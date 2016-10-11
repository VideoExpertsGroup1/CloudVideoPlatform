package com.vxg.cloud.cm.Control;

import android.content.Context;
import android.content.pm.PackageManager;
import android.os.AsyncTask;
import android.os.Handler;
import android.util.Log;

import com.vxg.cloud.cm.Interfaces.LoginActivityListener;
import com.vxg.cloud.cm.Interfaces.StreamActivityListener;
import com.vxg.cloud.cm.Interfaces.UserLoginTaskListener;
import com.vxg.cloud.cm.Interfaces.WebSocketApiListener;
import com.vxg.cloud.cm.Objects.CameraDetail;
import com.vxg.cloud.cm.R;
import com.vxg.cloud.cm.UserLoginTask;
import com.vxg.cloud.cm.Utils.Util;
import com.vxg.cloud.cm.WebAPI;
import com.vxg.cloud.cm.WebSocketAPI;

import java.io.IOException;
import java.util.concurrent.ExecutionException;

public class CaptureStreamingController
        implements UserLoginTaskListener,
                    WebSocketApiListener {
    private final String TAG = "CS_Controller";

    public static String ERROR_LOST_SERVER_CONNECTION;
    public static String ERROR_WS_PORT_BLOCKED;

    private static CaptureStreamingController instance;

    private WebAPI webAPI;
    private WebSocketAPI webSocketAPI;
    private CameraDetail cameraDetail;
    private Context context;

    private UserLoginTask loginTask;
    private LoginActivityListener loginActivityListener;
    private StreamActivityListener streamActivityListener;

    //!******  UserLoginTaskListener
    @Override
    public void onSuccessfulLogin() {
        Log.d(TAG, "LoginTask onSuccessfulLogin()");
        if (loginActivityListener != null)
            loginActivityListener.onSuccessfulLogin();
        else
            Log.e(TAG, "onSuccessfulLogin:  loginActivityListener == null !!");

        loginTask = null;
    }
    @Override
    public void onIncorrectPassword() {
        Log.d(TAG, "LoginTask onIncorrectPassword()");
        if (loginActivityListener != null)
            loginActivityListener.onIncorrectPassword();

        loginTask = null;
    }
    @Override
    public void onCancelled() {
        Log.d(TAG, "LoginTask onCancelled()");
        loginTask = null;
        refreshLoginViews();
    }
    @Override
    public void onHttpErrors() {
        Log.d(TAG, "LoginTask onHttpErrors()");
        if (loginActivityListener != null)
            loginActivityListener.onHttpErrors();
        loginTask = null;
    }
    //********!
    //!****** WebSocketApiListener
    @Override
    public void onPreparedCM() {
        String mediaServerURL = webSocketAPI.getMediaServerURL();
        String cam_path = webSocketAPI.getCamPath();
        String stream_id = webSocketAPI.getStreamID();
        String sid = webSocketAPI.getSID();


        String url = "rtmp://" + mediaServerURL + "/" + cam_path + stream_id + "?sid=" + sid ;
        if (streamActivityListener != null)
            streamActivityListener.availableStream(url);
    }
    @Override
    public void OnFailRegisterCM() {
        if (streamActivityListener != null)
            streamActivityListener.failStartStream();
    }
    @Override
    public void onServerConnClose(String reason) {
        if (streamActivityListener != null)
            streamActivityListener.serverConnClose(reason);

        Util.writeLog("CLOUD.camera_VEG_WebSocket", "VEG_WebSocket:V *:S");
    }
    //**********!

    private CaptureStreamingController(Context context) {
        Log.d(TAG, "CaptureStreamingController() created");
        this.context = context;

        ERROR_LOST_SERVER_CONNECTION = context.getString(R.string.error_dialog_lost_server_connection);
        ERROR_WS_PORT_BLOCKED = context.getString(R.string.error_dialog_ws_port_blocked);
    }

    public static CaptureStreamingController getInstance(Context context) {
        if ( instance == null)
            instance = new CaptureStreamingController(context);
        return instance;
    }

    public static boolean hasInstance() {
        return instance != null;
    }

    public void release() {
        Log.i(TAG, "release()");
        if (loginTask != null && !loginTask.isCancelled()) {
            cancelAuthenticationUser();
            loginTask = null;
        }
        webSocketAPI.unsetWebSocketApiListener();
        webSocketAPI = null;
        instance = null;
    }

    public void logout() {
        if (webSocketAPI != null) {
            webSocketAPI.cmd_bye();
        }
        if (streamActivityListener != null) {
            Log.d(TAG, "logout() = " + logoutWebAPI());
            streamActivityListener.logout();
        }
    }
    private boolean logoutWebAPI() {
        try {
            return new AsyncTask<Void, Void, Boolean>() {
                @Override
                protected Boolean doInBackground(Void... params) {
                    try {
                        boolean result = webAPI.logout();
                        webAPI = null;
                        return result;
                    } catch (IOException e) {
                        Log.e(TAG, e.getMessage());
                        webAPI = null;
                        return false;
                    }
                }
            }.execute().get();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } catch (ExecutionException e) {
            e.printStackTrace();
        }

        webAPI = null;
        return false;
    }

    public void authenticationUser(String login, String pass) {
        webAPI = new WebAPI(new Handler(), context);
        loginTask = new UserLoginTask(CaptureStreamingController.this, webAPI, login, pass);
        loginTask.execute();
        if (loginActivityListener != null)
            loginActivityListener.showProgress(true);
    }

    public void prepareCM() {
        try {
            cameraDetail = new CameraDetail(context.getPackageManager().getPackageInfo(context.getPackageName(), 0).versionName);
        } catch (PackageManager.NameNotFoundException e) {
            Log.e(TAG, "prepareCM: getAppVersion", e);
            cameraDetail = new CameraDetail("Unknown");
        }
        webSocketAPI = new WebSocketAPI(context, cameraDetail);
        webSocketAPI.startWebSocket(this);
    }
    public void restartCM() {
        if (webSocketAPI != null)
            webSocketAPI.unsetWebSocketApiListener();
        webSocketAPI = new WebSocketAPI(context, cameraDetail);
        webSocketAPI.startWebSocket(this);
    }

    public void cancelAuthenticationUser() {
        if (loginTask != null)
            loginTask.cancel(true);
    }

    public void setLoginActivityListener(LoginActivityListener listener) {
        loginActivityListener = listener;
    }
    public void unsetLoginActivityListener() {
        loginActivityListener = null;
    }

    public void setStreamActivityListener(StreamActivityListener listener) {
        streamActivityListener = listener;
    }
    public void unsetStreamActivityListener() {
        streamActivityListener = null;
    }

    public void refreshLoginViews() {
        if (loginActivityListener != null)
            loginActivityListener.showProgress(loginTask != null);
        else
            Log.e(TAG, "refreshLoginViews: loginActivityListener == null");
    }
}