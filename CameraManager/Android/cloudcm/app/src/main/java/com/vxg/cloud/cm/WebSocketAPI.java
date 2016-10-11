package com.vxg.cloud.cm;

import android.content.Context;
import android.util.Log;

import com.vxg.cloud.cm.Control.CaptureStreamingController;
import com.vxg.cloud.cm.Interfaces.ServerWebSocketListener;
import com.vxg.cloud.cm.Interfaces.WebSocketApiListener;
import com.vxg.cloud.cm.Objects.AccountConfiguration;
import com.vxg.cloud.cm.Objects.CameraDetail;
import com.vxg.cloud.cm.Utils.JsonHelper;
import com.vxg.cloud.cm.Utils.Util;
import com.vxg.cloud.cm.Utils.VEG_WebSocket;
import com.vxg.cloud.cm.Utils.VEG_WebSocket.ERROR_TYPE;

import org.json.JSONObject;

import java.net.URI;
import java.net.URISyntaxException;

public class WebSocketAPI implements ServerWebSocketListener {
    private final String TAG = "WebSocketAPI";

    public final static String CMD_REGISTER = "register";
    public final static String CMD_DONE = "done";
    public final static String CMD_CONFIGURE = "configure";
    public final static String CMD_BYE = "bye";
    public final static String CMD_HELLO = "hello";
    public final static String CMD_CAM_REGISTER = "cam_register";
    public final static String CMD_CAM_HELLO = "cam_hello";
    public final static String CMD_GET_CAM_STATUS = "get_cam_status";
    public final static String CMD_CAM_STATUS = "cam_status";
    public final static String CMD_GET_CAM_VIDEO_CONF = "get_cam_video_conf";
    public final static String CMD_CAM_VIDEO_CONF = "cam_video_conf";
    public final static String CMD_GET_CAM_AUDIO_CONF  = "get_cam_audio_conf";
    public final static String CMD_CAM_AUDIO_CONF  = "cam_audio_conf";
    public final static String CMD_GET_SUPPORTED_STREAMS = "get_supported_streams";
    public final static String CMD_SUPPORTED_STREAMS = "supported_streams";
    public final static String CMD_GET_CAM_EVENTS = "get_cam_events";
    public final static String CMD_CAM_EVENTS_CONF = "cam_events_conf";
    public final static String CMD_SET_CAM_EVENTS = "set_cam_events";
    public final static String CMD_GET_STREAM_BY_EVENT = "get_stream_by_event";
    public final static String CMD_STREAM_BY_EVENT_CONF = "stream_by_event_conf";
    public final static String CMD_SET_CAM_VIDEO_CONF = "set_cam_video_conf";
    public final static String CMD_SET_CAM_AUDIO_CONF = "set_cam_audio_conf";
    public final static String CMD_STREAM_START = "stream_start";
    public final static String CMD_GET_STREAM_CAPS = "get_stream_caps";
    public final static String CMD_STREAM_CAPS = "stream_caps";
    public final static String CMD_GET_STREAM_CONFIG = "get_stream_config";
    public final static String CMD_STREAM_CONFIG = "stream_config";

    public final static String REASON_ERROR = "ERROR"; //general application error
    public final static String REASON_SYSTEM_ERROR = "SYSTEM_ERROR"; // – system failure on peer
    public final static String REASON_INVALID_USER = "INVALID_USER"; //  user not found
    public final static String REASON_AUTH_FAILURE = "AUTH_FAILURE"; // authentication failure
    public final static String REASON_CONN_CONFLICT = "CONN_CONFLICT"; //there is another alive connection from the CM
    public final static String REASON_RECONNECT = "RECONNECT"; // no error but reconnection is required
    public final static String REASON_SHUTDOWN = "SHUTDOWN"; //CM shutdown or reboot is requested
    public final static String REASON_DELETED = "DELETED";   /*  CM has been deleted from account it belonged to. CM must stop all
                                                                attempts to connect to server and forget all related data:
                                                                account (user), password, server address and port.*/


