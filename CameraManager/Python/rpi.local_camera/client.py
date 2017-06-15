#!/usr/bin/python -t
"""
Main client routine is defined here, if CM is already registered, you can use this file as start point for this sample
"""

import json
import logging
import sys
import signal
import errno
import threading
import time
import websocket
import ssl
from utils import uptime, get_logger, error_str, CapabilityViolatedError, get_current_tz_name
import globals
from camera import Camera, MotionDetectionParams, AudioDetectionParams,\
    EventParams, VideoParams, AudioParams, StreamByEventParams
from commands import CommandQueue
import traceback
from file_uploader import HTTPUploader

logger = get_logger()
logging.basicConfig()

app_ret = None
app_ev = None


class NvrStat(object):
    """
    This is { 'event' : 'last time' } dictionary with interface
    """
    def __init__(self):
        self.stat = {}

    def set_tm(self, name, curr_tm=None):
        if curr_tm is None:
            curr_tm = uptime()
        self.stat[name] = curr_tm

    def reset_tm(self, name):
        try:
            del self.stat[name]
        except:
            pass
        
    def get_tm(self, name, default=None):
        return self.stat.get(name, default)

    def clear_tm(self):
        self.stat = {}

    def expired(self, name, delay, curr_tm=None):
        """ @return True, if delay was passed from set_tm() call
        """
        if curr_tm is None:
            curr_tm = uptime()
        last_tm = self.get_tm(name)
        return last_tm is None or last_tm + delay <= curr_tm


STATE_CONNECTING = 'connecting'
STATE_CONNECTED = 'connected'
STATE_RECORDING = 'recording'
STATE_DISCONNECTING = 'disconnecting'
STATE_DISCONNECTED = 'disconnected'
STATE_UNREGISTERED = 'unregistered'


class ConnectionClosedByServer(Exception):
    pass


