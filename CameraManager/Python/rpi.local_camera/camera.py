"""
Camera class is defined here. Primitive streaming support.
"""

from threading import RLock
from urlparse import urlparse
from utils import get_logger, error_str, PackBits, CapabilityViolatedError, get_iso_8601_time_str, check_value_in_range, \
    get_base64_content
import globals
from base64 import b64decode, b64encode
from time import time
import traceback
import os.path
import sys
from shutil import copyfile
# https://bugs.python.org/issue20318
# Popen from 2.7 python is buggy in multi-threaded environment, use backport from python 3.2
if sys.version_info[0] < 3:
    import subprocess32 as subprocess
else:
    import subprocess

if os.name == 'nt':
    FFMPEG = '%s/ffmpeg.exe' % globals.WORK_DIR
else:
    FFMPEG = '%s/ffmpeg' % globals.WORK_DIR

logger = get_logger()


class AccessMode:
    """
    Enumerates available camera access modes
    """
    # Camera interacting with user only via cloud, all records are stored in the cloud,
    # streams is retranslated by cloud to users, etc.. see ServerAPI doc for full description
    Cloud = 'cloud'
    # Camera acts as server: stores own records, translates videos directly to users, etc.
    # Only command channel is established to cloud. see ServerAPI doc for full description
    P2P = 'p2p'

    def __init__(self):
        raise NotImplementedError


class P2PInfo:
    """
    Direct access parameters
    """
    def __init__(self, ip_public=None, main_port_public=None, web_port_public=None, rtmp_port_public=None,
                 rtsp_port_public=None, main_port_local=None, web_port_local=None, rtmp_port_local=None,
                 rtsp_port_local=None):
        """
        Some parameters could be omitted if not used
        :type ip_public: str or None
        :param ip_public: public IP used by camera
        :type main_port_public: int or None
        :param main_port_public: public available port for proprietary camera protocol
        :type web_port_public: int or None
        :param web_port_public: public available port for HTTP
        :type rtmp_port_public: int or None
        :param rtmp_port_public: public available port for RTMP
        :type rtsp_port_public: int or None
        :param rtsp_port_public: public available port for RTSP
        :type main_port_local: int or None
        :param main_port_local: port for proprietary camera protocol
        :type web_port_local: int or None
        :param web_port_local: port for HTTP
        :type rtmp_port_local: int or None
        :param rtmp_port_local: port for RTMP
        :type rtsp_port_local: int or None
        :param rtsp_port_local: port for RTSP
        """
        self.ip_public = ip_public
        self.main_port_public = main_port_public
        self.web_port_public = web_port_public
        self.rtmp_port_public = rtmp_port_public
        self.rtsp_port_public = rtsp_port_public
        self.main_port_local = main_port_local
        self.web_port_local = web_port_local
        self.rtmp_port_local = rtmp_port_local
        self.rtsp_port_local = rtsp_port_local

    def to_json(self):
        """
        Convert P2PInfo to dict object which can be encoded to JSON in ServerAPI format
        """
        retval = {}
        local_ports = dict()
        local_ports['main_port'] = self.main_port_local or 0
        local_ports['web_port'] = self.web_port_local or 0
        local_ports['rtmp_port'] = self.rtmp_port_local or 0
        local_ports['rtsp_port'] = self.rtsp_port_local or 0
        retval['local'] = local_ports
        public_ports = dict()
        public_ports['main_port'] = self.main_port_public or 0
        public_ports['web_port'] = self.web_port_public or 0
        public_ports['rtmp_port'] = self.rtmp_port_public or 0
        public_ports['rtsp_port'] = self.rtsp_port_public or 0
        retval['public'] = public_ports
        retval['public']['ip'] = self.ip_public or '0.0.0.0'
        return retval


class VideoParams:
    """
    Stream unrelated video parameters set
    """
    def __init__(self, vert_flip=None, horz_flip=None, tdn=None, ir_light=None):
        """
        :type vert_flip: str or None
        :param vert_flip: Vertical image flip mode can be None, "off", "on", "auto", default - None = N/A
        :type horz_flip: str or None
        :param horz_flip: Horizontal image flip mode can be None, "off", "on", "auto", default - None = N/A
        :type tdn: str or None
        :param tdn: Can be None, "day", "night", "auto", default - None = N/A
        :type ir_light: str or None
        :param ir_light: IR-light for night conditions, can be None, "off", "on", "auto", default - None = N/A
        """
        self.vert_flip = vert_flip
        self.horz_flip = horz_flip
        self.tdn = tdn
        self.ir_light = ir_light

    def to_json(self):
        """
        Convert VideoParams to dict object which can be encoded to JSON in ServerAPI format
        """
        retval = {}
        if self.vert_flip is not None:
            retval['vert_flip'] = self.vert_flip
        if self.horz_flip is not None:
            retval['horz_flip'] = self.horz_flip
        if self.tdn is not None:
            retval['tdn'] = self.tdn
        if self.ir_light is not None:
            retval['ir_light'] = self.ir_light
        return retval

    @classmethod
    def create_from_json(cls, data):
        """
        Create VideoParams from dict object in ServerAPI format
        """
        return cls(vert_flip=data.get('vert_flip', None),
                   horz_flip=data.get('horz_flip', None),
                   tdn=data.get('tdn', None),
                   ir_light=data.get('ir_light', None))

    def __eq__(self, other):
        return self.vert_flip == other.vert_flip\
               and self.horz_flip == other.horz_flip\
               and self.tdn == other.tdn\
               and self.ir_light == other.ir_light


class VideoParamCapabilities:
    """
    Capabilities for camera stream unrelated video parameters
    """
    def __init__(self, vert_flip=list(), horz_flip=list(), tdn=list(), ir_light=list()):
        """
        :type vert_flip: list
        :param vert_flip: available values for VideoParams.vert_flip, default - empty list
        :type horz_flip: list
        :param horz_flip: available values for VideoParams.horz_flip, default - empty list
        :type tdn: list
        :param tdn: available values for VideoParams.tdn, default - empty list
        :type ir_light: list
        :param ir_light: available values for VideoParams.ir_light, default - empty list
        """
        self.vert_flip = vert_flip
        self.horz_flip = horz_flip
        self.tdn = tdn
        self.ir_light = ir_light

    def to_json(self):
        """
        Convert VideoParamCapabilities to dict object which can be encoded to JSON in ServerAPI format
        """
        return {'vert_flip': self.vert_flip, 'horz_flip': self.horz_flip, 'tdn': self.tdn, 'ir_light': self.ir_light}

    def check_parameters(self, video_params):
        """
        Match parameters to this capabilities
        :type video_params: VideoParams
        :param video_params: Video parameters to check
        :raise CapabilityViolatedError: When parameter does not match capabilities
        """
        if video_params.vert_flip is not None:
            if video_params.vert_flip not in self.vert_flip:
                raise CapabilityViolatedError('vert_flip')
        if video_params.horz_flip is not None:
            if video_params.horz_flip not in self.horz_flip:
                raise CapabilityViolatedError('horz_flip')
        if video_params.tdn is not None:
            if video_params.tdn not in self.tdn:
                raise CapabilityViolatedError('tdn')
        if video_params.ir_light is not None:
            if video_params.ir_light not in self.ir_light:
                raise CapabilityViolatedError('ir_light')


class AudioParams:
    """
    Stream unrelated audio parameters set
    """
    def __init__(self, mic_gain=None, mic_mute=None, spkr_vol=None, spkr_mute=None, echo_cancel=None):
        """
        :type mic_gain: int or None
        :param mic_gain: Microphone gain can be [0..100] or None if not available, default - None
        :type mic_mute: bool or None
        :param mic_mute: Microphone mute, None if not available, default - None
        :type spkr_vol: int or None
        :param spkr_vol: Speaker volume can be [0..100] or None if not available, default - None
        :type spkr_mute: bool or None
        :param spkr_mute: Speaker mute, None if not available, default - None
        :type echo_cancel: str or None
        :param echo_cancel: Echo cancellation mode can be 'Auto', 'On', 'Off' or None if not available, default - None
        """
        self.mic_gain = mic_gain
        self.mic_mute = mic_mute
        self.spkr_vol = spkr_vol
        self.spkr_mute = spkr_mute
        self.echo_cancel = echo_cancel

    def to_json(self):
        """
        Convert AudioParams to dict object which can be encoded to JSON in ServerAPI format
        """
        retval = {}
        if self.mic_gain is not None:
            retval['mic_gain'] = self.mic_gain
        if self.mic_mute is not None:
            retval['mic_mute'] = self.mic_mute
        if self.spkr_vol is not None:
            retval['spkr_vol'] = self.spkr_vol
        if self.spkr_mute is not None:
            retval['spkr_mute'] = self.spkr_mute
        if not self.echo_cancel:
            retval['echo_cancel'] = self.echo_cancel
        return retval

    @classmethod
    def create_from_json(cls, data):
        """
        Create AudioParams from dict object in ServerAPI format
        """
        return cls(mic_gain=data.get('mic_gain', None),
                   mic_mute=data.get('mic_mute', None),
                   spkr_vol=data.get('spkr_vol', None),
                   spkr_mute=data.get('spkr_mute', None),
                   echo_cancel=data.get('echo_cancel', None))

    def __eq__(self, other):
        return self.mic_gain == other.mic_gain\
               and self.mic_mute == other.mic_mute\
               and self.spkr_vol == other.spkr_vol\
               and self.spkr_mute == other.spkr_mute\
               and self.echo_cancel == other.echo_cancel