    // WS(S) - 8888(8883)
    private String protocol = "ws://";
    //private String address = "54.173.34.172";
    private String address = "cam.skyvr.videoexpertsgroup.com";
    private String port = "8888";

    private VEG_WebSocket webSocketClient;
    private int massageId = 1;
    private CameraDetail cameraDetail;
    private AccountConfiguration configuration;

    private WebSocketApiListener webSocketApiListener;

    private boolean closedByUser = false;

    // need save
    private String upload_url;
    private String media_server;
    private String cam_path;
    private String stream_id = "Main";

    //!****** ServerWebSocketListener
    @Override
    public void onCloseWebSocket(URI uri, boolean wasOpened, boolean wasPinged) {
        if (uri.equals(getAddress(address)) && !closedByUser) {
            if (webSocketApiListener != null)
                webSocketApiListener.onServerConnClose(CaptureStreamingController.ERROR_LOST_SERVER_CONNECTION);
        }
        else
            Log.v(TAG, "Was reconnecting. It's ok" );
    }
    @Override
    public void onErrorWebSocket(ERROR_TYPE error) {
        switch (error) {
            case BLOCK_PORT :
                closedByUser = true;
                if (webSocketApiListener != null)
                    webSocketApiListener.onServerConnClose(CaptureStreamingController.ERROR_WS_PORT_BLOCKED);
                break;
            case NETWORK_IS_UNREACHABLE :
                closedByUser = true;
                if (webSocketApiListener != null)
                    webSocketApiListener.onServerConnClose(CaptureStreamingController.ERROR_LOST_SERVER_CONNECTION);
                break;
            case CONN_TIME_OUT :
                closedByUser = true;
                if (webSocketApiListener != null)
                    webSocketApiListener.onServerConnClose(CaptureStreamingController.ERROR_LOST_SERVER_CONNECTION);
                break;
        }
    }

    @Override
    public void onOpenWebSocket() {
        cmd_register();
    }
    @Override
    public void onConfigureReceived(int refid, String orig_cmd, JsonHelper json) {
        String pwd = json.getString(JsonHelper.PARAM_PWD);
        String connId = json.getString(JsonHelper.PARAM_CONNID);
        String address = json.getString(JsonHelper.PARAM_SERVER);
        String uuid = json.getString(JsonHelper.PARAM_UUID);

        if (pwd == null && address != null) {
            Log.d(TAG, "onConfigureReceive() newAddress=" + address);
            this.address = address;
        }
        if (uuid != null || connId != null) {
            cameraDetail.setUuid(uuid);
            configuration.putString(AccountConfiguration.UUID, uuid);
            configuration.putString(AccountConfiguration.CONNID, connId);
            configuration.putString(AccountConfiguration.PWD, pwd);
        }
        cmd_done("OK", refid, orig_cmd);
    }
    @Override
    public void onBuyReceived(int refid, String orig_cmd, String reason) {
        switch (reason) {
            case REASON_RECONNECT :
                closedByUser = true;
                if (webSocketClient != null)
                    webSocketClient.close();
                webSocketClient = new VEG_WebSocket(this, getAddress(address));
                closedByUser = false;
                break;
            case REASON_AUTH_FAILURE :
                closedByUser = true;
                if (webSocketApiListener != null) {
                    webSocketApiListener.OnFailRegisterCM();
                    webSocketApiListener.onServerConnClose(REASON_AUTH_FAILURE);
                }
                break;
            case REASON_CONN_CONFLICT :
                closedByUser = true;
                if (webSocketApiListener != null)
                    webSocketApiListener.onServerConnClose(REASON_CONN_CONFLICT);
                break;
            case REASON_ERROR :
                closedByUser = true;
                if (webSocketApiListener != null)
                    webSocketApiListener.onServerConnClose(REASON_ERROR);
                break;
            case REASON_SYSTEM_ERROR :
                closedByUser = true;
                if (webSocketApiListener != null)
                    webSocketApiListener.onServerConnClose(REASON_SYSTEM_ERROR);
                break;
            case REASON_INVALID_USER :
                closedByUser = true;
                if (webSocketApiListener != null)
                    webSocketApiListener.onServerConnClose(REASON_INVALID_USER);
                break;
            case REASON_SHUTDOWN :
                closedByUser = true;
                if (webSocketApiListener != null)
                    webSocketApiListener.onServerConnClose(REASON_SHUTDOWN);
                break;
            case REASON_DELETED :
                closedByUser = true;
                configuration.clearSettings();
                if (webSocketApiListener != null)
                    webSocketApiListener.onServerConnClose(REASON_DELETED);
                break;
        }
    }
    @Override
    public void onHelloReceived(int refid, String orig_cmd, JsonHelper json) {
        String sid = json.getString(JsonHelper.PARAM_SID);
        upload_url = json.getString(JsonHelper.PARAM_UPLOAD_URL);
        media_server = json.getString(JsonHelper.PARAM_MEDIA_SERVER);
        String CA = json.getString(JsonHelper.PARAM_CA);

        configuration.putString(AccountConfiguration.CA, CA);
        configuration.putString(AccountConfiguration.SID, sid);

        cmd_done("OK", refid, orig_cmd);
    }
    @Override
    public void onCamHelloReceived(int refid, String orig_cmd, int cam_id, String media_url, boolean activity) {
        cameraDetail.setCameraID(cam_id);
        cam_path = media_url;
        cameraDetail.setActivity(activity);
        configuration.putBool(AccountConfiguration.REGISTERED, true);
        cmd_done("OK", refid, orig_cmd);
    }

