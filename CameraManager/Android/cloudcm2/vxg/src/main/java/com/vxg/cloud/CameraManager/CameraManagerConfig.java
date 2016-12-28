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

package com.vxg.cloud.CameraManager;

import android.os.Build;
import android.util.Log;

import com.vxg.cloud.CameraManager.Enums.CameraManagerAudioFormats;
import com.vxg.cloud.CameraManager.Enums.CameraManagerVideoFormats;
import com.vxg.cloud.CameraManager.Objects.AudioStreamConfig;
import com.vxg.cloud.CameraManager.Objects.StreamConfig;
import com.vxg.cloud.CameraManager.Objects.VideoStreamConfig;
import com.vxg.cloud.ServiceProvider.ServiceProviderRegToken;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.TimeZone;

public class CameraManagerConfig {
    private static final String TAG = CameraManagerConfig.class.getSimpleName();
    private String mUploadUrl = "";
    private String mMediaServer = "";
    private String mCA = ""; // TODO
    private String mSID = "";
    private String mPwd = "";
    private String mUUID = "";
    private String mConnID = "";
    private long mCamID = 0;
    private ServiceProviderRegToken mRegToken = null;

    // some camera details
    private boolean mCameraActivity = false;
    private boolean mCameraStreaming = true;
    private boolean mCameraStatusLed = false;
    private String mCameraIPAddress = "";
    private String mCMVersion = "";
    private String mCameraBrand = "";
    private String mCameraModel = "";
    private String mCameraSerialNumber = "";
    private String mCameraVersion = "";
    private String mCameraTimezone = "";
    private String mCameraVendor = "";
    private StreamConfig mStreamConfig = null;

    // WS(S) - 8888(8883)
    // default parameters
    public static String PROTOCOL = "ws://";
    public static String ADDRESS = "cam.skyvr.videoexpertsgroup.com";
    // public static String ADDRESS = "54.173.34.172";
    public static int PORT = 8888;

    private String mReconnectAddress = null;

    public CameraManagerConfig(){
        mCameraIPAddress = CameraManagerHelper.getLocalIpAddress();
        mCameraBrand = Build.BRAND;
        mCameraModel = Build.MODEL;
        mCameraSerialNumber = Build.SERIAL;
        mCameraVersion = "1";
        mCMVersion = "Android CM";
        mCameraVendor = "vendor";
        mCameraTimezone = TimeZone.getDefault().getID();

        configureStreamConfig();
    }

    public void setUploadURL(String val) {
        mUploadUrl = val;
    }

    public String getUploadURL() {
        return mUploadUrl;
    }

    public void setMediaServer(String val) {
        mMediaServer = val;
    }

    public String getMediaServer() {
        return mMediaServer;
    }

    public void setCA(String val) { mCA = val;}

    public void setSID(String val) {
        mSID = val;
    }

    public String getSID() {
        return mSID;
    }

    public void setUUID(String val) {
        mUUID = val;
    }

    public String getUUID() {
        return mUUID;
    }

    public void setConnID(String val) {
        mConnID = val;
    }

    public String getConnID() {
        return mConnID;
    }

    public void setPwd(String val) {
        mPwd = val;
    }

    public String getPwd() {
        return mPwd;
    }

    public void setCamID(long val) {
        mCamID = val;
    }

    public long getCamID() {
        return mCamID;
    }

    public boolean isRegistered(){
        return mCamID > 0;
    }

    public void setReconnectAddress(String val) {
        mReconnectAddress = val;
    }
    public void setRegToken(ServiceProviderRegToken regToken){
        mRegToken = regToken;
    }

    public ServiceProviderRegToken getRegToken(){
        return mRegToken;
    }

    public void resetRegToken() {
        mRegToken = null;
    }

    public URI getAddress(){
        Log.v(TAG, "getAddress");
        URI uri = null;
        try {
            String address = mReconnectAddress == null ? ADDRESS : mReconnectAddress;
            if (mRegToken == null && this.getConnID() != null) {
                uri = new URI(PROTOCOL + address + ":" + PORT + "/ctl/" + this.getConnID() + "/");
            } else if (mRegToken != null){
                uri = new URI(PROTOCOL + address + ":" + PORT + "/ctl/NEW/" + mRegToken.getToken() + "/");
            } else {
                Log.e(TAG, "getAddress, error");
            }
        }catch(URISyntaxException e){
            Log.e(TAG, "URISyntaxException " + e.getMessage());
            e.printStackTrace();
        }
        return uri;
    }

    public void setCameraActivity(boolean val){
        mCameraActivity = val;
    }

    public boolean getCameraActivity(){
        return mCameraActivity;
    }

    public boolean getCameraStreaming() {
        return mCameraStreaming;
    }

    public void setCameraStreaming(boolean val) {
        mCameraStreaming = val;
    }

    public boolean getCameraStatusLed() {
        return mCameraStatusLed;
    }

    public void setCameraStatusLed(boolean val) {
        mCameraStatusLed = val;
    }

    public String getCameraIPAddress() {
        return mCameraIPAddress;
    }

    public String getCMVersion() {
        return mCMVersion;
    }
    public void setCMVersion(String val) {
        mCMVersion = val;
    }

    public String getCameraVendor() {
        return mCameraVendor;
    }
    public void setCameraVendor(String val) {
        mCameraVendor = val;
    }

    public String getCameraTimezone() {
        return mCameraTimezone;
    }
    public void setCameraTimezone(String val) {
        mCameraTimezone = val;
    }

    public String getCameraVersion() {
        return mCameraVersion;
    }

    public String getCameraSerialNumber() {
        return mCameraSerialNumber;
    }

    public String getCameraModel() {
        return mCameraModel;
    }

    public String getCameraBrand() {
        return mCameraBrand;
    }


    public void setStreamConfig(StreamConfig conf){
        mStreamConfig = conf;
    }

    public StreamConfig getStreamConfig(){
        return mStreamConfig;
    }

    private void configureStreamConfig(){
        mStreamConfig = new StreamConfig();

        // Video stream config
        VideoStreamConfig videoStreamConfig = new VideoStreamConfig();
        videoStreamConfig.setStream("Vid"); // hardcoded name
        videoStreamConfig.setFormat(CameraManagerVideoFormats.H_264);
        videoStreamConfig.setHorz(640);
        videoStreamConfig.setVert(480);
        videoStreamConfig.setVbr(true);
        videoStreamConfig.setQuality(0);
        videoStreamConfig.setGop(60);
        videoStreamConfig.setFps(30.0);
        mStreamConfig.addVideoStreamConfig(videoStreamConfig);

        // Audio stream config
        AudioStreamConfig audioStreamConfig = new AudioStreamConfig();
        audioStreamConfig.setStream("Aud");
        audioStreamConfig.setBitrate(128);
        audioStreamConfig.setSrt(44.1);
        audioStreamConfig.setFormat(CameraManagerAudioFormats.AAC);
        mStreamConfig.addAudioStreamConfig(audioStreamConfig);
    }
}