class NVRClient:
    version = '1.0.0'

    # Control server connection statuses
    CONN_DISCONNECTED = 0
    CONN_OPENED = 1
    CONN_CONNECTED = 2

    # Control server Hello statuses
    CSCS_OK = 'OK'

    # Control server protocol error codes
    CMDERR_OK = 'OK'
    CMDERR_GENERAL_ERROR = 'ERROR'
    CMDERR_SYSTEM_ERROR = 'SYSTEM_ERROR'
    CMDERR_NOT_SUPPORTED = 'NOT_SUPPORTED'
    CMDERR_INVALID_PARAMETER = 'INVALID_PARAM'
    CMDERR_MISSED_PARAMETER = 'MISSED_PARAM'
    CMDERR_TOO_MANY = 'TOO_MANY'
    CMDERR_RETRY = 'RETRY'

    # Bye message reasons
    BYE_R_ERROR = 'ERROR'
    BYE_R_SYSTEM_ERROR = 'SYSTEM_ERROR'
    BYE_R_AUTH_FAILURE = 'AUTH_FAILURE'
    BYE_R_CONN_CONFLICT = 'CONN_CONFLICT'
    BYE_R_RECONNECT = 'RECONNECT'
    BYE_R_SHUTDOWN = 'SHUTDOWN'
    BYE_R_DELETED = 'DELETED'

    def __init__(self):
        """
        Initialize application
        """

        """
        Internal variables
        """
        self.config = globals.config  # Config library instance
        self._check_config()
        self.ws = None  # WebSocket library instance
        self._next_msg_id = 0  # Next message's ID to send to server
        self.stat = NvrStat()  # Time assigned events manager
        self.conn_state = self.CONN_DISCONNECTED  # Current connection state, see CONN_* enum
        self.thread_run = None  # Main thread
        self.thread_ev_loop = None  # Timeout checking thread
        self.command_queue = None  # Commands sending thread
        self.upload_queue = None  # HTTP(s) uploading thread
        self.error = None

        """
        Cloud session variables
        """
        self.sid = ''  # Session ID
        self.media_server = ''  # Streaming server address and port
        self.upload_server = ''  # Direct upload server fully qualified address
        self.reconnect_target = None  # Reconnect target server
        self.reconnect = False  # Reconnect sequence is initiated
        self.reg_token = self.config.get('reg_token', '')  # registration token

        """
        CM hardcoded variables
        """
        self.vendor = 'VXG'  # CM software vendor
        self.secure = self.config.get('wss_port', None) > 0  # use secure WS connection
        self.timezone = self.config.get('timezone', get_current_tz_name())  # CM's timezone in Olson format
        self.ping_interval = 30  # send ping command if there was no commands from server for ping_interval secs

        """
        Camera
        """
        Camera.event_cb = self.on_camera_event
        Camera.raw_msg_cb = self.on_raw_message
        self.camera = Camera()

        self.stat.set_tm("dbg_event")
        self.dbg_event_interval = self.config.get('dbg_events_interval', 0)
        self.dbg_event_value = True

    def _check_config(self):
        """
        Validate config for essential fields
        :raise RuntimeError: when config is invalid
        """
        camera_feed = self.config.get('camera_feed', None)
        if not camera_feed:
            raise RuntimeError('Please provide correct video source URL in client.conf.py in param "camera_feed"')
        reg_token = self.config.get('reg_token', None)
        connection_id = self.config.get('connection_id', None)
        if not reg_token and not connection_id:
            raise RuntimeError('CM is not registered, provide correct registration token in client.conf.py in param '
                               '"reg_token"')

    def _ws_on_open(self, ws):
        """
        Websockets handler: Connection opened
        """
        if ws == self.ws:  # Command channel is opened
            self.reconnect_target = None
            logger.info("Connected to server %s", self.ws.url)
            self.conn_state = self.CONN_OPENED
            if self.config.get('connection_id', None):
                # CM is known by server, use password to register
                self._cmd_register(version=self.version,
                                   password=self.config['password'],
                                   prev_session=self.config.get('sid', None))
            else:
                # Connection ID is not set, so CM is not known by server, use reg_token to register
                self._cmd_register(version=self.version,
                                   reg_token=self.reg_token)

    """
    Commands implementations
    """
    def _cmd_ping(self):
        self.command_queue.put_command('')

    def _send_cmd(self, name, data, min_conn_state=CONN_CONNECTED):
        """
        Adds necessary fields 'cmd' and 'msgid' and puts to command queue
        :param name: Command name to fill 'cmd' field
        :param data: Dictionary with message to send
        :param min_conn_state: minimum connection state to send this command
        """
        if self.conn_state >= min_conn_state:
            data['msgid'] = self._next_msg_id
            data['cmd'] = name
            self.command_queue.put_command(data)
            self._next_msg_id += 1

    def _cmd_register(self, version, password=None, reg_token=None, prev_session=None):
        """
        Prepares 'register' command (see chapter 2.3 of API reference)
        :param version: application version
        :param password: optional string, password to access server
        :param prev_session: optional str, CM previous session ID
        :param reg_token: optional string, registration token, if set and correct, CM will binds to the token issuer.
        """
        msg = {'ver': version, 'tz': self.timezone, 'vendor': self.vendor}
        if password is not None:
            msg['pwd'] = password
        if reg_token is not None and reg_token != '':
            msg['reg_token'] = reg_token
        if prev_session is not None and prev_session != '':
            msg['prev_sid'] = prev_session
        self._send_cmd('register', msg, self.CONN_OPENED)

    def _cmd_cam_register(self, camera):
        """
        Prepares 'cam_register' command (see chapter 2.6 of API reference)
        :type camera: Camera
        :param camera: camera to register
        """
        self._send_cmd('cam_register', camera.to_json())

    def _cmd_done(self, msg_id, cmd_name, status, cam_id):
        """
        Prepares 'done' command (see chapter 3.1 of API reference)
        :param msg_id: ID of command to respond to
        :param cmd_name: name of command to respond to
        :param status: result: one of CMDERR_ predefined values
        """
        data = {'refid': msg_id, 'orig_cmd': cmd_name, 'status': status}
        if cam_id:
            data['cam_id'] = cam_id
        self._send_cmd('done', data, True)

    def _cmd_cam_status(self, camera):
        """
        Prepares 'cam_status' command (see chapter 3.4 of API reference)
        :type camera: Camera
        :param camera: Camera to send status
        """
        self._send_cmd('cam_status', {'cam_id': camera.camera_id, 'ip': camera.get_ip(),
                                      'streaming': camera.is_any_stream_connected(),
                                      'status_led': camera.status_led,
                                      'activity': camera.activity})

    def _cmd_cam_video_conf(self, camera):
        """
        Prepares 'cam_video_conf' command (see chapter 3.7 of API reference)
        :type camera: Camera
        :param camera: camera to get video config
        """
        retval = {'cam_id': camera.camera_id}
        params, caps = camera.get_video_params()
        retval.update(params.to_json())
        retval['caps'] = caps.to_json()
        self._send_cmd('cam_video_conf', retval)

    def _cmd_cam_audio_conf(self, camera):
        """
        Prepares 'cam_audio_conf' command (see chapter 3.10 of API reference)
        :type camera: Camera
        :param camera: camera to get audio config
        """
        retval = {'cam_id': camera.camera_id}
        params, caps = camera.get_audio_params()
        retval.update(params.to_json())
        retval['caps'] = caps.to_json()
        self._send_cmd('cam_audio_conf', retval)

    def _cmd_bye(self, reason):
        """
        Prepares 'bye' command (see chapter 3.13 of API reference)
        :param reason: string, one of the BYE_R_...
        """
        self._send_cmd('bye', {'reason': reason})

    def _cmd_cam_preview_image(self, camera, data):
        """
        Prepares 'cam_preview_image' command (see chapter 3.16 of API reference)
        :type camera: Camera
        :param camera: camera to update preview
        :param data: Base64-encoded binary content of jpg image
        """
        self._send_cmd('cam_preview_image', {'cam_id': camera.camera_id, 'image': data})

    def _cmd_stream_config(self, camera, video=None, audio=None):
        """
        'stream_config' command , containing current video and audio parameters (see chapter 4.5 of API reference)
        :type camera: Camera
        :param camera: Camera object or its child
        :type video: list
        :param video: list of video ES names
        :type audio: list
        :param audio: list of audio ES names
        """
        retval = {'cam_id': camera.camera_id}
        video_infos, audio_infos = camera.get_stream_info(video, audio)
        if video_infos is not None:
            retval['video'] = []
            for stream_id, stream_info in video_infos.iteritems():
                jsoned = stream_info.to_json()
                jsoned['stream'] = stream_id
                retval['video'].append(jsoned)
        if audio_infos is not None:
            retval['audio'] = []
            for stream_id, stream_info in audio_infos.iteritems():
                jsoned = stream_info.to_json()
                jsoned['stream'] = stream_id
                retval['audio'].append(jsoned)
        self._send_cmd('stream_config', retval)

    def _cmd_stream_by_event_conf(self, camera):
        """
        'stream_by_event_conf' command, containing active stream triggers (see chapter 4.8 of API reference)
        :type camera: Camera
        :param camera: camera to send event recording config
        """
        config = {'cam_id': camera.camera_id}
        params, caps = camera.get_stream_by_event_params()
        config.update(params.to_json())
        config['caps'] = caps.to_json()
        self._send_cmd('stream_by_event_conf', config)

    def _cmd_stream_caps(self, camera):
        """
        'stream_caps' command, reports encoder capabilities (see chapter 4.11 of API reference)
        :type camera: Camera
        :param camera: camera to report its stream caps
        """
        # This block merges streams caps from dict {'stream_id': [stream_caps]} to ServerAPI format
        # [{'streams': [], <stream_caps>}]
        video_caps_dict = dict()
        for stream_id, stream_info in camera.video_stream_caps.iteritems():
            for stream_caps in stream_info:
                if stream_caps not in video_caps_dict:
                    video_caps_dict[stream_caps] = [stream_id]
                else:
                    video_caps_dict[stream_caps].append(stream_id)
        caps_video = []
        for stream_info, stream_id_list in video_caps_dict.iteritems():
            jsoned_value = stream_info.to_json()
            jsoned_value['streams'] = stream_id_list
            caps_video.append(jsoned_value)

        # This block merges streams caps from dict {'stream_id': [stream_caps]} to ServerAPI format
        # [{'streams': [], <stream_caps>}]
        audio_caps_dict = dict()
        for stream_id, stream_info in camera.audio_stream_caps.iteritems():
            for stream_caps in stream_info:
                if stream_caps not in audio_caps_dict:
                    audio_caps_dict[stream_caps] = [stream_id]
                else:
                    audio_caps_dict[stream_caps].append(stream_id)
        caps_audio = []
        for stream_info, stream_id_list in audio_caps_dict.iteritems():
            jsoned_value = stream_info.to_json()
            jsoned_value['streams'] = stream_id_list
            caps_audio.append(jsoned_value)

        self._send_cmd('stream_caps', {'cam_id': camera.camera_id, 'caps_video': caps_video, 'caps_audio': caps_audio})

    def _cmd_supported_streams(self, camera):
        """
        'supported_streams' command, returns supported media streams and video/audio ES
        (See chapter 4.13 of API reference)
        :type camera: Camera
        :param camera: camera to report its media streams
        """
        streams = list()
        for media_stream in camera.media_streams:
            streams.append(media_stream.to_json())
        video_es = list()
        for video_str in camera.video_streams.keys():
            video_es.append(video_str)
        audio_es = list()
        for audio_str in camera.audio_streams.keys():
            audio_es.append(audio_str)
        self._send_cmd('supported_streams', {'cam_id': camera.camera_id, 'streams': streams, 'video_es': video_es,
                                             'audio_es': audio_es})

    def _cmd_motion_detection_conf(self, camera):
        """
        'motion_detection_conf' command, contains description and current state of motion map
        (See chapter 5.3 of API reference)
        :type camera: Camera
        :param camera: camera ot report its motion detection config
        """
        config = {'cam_id': camera.camera_id}
        params, caps = camera.get_motion_detection_params()
        config.update(params.to_json())
        config['caps'] = caps.to_json()
        self._send_cmd('motion_detection_conf', config)

    def _cmd_audio_detection_conf(self, camera):
        """
        'audio_detection_conf' command, contains current audio detection settings (See chapter 5.6 of API reference)
        :type camera: Camera
        :param camera: camera ot report its audio detection config
        """
        config = {'cam_id': camera.camera_id}
        params, caps = camera.get_audio_detection_params()
        config.update(params.to_json())
        config['caps'] = caps.to_json()
        self._send_cmd('audio_detection_conf', config)

    def _cmd_cam_events_conf(self, camera):
        """
        'cam_events_conf' command, contains list of events supported by camera (See chapter 6.4 of API reference)
        :type camera: Camera
        :param camera: camera ot report its event processing config
        """
        config = {'cam_id': camera.camera_id,
                  'enabled': camera.events_enabled}
        params_map, caps_map = camera.get_event_processing_params()
        events = []
        for event_name, event_caps in caps_map.iteritems():
            event_params = params_map[event_name]
            serialized = event_params.to_json()
            serialized['event'] = event_name
            serialized['caps'] = event_caps.to_json()
            events.append(serialized)
        config['events'] = events
        self._send_cmd('cam_events_conf', config)

    def _cmd_cam_event(self, event_data):
        """
        Sends event notification to server.
        Raises:
            - ValueError if some mandatory fields are missing.
        :param event_data: Event parameters dictionary. Fields:
            - cam_id: int, camera ID;
            - event: string, event name;
            - time: float, calendar time UTC;
            - mediatm: optional int, media timestamp;
            - net_info: "net" event data;
            - record_info: "record" event data, CM detected that recording should be started/stopped;
            - snapshot_info: for events with snapshot;
            - motion_info: "motion" event data.
        """
        if 'cam_id' not in event_data:
            raise ValueError('cam_id')
        if 'event' not in event_data:
            raise ValueError('event')
        self._send_cmd('cam_event', event_data)

    def _cmd_raw_message(self, rmsg_data):
        """
        Sends raw_message to server.
        Raises:
            - ValueError if some mandatory fields are missing.
        :param rmsg_data: Event parameters dictionary. Fields:
            - cam_id: int, camera ID;
            - client_id: string, ID of a client;
            - message: string, message content;
        """
        if 'cam_id' not in rmsg_data:
            raise ValueError('cam_id')
        if 'client_id' not in rmsg_data:
            raise ValueError('client_id')
        if 'message' not in rmsg_data:
            raise ValueError('message')
        self._send_cmd('raw_message', rmsg_data)

    def _on_cmd_message(self, message):
        """
        Main command messages handler
        """
        self.stat.set_tm("command")
        msg = json.loads(message)

        cmd = msg.get('cmd', None)
        msgid = msg.get('msgid', None)
        if cmd is not None and msgid is not None:
            logger.debug('[ws] <= %s', msg)
            status = NVRClient.CMDERR_OK
            is_control_server_changed = False
            try:
                if cmd == 'configure':
                    config_changed = False
                    if 'connid' in msg:
                        self.config['connection_id'] = msg['connid']
                        config_changed = True
                    if 'uuid' in msg:
                        self.config['camera_uuid'] = msg['uuid']
                        self.camera.uuid = msg['uuid']
                        config_changed = True
                    if 'pwd' in msg:
                        self.config['password'] = msg['pwd']
                        config_changed = True
                    if 'server' in msg:
                        self.reconnect_target = msg['server']
                    if 'tz' in msg:
                        self.config['timezone'] = msg['tz']
                        config_changed = True
                        self.set_timezone(msg['tz'])

                    if config_changed:
                        self.config.write()

                elif cmd == 'hello':
                    is_media_server_info_changed = False
                    if self.sid != msg.get('sid', None):
                        self.sid = msg.get('sid', None)
                        self.config['sid'] = self.sid  # saving SID as it described in ServerAPI doc chapter 2.4
                        self.config.write()
                        is_media_server_info_changed = True
                    if self.media_server != msg.get('media_server', None):
                        self.media_server = msg.get('media_server', None)
                        is_media_server_info_changed = True
                    if self.upload_server != msg.get('upload_url', None):
                        self.upload_server = msg.get('upload_url', None)
                        is_media_server_info_changed = True
                    if is_media_server_info_changed:
                        self._on_media_server_info_changed()
                    self._on_control_server_connected(msg['status'])

                elif cmd == 'cam_hello':
                    self.camera.camera_id = msg['cam_id']
                    self.camera.set_media_path(msg['media_url'])
                    self.camera.set_activity(msg['activity'])
                    self.camera.set_access_mode(msg.get('mode', None))

                elif cmd == 'get_cam_status':
                    assert self.camera.camera_id == msg['cam_id']
                    self._cmd_cam_status(self.camera)
                    status = ''  # Already responded

                elif cmd == 'cam_ptz':
                    assert self.camera.camera_id == msg['cam_id']
                    self.camera.ptz_process(msg['action'], msg.get('tm', None))

                elif cmd == 'get_cam_video_conf':
                    assert self.camera.camera_id == msg['cam_id']
                    self._cmd_cam_video_conf(self.camera)
                    status = ''  # Already responded

                elif cmd == 'set_cam_video_conf':
                    assert self.camera.camera_id == msg['cam_id']
                    new_params = VideoParams.create_from_json(msg)
                    self.camera.set_video_params(new_params)

                elif cmd == 'get_cam_audio_conf':
                    assert self.camera.camera_id == msg['cam_id']
                    self._cmd_cam_audio_conf(self.camera)
                    status = ''  # Already responded

                elif cmd == 'set_cam_audio_conf':
                    assert self.camera.camera_id == msg['cam_id']
                    new_params = AudioParams.create_from_json(msg)
                    self.camera.set_audio_params(new_params)

                elif cmd == 'set_cam_parameter':
                    assert self.camera.camera_id == msg['cam_id']
                    self.camera.set_parameters(msg)

                elif cmd == 'bye':
                    logger.info('Server is closing connection. Reason: %s', msg['reason'])
                    if msg['reason'] == self.BYE_R_RECONNECT:
                        self.reconnect = True
                    else:
                        self.error = ConnectionClosedByServer(msg['reason'])
                    status = ''

                elif cmd == 'stream_start':
                    assert self.camera.camera_id == msg['cam_id']
                    self.camera.connect_stream(msg['stream_id'], msg['reason'])

                elif cmd == 'stream_stop':
                    assert self.camera.camera_id == msg['cam_id']
                    self.camera.disconnect_stream(msg['stream_id'], msg['reason'])

                elif cmd == 'get_stream_config':
                    assert self.camera.camera_id == msg['cam_id']
                    self._cmd_stream_config(self.camera, msg.get('video_es', None), msg.get('audio_es', None))
                    status = ''  # Already responded

                elif cmd == 'set_stream_config':
                    assert self.camera.camera_id == msg['cam_id']
                    self.camera.set_stream_info(msg.get('video', None), msg.get('audio', None))
                    status = ''

                elif cmd == 'get_stream_by_event':
                    assert self.camera.camera_id == msg['cam_id']
                    self._cmd_stream_by_event_conf(self.camera)
                    status = ''  # Already responded

                elif cmd == 'set_stream_by_event':
                    assert self.camera.camera_id == msg['cam_id']
                    params = StreamByEventParams.create_from_json(msg)
                    self.camera.set_stream_by_event_params(params)

                elif cmd == 'get_stream_caps':
                    assert self.camera.camera_id == msg['cam_id']
                    self._cmd_stream_caps(self.camera)
                    status = ''  # Already responded

                elif cmd == 'get_supported_streams':
                    assert self.camera.camera_id == msg['cam_id']
                    self._cmd_supported_streams(self.camera)
                    status = ''  # Already responded

                elif cmd == 'get_motion_detection':
                    assert self.camera.camera_id == msg['cam_id']
                    self._cmd_motion_detection_conf(self.camera)
                    status = ''  # Already responded

                elif cmd == 'set_motion_detection':
                    assert self.camera.camera_id == msg['cam_id']
                    regions = MotionDetectionParams.regions_from_json(msg)
                    self.camera.set_motion_detection_params(regions)

                elif cmd == 'get_audio_detection':
                    assert self.camera.camera_id == msg['cam_id']
                    self._cmd_audio_detection_conf(self.camera)
                    status = ''  # Already responded

                elif cmd == 'set_audio_detection':
                    assert self.camera.camera_id == msg['cam_id']
                    params = AudioDetectionParams.create_from_json(msg)
                    self.camera.set_audio_detection_params(params)

                elif cmd == 'get_cam_events':
                    assert self.camera.camera_id == msg['cam_id']
                    self._cmd_cam_events_conf(self.camera)
                    status = ''  # Already responded

                elif cmd == 'set_cam_events':
                    assert self.camera.camera_id == msg['cam_id']
                    events_config = dict()
                    for event_def in msg['events']:
                        event_params = EventParams.create_from_json(event_def)
                        events_config[event_def['event']] = event_params
                    self.camera.set_events_processing_params(events_config)

                elif cmd == 'cam_format_memorycard':
                    assert self.camera.camera_id == msg['cam_id']
                    self.camera.format_memorycard_process()

                elif cmd == 'cam_update_preview':
                    assert self.camera.camera_id == msg['cam_id']
                    resp = self.camera.update_preview()
                    if resp != '':  # image needs to be send via command channel
                        self._cmd_cam_preview_image(self.camera, resp)
                        status = ''  # Already responded

                elif cmd == 'cam_upgrade_firmware':
                    assert self.camera.camera_id == msg['cam_id']
                    self.camera.upgrade_firmware(msg['url'])

                elif cmd == 'upgrade_firmware':
                    self.upgrade_firmware(msg['url'])

                elif cmd == 'cam_get_log':
                    assert self.camera.camera_id == msg['cam_id']
                    self.camera.get_log()

                elif cmd == 'raw_message':
                    assert self.camera.camera_id == msg['cam_id']
                    self.camera.on_raw_message(msg['client_id'], msg['message'])

                elif cmd == 'raw_message_client_connected':
                    assert self.camera.camera_id == msg['cam_id']
                    self.camera.on_raw_message_client_connected(msg['client_id'])

                elif cmd == 'raw_message_client_disconnected':
                    assert self.camera.camera_id == msg['cam_id']
                    self.camera.on_raw_message_client_disconnected(msg['client_id'])

                elif cmd == 'backward_start':
                    assert self.camera.camera_id == msg['cam_id']
                    self.camera.backward_start(msg['url'])

                elif cmd == 'backward_stop':
                    assert self.camera.camera_id == msg['cam_id']
                    self.camera.backward_stop(msg['url'])

                else:
                    logger.debug('Unknown command %s', msg)
                    status = NVRClient.CMDERR_NOT_SUPPORTED

            except NotImplementedError as niy_ex:
                logger.error('Message handling: Command "%s" is not implemented: %s', cmd, niy_ex.message)
                status = NVRClient.CMDERR_NOT_SUPPORTED

            except CapabilityViolatedError as ex:
                logger.error('Parameter(%s) violated capabilities', ex.message)
                status = NVRClient.CMDERR_INVALID_PARAMETER

            except ValueError as value_ex:
                logger.error('Invalid parameter "%s" value on message handling', value_ex.message)
                traceback.print_exc()
                status = NVRClient.CMDERR_INVALID_PARAMETER

            except KeyError as key_ex:
                logger.error('Missing parameter "%s" on message handling', key_ex.message)
                traceback.print_exc()
                status = NVRClient.CMDERR_MISSED_PARAMETER

            except Exception as ex:
                logger.error('Unknown exception on message handling: %s', ex)
                traceback.print_exc()
                status = NVRClient.CMDERR_GENERAL_ERROR

            finally:
                if status != '':
                    self._cmd_done(msgid, cmd, status, msg.get('cam_id', None))

            if is_control_server_changed:
                self._on_control_server_changed()
        else:
            logger.error('Unknown message format %s', msg)

    def _ws_on_message(self, ws, message):
        """ Websockets handler: On message received
        """
        if message is None:
            return

        # check the source of callback: command connection or data connection
        if ws == self.ws:
            self._on_cmd_message(message)
        else:
            raise NotImplementedError

    def _ws_on_pong(self, ws, message):
        """
        Websockets handler: On Pong received
        :param ws: WS instance, received that message
        :param message: string, message body
        """
        self.stat.set_tm("command")

    def _ws_on_error(self, ws, error):
        """ Websockets handler: On error happened
        """
        logger.error('WebSocket error %s', str(error))
        self.error = error
        if self.secure:
            logger.debug('Fallback to insecure connection..')
            self.secure = False
            self.error = None
        ws.close()

    def _ws_on_close(self, ws):
        """ Websockets handler: On connection closed
        """
        if ws != self.ws:
            return
        self.ws = None
        self.conn_state = self.CONN_DISCONNECTED
        self.stat.set_tm("disconnect")
        logger.info("Server connection is closed")

    def _on_control_server_changed(self):
        """ Called when server redirects CM to another server
        """
        logger.info('Redirected to new control server: %s', self.config['server_hostname'])
        self._close_ws_connection()
        if not self.thread_run.isAlive():
            self.thread_run.start()

    def _on_control_server_connected(self, status):
        """
        Called when connection established (handshaking complete)
        :param status: string, server connection status (values are CSCS_...)
        """
        self.stat.set_tm("connect")  # do not treat cli as really connected until get hello
        if status == self.CSCS_OK:
            logger.info('Connected with sid %s. Status: %s', self.sid, status)
            self.conn_state = self.CONN_CONNECTED
        else:
            logger.error('Connected with invalid status: %s', status)
            return

        # Send camera registration
        self._cmd_cam_register(self.camera)

    def _on_media_server_info_changed(self):
        """
        Called when media streaming server is changed
        """
        # Apply new media\upload server and sid info to camera
        self.camera.set_media_server_info(self.media_server, self.sid, self.upload_server)

    def set_timezone(self, new_timezone):
        logger.info('Timezone changed %s => %s', self.timezone, new_timezone)
        self.timezone = new_timezone

    def upgrade_firmware(self, url):
        # TODO: actual realization
        logger.info('Upgrade CM to new version, url %s', url)

    def _ev_loop(self):
        """
        Thread for timeouts checking
        """
        curr_tid = threading.current_thread()
        logger.info("Event loop is started")
        while self.thread_ev_loop == curr_tid:
            time.sleep(1)
            if curr_tid != self.thread_ev_loop:
                break

            try:
                tm = uptime()

                # If not connected or error is reported, stop after 5 minutes:
                if self.stat.expired("started", 300, tm):
                    connect_timeout = self.stat.get_tm("connect")
                    if not connect_timeout:
                        if connect_timeout is None:
                            connect_timeout = self.stat.get_tm("started")
                        logger.warning("Connection is not started after >5mins(%s) since application started",
                                       connect_timeout)
                        self.stop()
                        break

                if self.conn_state < self.CONN_CONNECTED:
                    continue

                if self.stat.expired("command", self.ping_interval, tm):
                    # haven't send/received commands for a long time, suspicious
                    self._cmd_ping()

                if self.dbg_event_interval > 0 and self.stat.expired('dbg_event', self.dbg_event_interval, tm):
                    self.debug_generate_camera_event()

            except:
                logger.error('Event loop error %s', error_str())

        logger.info("Event loop is stopped")

    def start(self, secure):
        """
        Opens WebSocket connection
        :param secure: Use secured connection
        """
        if self.reconnect_target:
            server = self.reconnect_target
        else:
            server = self.config['server_hostname']
        if secure:
            proto = 'wss'
            port = self.config['wss_port']
        else:
            proto = 'ws'
            port = self.config['ws_port']
        connection_id = self.config.get('connection_id', None)
        if connection_id:
            path = 'ctl/%s/' % connection_id
        else:
            path = 'ctl/NEW/%s/' % self.config['reg_token']
        websocket_url = "%s://%s:%s/%s" % (proto, server, port, path)
        logger.info("Connect to %s", websocket_url)
        self.ws = websocket.WebSocketApp(websocket_url,
                                         on_message=self._ws_on_message,
                                         on_error=self._ws_on_error,
                                         on_close=self._ws_on_close,
                                         on_open=self._ws_on_open,
                                         on_pong=self._ws_on_pong)

    def _close_ws_connection(self):
        """ Closes WebSocket connection
        """
        logger.info('Closing WS connection')
        if self.ws is not None:
            ws = self.ws
            self.ws = None
            if ws:
                ws.close()

    def run(self):
        """ Starts all client routines
        """
        try:
            # Mark time when client is started to check connection timeout
            self.stat.set_tm("started")

            # Start timeout checking routine
            self.thread_ev_loop = threading.Thread(target=self._ev_loop)
            self.thread_ev_loop.daemon = True
            self.thread_ev_loop.start()

            # Start command sending thread
            self.command_queue = CommandQueue(self)
            self.command_queue.start()  # commands.py loop cycle

            # Start uploading thread
            self.upload_queue = HTTPUploader()
            self.upload_queue.start()
            Camera.http_uploader = self.upload_queue

            while self.error is None or (self.reconnect and self.reconnect_target is not None):
                self.reconnect = False
                # Start WebSocket connection
                self.start(self.secure)
                if self.secure:
                    ws_params = {'sslopt': {"cert_reqs": ssl.CERT_NONE, "check_hostname": False}}
                else:
                    ws_params = {}
                self.ws.run_forever(**ws_params)
                self._close_ws_connection()

            if self.reconnect and self.reconnect_target is not None:
                self.reconnect = False

            global app_ret
            app_ret = 1
            logger.info('Client worker routine finished')
        except Exception as ex:
            logger.error('Exception on client worker thread: %s %s', ex.message, error_str())
        finally:
            self.stop()

    def stop(self):
        """ Stops all of the client routines
        """
        logger.info("Stop")
        try:
            self.thread_ev_loop = None

            t = self.command_queue
            self.command_queue = None
            if t:
                t.stop()

            t = self.upload_queue
            self.upload_queue = None
            if t:
                t.stop()

            self._close_ws_connection()
        except:
            pass

    def debug_generate_camera_event(self):
        """
        Test. Generate sound event on cameras
        """
        self.camera.on_sound_event(self.dbg_event_value)
        self.dbg_event_value = not self.dbg_event_value
        self.stat.set_tm("dbg_event")

    def on_camera_event(self, event):
        """
        Callback for camera events
        :param event: dict, event data in format described in chapter 6.5 of API reference
        """
        self._cmd_cam_event(event)

    def on_raw_message(self, client_id,  message):
        """
        Callback for raw messages
        :param client_id: string, ID of client
        :param message: string, message
        """
        rmsg = {'msgid': self._next_msg_id, 'cam_id': self.camera.camera_id, 'client_id': client_id, 'message': message}
        self._cmd_raw_message(rmsg)