    @Override
    public void onGetCamStatusReceived(int refid, int cam_id) {
        cmd_cam_status(refid, cam_id);
    }
    @Override
    public void onGetSupportedStreamsReceived(int refid, int cam_id) {
        cmd_supported_streams(refid, cam_id);
    }
    @Override
    public void onGetCamEventsReceived(int refid, int cam_id) {
        cmd_cam_events_conf(refid, cam_id);
    }
    @Override
    public void onSetCamEventsReceived(int refid, String orig_cmd, int cam_id) {
        //TODO
        cmd_done("OK", refid, orig_cmd);
    }
    @Override
    public void onGetStreamByEventReceived(int refid, int cam_id) {
        //cmd_stream_by_event_conf(); //TODO
    }

    @Override
    public void onGetCamVideoConfReceived(int refid, int cam_id) {
        cmd_cam_video_conf(refid, cam_id);
    }

    @Override
    public void onGetCamAudioConfReceived(int refid, int cam_id) {
        cmd_cam_audio_conf(refid, cam_id);
    }
    @Override
    public void onSetCamVideoConfReceived(int refid, String orig_cmd, int cam_id) {
        //TODO
        cmd_done("OK", refid, orig_cmd);

    }
    @Override
    public void onSetCamAudioConfReceived(int refid, String orig_cmd, int cam_id) {
        //TODO
        cmd_done("OK", refid, orig_cmd);
    }
    @Override
    public void onStreamStartReceived(int refid, String orig_cmd, int cam_id, String stream_id, String reason) {
        //TODO
        cmd_done("OK", refid, orig_cmd);
    }
    @Override
    public void onGetStreamCapsReceived(int refid, int cam_id, String[] video_es, String[] audio_es) {
        cmd_stream_caps(refid, cam_id, video_es, audio_es);
    }
    @Override
    public void onGetStreamConfigReceived(int refid, int cam_id, String[] video_es, String[] audio_es) {
        cmd_stream_config(refid, cam_id, video_es, audio_es);
    }
    //**********!

    public WebSocketAPI(Context context, CameraDetail cameraDetail) {
        configuration = AccountConfiguration.getInstance(context);
        this.cameraDetail = cameraDetail;
    }

    public void startWebSocket(WebSocketApiListener webSocketApiListener) {
        if (configuration.isRegistered()) {
            cameraDetail.setUuid(configuration.getString(AccountConfiguration.UUID, null));
        }
        this.webSocketApiListener = webSocketApiListener;
        webSocketClient = new VEG_WebSocket(this, getAddress(address));
        closedByUser = false;
    }