class AudioParamCapabilities:
    """
    Capabilities for camera stream unrelated audio parameters
    """
    def __init__(self, mic=False, spkr=False, backward=False, echo_cancel=list()):
        """
        :type mic: bool
        :param mic: Microphone is supported (enables AudioParams.mic_gain and AudioParams.mic_mute), default - False
        :type spkr: bool
        :param spkr: Speaker is supported (enables AudioParams.spkr_vol and AudioParams.spkr_mute), default - False
        :type backward: bool
        :param backward: Backward audio channel is supported, default - False
        :type echo_cancel: list
        :param echo_cancel: available values for AudioParams.echo_cancel, default - empty list
        """
        self.mic = mic
        self.spkr = spkr
        self.echo_cancel = echo_cancel
        self.backward = backward

    def to_json(self):
        """
        Convert AudioParamCapabilities to dict object which can be encoded to JSON in ServerAPI format
        """
        return {'mic': self.mic, 'spkr': self.spkr, 'echo_cancel': self.echo_cancel, 'backward': self.backward}

    def check_parameters(self, audio_params):
        """
        Match parameters to this capabilities
        :type audio_params: AudioParams
        :param audio_params: Audio parameters to check
        :raise CapabilityViolatedError: When parameter does not match capabilities
        """
        if not (self.mic is True and audio_params.mic_gain is not None and audio_params.mic_mute is not None):
            raise CapabilityViolatedError('mic')
        if not (self.spkr is True and audio_params.spkr_vol is not None and audio_params.spkr_mute is not None):
            raise CapabilityViolatedError('spkr')
        if audio_params.echo_cancel not in self.echo_cancel:
            raise CapabilityViolatedError('echo_cancel')


class VideoEncodingFormat:
    """
    Enumerates available video encoding formats
    """
    H264 = 'H.264'

    def __init__(self):
        raise NotImplementedError


class VBRQuality:
    """
    Enumerates available VBR quality values
    """
    ExtremelyLow = -4
    VeryLow = -3
    Low = -2
    Economy = -1
    Normal = 0
    Rich = 1
    Fine = 2
    ExtraFine = 3
    UltraFine = 4

    def __init__(self):
        raise NotImplementedError


class VideoInfo:
    """
    Video elementary stream info
    """
    def __init__(self, fmt, width, height, fps, gop, vbr=False, bitrate=None, quality=None):
        """
        :type fmt: str
        :param fmt: Video encoding format, see VideoEncodingFormat for available values
        :type width: int
        :param width: Video resolution
        :type height: int
        :param height: Video resolution
        :type fps: float
        :param fps: Framerate
        :type gop: int
        :param gop: GoP size (aka I-Frame interval)
        :type vbr: bool
        :param vbr: Prefer VBR, if False use CBR
        :type bitrate: int or None
        :param bitrate: if CBR is used specifies bitrate, kbps
        :type quality: int or None
        :param quality: if VBR is used specifies quality profile, see VBRQuality for available values
        """
        self.format = fmt
        self.width = width
        self.height = height
        self.fps = fps
        self.gop = gop
        self.vbr = vbr
        self.bitrate = bitrate
        self.quality = quality

    def to_json(self):
        """
        Convert VideoInfo to dict object which can be encoded to JSON in ServerAPI format
        """
        retval = {'format': self.format, 'horz': self.width, 'vert': self.height, 'fps': self.fps, 'gop': self.gop,
                  'vbr': self.vbr}
        if self.quality is not None:
            retval['quality'] = self.quality
        if self.bitrate is not None:
            retval['brt'] = self.bitrate
        return retval

    @classmethod
    def create_from_json(cls, data):
        """
        Create VideoInfo from dict object in ServerAPI format
        """
        kwargs = {'fmt': data['format'],
                  'width': data['horz'],
                  'height': data['vert'],
                  'fps': data['fps'],
                  'gop': data['gop'],
                  'vbr': data.get('vbr', False)}
        if not kwargs['vbr']:
            kwargs['bitrate'] = data['brt']
        else:
            kwargs['quality'] = data['quality']
        return cls(**kwargs)


class VideoInfoCapabilities:
    """
    Elementary video stream capabilities
    """
    def __init__(self, formats=list(), resolutions=list(), fps=list(), gop=list([0, 0, 0]), bitrate=list([0, 0, 0]),
                 vbr=False, quality=list([VBRQuality.Normal, VBRQuality.Normal])):
        """
        :type formats: list
        :param formats: available values for VideoInfo.format, default - empty list
        :type resolutions: list
        :param resolutions: available value pairs [width, height] for VideoInfo.width and VideoInfo.height,
        default - empty list
        :type fps: list
        :param fps: available values for VideoInfo.fps, default - empty list
        :type gop: list
        :param gop: [min_value, max_value, step] defines interval for VideoInfo.gop, default - [0, 0, 0]
        :type bitrate: list
        :param bitrate: [min_value, max_value, step] defines interval for VideoInfo.bitrate, default - [0, 0, 0]
        :type vbr: bool
        :param vbr: is VBR supported, enables VideoInfo.vbr and VideoInfo.quality, default - False
        :type quality: list
        :param quality: [min_value, max_value] defines range for VideoInfo.quality,
        default - [VBRQuality.Normal, VBRQuality.Normal]
        """
        self.formats = formats
        self.resolutions = resolutions
        self.fps = fps
        self.gop = gop
        self.bitrate = bitrate
        self.vbr = vbr
        self.quality = quality

    def to_json(self):
        """
        Convert VideoInfoCapabilities to dict object which can be encoded to JSON in ServerAPI format
        """
        return {'formats': self.formats, 'resolutions': self.resolutions, 'fps': self.fps, 'gop': self.gop,
                'brt': self.bitrate, 'vbr': self.vbr, 'quality': self.quality}

    def check_parameters(self, params):
        """
        Match parameters to this capabilities
        :type params: VideoInfo
        :param params: Video stream settings to check
        :return: True if parameters match caps, False - otherwise
        """
        if params.format not in self.formats:
            return False
        if [params.width, params.height] not in self.resolutions:
            return False
        if params.fps not in self.fps:
            return False
        if not check_value_in_range(params.gop, self.gop):
            return False
        if params.vbr is True and self.vbr is False:
            return False
        if params.vbr is True:
            if not check_value_in_range(params.quality, self.quality):
                return False
        else:
            if not check_value_in_range(params.bitrate, self.bitrate):
                return False
        return True

    def __eq__(self, other):
        return self.formats == other.formats\
               and self.resolutions == other.resolutions\
               and self.fps == other.fps\
               and self.gop == other.gop\
               and self.bitrate == other.bitrate\
               and self.vbr == other.vbr\
               and self.quality == other.quality

    def __hash__(self):
        return hash(str(self.formats).lower()) ^\
               hash(str(self.resolutions).lower()) ^\
               hash(str(self.fps).lower()) ^\
               hash(str(self.gop).lower()) ^\
               hash(str(self.bitrate).lower()) ^\
               hash(str(self.vbr).lower()) ^\
               hash(str(self.quality).lower())


class AudioEncodingFormat:
    """
    Enumerates available audio encoding formats
    """
    AAC = 'AAC'

    def __init__(self):
        raise NotImplementedError


class AudioInfo:
    """
    Audio elementary stream info
    """
    def __init__(self, fmt, bitrate, samplerate):
        """
        :type fmt: str
        :param fmt: Audio encoding format, see AudioEncodingFormat for available values
        :type bitrate: int
        :param bitrate: Specifies bitrate, kbps
        :type samplerate: float
        :param samplerate: Specifies samplerate, kHz
        """
        self.format = fmt
        self.bitrate = bitrate
        self.samplerate = samplerate

    def to_json(self):
        """
        Convert AudioInfo to dict object which can be encoded to JSON in ServerAPI format
        """
        return {'format': self.format, 'brt': self.bitrate, 'srt': self.samplerate}

    @classmethod
    def create_from_json(cls, data):
        """
        Create AudioInfo from dict object in ServerAPI format
        """
        return cls(fmt=data['format'],
                   bitrate=data['brt'],
                   samplerate=data['srt'])