def init_signals():
    global app_ret, app_ev
    app_ret = 0
    app_ev = threading.Event()

    # Init signals handlers for supervisor and Ctrl+C
    signal.signal(signal.SIGTERM, sig_handler)
    signal.signal(signal.SIGINT, sig_handler)
    if hasattr(signal, "SIGBREAK"):
        signal.signal(signal.SIGBREAK, sig_handler)


def sig_handler(sig, frame):
    global app_ret, logger, app_ev
    app_ret = 19
    logger.info("Signal %d", sig)
    app_ev.set()


def main():
    global app_ret, app_ev

    app_ret = 0
    app_ev.clear()
    logger.info("###Starting CM sample ver %s###", NVRClient.version)
    try:
        cli = NVRClient()
        last_time = uptime()
        while app_ret == 0:
            cli.stat.clear_tm()
            cli.thread_run = threading.Thread(target=cli.run)
            cli.thread_run.setDaemon(True)
            cli.thread_run.start()
            try:
                # On Windows join w/o timeout is not interruptable
                # On Linux it is found that join is not interruptable so use event instead
                while app_ret == 0 and cli.thread_run.isAlive():
                    app_ev.wait(3)
            except IOError as e:
                if e.errno != errno.EINTR:
                    raise
            cli.stop()

            if app_ret:  # signal received or error
                break

            check_time = uptime()
            if cli.stat.get_tm("connect"):
                last_time = cli.stat.get_tm("disconnect", last_time)

            # No connection for 5 min
            if check_time - last_time > 300:
                app_ret = 6

            if app_ret == 0:
                time.sleep(2)  # dont restart too fast

        cli.camera.disconnect_all_streams()

    finally:
        pass

    logger.info("### Exiting, ret = %d ###", app_ret)
    sys.exit(app_ret)


if __name__ == "__main__":
    init_signals()
    main()