    public void unsetWebSocketApiListener() {
        this.webSocketApiListener = null;
        if (webSocketClient != null) {
            webSocketClient.close();
            webSocketClient = null;
            closedByUser = true;
        }
    }

    private void cmd_register() {
        if (webSocketClient.isOpen()) {
            JsonHelper json = new JsonHelper(getBaseJSON(CMD_REGISTER));
            json.put(
                    new Object[]{JsonHelper.PARAM_VER, cameraDetail.getCmVersion()},
                    new Object[]{JsonHelper.PARAM_TZ, cameraDetail.getTz()},
                    new Object[]{JsonHelper.PARAM_VENDOR, cameraDetail.getVendor()}
            );

            String pwd = configuration.getString(AccountConfiguration.PWD, null);
            String sid = getSID();

            if (pwd != null) {
                json.put(new Object[]{JsonHelper.PARAM_PWD, pwd});

            }
            if (sid != null)
                json.put(new Object[]{JsonHelper.PARAM_PREV_SID, sid});
            else {
                json.put(new Object[]{
                        JsonHelper.PARAM_REG_TOKEN,
                        configuration.getString(AccountConfiguration.REG_TOKEN, null)
                    }
                );
            }

            if (webSocketClient != null)
                webSocketClient.sendJSON(json.toString());
        }
        else
            Log.e(TAG, "cmd_register: webSocketClient is't Open");
    }

    public void cmd_cam_register() {
        JsonHelper json = new JsonHelper(getBaseJSON(CMD_CAM_REGISTER));
        json.put(
                new Object[]{JsonHelper.PARAM_IP, cameraDetail.getIp()},
                new Object[]{JsonHelper.PARAM_UUID, cameraDetail.getUuid()},
                new Object[]{JsonHelper.PARAM_BRAND, cameraDetail.getBrand()},
                new Object[]{JsonHelper.PARAM_MODEL, cameraDetail.getModel()},
                new Object[]{JsonHelper.PARAM_SN, cameraDetail.getSn()},
                new Object[]{JsonHelper.PARAM_VERSION, cameraDetail.getCameraVersion()}
        );
        if (webSocketClient != null)
            webSocketClient.sendJSON(json.toString());
    }

    public void cmd_bye() {
        if (webSocketClient != null) {
            JsonHelper json = new JsonHelper(getBaseJSON(CMD_BYE));

            json.put(new Object[]{JsonHelper.PARAM_REASON, REASON_SHUTDOWN});

            webSocketClient.sendJSON(json.toString());
            webSocketClient.close();
            webSocketClient = null;
            closedByUser = true;
        }
    }

    public String getMediaServerURL() {
        return media_server;
    }

    public String getUploadURL() {
        return upload_url;
    }

    public String getSID() {
        return configuration.getString(AccountConfiguration.SID, null);
    }

    public String getStreamID() {
        return stream_id;
    }

    public String getCamPath() {
        return cam_path;
    }