class AudioInfoCapabilities:
    """
    Elementary audio stream capabilities
    """
    def __init__(self, formats=list(), bitrate=list([0, 0, 0]), samplerates=list()):
        """
        :type formats: list
        :param formats: available values for AudioInfo.format, default - empty list
        :type bitrate: list
        :param bitrate: [min_value, max_value, step] defines interval for AudioInfo.bitrate, default - [0, 0, 0]
        :type samplerates: list
        :param samplerates: available values for AudioInfo.samplerate, default - empty list
        """
        self.formats = formats
        self.bitrate = bitrate
        self.samplerates = samplerates

    def to_json(self):
        """
        Convert AudioInfoCapabilities to dict object which can be encoded to JSON in ServerAPI format
        """
        return {'formats': self.formats, 'brt': self.bitrate, 'srt': self.samplerates}

    def check_parameters(self, params):
        """
        Match parameters to this capabilities
        :type params: AudioInfo
        :param params: Audio stream settings to check
        :return: True if parameters match caps, False - otherwise
        """
        if params.format not in self.formats:
            return False
        if not check_value_in_range(params.bitrate, self.bitrate):
            return False
        if params.samplerate not in self.samplerates:
            return False
        return True

    def __eq__(self, other):
        return self.formats == other.formats\
               and self.bitrate == other.bitrate\
               and self.samplerates == other.samplerates

    def __hash__(self):
        return hash(str(self.formats).lower()) ^\
               hash(str(self.bitrate).lower()) ^\
               hash(str(self.samplerates).lower())


class MediaStreamInfo:
    """
    Camera media stream info
    """
    def __init__(self, stream_id='', video_stream_id=None, audio_stream_id=None, media_url=''):
        """
        :type stream_id: str
        :param stream_id: Media stream name, should be url-safe
        :type video_stream_id: str or None
        :param video_stream_id: Video ES name, or None if video stream is not used
        :type audio_stream_id: str or None
        :param audio_stream_id: Audio ES name, or None if audio stream is not used
        :type media_url: str
        :param media_url: URL or other kind of identifier of media stream for media library needed to start media translation
        """
        self.id = stream_id
        self.video = video_stream_id
        self.audio = audio_stream_id

        self.url = media_url
        # Another parameters could be added to carry media stream related data. This sample shows 'url' as such data.

    def to_json(self):
        """
        Convert MediaStreamInfo to dict object which can be encoded to JSON in ServerAPI format
        """
        retval = {'id': self.id}
        if self.video is not None:
            retval['video'] = self.video
        if self.audio is not None:
            retval['audio'] = self.audio
        return retval


class StreamByEventParams:
    """
    Event-driven streaming parameters
    """
    def __init__(self, stream_id, pre_event=0, post_event=0):
        """
        :type stream_id: str
        :param stream_id: Camera media stream to use
        :type pre_event: int
        :param pre_event: Duration of stream before event, camera should upload pre-recorded video file to server, msec
        :type post_event: int
        :param post_event: Duration of stream after event, msec
        """
        self.stream_id = stream_id
        self.pre_event = pre_event
        self.post_event = post_event

    def to_json(self):
        """
        Convert StreamByEventParams to dict object which can be encoded to JSON in ServerAPI format
        """
        return {'stream_id': self.stream_id, 'pre_event': self.pre_event, 'post_event': self.post_event}

    @classmethod
    def create_from_json(cls, data):
        """
        Create StreamByEventParams from dict object in ServerAPI format
        """
        return cls(stream_id=data['stream_id'],
                   pre_event=data.get('pre_event', 0),
                   post_event=data['post_event'])

    def __eq__(self, other):
        return self.stream_id == other.stream_id\
               and self.pre_event == other.pre_event\
               and self.post_event == other.post_event


class StreamByEventCapabilities:
    """
    Capabilities for event-driven streaming parameters
    """
    def __init__(self, pre_event_max=0, post_event_max=0):
        """
        :type pre_event_max: int
        :param pre_event_max: max value for StreamByEventParams.pre_event, default - 0
        :type post_event_max: int
        :param post_event_max: max value for StreamByEventParams.post_event, default - 0
        :return:
        """
        self.pre_event_max = pre_event_max
        self.post_event_max = post_event_max

    def to_json(self):
        """
        Convert StreamByEventCapabilities to dict object which can be encoded to JSON in ServerAPI format
        """
        return {'pre_event_max': self.pre_event_max,
                'post_event_max': self.post_event_max}

    def check_parameters(self, params):
        """
        Match parameters to this capabilities
        :type params: StreamByEventParams
        :param params: Event-driven streaming settings to check
        :raise CapabilityViolatedError: When parameter does not match capabilities
        """
        if params.pre_event > self.pre_event_max:
            raise CapabilityViolatedError('pre-event')
        if params.post_event > self.post_event_max:
            raise CapabilityViolatedError('post-event')


class MotionRegion:
    """
    Motion detection region
    """
    def __init__(self, map_value, sensitivity, enabled=True, name=None):
        """
        :type map_value: str
        :param map_value: Bitstring where '1' denotes an active cell and a '0' an inactive cell.
        The first cell is in the upper left corner.
        :type enabled: bool
        :param enabled: Detection is enabled for this region
        :type sensitivity: int or None
        :param sensitivity: Sensitivity of detection, 0 stands for minimal sensitivity
        :type name: str or None
        :param name: Optional name of region if supported by camera
        """
        self.name = name
        self.map = map_value
        self.sensitivity = sensitivity
        self.enabled = enabled

    def to_json(self):
        """
        Convert MotionRegion to dict object which can be encoded to JSON in ServerAPI format
        """
        retval = {'map': b64encode(PackBits.encode(self.map)), 'sensitivity': self.sensitivity, 'enabled': self.enabled}
        if self.name is not None:
            retval['region'] = self.name
        return retval

    @classmethod
    def create_from_json(cls, data):
        """
        Create MotionRegion from dict object in ServerAPI format
        :return MotionRegion
        """
        return cls(map_value=PackBits.decode(b64decode(data['map'])),
                   sensitivity=data['sensitivity'],
                   enabled=data['enabled'],
                   name=data.get('region', None))

    def __eq__(self, other):
        return self.name == other.name \
               and self.map == other.map \
               and self.sensitivity == other.sensitivity \
               and self.enabled == other.enabled


class MotionDetectionParams:
    """
    Motion detection parameters
    """
    def __init__(self, columns=0, rows=0, regions=list()):
        """
        :type columns: int
        :param columns: size of grid for motion region definition, 0 means detection is unsupported
        :type rows: int
        :param rows: size of grid for motion region definition, 0 means detection is unsupported
        :type regions: list
        :param regions: Configured motion regions, list of MotionRegion
        """
        self.columns = columns
        self.rows = rows
        self.regions = regions

    def to_json(self):
        """
        Convert MotionDetectionParams to dict object which can be encoded to JSON in ServerAPI format
        """
        regions = []
        for region in self.regions:
            regions.append(region.to_json())
        return {'columns': self.columns, 'rows': self.rows, 'regions': regions}

    @staticmethod
    def regions_from_json(data):
        """
        Create regions list from dict object in ServerAPI format
        """
        regions = []
        for region in data['regions']:
            regions.append(MotionRegion.create_from_json(region))
        return regions


class MotionDetectionCapabilities:
    """
    Motion detection parameters capabilities
    """
    # sensitivity values enum
    SENS_REGION = 'region'  # sensitivity could be set for single region
    SENS_FRAME = 'frame'  # sensitivity could be set only for the whole frame

    # region_shape values enum
    RSH_RECTANGULAR = 'rect'  # region could have only rectangular shape
    RSH_ANY = 'any'  # region could have any shape

    def __init__(self, max_regions=0, sensitivity=None, region_shape=None):
        """
        :type max_regions: int
        :param max_regions: max number of motion regions in MotionDetectionParams.regions list
        :type sensitivity: str or None
        :param sensitivity: one of the SENS_* enum or None for default value (SENS_FRAME)
        :type region_shape: str or None
        :param region_shape: one of the RSH_* enum or None for default value (RSH_ANY)
        """
        self.max_regions = max_regions
        self.sensitivity = sensitivity
        self.region_shape = region_shape

    def to_json(self):
        """
        Convert MotionDetectionCapabilities to dict object which can be encoded to JSON in ServerAPI format
        """
        retval = {'max_regions': self.max_regions}
        if self.sensitivity is not None:
            retval['sensitivity'] = self.sensitivity
        if self.region_shape is not None:
            retval['region_shape'] = self.region_shape
        return retval

    def check_parameters(self, params, new_regions):
        """
        Match parameters to this capabilities
        :type params: MotionDetectionParams
        :param params: Motion detection settings to check
        :type new_regions: list of MotionRegion
        :param new_regions: new motion regions
        :raise CapabilityViolatedError: When parameter does not match capabilities
        """
        if len(new_regions) > self.max_regions:
            raise CapabilityViolatedError('max_regions')

        if self.sensitivity == self.SENS_FRAME:
            sensitivity = None
            for region in new_regions:
                if sensitivity is None:
                    sensitivity = region.sensitivity
                else:
                    if region.sensitivity is not None and region.sensitivity != sensitivity:
                        raise CapabilityViolatedError('Sensitivity mode')
        for region in new_regions:
            if len(region.map) > params.columns * params.rows:
                raise CapabilityViolatedError('Map size')


class AudioDetectionParams:
    """
    Audio detection parameters
    """
    def __init__(self, level, length):
        """
        :type level: int
        :param level: Triggering audio volume in -dB
        :type length: int
        :param length: Duration before event trigger, msec
        """
        self.level = level
        self.length = length

    def to_json(self):
        """
        Convert AudioDetectionParams to dict object which can be encoded to JSON in ServerAPI format
        """
        return {'level': self.level, 'length': self.length}

    @classmethod
    def create_from_json(cls, data):
        """
        Create AudioDetectionParams from dict object in ServerAPI format
        """
        return cls(level=data['level'],
                   length=data['length'])

    def __eq__(self, other):
        return self.level == other.level and self.length == other.length


