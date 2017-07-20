package com.vxg.cloud.cm.Control;

import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Handler;
import android.os.Message;
import android.util.Log;

import com.vxg.cloud.CameraManager.CameraManagerConfig;
import com.vxg.cloud.CameraManager.Enums.CameraManagerErrors;
import com.vxg.cloud.ServiceProvider.ServiceProviderRegToken;
import com.vxg.cloud.cm.Objects.CameraConfiguration;
import com.vxg.cloud.cm.VXGCloudCamera;
import com.vxg.cloud.cm.Interfaces.LoginActivityListener;
import com.vxg.cloud.cm.Interfaces.StreamActivityListener;
import com.vxg.cloud.cm.Interfaces.WebSocketApiListener;

import org.json.JSONException;
import org.json.JSONObject;

import static com.vxg.cloud.CameraManager.Enums.CameraManagerErrors.REASON_AUTH_FAILURE;

public class StreamController implements WebSocketApiListener {
    private final String TAG = StreamController.class.getSimpleName();

    public static final int ACTION_SEND_BROADCAST_PREVIEW = 2;
    public static final int ACTION_STREAM_START = 4;
    public static final int ACTION_STREAM_STOP = 5;
    public static final int ACTION_OPEN_STREAM_ACTIVITY = 6;
    public static final int ACTION_BACKWARD_START = 7;
    public static final int ACTION_BACKWARD_STOP = 8;

    private static StreamController instance;

    private VXGCloudCamera mVXGCloudCamera;
    private Context mContext;
    // private CameraManagerConfig mConfig = new CameraManagerConfig();

    private LoginActivityListener mLoginActivityListener;
    private StreamActivityListener mStreamActivityListener;
    private Handler handler;
    private String mStreamUrl = null;
    private String mTakePreview = null;
    private StreamController(Context context) {
        Log.d(TAG, "StreamController() created");
        mContext = context;

        handler = new Handler() {
            @Override
            public void handleMessage(Message msg) {
                super.handleMessage(msg);
                switch (msg.what) {
                    case ACTION_STREAM_START :
                        if (mStreamActivityListener != null) {
                            mStreamActivityListener.startStream();
                        }else{
                            Log.e(TAG, "handleMessage(ACTION_STREAM_START) mStreamActivityListener is null");
                        }
                        break;
                    case ACTION_SEND_BROADCAST_PREVIEW:
                        if (mStreamActivityListener != null) {
                            mStreamActivityListener.takePreview((String) msg.obj);
                        }else{
                            mTakePreview = (String) msg.obj;
                            Log.e(TAG, "handleMessage(ACTION_SEND_BROADCAST_PREVIEW) mStreamActivityListener is null , mTakePreview = " + mTakePreview);
                        }
                        break;
                    case ACTION_STREAM_STOP :
                        if (mStreamActivityListener != null) {
                            mStreamActivityListener.stopStream();
                        }else{
                            Log.e(TAG, "handleMessage(ACTION_STREAM_STOP) mStreamActivityListener is null");
                        }
                        break;
                    case ACTION_OPEN_STREAM_ACTIVITY:
                        if(mLoginActivityListener != null){
                            mLoginActivityListener.onSuccessRegistryCamera();
                        }else{
                            Log.e(TAG, "handleMessage(ACTION_OPEN_STREAM_ACTIVITY) mLoginActivityListener is null");
                        }
                        break;
                    case ACTION_BACKWARD_START:
                        if(mLoginActivityListener != null){
                            mStreamActivityListener.startBackwardAudio((String) msg.obj);
                        }else{
                            Log.e(TAG, "handleMessage(ACTION_BACKWARD_START) mStreamActivityListener is null");
                        }
                        break;
                    case ACTION_BACKWARD_STOP:
                        if(mLoginActivityListener != null){
                            mStreamActivityListener.stopBackwardAudio();
                        }else{
                            Log.e(TAG, "handleMessage(ACTION_BACKWARD_START) mStreamActivityListener is null");
                        }
                        break;
                }
            }
        };
    }

