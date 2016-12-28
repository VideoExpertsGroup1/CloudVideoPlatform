package com.vxg.cloud.ServiceProvider.Filters;

import android.util.Log;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.Map;

public class ServiceProviderCamerasFilter {
    private static String TAG = ServiceProviderCamerasFilter.class.getSimpleName();

    public enum CameraStatus {
        CAMERA_STATUS_ACTIVE,
        CAMERA_STATUS_INACTIVE,
        CAMERA_STATUS_ANY
    };

    public enum CameraOnline { YES, NO, ANY };

    private int mOffset = 0;
    private int mLimit = 50;

    private CameraStatus mCameraStatus = CameraStatus.CAMERA_STATUS_ANY;
    private CameraOnline mCameraOnline = CameraOnline.ANY;

    public ServiceProviderCamerasFilter(int offset, int limit){
        mOffset = offset;
        mLimit = limit;
    };

    public int getOffset(){
        return mOffset;
    }

    public void setOffset(int offset){
        mOffset = offset;
    }

    public int getLimit(){
        return mLimit;
    }

    public void setLimit(int limit){
        mLimit = limit;
    }

    public void setCameraOnline(CameraOnline cameraOnline) {
        mCameraOnline = cameraOnline;
    }

    public CameraOnline getCameraOnline() {
        return mCameraOnline;
    }

    private Map<String, String> makeParams(){
        Map<String, String> params = new HashMap<String,String>();
        params.put("offset", Integer.toString(mOffset));
        params.put("limit", Integer.toString(mLimit));
        if(mCameraStatus == CameraStatus.CAMERA_STATUS_ACTIVE){
            params.put("active", "true");
        } else if(mCameraStatus == CameraStatus.CAMERA_STATUS_INACTIVE) {
            params.put("active", "false");
        }

        if(mCameraOnline != CameraOnline.ANY){
            params.put("camera_online", mCameraOnline == CameraOnline.YES ? "true" : "false");
        }
        return params;
    }

    public String toUrlString_ForGetRequest(){
        String url_get_request = "";
        Map<String, String> params = this.makeParams();
        for (String key : params.keySet()) {
            String sKey = "";
            String sValue = "";
            try {
                sKey = URLEncoder.encode(key, "utf-8");
                sValue = URLEncoder.encode(params.get(key), "utf-8");
            } catch (UnsupportedEncodingException e) {
                e.printStackTrace();
            }
            if(!key.isEmpty()) {
                url_get_request += url_get_request.length() != 0 ? "&" : "";
                url_get_request += sKey + "=" + sValue;
            }
        }
        Log.d(TAG, "toUrlString_ForGetRequest: " + url_get_request);
        return url_get_request;
    };
}