    private void cmd_stream_config(int refid,int cam_id, String[] video_es, String[] audio_es) {
        JsonHelper json = new JsonHelper(getBaseJSON(CMD_STREAM_CONFIG));
        if (cam_id != cameraDetail.getCameraID())
            Log.e(TAG, "Unknown camera !!!" + cam_id + " (expected " + cameraDetail.getCameraID());

        json.put(
                new Object[]{JsonHelper.PARAM_REFID, refid},
                new Object[]{JsonHelper.PARAM_CAM_ID, cam_id}
        );
        //TODO hardcoded
        JsonHelper video1 = new JsonHelper();
        video1.put(new Object[]{JsonHelper.PARAM_STREAM, video_es[0]});
        video1.put(new Object[]{JsonHelper.PARAM_FORMAT, "H.264"});
        video1.put(new Object[]{JsonHelper.PARAM_HORZ, 1280});
        video1.put(new Object[]{JsonHelper.PARAM_VERT, 720});
        video1.put(new Object[]{JsonHelper.PARAM_FPS, 30});
        video1.put(new Object[]{JsonHelper.PARAM_GOP, 60});
        video1.put(new Object[]{JsonHelper.PARAM_BRT, 128});
        video1.put(new Object[]{JsonHelper.PARAM_VBR, true});
        video1.put(new Object[]{JsonHelper.PARAM_QUALITY, 0});

        JsonHelper audio1 = new JsonHelper();
        audio1.put(new Object[]{JsonHelper.PARAM_STREAM, audio_es[0]});
        audio1.put(new Object[]{JsonHelper.PARAM_FORMAT, "AAC"});
        audio1.put(new Object[]{JsonHelper.PARAM_BRT, 128});
        audio1.put(new Object[]{JsonHelper.PARAM_SRT, 44.1});

        json.putArrayOfJson(JsonHelper.PARAM_VIDEO, video1);
        json.putArrayOfJson(JsonHelper.PARAM_AUDIO, audio1);

        Log.e(TAG, json.toString(1));
        if (webSocketClient != null)
            webSocketClient.sendJSON(json.toString());
    }
    private void cmd_stream_caps(int refid,int cam_id, String[] video_es, String[] audio_es) {
        JsonHelper json = new JsonHelper(getBaseJSON(CMD_STREAM_CAPS));
        if (cam_id != cameraDetail.getCameraID())
            Log.e(TAG, "Unknown camera !!!" + cam_id + " (expected " + cameraDetail.getCameraID());

        json.put(
                new Object[]{JsonHelper.PARAM_REFID, refid},
                new Object[]{JsonHelper.PARAM_CAM_ID, cam_id}
        );
        //TODO hardcoded
        JsonHelper caps_video1 = new JsonHelper();
        caps_video1.putArrayOfString(JsonHelper.PARAM_STREAMS, video_es);
        caps_video1.putArray(JsonHelper.PARAM_FORMATS, "H.264");
        caps_video1.putArrayOfPairs(
                JsonHelper.PARAM_RESOLUTIONS,
                new Object[]{1280, 720},
                new Object[]{1920, 1080},
                new Object[]{640, 480}
        );
        caps_video1.putArray(JsonHelper.PARAM_FPS, 30);
        caps_video1.putArray(JsonHelper.PARAM_GOP, 60, 120, 60);
        caps_video1.putArray(JsonHelper.PARAM_BRT, 1024, 2048, 128);
        caps_video1.put(new Object[]{JsonHelper.PARAM_VBR, true});
        caps_video1.putArray(JsonHelper.PARAM_QUALITY, -4,4);

        JsonHelper caps_audio1 = new JsonHelper();
        caps_audio1.putArrayOfString(JsonHelper.PARAM_STREAMS, audio_es);
        caps_audio1.putArray(JsonHelper.PARAM_FORMATS, "AAC");
        caps_audio1.putArray(JsonHelper.PARAM_BRT, 64, 128, 64);
        caps_audio1.putArray(JsonHelper.PARAM_SRT, 32.0, 44.1, 48.0);

        json.putArrayOfJson(JsonHelper.PARAM_CAPS_VIDEO, caps_video1);
        json.putArrayOfJson(JsonHelper.PARAM_CAPS_AUDIO, caps_audio1);

        //Log.e(TAG, json.toString(1));
        if (webSocketClient != null)
            webSocketClient.sendJSON(json.toString());
    }
    private void cmd_cam_audio_conf(int refid, int cam_id) {
        JsonHelper json = new JsonHelper(getBaseJSON(CMD_CAM_AUDIO_CONF));
        if (cam_id != cameraDetail.getCameraID())
            Log.e(TAG, "Unknown camera !!!" + cam_id + " (expected " + cameraDetail.getCameraID());

        json.put(
                new Object[]{JsonHelper.PARAM_REFID, refid},
                new Object[]{JsonHelper.PARAM_CAM_ID, cam_id}
        );

        JsonHelper json_caps = new JsonHelper();
        json_caps.put(
                new Object[]{JsonHelper.PARAM_MIC, false},
                new Object[]{JsonHelper.PARAM_SPKR, false},
                new Object[]{JsonHelper.PARAM_BACKWARD, false}
        );
        json.putJson(
                JsonHelper.PARAM_CAPS,
                json_caps
        );

        if (webSocketClient != null)
            webSocketClient.sendJSON(json.toString());
    }
    private void cmd_cam_video_conf(int refid, int cam_id) {
        JsonHelper json = new JsonHelper(getBaseJSON(CMD_CAM_VIDEO_CONF));
        if (cam_id != cameraDetail.getCameraID())
            Log.e(TAG, "Unknown camera !!!" + cam_id + " (expected " + cameraDetail.getCameraID());
        json.put(
                new Object[]{JsonHelper.PARAM_REFID, refid},
                new Object[]{JsonHelper.PARAM_CAM_ID, cam_id}
        );
        JsonHelper json_caps = new JsonHelper();
        json.putJson(
                JsonHelper.PARAM_CAPS,
                json_caps
        );

        if (webSocketClient != null)
            webSocketClient.sendJSON(json.toString());
    }
    private void cmd_stream_by_event_conf(int refid, int cam_id) {
        JsonHelper json = new JsonHelper(getBaseJSON(CMD_STREAM_BY_EVENT_CONF));
        if (cam_id != cameraDetail.getCameraID())
            Log.e(TAG, "Unknown camera !!!" + cam_id + " (expected " + cameraDetail.getCameraID());
        json.put(
                new Object[]{JsonHelper.PARAM_REFID, refid},
                new Object[]{JsonHelper.PARAM_CAM_ID, cam_id}
        );
        json.put(new Object[]{JsonHelper.PARAM_POST_EVENT, 2000});

        //TODO !!!!!! need stream_id

        if (webSocketClient != null)
            webSocketClient.sendJSON(json.toString());
    }
    private void cmd_cam_events_conf(int refid, int cam_id) {
        JsonHelper json = new JsonHelper(getBaseJSON(CMD_CAM_EVENTS_CONF));
        if (cam_id != cameraDetail.getCameraID())
            Log.e(TAG, "Unknown camera !!!" + cam_id + " (expected " + cameraDetail.getCameraID());
        json.put(
                new Object[]{JsonHelper.PARAM_REFID, refid},
                new Object[]{JsonHelper.PARAM_CAM_ID, cam_id},
                new Object[]{JsonHelper.PARAM_ENABLED, true} //bool, indicates global events and event-driven streaming enabling flag
        );

        JsonHelper temp_json_event1 = new JsonHelper();
        JsonHelper temp_json_caps1 = new JsonHelper();
        temp_json_caps1.put(
                new Object[]{JsonHelper.PARAM_STREAM, true},
                new Object[]{JsonHelper.PARAM_SNAPSHOT, false}
        );
        temp_json_event1.putJson(
                JsonHelper.PARAM_CAPS,
                temp_json_caps1
        );
        temp_json_event1.put(
                /*
                Events:
                – “motion”  for motion detection events
                – “sound” for audio detection
                – “net” for the camera network status change
                – “record” CM informs server about necessity of changing of recording state
                – “memorycard” camera's memory-card status change
                – “wifi” status of camera's currently used Wi-Fi
                 */
                new Object[]{JsonHelper.PARAM_EVENT, "record"},
                new Object[]{JsonHelper.PARAM_ACTIVE, true},
                new Object[]{JsonHelper.PARAM_STREAM, true},
                new Object[]{JsonHelper.PARAM_SNAPSHOT, false}
        );

        json.putArrayOfJson(
                JsonHelper.PARAM_EVENTS,
                temp_json_event1
        );
        Log.e(TAG, json.toString(1));

        if (webSocketClient != null)
            webSocketClient.sendJSON(json.toString());
    }
    private void cmd_supported_streams(int refid, int cam_id) {
        JsonHelper json = new JsonHelper(getBaseJSON(CMD_SUPPORTED_STREAMS));
        if (cam_id != cameraDetail.getCameraID())
            Log.e(TAG, "Unknown camera !!!" + cam_id + " (expected " + cameraDetail.getCameraID());
        json.put(
                new Object[]{JsonHelper.PARAM_REFID, refid},
                new Object[]{JsonHelper.PARAM_CAM_ID, cam_id}
        );

        json.putArray(JsonHelper.PARAM_AUDIO_ES, "Aud");
        json.putArray(JsonHelper.PARAM_VIDEO_ES, "Vid");

        JsonHelper json_stream1 = new JsonHelper();
        json_stream1.put(
                new Object[]{JsonHelper.PARAM_ID, "Main"},
                new Object[]{JsonHelper.PARAM_VIDEO, "Vid"},
                new Object[]{JsonHelper.PARAM_AUDIO, "Aud"}
        );
        json.putArrayOfJson(JsonHelper.PARAM_STREAMS, json_stream1);
        if (webSocketClient != null)
            webSocketClient.sendJSON(json.toString());
    }
    private void cmd_cam_status(int refid, int cam_id) {
        JsonHelper json = new JsonHelper(getBaseJSON(CMD_CAM_STATUS));
        if (cam_id != cameraDetail.getCameraID())
            Log.e(TAG, "Unknown camera !!!" + cam_id + " (expected " + cameraDetail.getCameraID());
        json.put(
                new Object[]{JsonHelper.PARAM_REFID, refid},
                new Object[]{JsonHelper.PARAM_CAM_ID, cam_id},
                new Object[]{JsonHelper.PARAM_IP, cameraDetail.getIp()},
                new Object[]{JsonHelper.PARAM_ACTIVITY, cameraDetail.getActivity()},
                new Object[]{JsonHelper.PARAM_STREAMING, cameraDetail.isStreaming()},
                new Object[]{JsonHelper.PARAM_STATUS_LED, cameraDetail.getStatusLed()}
        );
        if (webSocketClient != null)
            webSocketClient.sendJSON(json.toString());
    }
    private void cmd_done(String status, int refid, String orig_cmd) {
        /*
        Success is “OK”. Predefined values are:
        –	ERROR – general error
        –	SYSTEM_ERROR – system failure
        –	NOT_SUPPORTED – functionality is not supported
        –	INVALID_PARAM – some parameter in packet is invalid
        –	MISSED_PARAM – mandatory parameter is missed in the packet
        –	TOO_MANY – list contains too many elements
        –	RETRY – peer is busy, retry later
         */
        JsonHelper json = new JsonHelper(getBaseJSON(CMD_DONE));
        json.put(
                new Object[]{JsonHelper.PARAM_REFID, refid},
                new Object[]{JsonHelper.PARAM_ORIG_CMD, orig_cmd},
                new Object[]{JsonHelper.PARAM_STATUS, status}
        );

        if (webSocketClient != null) {
            webSocketClient.sendJSON(json.toString());

            if (orig_cmd.equals(CMD_HELLO))
                cmd_cam_register();
            else if (orig_cmd.equals(CMD_CAM_HELLO)) {
                Log.i(TAG, "CAM_HELLO receive ; call onPreparedCM()");
                if (webSocketApiListener != null)
                    webSocketApiListener.onPreparedCM();
            }
        }
    }
    private JSONObject getBaseJSON(String cmd) {
        return JsonHelper.toJsonObject(
                new Object[] { JsonHelper.PARAM_CMD, cmd},
                new Object[] { JsonHelper.PARAM_MSGID, massageId++}
        );
    }
    private URI getAddress(String address) {
        try {
            if (configuration.isRegistered()) {
                String connId = configuration.getString(AccountConfiguration.CONNID, null);
                return new URI(protocol + address + ":" + port + "/ctl/" + connId + "/");
            }
            else {
                return new URI(protocol + address + ":" + port + "/ctl/NEW/" + configuration.getString(AccountConfiguration.REG_TOKEN, null) + "/");
            }
        } catch (URISyntaxException e) {
            Log.e(TAG, "getAddress", e);
            return null;
        }
    }
}