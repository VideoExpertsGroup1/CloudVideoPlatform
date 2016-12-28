package com.vxg.cloud.cm.Utils;

import android.util.Log;

import com.firebase.tubesock.WebSocket;
import com.firebase.tubesock.WebSocketEventHandler;
import com.firebase.tubesock.WebSocketException;
import com.firebase.tubesock.WebSocketMessage;
import com.vxg.cloud.CameraManager.CameraManagerConfig;
import com.vxg.cloud.CameraManager.CreateCmdHandlers;
import com.vxg.cloud.CameraManager.Enums.CameraManagerCommandNames;
import com.vxg.cloud.CameraManager.Enums.CameraManagerErrors;
import com.vxg.cloud.CameraManager.Enums.CameraManagerParameterNames;
import com.vxg.cloud.CameraManager.Interfaces.CameraManagerClientListener;
import com.vxg.cloud.CameraManager.Interfaces.CmdHandler;
import com.vxg.cloud.cm.Interfaces.ServerWebSocketListener;

import org.json.JSONException;
import org.json.JSONObject;

import java.net.URI;
import java.nio.channels.NotYetConnectedException;
import java.util.HashMap;

public class VEG_WebSocket extends WebSocket {
    private final String TAG = "VEG_WebSocket";

    private ServerWebSocketListener serverWebSocketListener;
    private URI curURI;
    private boolean isOpen = false;
    private boolean wasOpened = false;
    private HashMap<String, CmdHandler> mHandlers = CreateCmdHandlers.create();
    private CameraManagerClientListener mClient = null;

    public VEG_WebSocket(ServerWebSocketListener listener, CameraManagerClientListener client, final URI uri) {
        super(uri);
        this.curURI = uri;
        Log.i(TAG, "mHandlers.size(): " + mHandlers.size());
        mClient = client;
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
                if(!message.isText()) // could be binary
                    return;
                Log.i(TAG, "Receive message: " + message.getText());

                JSONObject messageJson = null;
                String cmd = "";
                try {
                    messageJson = new JSONObject(message.getText());
                    if(messageJson.has("cmd") && !messageJson.isNull("cmd")){
                        cmd = messageJson.getString("cmd");
                    }
                } catch (JSONException e) {
                    Log.e(TAG, "onMessage, invalid json: " + message.getText());
                    e.printStackTrace();
                }

                if(mHandlers.containsKey(cmd)) {
                    mHandlers.get(cmd).handle(messageJson, mClient);
                } else {
                    JsonHelper json = new JsonHelper(message.getText());

                    // OLD HANDLE COMMAND
                    switch (cmd) {
                        case CameraManagerCommandNames.CAM_HELLO:
                            // TODO redesign to CmdHandler
                            serverWebSocketListener.onCamHelloReceived(
                                    json.getInt(CameraManagerParameterNames.MSGID),
                                    CameraManagerCommandNames.CAM_HELLO,
                                    json.getInt(CameraManagerParameterNames.CAM_ID),
                                    json.getString(CameraManagerParameterNames.MEDIA_URL),
                                    json.getBoolean(CameraManagerParameterNames.ACTIVITY)
                            );
                            break;
                        default:
                            Log.e(TAG, "Unhandled comamnd '" + cmd + "'");
                    }
                }
            }

            @Override
            public void onClose() {
                Log.i(
                        TAG,
                        "VXGCloudCamera Closed "
                                + " wasOpened=" + wasOpened
                );
                isOpen = false;
                serverWebSocketListener.onCloseWebSocket(curURI, wasOpened);
            }

            @Override
            public void onError(WebSocketException e) {
                Log.e(TAG, "onError: " + e.getMessage() );
            }

            @Override
            public void onLogMessage(String msg) {
                Log.d(TAG, "onLogMessage: " + msg);
                if (msg != null) {
                    if(msg.contains("connect failed: ETIMEDOUT (Connection timed out)")) {// || msg.contains("failed to connect to"))
                        Log.e(TAG, "Block 8888 port");
                        serverWebSocketListener.onErrorWebSocket(CameraManagerErrors.BLOCK_PORT);
                    }else if (msg.contains("connect failed: ENETUNREACH (Network is unreachable)")) {// || msg.contains("failed to connect to"))
                        Log.e(TAG, "connect failed: ENETUNREACH (Network is unreachable)");
                        serverWebSocketListener.onErrorWebSocket(CameraManagerErrors.NETWORK_IS_UNREACHABLE);
                    } else if (msg.contains("recvfrom failed: ETIMEDOUT (Connection timed out)")) {
                        Log.e(TAG, "recvfrom failed: ETIMEDOUT (Connection timed out)");
                        serverWebSocketListener.onErrorWebSocket(CameraManagerErrors.CONNECTION_TIMEOUT);
                    } else if (msg.contains("failed to connect to " + CameraManagerConfig.ADDRESS) && msg.contains("(port " + CameraManagerConfig.PORT + ") after ")) {
                        Log.e(TAG, "WebSocketListener: " + msg);
                        serverWebSocketListener.onErrorWebSocket(CameraManagerErrors.CONNECTION_TIMEOUT);
                    }else {
                        Log.e(TAG, "Unhandled message: " + msg);
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
        return super.isConnected();
    }
}