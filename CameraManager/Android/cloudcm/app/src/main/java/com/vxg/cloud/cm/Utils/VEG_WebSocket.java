package com.vxg.cloud.cm.Utils;

import android.os.AsyncTask;
import android.util.Log;

import com.vxg.cloud.cm.Interfaces.ServerWebSocketListener;
import com.vxg.cloud.cm.Utils.tubesock.WebSocket;
import com.vxg.cloud.cm.Utils.tubesock.WebSocketEventHandler;
import com.vxg.cloud.cm.Utils.tubesock.WebSocketException;
import com.vxg.cloud.cm.Utils.tubesock.WebSocketMessage;
import com.vxg.cloud.cm.WebSocketAPI;

import java.net.URI;
import java.nio.channels.NotYetConnectedException;

public class VEG_WebSocket extends WebSocket {
    private final String TAG = "VEG_WebSocket";

    private ServerWebSocketListener serverWebSocketListener;
    private URI curURI;
    private boolean wasPinged = false;
    private boolean isOpen = false;
    private boolean wasOpened = false;

    public enum ERROR_TYPE { BLOCK_PORT, CONN_TIME_OUT, NETWORK_IS_UNREACHABLE }

    public VEG_WebSocket(ServerWebSocketListener listener,final URI uri) {
        super(uri);
        new AsyncTask<Void, Void, Void>() {
            @Override
            protected Void doInBackground(Void... params) {
                wasPinged = (Util.pingHost(uri.getHost())) == 0;
                Log.e("wasPinged", uri.getHost() + " wasPinged: " + wasPinged);
                return null;
            }
        }.execute();
        this.curURI = uri;
        serverWebSocketListener = listener;
        this.setEventHandler(new WebSocketEventHandler() {
            @Override
            public void onOpen() {
                Log.i(TAG, "WebSocket Opened." + curURI);
                isOpen = true;
                wasOpened = true;
                serverWebSocketListener.onOpenWebSocket();
            }

            @Override
            public void onMessage(WebSocketMessage message) {
                Log.i(TAG, "Receive message: " + message.getText());
                JsonHelper json = new JsonHelper(message.getText());
                switch (json.getString(JsonHelper.PARAM_CMD)) {
                    case WebSocketAPI.CMD_CONFIGURE :
                        serverWebSocketListener.onConfigureReceived(
                                json.getInt(JsonHelper.PARAM_MSGID),
                                WebSocketAPI.CMD_CONFIGURE,
                                json
                        );
                        break;
                    case WebSocketAPI.CMD_BYE :
                        serverWebSocketListener.onBuyReceived(
                                json.getInt(JsonHelper.PARAM_MSGID),
                                WebSocketAPI.CMD_BYE,
                                json.getString(JsonHelper.PARAM_REASON)
                        );
                        break;
                    case WebSocketAPI.CMD_HELLO :
                        serverWebSocketListener.onHelloReceived(
                                json.getInt(JsonHelper.PARAM_MSGID),
                                WebSocketAPI.CMD_HELLO,
                                json
                        );
                        break;
                    case WebSocketAPI.CMD_CAM_HELLO :
                        serverWebSocketListener.onCamHelloReceived(
                                json.getInt(JsonHelper.PARAM_MSGID),
                                WebSocketAPI.CMD_CAM_HELLO,
                                json.getInt(JsonHelper.PARAM_CAM_ID),
                                json.getString(JsonHelper.PARAM_MEDIA_URL),
                                json.getBoolean(JsonHelper.PARAM_ACTIVITY)
                        );
                        break;
                    case WebSocketAPI.CMD_GET_CAM_STATUS :
                        serverWebSocketListener.onGetCamStatusReceived(
                                json.getInt(JsonHelper.PARAM_MSGID),
                                json.getInt(JsonHelper.PARAM_CAM_ID)
                        );
                        break;
                    case WebSocketAPI.CMD_GET_SUPPORTED_STREAMS :
                        serverWebSocketListener.onGetSupportedStreamsReceived(
                                json.getInt(JsonHelper.PARAM_MSGID),
                                json.getInt(JsonHelper.PARAM_CAM_ID)
                        );
                        break;
                    case WebSocketAPI.CMD_GET_CAM_EVENTS :
                        serverWebSocketListener.onGetCamEventsReceived(
                                json.getInt(JsonHelper.PARAM_MSGID),
                                json.getInt(JsonHelper.PARAM_CAM_ID)
                        );
                        break;
                    case WebSocketAPI.CMD_SET_CAM_EVENTS :
                        serverWebSocketListener.onSetCamEventsReceived(
                                json.getInt(JsonHelper.PARAM_MSGID),
                                WebSocketAPI.CMD_SET_CAM_EVENTS,
                                json.getInt(JsonHelper.PARAM_CAM_ID)
                        );
                        break;
                    case WebSocketAPI.CMD_GET_STREAM_BY_EVENT :
                        serverWebSocketListener.onGetStreamByEventReceived(
                                json.getInt(JsonHelper.PARAM_MSGID),
                                json.getInt(JsonHelper.PARAM_CAM_ID)
                        );
                        break;
                    case WebSocketAPI.CMD_GET_CAM_VIDEO_CONF :
                        serverWebSocketListener.onGetCamVideoConfReceived(
                                json.getInt(JsonHelper.PARAM_MSGID),
                                json.getInt(JsonHelper.PARAM_CAM_ID)
                        );
                        break;
                    case WebSocketAPI.CMD_GET_CAM_AUDIO_CONF :
                        serverWebSocketListener.onGetCamAudioConfReceived(
                                json.getInt(JsonHelper.PARAM_MSGID),
                                json.getInt(JsonHelper.PARAM_CAM_ID)
                        );
                        break;
                    case WebSocketAPI.CMD_SET_CAM_VIDEO_CONF :
                        serverWebSocketListener.onSetCamVideoConfReceived(
                                json.getInt(JsonHelper.PARAM_MSGID),
                                WebSocketAPI.CMD_SET_CAM_VIDEO_CONF,
                                json.getInt(JsonHelper.PARAM_CAM_ID)
                        );
                        break;
                    case WebSocketAPI.CMD_SET_CAM_AUDIO_CONF :
                        serverWebSocketListener.onSetCamAudioConfReceived(
                                json.getInt(JsonHelper.PARAM_MSGID),
                                WebSocketAPI.CMD_SET_CAM_AUDIO_CONF,
                                json.getInt(JsonHelper.PARAM_CAM_ID)
                        );
                        break;
                    case WebSocketAPI.CMD_STREAM_START :
                        serverWebSocketListener.onStreamStartReceived(
                                json.getInt(JsonHelper.PARAM_MSGID),
                                WebSocketAPI.CMD_STREAM_START,
                                json.getInt(JsonHelper.PARAM_CAM_ID),
                                json.getString(JsonHelper.PARAM_STREAM_ID),
                                json.getString(JsonHelper.PARAM_REASON)
                        );
                        break;
                    case WebSocketAPI.CMD_GET_STREAM_CAPS :
                        serverWebSocketListener.onGetStreamCapsReceived(
                                json.getInt(JsonHelper.PARAM_MSGID),
                                json.getInt(JsonHelper.PARAM_CAM_ID),
                                json.getArrayString(JsonHelper.PARAM_VIDEO_ES),
                                json.getArrayString(JsonHelper.PARAM_AUDIO_ES)
                        );
                        break;
                    case WebSocketAPI.CMD_GET_STREAM_CONFIG :
                        serverWebSocketListener.onGetStreamConfigReceived(
                                json.getInt(JsonHelper.PARAM_MSGID),
                                json.getInt(JsonHelper.PARAM_CAM_ID),
                                json.getArrayString(JsonHelper.PARAM_VIDEO_ES),
                                json.getArrayString(JsonHelper.PARAM_AUDIO_ES)
                        );
                        break;
                }
            }

            @Override
            public void onClose() {
                Log.i(
                        TAG,
                        "WebSocketAPI Closed "
                                + " wasOpened=" + wasOpened
                                + " wasPinged=" + wasPinged
                );
                isOpen = false;
                serverWebSocketListener.onCloseWebSocket(curURI, wasOpened, wasPinged);
            }

            @Override
            public void onError(WebSocketException e) {
                Log.e(TAG, "onError: ",e );
            }

            @Override
            public void onLogMessage(String msg) {
                Log.d(TAG, "onLogMessage: " + msg);
                if (msg != null) {
                    if (msg.contains("connect failed: ETIMEDOUT (Connection timed out)")) {// || msg.contains("failed to connect to"))
                        Log.i(TAG, "Block 8888 port");
                        serverWebSocketListener.onErrorWebSocket(ERROR_TYPE.BLOCK_PORT);
                    }
                    if (msg.contains("connect failed: ENETUNREACH (Network is unreachable)")) {// || msg.contains("failed to connect to"))
                        Log.i(TAG, "отключаю вайфай заблокированный");
                        serverWebSocketListener.onErrorWebSocket(ERROR_TYPE.NETWORK_IS_UNREACHABLE);
                    }
                    if (msg.contains("recvfrom failed: ETIMEDOUT (Connection timed out)")) {
                        Log.i(TAG, "отключаю вайфай нормальный");
                        serverWebSocketListener.onErrorWebSocket(ERROR_TYPE.CONN_TIME_OUT);
                    }
                }
            }

            //IO Error проверку
        });
        this.connect();
    }

    public void sendJSON(String text) throws NotYetConnectedException {
        if (isOpen) {
            Log.i(TAG, "Send: " + text);
            super.send(text);
        }
        else {
            Log.e(TAG, "Can't send: " + text);
        }
    }

    public boolean isOpen() {
        return super.getState() ==  State.CONNECTED;
    }
}