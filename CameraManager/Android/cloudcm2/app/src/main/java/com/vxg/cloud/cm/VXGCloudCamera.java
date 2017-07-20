//
//  Copyright © 2016 VXG Inc. All rights reserved.
//  Contact: https://www.videoexpertsgroup.com/contact-vxg/
//  This file is part of the demonstration of the VXG Cloud Platform.
//
//  Commercial License Usage
//  Licensees holding valid commercial VXG licenses may use this file in
//  accordance with the commercial license agreement provided with the
//  Software or, alternatively, in accordance with the terms contained in
//  a written agreement between you and VXG Inc. For further information
//  use the contact form at https://www.videoexpertsgroup.com/contact-vxg/
//

package com.vxg.cloud.cm;

import android.content.Context;
import android.os.Handler;
import android.os.Message;
import android.util.Log;

import com.vxg.cloud.CameraManager.CameraManagerConfig;
import com.vxg.cloud.CameraManager.Enums.CameraManagerCommandNames;
import com.vxg.cloud.CameraManager.Enums.CameraManagerDoneStatus;
import com.vxg.cloud.CameraManager.Enums.CameraManagerErrors;
import com.vxg.cloud.CameraManager.Enums.CameraManagerParameterNames;
import com.vxg.cloud.CameraManager.Interfaces.CameraManagerClientListener;
import com.vxg.cloud.ServiceProvider.ServiceProviderHelper;
import com.vxg.cloud.cm.Control.StreamController;
import com.vxg.cloud.cm.Interfaces.ServerWebSocketListener;
import com.vxg.cloud.cm.Interfaces.WebSocketApiListener;
import com.vxg.cloud.cm.Utils.VEG_WebSocket;

import org.json.JSONException;
import org.json.JSONObject;

import java.net.URI;

public class VXGCloudCamera implements ServerWebSocketListener, CameraManagerClientListener {
    private final String TAG = VXGCloudCamera.class.getSimpleName();

    public final static String UPLOADING_TYPE_JPG = "jpg";
    public final static String UPLOADING_CATEGORY_PREVIEW = "preview";

    private VEG_WebSocket webSocketClient;
    private int massageId = 1;

    private WebSocketApiListener mWebSocketApiListener;

    private boolean closedByUser = false;
    private boolean isReconnect = false;

    // need save
    private Handler controllerHandler;
    private String cam_path;
    private String stream_id = "Main";
    private CameraManagerConfig mConfig = null;
    private int start_stream_counter = 0;

    public VXGCloudCamera(Context context, Handler handler) {
        controllerHandler = handler;
    }

    //!****** ServerWebSocketListener
    @Override
    public void onCloseWebSocket(URI uri, boolean wasOpened) {
        if (isReconnect) {
            Log.v(TAG, "Was reconnecting. It's ok" );
        }else{
            Log.i(TAG, "DEBUG ERROR_LOST_SERVER_CONNECTION");

            if (mWebSocketApiListener != null) {
                mWebSocketApiListener.onServerConnClose(CameraManagerErrors.LOST_SERVER_CONNECTION);
            }else{
                Log.e(TAG, "mWebSocketApiListener is null");
            }
        }
    }

    @Override
    public void onErrorWebSocket(CameraManagerErrors error) {
        Log.e(TAG, "onErrorWebSocket, " + error.toString());
        if (mWebSocketApiListener != null){
            mWebSocketApiListener.onServerConnClose(error);
        }else{
            Log.e(TAG, "mWebSocketApiListener is null");
        }
    }

    @Override
    public void onOpenWebSocket() {
        cmd_register();
    }

    @Override
    public void onCamHelloReceived(int refid, String orig_cmd, int cam_id, String media_url, boolean bActivity) {
        mConfig.setCamID(cam_id);
        if(mWebSocketApiListener != null) {
            Log.i(TAG, "CAM_HELLO receive ; call onUpdatedCameraManagerConfig()");
            mWebSocketApiListener.onUpdatedCameraManagerConfig(mConfig);
        }else{
            Log.e(TAG, "mWebSocketApiListener is null");
        }
        cam_path = media_url;
        mConfig.setCameraActivity(bActivity);

        Log.i(TAG, "CAM_HELLO receive");
        if (mWebSocketApiListener != null) {
            Log.i(TAG, "CAM_HELLO receive ; call onPreparedCM()");
            mWebSocketApiListener.onPreparedCM();
        }else{
            Log.e(TAG, "mWebSocketApiListener is null could not call onPreparedCM");
        }
        sendCmdDone(refid, orig_cmd, CameraManagerDoneStatus.OK);
    }
    //**********!