class AudioDetectionCapabilities:
    """
    Audio detection parameters capabilities
    """
    def __init__(self, level=list([0, 0, 0])):
        """
        :type level: list
        :param level: [min_value, max_value, step] values range for AudioDetectionParams.level
        """
        self.level = level

    def to_json(self):
        """
        Convert MotionDetectionCapabilities to dict object which can be encoded to JSON in ServerAPI format
        """
        return {'level': self.level}

    def check_parameters(self, params):
        """
        Match parameters to this capabilities
        :type params: AudioDetectionParams
        :param params: Audio detection settings to check
        :raise CapabilityViolatedError: When parameter does not match capabilities
        """
        if check_value_in_range(params.level, self.level):
            raise CapabilityViolatedError('level')


class EventParams:
    """
    Event processing parameters
    """
    def __init__(self, active, stream=False, snapshot=False):
        """
        :type active: bool
        :param active: Event is active: saved and processed by server
        :type stream: bool
        :param stream: start streaming when event is triggered
        :type snapshot: bool
        :param snapshot: generate snapshot when event is triggered
        """
        self.active = active
        self.stream = stream
        self.snapshot = snapshot

    def to_json(self):
        """
        Convert EventParams to dict object which can be encoded to JSON in ServerAPI format
        """
        retval = {'active': self.active}
        if self.stream is not None:
            retval['stream'] = self.stream
        if self.snapshot is not None:
            retval['snapshot'] = self.snapshot
        return retval

    @classmethod
    def create_from_json(cls, data):
        """
        Create EventParams from dict object in ServerAPI format
        :return EventParams
        """
        return cls(active=data['active'], stream=data.get('stream', False), snapshot=data.get('snapshot', False))


class EventCaps:
    """
    Event processing parameters caps
    """
    def __init__(self, stream=False, snapshot=False):
        """
        :type stream: bool
        :param stream: can event start streaming, enables EventParams.stream
        :type snapshot: bool
        :param snapshot: can event trigger snapshot generation, enables EventParams.snapshot
        """
        self.stream = stream
        self.snapshot = snapshot

    def check_parameters(self, params):
        """
        Match parameters to this capabilities
        :type params: EventParams
        :param params: Event processing settings to check
        :raise CapabilityViolatedError: When parameter does not match capabilities
        """
        if not self.stream and params.stream is True:
            raise CapabilityViolatedError('stream')
        if not self.snapshot and params.snapshot is True:
            raise CapabilityViolatedError('snapshot')

    def to_json(self):
        """
        Convert EventCaps to dict object which can be encoded to JSON in ServerAPI format
        """
        return {'stream': self.stream, 'snapshot': self.snapshot}


class ActiveStreams:
    """
    Storage for active streams and their reasons
    """
    def __init__(self):
        self.streams = {}  # media_stream_id: list of strings [SR_LIVE, SR_RECORD]

    def add(self, stream_id, reason):
        """
        Try to add stream to active list
        :param stream_id: string, media stream ID
        :param reason: string, [SR_LIVE, SR_RECORD]
        :return: bool, True - Stream added, False - stream exists but reason added, None - nothing is changed
        """
        if reason in self.streams.get(stream_id, []):
            return None

        if stream_id in self.streams:
            self.streams[stream_id].append(reason)
            return False
        else:
            self.streams[stream_id] = [reason]
            return True

    def remove(self, stream_id, reason):
        """
        Removes stream's reason from list.
        :param stream_id: string, media stream ID
        :param reason: string, [SR_LIVE, SR_RECORD]
        :return: bool, True if stream completely removed, False if stream is needed for some another reason,
        None if there is no such stream
        """
        if stream_id not in self.streams:
            return None

        reasons = self.streams[stream_id]
        if reason not in reasons:
            return None

        reasons.remove(reason)
        retval = len(reasons) == 0
        if retval:
            del self.streams[stream_id]
        return retval

    def enum_reasons(self, stream_id):
        """
        Get list of reasons for selected stream
        :param stream_id: string, media stream ID
        :return: list of strings
        """
        return self.streams.get(stream_id, [])

    def enum_streams(self, reason):
        """
        Get list of streams for particular reason
        :param reason: string, [SR_LIVE, SR_RECORD]
        :return:
        """
        retval = []
        for stream, reasons in self.streams.iteritems():
            if reason in reasons:
                retval.append(stream)
        return retval


class MediaServerInfo:
    """
    Media server URL composing routines
    """
    UPLOAD_CAT_PRERECORD = 'prerecord'
    UPLOAD_CAT_SNAPSHOT = 'snapshot'
    UPLOAD_CAT_PREVIEW = 'preview'
    UPLOAD_CAT_LOG = 'log'

    UPLOAD_FTYPE_JPG = 'jpg'
    UPLOAD_FTYPE_MP4 = 'mp4'
    UPLOAD_FTYPE_TXT = 'txt'

    def __init__(self, server_url=None, path=None, session_id=None, upload_url=None):
        self.server_url = server_url
        self.path = path
        self.session_id = session_id
        self.upload_url = upload_url

    def set_server_url(self, new_server_url):
        if self.server_url != new_server_url:
            self.server_url = new_server_url
            return True
        return False

    def set_path(self, new_path):
        if self.path != new_path:
            self.path = new_path
            return True
        return False

    def set_session_id(self, new_session_id):
        if self.session_id != new_session_id:
            self.session_id = new_session_id
            return True
        return False

    def set_upload_url(self, new_upload_url):
        if self.upload_url != new_upload_url:
            self.upload_url = new_upload_url
            return True
        return False

    def get_rtmp_url(self, stream_id):
        return ''.join(['rtmp://', self.server_url, '/', self.path, stream_id, '?sid=', self.session_id])

    def get_upload_url(self, category, file_type, file_time, duration=None, stream_id=None):
        if self.upload_url is None:
            return None

        link_list = ['http://', self.upload_url, '/', self.path]  # TODO: HTTPS
        if category == MediaServerInfo.UPLOAD_CAT_PRERECORD:
            if stream_id is None:
                return None
            link_list.append(stream_id)
        elif category == MediaServerInfo.UPLOAD_CAT_SNAPSHOT:
            pass
        elif category == MediaServerInfo.UPLOAD_CAT_PREVIEW:
            pass
        elif category == MediaServerInfo.UPLOAD_CAT_LOG:
            pass
        else:
            return None

        link_list.extend(['?sid=', self.session_id,
                          '&cat=', category,
                          '&type=', file_type,
                          '&start=', get_iso_8601_time_str(file_time)])
        if category == MediaServerInfo.UPLOAD_CAT_PRERECORD:
            if duration is None:
                return None
            link_list.extend(['&length=', str(duration)])
        elif category == MediaServerInfo.UPLOAD_CAT_SNAPSHOT:
            pass
        elif category == MediaServerInfo.UPLOAD_CAT_PREVIEW:
            pass
        elif category == MediaServerInfo.UPLOAD_CAT_LOG:
            pass
        else:
            return None
        return ''.join(link_list)