    //********!
    //!****** WebSocketApiListener
    @Override
    public void onPreparedCM() {
        Log.i(TAG, "onPreparedCM");
        String mediaServerURL = mVXGCloudCamera.getConfig().getMediaServer();
        String cam_path = mVXGCloudCamera.getCamPath();
        String stream_id = mVXGCloudCamera.getStreamID();
        String sid = mVXGCloudCamera.getConfig().getSID();

        String url = "rtmp://" + mediaServerURL + "/" + cam_path + stream_id + "?sid=" + sid ;

        if (mStreamActivityListener != null) {
            Log.i(TAG, "onPreparedCM: Set new url: " + url);
            mStreamActivityListener.availableStream(url);
        }else{
            mStreamUrl = url;
            Log.e(TAG, "onPreparedCM: Failed set new url: " + url);
        }
    }

    @Override
    public void onServerConnClose(CameraManagerErrors reason) {
        if (mStreamActivityListener != null)
            mStreamActivityListener.serverConnClose(reason);

        if(reason == REASON_AUTH_FAILURE){
            if(mLoginActivityListener != null) {
                mLoginActivityListener.onAuthFailure();
            }else{
                Log.e(TAG, "onServerConnClose: mLoginActivityListener is null");
            }
            Log.e(TAG, "Invalid reg_token");
        }
    }

    @Override
    public void onUpdatedCameraManagerConfig(CameraManagerConfig config) {
        Log.i(TAG, "onUpdatedCameraManagerConfig");
        if(mVXGCloudCamera != null && mLoginActivityListener != null){
            mLoginActivityListener.updateCameraConfiguration(config);
        }else{
            Log.e(TAG, "onUpdatedCameraManagerConfig: mLoginActivityListener is null or mVXGCloudCamera is null");
        }
    }
    //**********!

    public void resetConfig(){
        if(mVXGCloudCamera != null){
            CameraManagerConfig config = new CameraManagerConfig();
            mVXGCloudCamera.setConfig(config);
        }else{
            Log.e(TAG, "resetConfig: mVXGCloudCamera is null");
        }
    }

    public static StreamController getInstance(Context context) {
        if ( instance == null)
            instance = new StreamController(context);
        return instance;
    }

    public static boolean hasInstance() {
        return instance != null;
    }

    public void release() {
        Log.i(TAG, "release()");
        mVXGCloudCamera.unsetWebSocketApiListener();
        mVXGCloudCamera = null;
        instance = null;
    }

    public void logout() {
        if (mStreamActivityListener != null) {
            mStreamActivityListener.logout();
        }
    }

    public void registryCamera(String reg_token) {

        JSONObject data = new JSONObject();
        try {
            data.put("token", reg_token);
            data.put("expire", "");
            data.put("status", "ready");
        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }

        ServiceProviderRegToken serviceProviderRegToken = new ServiceProviderRegToken(data);
        if (mLoginActivityListener != null)
            mLoginActivityListener.showProgress(true);

        prepareCM(serviceProviderRegToken);
    }

    public void prepareCM(ServiceProviderRegToken serviceProviderRegToken) {
        mVXGCloudCamera = new VXGCloudCamera(mContext, handler);
        CameraManagerConfig config = CameraConfiguration.loadCameraManagerConfig(mContext);
        if(serviceProviderRegToken != null) {
            config.setRegToken(serviceProviderRegToken);
            config.setConnID(null);
        }

        try {
            config.setCMVersion( "Android CM " + mContext.getPackageManager().getPackageInfo(mContext.getPackageName(), 0).versionName);
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }

        mVXGCloudCamera.setConfig(config);
        mVXGCloudCamera.startWebSocket(this);
    }

    /*public void restartCM() {
        if (mVXGCloudCamera != null)
            mVXGCloudCamera.unsetWebSocketApiListener();
        mVXGCloudCamera = new VXGCloudCamera(mContext, handler);
        mVXGCloudCamera.startWebSocket(this);
    }*/

    public void setLoginActivityListener(LoginActivityListener listener) {
        mLoginActivityListener = listener;
    }
    public void unsetLoginActivityListener() {
        mLoginActivityListener = null;
    }

    public void setStreamActivityListener(StreamActivityListener listener) {
        Log.i(TAG, "setStreamActivityListener");
        mStreamActivityListener = listener;

        // ad-hoc
        if(mStreamUrl != null){
            mStreamActivityListener.availableStream(mStreamUrl);
            mStreamUrl = null;
        }

        if(mTakePreview != null) {
            mStreamActivityListener.takePreview(mTakePreview);
            mTakePreview = null;
        }

    }
    public void unsetStreamActivityListener() {
        if(mStreamActivityListener != null) {
            Log.i(TAG, "unsetStreamActivityListener");
            mStreamActivityListener = null;
        }
    }

    public void refreshLoginViews() {
    }
}