    public void startWebSocket(WebSocketApiListener webSocketApiListener) {
        Log.i(TAG, "startWebSocket");
        /*if (configuration.isRegistered()) {
            mConfig.setUUID(configuration.getString(CameraConfiguration.UUID, null));
        }*/

        this.mWebSocketApiListener = webSocketApiListener;
        URI uri = mConfig.getAddress();
        Log.i(TAG, "startWebSocket CameraConfiguration " + uri);
        if(uri != null){
            webSocketClient = new VEG_WebSocket(VXGCloudCamera.this, VXGCloudCamera.this, uri);
        }else{
            Log.e(TAG, "Address is null");
        }
    }

    public void unsetWebSocketApiListener() {
        Log.i(TAG, "unsetWebSocketApiListener");
        this.mWebSocketApiListener = null;
        if (webSocketClient != null) {
            webSocketClient.close();
            webSocketClient = null;
            closedByUser = true;
        }
    }

    private void cmd_register() {
        if (webSocketClient.isOpen()) {
            JSONObject json = getBaseJSON(CameraManagerCommandNames.REGISTER);
            try{
                json.put(CameraManagerParameterNames.VER, mConfig.getCMVersion());
                json.put(CameraManagerParameterNames.TZ, mConfig.getCameraTimezone());
                json.put(CameraManagerParameterNames.VENDOR, mConfig.getCameraVendor());
                if(mConfig.getPwd() != null){
                    json.put(CameraManagerParameterNames.PWD, mConfig.getPwd());
                }
                if(mConfig.getSID() != null){
                    json.put(CameraManagerParameterNames.PREV_SID, mConfig.getSID());
                }

                if(mConfig.getRegToken() != null){
                    json.put(CameraManagerParameterNames.REG_TOKEN, mConfig.getRegToken().getToken());
                }

            }catch(JSONException e){
                Log.e(TAG, "Invalid json " + e.getMessage());
                e.printStackTrace();
            }

            if (webSocketClient != null) {
                webSocketClient.sendJSON(json.toString());
            }
        } else {
            Log.e(TAG, "cmd_register: webSocketClient is't Open");
        }
    }

    public void cmd_cam_register() {
        JSONObject json = getBaseJSON(CameraManagerCommandNames.CAM_REGISTER);
        try {
            json.put(CameraManagerParameterNames.IP, mConfig.getCameraIPAddress());
            json.put(CameraManagerParameterNames.UUID, mConfig.getUUID());
            json.put(CameraManagerParameterNames.BRAND, mConfig.getCameraBrand());
            json.put(CameraManagerParameterNames.MODEL, mConfig.getCameraModel());
            json.put(CameraManagerParameterNames.SN, mConfig.getCameraSerialNumber());
            json.put(CameraManagerParameterNames.VERSION, mConfig.getCameraVersion());
        }catch(JSONException e){
            Log.e(TAG, "Could not camera register");
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
            return;
        }

        if (webSocketClient != null)
            webSocketClient.sendJSON(json.toString());

        controllerHandler.sendEmptyMessage(StreamController.ACTION_OPEN_STREAM_ACTIVITY);
    }

    private JSONObject getBaseJSON(String cmd) {
        JSONObject obj = new JSONObject();
        try {
            obj.put(CameraManagerParameterNames.CMD, cmd);
            obj.put(CameraManagerParameterNames.MSGID, massageId++);
        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }
        return obj;
    }

    @Override
    public CameraManagerConfig getConfig() {
        return mConfig;
    }

    public String getStreamID() {
        return stream_id;
    }

    public String getCamPath() {
        return cam_path;
    }

    public long getCamID() {
        return mConfig.getCamID();
    }

    @Override
    public void setConfig(CameraManagerConfig config) {
        mConfig = config;
    }

    @Override
    public void sendCmdDone(int cmd_id, String cmd, CameraManagerDoneStatus status) {
        try {
            JSONObject data = new JSONObject();
            data.put(CameraManagerParameterNames.CMD, CameraManagerCommandNames.DONE);
            data.put(CameraManagerParameterNames.REFID, cmd_id);
            data.put(CameraManagerParameterNames.ORIG_CMD, cmd);
            data.put(CameraManagerParameterNames.STATUS, status.toString());

            if (webSocketClient != null) {
                webSocketClient.sendJSON(data.toString());
                // TODO remove it
                switch (cmd) {
                    case CameraManagerCommandNames.HELLO :
                        cmd_cam_register();
                        break;
                }
            }
        } catch(JSONException e) {
            Log.e(TAG, "sendCmdDone, invalid json");
        }
    }

    @Override
    public void send(JSONObject response) {
        if (webSocketClient != null) {
            webSocketClient.sendJSON(response.toString());
        }else{
            Log.e(TAG, "webSocketClient is null");
        }
    }