class Camera:
    """
    Base class for all camera types. Contains some general info and base interface
    """
    event_cb = None
    raw_msg_cb = None
    http_uploader = None

    # Stream types
    SR_LIVE = 'live'
    SR_RECORD = 'record'
    SR_EVENT_RECORD = 'record_by_event'  # as it defined in server protocol, just toggles this mode
    SR_EVENT_RECORD_REAL = 'record_by_event_real'  # internal value, connects streams
    LAST_IMAGE = './last_image.jpg'

    def __init__(self):
        """
        Camera initialization, fill all camera parameters here
        """

        """
        Base parameters, describing camera as device unit and determined by firmware developer
        """
        # Camera UUID, set by server and should be used in further communication
        self.uuid = globals.config.get('camera_uuid', None)
        self.brand = 'VXG'  # Manufacturer brand
        self.model = 'Sample Raspberry PI camera'  # Camera model
        self.serial_number = ''  # Particular camera serial number, could be the same as uuid
        self.firmware = '1.0.0'  # Firmware version
        self.username = 'user'  # Credentials to access video/audio feed
        self.password = 'password'  # Credentials to access video/audio feed
        self.device_type = None  # Camera type: bullet, media server etc, could be empty
        self.raw_messaging = globals.config.get('raw_messaging', True)
        parse_res = urlparse(globals.config['camera_feed'])
        self.video_source_type = parse_res.scheme
        if self.video_source_type not in ['rtsp', 'dev', 'file', 'http', 'rtmp', 'https']:
            raise RuntimeError('Unknown video source type %s' % self.video_source_type)
        if self.video_source_type in ['rtsp', 'http', 'rtmp', 'https']:
            self.ip = parse_res.hostname
        else:
            self.ip = '127.0.0.1'

        """
        Capabilities determined by camera hardware and could not be changed dynamically
        """
        # Direct access parameters, P2PInfo or None if P2P access is not supported by camera
        self.p2p_parameters = None
        # Video parameters caps, use default 'empty' caps for this sample
        self.video_param_caps = VideoParamCapabilities()
        # Audio parameters caps, use default 'empty' caps for this sample
        self.audio_param_caps = AudioParamCapabilities()
        # Video streams caps, dictionary: {'video_stream_name': [VideoInfoCapabilities]...}
        # In this sample set's assume that camera have only one elementary video stream: 'video1'.
        # Since default VideoInfoCapabilities config is not usable, let's fill it somehow
        if self.video_source_type == 'dev':
            self.video_stream_caps = {'video1': [VideoInfoCapabilities(formats=[VideoEncodingFormat.H264],  # only H.264
                                                                       resolutions=[[960, 540]],  # only 960x540
                                                                       fps=[25],  # only 25 fps
                                                                       gop=[25, 25, 1],  # only 25 frames
                                                                       bitrate=[1000, 1000, 1],  # only 1000kbps
                                                                       vbr=False)]}  # does not support VBR
        else:
            self.video_stream_caps = {'video1': [VideoInfoCapabilities(formats=[VideoEncodingFormat.H264],  # only H.264
                                                                       resolutions=[[1920, 1080]],  # only 1920x1080
                                                                       fps=[30],  # only 30 fps
                                                                       gop=[30, 30, 1],  # only 30 frames
                                                                       bitrate=[500, 500, 1],  # only 500kbps
                                                                       vbr=False)]}  # does not support VBR
        # Audio streams caps, dictionary: {'audio_stream_name': [AudioInfoCapabilities]...}
        # In this sample set's assume that camera have only one elementary audio stream: 'audio1'.
        # Since default AudioInfoCapabilities config is not usable, let's fill it somehow
        if self.video_source_type == 'dev':
            self.audio_stream_caps = {}
        else:
            self.audio_stream_caps = {'audio1': [AudioInfoCapabilities(formats=[AudioEncodingFormat.AAC],  # only AAC
                                                                       bitrate=[64, 64, 1],  # only 64kbps
                                                                       samplerates=[44.1])]}  # only 44.1kHz
        # List of available media streams: [MediaStreamInfo]
        # First media stream in this list will be chosen as default for live and record on server,
        # if user wasn't selected another ones.
        # Actually media stream list could be changed on camera (i.e. in ONVIF camera),
        # but for simplification purposes, let's assume it is static.
        # Assume that camera has only one media stream 'primary' and it uses video ES 'video1' and audio ES 'audio1'.
        # Just for example, lets assume that we have some media streaming library, that needs URL to grab its video,
        # Our MediaStreamInfo contains placeholder for that URL. Another libraries could have different requirements,
        # so you should extend MediaStreamInfo and fill it properly.
        # Just for example our media stream URL will be taken from config, but in general it could be composed
        # by some rule from url, username, password, etc.
        if self.video_source_type == 'dev':
            self.media_streams = [MediaStreamInfo(stream_id='primary',
                                                  video_stream_id='video1',
                                                  media_url=parse_res.path)]
        elif self.video_source_type == 'file':
            url_parts = []
            if parse_res.netloc != '':
                url_parts.extend([parse_res.netloc.upper(), ':'])
            url_parts.append(parse_res.path)
            self.media_streams = [MediaStreamInfo(stream_id='primary',
                                                  video_stream_id='video1',
                                                  audio_stream_id='audio1',
                                                  media_url=''.join(url_parts))]
        else:
            self.media_streams = [MediaStreamInfo(stream_id='primary',
                                                  video_stream_id='video1',
                                                  audio_stream_id='audio1',
                                                  media_url=globals.config['camera_feed'])]
        # Event-driven streaming parameters caps, use default 'empty' caps for this sample
        self.stream_by_event_caps = StreamByEventCapabilities()
        # Motion detection parameters caps, use default 'empty' caps for this sample
        self.motion_detection_caps = MotionDetectionCapabilities()
        # Audio detection parameters caps, use default 'empty' caps for this sample
        self.audio_detection_caps = AudioDetectionCapabilities()
        # Event processing parameters caps, lets define some events:
        #  - 'net' event can't generate snapshots or start streaming;
        #  - 'sound' event can do both.
        # This parameter is dictionary of EventCaps: {'event_name': EventCaps ...}
        self.events_param_caps = {'net': EventCaps(stream=False, snapshot=False),
                                  'sound': EventCaps(stream=True, snapshot=True)}

        """
        Initial values for parameters that can be changed by cloud
        """
        # Camera access mode, use Cloud since P2P is not supported by this sample
        self.access_mode = AccessMode.Cloud
        # Stream unrelated video parameters, use default "empty" config
        self.video_params = VideoParams()
        # Stream unrelated audio parameters, use default "empty" config
        self.audio_params = AudioParams()
        # Camera's LED status switch, None if it's not supported
        self.status_led = None
        # dict of video ES current settings, 'video_stream_name': VideoInfo.
        # Let's describe stream defined earlier in video_streams_caps according to this caps.
        if self.video_source_type == 'dev':
            self.video_streams = {'video1': VideoInfo(fmt=VideoEncodingFormat.H264,
                                                      width=960, height=540,
                                                      fps=25,
                                                      gop=25,
                                                      bitrate=1000)}
        else:
            self.video_streams = {'video1': VideoInfo(fmt=VideoEncodingFormat.H264,
                                                      width=1920, height=1080,
                                                      fps=30,
                                                      gop=30,
                                                      bitrate=500)}
        # dict of audio ES current settings, 'audio_stream_name': AudioInfo.
        # Let's describe stream defined earlier in audio_stream_caps according to this caps
        if self.video_source_type == 'dev':
            self.audio_streams = {}
        else:
            self.audio_streams = {'audio1': AudioInfo(fmt=AudioEncodingFormat.AAC, bitrate=64, samplerate=44.1)}
        # Event-driven streaming settings.
        # Let's use media stream 'primary' we defined before as stream to record in event-driven recording case
        self.stream_by_event_params = StreamByEventParams(stream_id='primary')
        # Motion detection parameters.
        # Grid size values (columns and rows) that can't be changed by server and used as capability.
        # Use default 'empty' config for this sample, which means that MotionDetection is unsupported
        self.motion_detection_params = MotionDetectionParams()
        # Audio detection parameters.
        # Let's set values according to caps defined before
        self.audio_detection_params = AudioDetectionParams(level=0, length=0)
        # Event processing parameters, lets define settings for events defined before:
        #  - 'net' event will not generate snapshots or start streaming, according to caps;
        #  - 'sound' event will generate snapshots but will not trigger streaming start.
        # This parameter is dictionary of EventParams: {'event_name': EventParams ...}
        self.events_params = {'net': EventParams(active=True, stream=False, snapshot=False),
                              'sound': EventParams(active=True, stream=False, snapshot=False)}
        # Camera is enabled by user, see ServerAPI doc chapter 2.7 for detailed description
        self.activity = True
        # Storage for parameters that was changed during camera inactivity period.
        # Documentation says that camera should save parameters conflicting to inactive mode,
        # and apply them when camera is turned active.
        self.saved_parameters = {}
        # Global events switch, if False not event should be sent to server
        self.events_enabled = True

        """
        Variables dynamically set during message exchange
        """
        self.camera_id = None
        self.media_server = MediaServerInfo()  # media server info
        self.active_streams = ActiveStreams()
        self.record_by_event = False
        self.streamers = {}  # Active media streamer processes
        self.streamers_lock = RLock()  # To be sure that only one streamer app is accessing v4l device

    def to_json(self):
        """
        Creates a dictionary object which can be encoded to JSON in ServerAPI format
        """
        retval = {'ip': self.get_ip(),
                  'uuid': self.uuid}
        if self.device_type is not None:
            retval['type'] = self.device_type
        if self.brand is not None:
            retval['brand'] = self.brand
        if self.model is not None:
            retval['model'] = self.model
        if self.serial_number is not None:
            retval['sn'] = self.serial_number
        if self.firmware is not None:
            retval['version'] = self.firmware
        if self.p2p_parameters is not None:
            p2p_settings = self.p2p_parameters.to_json()
            if len(p2p_settings) > 0:
                p2p_settings['initial_mode'] = self.access_mode
                retval['p2p'] = p2p_settings
        retval['raw_messaging'] = self.raw_messaging

        return retval

    def get_ip(self):
        """
        Get camera's IP
        :return: string with camera's IP
        """
        return self.ip

    def __cmp__(self, ip):
        return ip != self.get_ip()

    def set_media_server_info(self, media_server, session_id, upload_server):
        """
        Set the media server url info to stream on it
        :param media_server: new media server URL
        :param session_id: new session ID
        :param upload_server: new ftp server URL
        """
        is_changed = self.media_server.set_server_url(media_server)
        is_changed |= self.media_server.set_session_id(session_id)
        is_changed |= self.media_server.set_upload_url(upload_server)
        if is_changed:
            streams = dict(self.active_streams.streams)
            for stream, reasons in streams.iteritems():
                for reason in reasons:
                    self.disconnect_stream(stream, reason)

            for stream, reasons in streams.iteritems():
                for reason in reasons:
                    self.connect_stream(stream, reason)

    def set_media_path(self, new_media_path):
        """
        Set the media server url path to stream on it
        :param new_media_path: string with new media server path
        """
        if self.media_server.set_path(new_media_path):
            streams = dict(self.active_streams.streams)
            for stream, reasons in streams.iteritems():
                for reason in reasons:
                    self.disconnect_stream(stream, reason)

            for stream, reasons in streams.iteritems():
                for reason in reasons:
                    self.connect_stream(stream, reason)

    def set_access_mode(self, mode):
        """
        Set camera access mode: direct('p2p') or via cloud('cloud')
        :param mode: new access mode
        """
        if mode is None:
            return

        if mode not in ['p2p', 'cloud']:
            raise ValueError('Camera access mode')

        if mode == 'p2p' and self.p2p_parameters is None:
            raise NotImplementedError

        self.access_mode = mode

    def set_activity(self, value):
        """
        Sets camera activity mode.
        :param value: bool, new value
        """
        if self.activity != value:
            self.activity = value
            if self.activity:
                self._enable()
            else:
                self._disable()

    def _enable(self):
        """
        Enter active mode
        """
        for stream in self.active_streams.streams.keys():
            self._connect_stream(stream, self.media_server.get_rtmp_url(stream))
        if 'status_led' in self.saved_parameters:
            self.status_led = self.saved_parameters.pop('status_led')
        if 'video_params' in self.saved_parameters:
            self.video_params = self.saved_parameters.pop('video_params')

    def _disable(self):
        """
        Enter passive mode. In this mode camera:
            - Stays on line awaiting for activity mode changing or closing of the connection;
            - Receives, replies, keeps parameters of miscellaneous commands that can conflict with below items,
            but doesn't process them. They must be applied after activity mode changing;
            - Suspends sending all kind of events;
            - Suspends all kind of streaming excluding remaining post-event duration for already reported/processed
            events;
            - Completes uploading of unfinished pre-event duration;
            - Switches off all available indicators, lighting (IR) and other functionality (TDN etc).
        """
        for stream in self.active_streams.streams.keys():
            self._disconnect_stream(stream)

        self.saved_parameters['status_led'] = self.status_led
        self.status_led = False

        self.saved_parameters['video_params'] = self.video_params
        self.video_params = VideoParams()  # Assign empty params meaning all is off

    def _find_media_stream_by_id(self, stream_id):
        """
        Helper. Finds stream_id in self.media_streams
        :param stream_id: string, media stream ID to find
        :return: MediaStreamInfo or None
        """
        for media_stream in self.media_streams:
            if media_stream.id == stream_id:
                return media_stream
        return None

    def connect_stream(self, stream_id, reason):
        """
        Connects to camera's stream and start translation
        :param stream_id: string, camera's specific stream definition
        :param reason: string, one of SR_* enum members
        :return: bool showing was the operation successful or not.
        """
        if reason == Camera.SR_EVENT_RECORD:
            # just turn the event-driven streaming mode ON, real streaming starts when event comes
            self.record_by_event = True
            return True

        # Register this stream in active_streams map. Analyze retval:
        retval = self.active_streams.add(stream_id, reason)
        if retval is None:
            #  - None: stream is already connected for exactly this reason - do nothing
            raise ValueError('Stream is already connected')
        else:
            #  - False: stream is already connected, but the reason is new -
            # Set the needed flags and do nothing else
            if retval is False:
                return True

        # - True: stream is not connected - connect stream
        if self.activity:
            result = self._connect_stream(stream_id, self.media_server.get_rtmp_url(stream_id))
        else:
            result = True
        if not result:
            self.active_streams.remove(stream_id, reason)
        return result

    def disconnect_stream(self, stream_id, reason):
        """
        Disconnects specific stream from camera and stops relaying data to server
        :param stream_id: camera's specific stream definition
        :param reason: string, [SR_LIVE, SR_RECORD, SR_EVENT_RECORD]
        """
        if reason == Camera.SR_EVENT_RECORD:
            # Turn off event recording: drop flag and disconnect stream if there is one
            self.record_by_event = False
            return self.disconnect_stream(stream_id, Camera.SR_EVENT_RECORD_REAL)

        retval = self.active_streams.remove(stream_id, reason)
        if retval is not None:
            if retval:
                self._disconnect_stream(stream_id)

    def disconnect_all_streams(self):
        """
        Disconnects any connected stream from camera and stops translations
        """
        streams = self.active_streams.streams.keys()
        reasons = [Camera.SR_RECORD, Camera.SR_LIVE]
        for stream in streams:
            for rsn in reasons:
                self.disconnect_stream(stream, rsn)

    def is_stream_connected(self, stream_id):
        """
        Checks if specific stream is connected
        :return: True if stream 'stream_id' connected
        """
        return len(self.active_streams.enum_reasons(stream_id)) > 0

    def is_any_stream_connected(self):
        """
        Checks if any stream is connected
        :return: True if any stream connected
        """
        return len(self.active_streams.streams) > 0

    def ptz_process(self, action, timeout=None):
        """
        Control camera's PTZ
        Can raise:
         - ValueError with message containing name for invalid parameter
         - NotImplementedError if PTZ is not supported
         - Exception with some description of error occured
        :param action: string, defines action to perform, one of the 'left', 'right', 'top', 'bottom' or 'stop'
        :param timeout: optional int, operation time in msec
        """
        return NotImplementedError

    def format_memorycard_process(self):
        """
        Camera's memory card formatting
        """
        raise NotImplementedError

    def get_video_params(self):
        """
        Get misc video params from camera
        :return: Tuple VideoParams, VideoParamCapabilities
        """
        return self.video_params, self.video_param_caps

    def set_video_params(self, video_params):
        """
        Set misc video params to camera
        :param video_params: VideoParams object, will be validated with VideoParamCapabilities
        :raise CapabilityViolatedError: if params doesn't match caps
        """
        if video_params == self.video_params:
            return
        self.video_param_caps.check_parameters(video_params)
        if self.activity:
            self.video_params = video_params
        else:
            self.saved_parameters['video_params'] = video_params

    def get_audio_params(self):
        """
        Get misc audio params from camera
        :return: Tuple AudioParams, AudioParamCapabilities
        """
        return self.audio_params, self.audio_param_caps

    def set_audio_params(self, audio_params):
        """
        Set misc audio params to camera
        :param audio_params: AudioParams object, will be validated with AudioParamCapabilities
        :raise CapabilityViolatedError: if params doesn't match caps
        """
        if audio_params == self.audio_params:
            return
        self.audio_param_caps.check_parameters(audio_params)
        self.audio_params = audio_params

    def set_parameters(self, data):
        """
        Set misc parameters to camera. For now you can set:
            - 'status_led': bool, LED status of camera;
            - 'activity': bool, enable/disable camera
        :param data: dict with keys described above
        """
        status_led = data.get('status_led', None)
        if status_led is not None:
            self.set_status_led(status_led)

        activity = data.get('activity', None)
        if activity is not None:
            self.set_activity(activity)

    def get_stream_info(self, video=None, audio=None):
        """
        Get specific stream info from camera
        :param video: list of video ES names
        :param audio: list of audio ES names
        :return: tuple of dicts, first one is for video, second - for audio; 'el_stream_id': Video/AudioInfo
        """
        video_streams = {}
        if video is not None:
            for stream in video:
                if stream not in self.video_streams:
                    raise ValueError('Video stream ID: %s' % stream)

                video_streams[stream] = self.video_streams[stream]
        audio_streams = {}
        if audio is not None:
            for stream in audio:
                if stream not in self.audio_streams:
                    raise ValueError('Audio stream ID: %s' % stream)

                audio_streams[stream] = self.audio_streams[stream]
        return video_streams, audio_streams

    def set_stream_info(self, video=None, audio=None):
        """
        Apply specific stream info to camera
        :param video: optional list of dict:
            - stream: string, video ES to use;
            - format: string, video encoding format;
            - horz and vert: int, video resolution;
            - fps: float, framerate;
            - gop: int, gop size;
            - vbr: optional bool, prefer VBR, if false or not set use CBR;
            - brt: optional int, bitrate, kbps (non-optional if vbr is False or not set);
            - quality: optional int [-4..4], quality profile for encoder (non-optional if vbr is true).
        :param audio: optional list of dict:
            - stream: string, audio ES to use;
            - format: string, audio encoding format;
            - brt: int, bitrate, kbps;
            - srt: float, samplerate, kHz.
        :raise ValueError: if stream_id is unknown
        :raise CapabilityViolatedError: if there is no matching capability for this stream
        """
        if video is not None:
            for stream in video:
                if stream['stream'] not in self.video_streams:
                    raise ValueError('Video stream ID')
                new_video_info = VideoInfo.create_from_json(stream)
                caps = self.video_stream_caps[stream['stream']]
                for capability in caps:
                    if capability.check_parameters(new_video_info):
                        passed = True
                        break
                else:
                    passed = False
                if not passed:
                    raise CapabilityViolatedError('Video stream(%s) settings violate caps' % stream['stream'])
                self.video_streams[stream['stream']] = new_video_info

        if audio is not None:
            for stream in audio:
                if stream['stream'] not in self.audio_streams:
                    raise ValueError('Audio stream ID')
                new_audio_info = AudioInfo.create_from_json(stream)
                caps = self.audio_stream_caps[stream['stream']]
                for capability in caps:
                    if capability.check_parameters(new_audio_info):
                        passed = True
                        break
                else:
                    passed = False
                if not passed:
                    raise ValueError('Audio stream(%s) settings violate caps' % stream['stream'])
                self.audio_streams[stream['stream']] = new_audio_info

    def get_stream_by_event_params(self):
        """
        Get event-driven streaming parameters
        :return: tuple StreamByEventParams, StreamByEventCaps;
        """
        return self.stream_by_event_params, self.stream_by_event_caps

    def set_stream_by_event_params(self, params):
        """
        Sets camera event-driven streaming config
        :param params: StreamByEventParams object
        :raise CapabilityViolatedError: if param violates capabilities
        """
        if params == self.stream_by_event_params:
            return
        self.stream_by_event_caps.check_parameters(params)
        self.stream_by_event_params = params

    def get_motion_detection_params(self):
        """
        Get camera's current motion map and its caps
        :return: tuple MotionDetectionParams, MotionDetectionCapabilities;
        """
        return self.motion_detection_params, self.motion_detection_caps

    def set_motion_detection_params(self, regions):
        """
        Set new motion map.
        :param regions: list of MotionRegion(s)
        :raise CapabilityViolatedError: if param violates capabilities
        """
        if self.motion_detection_params.regions == regions:
            return
        self.motion_detection_caps.check_parameters(self.motion_detection_params, regions)
        self.motion_detection_params.regions = regions

    def get_audio_detection_params(self):
        """
        Get camera's current audio detection config and it's caps
        :return: tuple AudioDetectionParams, AudioDetectionCapabilities
        """
        return self.audio_detection_params, self.audio_detection_caps

    def set_audio_detection_params(self, params):
        """
        Set camera's current audio detection config
        :param params: AudioDetectionParams
        :raise CapabilityViolatedError: if param violates capabilities
        """
        if self.audio_detection_params == params:
            return
        self.audio_detection_caps.check_parameters(params)
        self.audio_detection_params = params

    def get_event_processing_params(self):
        """
        Get camera's current events configuration
        :return: tuple {'event_name': EventParams}, {'event_name': EventCaps}
        """
        return self.events_params, self.events_param_caps

    def set_events_processing_params(self, params):
        """
        Set camera's event processing configuration
        :param params: dict event_name: EventParams
        :raise CapabilityViolatedError: if param violates capabilities
        """
        violated = []
        for event_name, event_params in params.iteritems():
            if self.events_params[event_name] == event_params:
                continue
            try:
                self.events_param_caps[event_name].check_parameters(event_params)
            except CapabilityViolatedError:
                violated.append(event_name)
            self.events_params[event_name] = event_params
        if len(violated) != 0:
            raise CapabilityViolatedError('Event parameters(%s)', ', '.join(violated))

    def set_status_led(self, value):
        """
        Sets the camera LED status
        :param value: bool, new value
        """
        if self.status_led != value:
            if self.activity:
                self.status_led = value
            else:
                self.saved_parameters['status_led'] = value

    def on_event(self, name, data, ev_time, media_time=None):
        """
        Fire event callback if camera is active and event processing is enabled.
        Event type disabled flag is checked in processing part.
        :param name: string, event name, see chapter 6.1 of API reference
        :param data: dict with event-related data (snapshot and record event are surrogate event types and added
        to message in processing part), i.e.:
            - net_info: dict, 'net' event only;
            - motion_info: dict, 'motion' event only;
        :param ev_time: time, UTC time of event;
        :param media_time: optional int, media timestamp to sync with media stream.
        """
        if self.camera_id is not None and self.activity and self.events_enabled:
            event_data = {'event': name,
                          'time': ev_time,
                          'cam_id': self.camera_id}
            event_data.update(data)
            if media_time is not None:
                event_data['mediatm'] = media_time
            send_data = self.process_event(event_data)
            if send_data is not None and len(send_data):
                for to_send in send_data:
                    self.event_cb(to_send)

    def process_event(self, event_data):
        """
        Process event according to rules.
        :param event_data: dict with event info reported by camera;
        :return: list of dicts with data to report on server:
            - cam_id: int, camera ID;
            - event: string, event name;
            - time: float, calendar time UTC;
            - mediatm: optional int, media timestamp;
            - net_info: "net" event data;
            - record_info: "record" event data, CM detected that recording should be started/stopped;
            - snapshot_info: for events with snapshot;
            - motion_info: "motion" event data;
        :return: None in case of there is nothing to report.
        """
        try:
            params = self.events_params[event_data['event']]
            if not params.active:
                logger.debug('Event %s is disabled', event_data['event'])
                return None

            retval = []

            if params.snapshot:
                if self._is_event_on(event_data):
                    try:
                        img_time = get_iso_8601_time_str(event_data['time'])
                        event_data['snapshot_info'] = {'image_time': img_time}
                        url = self.media_server.get_upload_url(MediaServerInfo.UPLOAD_CAT_SNAPSHOT,
                                                               MediaServerInfo.UPLOAD_FTYPE_JPG,
                                                               event_data['time'])
                        if url is not None:
                            # Send via HTTP(s)
                            self._upload_file(url, None, True, self._make_snapshot,
                                              self.stream_by_event_params.stream_id)
                        else:
                            # Send via command channel, obsoletes soon
                            snapshot_path = self._make_snapshot(self.stream_by_event_params.stream_id)
                            inline = get_base64_content(snapshot_path)
                            event_data['snapshot_info']['image_inline'] = inline
                    except Exception as ex:
                        logger.error('Failed to get snapshot from stream %s: %s',
                                     self.stream_by_event_params.stream_id, error_str())

            retval.append(event_data)

            event_stream_id = self.stream_by_event_params.stream_id
            if params.stream and self.record_by_event:
                rec_info = {'stream_id': event_stream_id, 'on': False}
                if self._is_event_on(event_data):
                    if self.activity:
                        file_duration_msec = 51000
                        url = self.media_server.get_upload_url(MediaServerInfo.UPLOAD_CAT_PRERECORD,
                                                               MediaServerInfo.UPLOAD_FTYPE_MP4,
                                                               event_data['time'] - file_duration_msec / 1000.,
                                                               file_duration_msec,
                                                               event_stream_id)
                        pre_event_file_path = self._make_preevent_record()
                        self._upload_file(url, pre_event_file_path, False)
                        self.connect_stream(event_stream_id, Camera.SR_EVENT_RECORD_REAL)
                        rec_info['on'] = True

                else:
                    self.disconnect_stream(event_stream_id, Camera.SR_EVENT_RECORD_REAL)

                record_event = {'cam_id': event_data['cam_id'],
                                'event': 'record',
                                'time': event_data['time'],
                                'record_info': rec_info}
                if 'mediatm' in event_data:
                    record_event['mediatm'] = event_data['mediatm']
                retval.append(record_event)

            return retval
        except Exception as ex:
            traceback.print_exc()
            logger.error('Error at event processing: %s', repr(ex))
        return None

    def send_raw_message_broadcast(self, message):
        """
        Camera sends new raw_message to all its clients
        :param message: string, content of the message
        """
        if self.raw_messaging and self.camera_id is not None and self.activity:
            self.raw_msg_cb('', message)

    def send_raw_message(self, client_id, message):
        """
        Camera sends new raw_message to a client
        :param client_id: string, ID of a client that communicates with the camera
        :param message: string, content of the message
        """
        if self.raw_messaging and self.camera_id is not None and self.activity:
            self.raw_msg_cb(client_id, message)

    def on_raw_message(self, client_id, message):
        if self.raw_messaging:
            logger.info('Client %s. Received raw message: %s' % (client_id, message))

            # Do any fast processing here or asynchronously in a separate thread and answer to client
            # when necessary using send_raw_message

            # A test answer:
            self.send_raw_message(client_id, 'Processed: %s' % message)

    def on_raw_message_client_connected(self, client_id):
        if self.raw_messaging:
            logger.info('Added new raw messaging client %s' % client_id)

    def on_raw_message_client_disconnected(self, client_id):
        if self.raw_messaging:
            logger.info('Raw messaging client %s has been disconnected' % client_id)

    @staticmethod
    def _is_event_on(event_data):
        if event_data['event'] == 'sound':
            return event_data['sound_info']['on']
        elif event_data['event'] == 'net':
            return event_data['net_info']['ip'] != ''
        elif event_data['event'] == 'record':
            return event_data['record_info']['on']
        elif event_data['event'] == 'motion':
            return len(event_data['motion_info']['map']) != 0
        elif event_data['event'] == 'memorycard':
            return event_data['memorycard_info']['status'] == 'need-format'
        else:
            raise ValueError('Unknown event type')

    def on_net_event(self, online):
        """
        Call this when camera produces net event - comes offline/online
        :type online: bool
        :param online: camera state
        """
        if online:
            event_data = {'net_info': {'ip': self.get_ip()}}
            if self.p2p_parameters is not None:
                event_data['net_info']['p2p'] = self.p2p_parameters.to_json()
            self.on_event('net', event_data, time())
        else:
            event_data = {'net_info': {'ip': ''}}
            self.on_event('net', event_data, time())

    def on_sound_event(self, on):
        """
        Sound event - is a special test event to show how is event system working.
        This one is called to generate such event
        :type on: bool
        :param on: Event state
        """
        self.on_event('sound', {'sound_info': {'on': on}}, time())

    def _upload_file(self, url, path, delete, make_snapshot_cb=None, *args, **kwargs):
        if self.http_uploader is not None:
            self.http_uploader.upload_async(path, url, delete, make_snapshot_cb, args, kwargs)

    def update_preview(self):
        """
        Gets camera preview
        :return: base64 encoded content of jpg image or
        '' if there is no need to upload image contents via command channel
        """
        curr_time = time()
        url = self.media_server.get_upload_url(MediaServerInfo.UPLOAD_CAT_PREVIEW,
                                               MediaServerInfo.UPLOAD_FTYPE_JPG,
                                               curr_time)
        if url is not None:
            self._upload_file(url, None, True, self.make_snapshot, self.stream_by_event_params.stream_id)
        else:
            snapshot_path = self.make_snapshot(self.stream_by_event_params.stream_id)
            inline = get_base64_content(snapshot_path)
            return inline
        return ''

    def make_snapshot(self, stream_id):
        if self.video_source_type == 'dev':
            # Current rPI streaming implementation blocks video source exclusively,
            # Use cached image as snapshot
            if self.streamers.get(stream_id, None) is not None:
                if not os.path.isfile(self.LAST_IMAGE):
                    raise RuntimeError('No last image is present')
                filename = 'snap_%s.jpg' % get_iso_8601_time_str(time())
                copyfile(self.LAST_IMAGE, filename)
                return filename
            else:
                filename = self._make_snapshot(stream_id)
                copyfile(filename, self.LAST_IMAGE)
                return filename
        else:
            return self._make_snapshot(stream_id)

    def upgrade_firmware(self, url):
        logger.info('Upgrade camera to new FW, url %s', url)

    def get_log(self):
        """
        Gets camera log file and post its upload via HTTP(S)
        Can raise exceptions in case of error
        """
        curr_time = time()
        url = self.media_server.get_upload_url(MediaServerInfo.UPLOAD_CAT_LOG,
                                               MediaServerInfo.UPLOAD_FTYPE_TXT,
                                               curr_time)
        assert url is not None
        # Fill the 'log_path' variable with path to your log file from appropriate camera and uncomment next string:
        # self._upload_file(url, log_path, False)

    def backward_start(self, url):
        """
        Start camera backward channel listening
        :param url: RTMP URL to connect
        """
        # Not supported by this sample
        raise NotImplementedError

    def backward_stop(self, url):
        """
        Stop camera backward channel listening
        :param url: RTMP URL to disconnect
        """
        # Not supported by this sample
        raise NotImplementedError

    def _connect_stream(self, stream_id, publish_url):
        """
        Implicit camera media feed connection
        Can raise:
         - ValueError with message containing name for invalid parameter
         - Exception with some description of error occured
        :param stream_id: string, media stream id
        :param publish_url: string, url to publish data
        :return: bool showing was the operation successful or not.
        """
        media_stream = self._find_media_stream_by_id(stream_id)
        if media_stream is None:
            raise ValueError('Unknown media stream ID')
        camera_url = media_stream.url
        if self.streamers.get(stream_id, None) is not None:
            raise ValueError('Already started')

        if self.video_source_type == 'dev':
            self._initialize_camera()
            args = [FFMPEG, '-f', 'v4l2', '-v', 'error', '-hide_banner', '-video_size', '960x540',
                    '-framerate', '25', '-input_format', 'h264', '-i', camera_url, '-vcodec', 'copy',
                    '-bufsize', '100k', '-an', '-f', 'flv', publish_url]
            self.streamers_lock.__enter__()
        elif self.video_source_type == 'file':
            args = [FFMPEG, '-re', '-stream_loop', '0', '-v', 'error', '-hide_banner', '-i', camera_url,
                    '-c', 'copy', '-f', 'flv', '-map', '0', publish_url]
        elif self.video_source_type == 'rtsp':
            args = [FFMPEG, '-rtsp_transport', 'tcp', '-v', 'error', '-hide_banner', '-i', camera_url,
                    '-c', 'copy', '-f', 'flv', '-map', '0', '-bsf:v', 'dump_extra',
                    '-analyzeduration', '1500000', '-flags', 'global_header', publish_url]
        elif self.video_source_type == 'rtmp':
            args = [FFMPEG, '-v', 'error', '-hide_banner', '-f', 'live_flv', '-rtmp_live', 'live',
                    '-rtmp_buffer', '500', '-i', camera_url, '-c', 'copy', '-f', 'flv', '-map', '0', publish_url]
        else:
            args = [FFMPEG, '-v', 'error', '-hide_banner', '-i', camera_url, '-c', 'copy', '-an', '-f', 'flv',
                    '-map', '0', publish_url]
        try:
            self.streamers[stream_id] = subprocess.Popen(args)
        except:
            raise
        finally:
            if self.video_source_type == 'dev':
                self.streamers_lock.__exit__(None, None, None)
        return True

    @staticmethod
    def _initialize_camera():
        # auto_exposure_bias
        try:
            args = ['v4l2-ctl', '--set-ctrl', 'auto_exposure_bias=12']  # default 12
            subprocess.check_call(args)
        except:
            logger.error('Failed to initialize camera: could not set exposure_time_absolute')
        
        # exposure_time_absolute
        try:
            args = ['v4l2-ctl', '--set-ctrl', 'exposure_time_absolute=1000']  # default 1000
            subprocess.check_call(args)
        except:
            logger.error('Failed to initialize camera: could not set exposure_time_absolute')

        # white_balance_auto_preset
        try:
            args = ['v4l2-ctl', '--set-ctrl', 'white_balance_auto_preset=1']  # default 1
            subprocess.check_call(args)
        except:
            logger.error('Failed to initialize camera: could not set white_balance_auto_preset')
        
        # iso_sensitivity_auto
        try:
            args = ['v4l2-ctl', '--set-ctrl', 'iso_sensitivity_auto=1']  # default 1
            subprocess.check_call(args)
        except:
            logger.error('Failed to initialize camera: could not set h264 profile')

        try:
            args = ['v4l2-ctl', '--set-ctrl', 'h264_profile=4']  # set profile 2==main, 4==high
            subprocess.check_call(args)
        except:
            logger.error('Failed to initialize camera: could not set h264 profile')
            
        try:
            args = ['v4l2-ctl', '--set-ctrl', 'h264_i_frame_period=25']  # every 25 frames
            subprocess.check_call(args)
        except:
            logger.error('Failed to initialize camera: could not set I-Frame interval')
        try:
            args = ['v4l2-ctl', '--set-ctrl', 'video_bitrate=1000000']
            subprocess.check_call(args)
        except:
            logger.error('Failed to initialize camera: could not set video bitrate')
        try:
            args = ['v4l2-ctl', '--set-ctrl', 'repeat_sequence_header=1']
            subprocess.check_call(args)
        except:
            logger.error('Failed to initialize camera: could not set repeat sequence header')

    def _disconnect_stream(self, stream_id):
        """
        Implicit camera disconnection. Needs to be implemented in derived class
        :param stream_id: string, media stream id
        """
        if stream_id in self.streamers:
            streamer = self.streamers.pop(stream_id)
            streamer.terminate()

    def _make_snapshot(self, stream_id):
        """
        Get snapshot from particular media stream.
        Can raise:
            - ValueError with message containing name for invalid stream name
            - Exception with some description of error occured
        :param stream_id: string, media stream to get snapshot from
        :return: string path to JPEG file or None in case of error
        """
        if self.video_source_type in ['file']:
            raise NotImplementedError

        filename = 'snap_%s.jpg' % get_iso_8601_time_str(time())
        output = os.path.join(globals.WORK_DIR, filename)
        try:
            media_stream = self._find_media_stream_by_id(stream_id)
            if media_stream is None:
                raise ValueError('Unknown media stream ID')
            camera_url = media_stream.url
            if self.video_source_type == 'rtsp':
                args = [FFMPEG, '-v', 'error', '-y', '-rtsp_transport', 'tcp', '-i', camera_url,
                        '-f', 'image2', '-vframes', '1', '-s', '160x120', output]
            else:
                args = [FFMPEG, '-v', 'error', '-y', '-i', camera_url,
                        '-f', 'image2', '-vframes', '1', '-s', '160x120', output]
            if self.video_source_type == 'dev':
                self.streamers_lock.__enter__()
            subprocess.call(args)
        except:
            logger.error('Failed to make snapshot for cam(%s): %s', self.camera_id, error_str())
        finally:
            if self.video_source_type == 'dev':
                self.streamers_lock.__exit__(None, None, None)

        return output

    def _make_preevent_record(self):
        """
        Get pre-event recording buffer contents as mp4 file from current event-driven stream
        :return: string, path to MP4 file or none in case of error
        """
        raise NotImplementedError


if __name__ == "__main__":
    pass