    @Override
    public void sendPreview(long cam_id) {
        Log.i(TAG, "sendPreview: " + cam_id);
        if (cam_id == mConfig.getCamID()) {
            final String url =
                    "http://" +
                            mConfig.getUploadURL() + "/" +
                            cam_path +
                            "?sid=" + mConfig.getSID() +
                            "&cat=" + UPLOADING_CATEGORY_PREVIEW +
                            "&type=" + UPLOADING_TYPE_JPG +
                            "&start=" + ServiceProviderHelper.formatCurrentTimestampUTC_MediaFileUploading();
            Log.i(TAG, "sendPreview " + url);
            Message message = new Message();
            message.what = StreamController.ACTION_SEND_BROADCAST_PREVIEW;
            message.obj = url;
            controllerHandler.sendMessage(message);
        } else {
            Log.e(TAG, "Unknown camera !!!" + cam_id + " (expected " + mConfig.getCamID());
        }
    }

    @Override
    public void onUpdatedConfig() {
        if(mWebSocketApiListener != null) {
            mWebSocketApiListener.onUpdatedCameraManagerConfig(mConfig);
        }else{
            Log.e(TAG, "mWebSocketApiListener is null");
        }
    }

    @Override
    public void onByeReconnect() {
        isReconnect = true;
        if (webSocketClient != null)
            webSocketClient.close();
        URI uri = mConfig.getAddress();
        if(uri != null) {
            webSocketClient = new VEG_WebSocket(this, this, uri);
        }else{
            Log.e(TAG, "uri is null");
        }
        isReconnect = false;
    }

    @Override
    public void onByeError() {
        Log.i(TAG, "DEBUG REASON_ERROR");
        if (mWebSocketApiListener != null) {
            mWebSocketApiListener.onServerConnClose(CameraManagerErrors.REASON_ERROR);
        }else{
            Log.e(TAG, "mWebSocketApiListener is null");
        }
    }

    @Override
    public void onByeSystemError() {
        Log.i(TAG, "DEBUG REASON_SYSTEM_ERROR");
        if (mWebSocketApiListener != null) {
            mWebSocketApiListener.onServerConnClose(CameraManagerErrors.REASON_SYSTEM_ERROR);
        }else{
            Log.e(TAG, "mWebSocketApiListener is null");
        }
    }

    @Override
    public void onByeInvalidUser() {
        Log.i(TAG, "DEBUG REASON_INVALID_USER");
        if (mWebSocketApiListener != null){
            mWebSocketApiListener.onServerConnClose(CameraManagerErrors.REASON_INVALID_USER);
        }else{
            Log.e(TAG, "mWebSocketApiListener is null");
        }
    }

    @Override
    public void onByeAuthFailure() {
        Log.i(TAG, "clearSettings");
        Log.i(TAG, "DEBUG REASON_AUTH_FAILURE");
        if (mWebSocketApiListener != null) {
            mWebSocketApiListener.onServerConnClose(CameraManagerErrors.REASON_AUTH_FAILURE);
        }else{
            Log.e(TAG, "mWebSocketApiListener is null");
        }
    }

    @Override
    public void onByeConnConflict() {
        Log.i(TAG, "DEBUG REASON_CONN_CONFLICT");
        if (mWebSocketApiListener != null){
            mWebSocketApiListener.onServerConnClose(CameraManagerErrors.REASON_CONN_CONFLICT);
        }else{
            Log.e(TAG, "mWebSocketApiListener is null");
        }
    }

    @Override
    public void onByeShutdown() {
        Log.i(TAG, "DEBUG REASON_SHUTDOWN");
        if (mWebSocketApiListener != null){
            mWebSocketApiListener.onServerConnClose(CameraManagerErrors.REASON_SHUTDOWN);
        }else{
            Log.e(TAG, "mWebSocketApiListener is null");
        }
    }

    @Override
    public void onByeDelete() {
        Log.i(TAG, "DEBUG REASON_DELETED");
        if (mWebSocketApiListener != null) {
            mWebSocketApiListener.onServerConnClose(CameraManagerErrors.REASON_DELETED);
        }else{
            Log.e(TAG, "mWebSocketApiListener is null");
        }
    }

    @Override
    public void onStreamStart(String reason) {
        if(start_stream_counter == 0) {
            controllerHandler.sendEmptyMessage(StreamController.ACTION_STREAM_START);
        }
        start_stream_counter = start_stream_counter + 1;
    }

    @Override
    public void onStreamStop(String reason) {
        if(start_stream_counter > 0) {
            start_stream_counter = start_stream_counter - 1;
        }
        if(start_stream_counter == 0) {
            controllerHandler.sendEmptyMessage(StreamController.ACTION_STREAM_STOP);
        }
    }

    @Override
    public void onBackwardStart(String url) {
        Log.i(TAG, "onBackwardStart");
        Message message = new Message();
        message.what = StreamController.ACTION_BACKWARD_START;
        message.obj = url;
        controllerHandler.sendMessage(message);
    }

    @Override
    public void onBackwardStop() {
        Log.i(TAG, "onBackwardStop");
        if (mWebSocketApiListener != null) {
            controllerHandler.sendEmptyMessage(StreamController.ACTION_BACKWARD_STOP);
        }else{
            Log.e(TAG, "mWebSocketApiListener is null");
        }
    }
}