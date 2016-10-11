package com.vxg.cloud.cm.Objects;

import android.os.Build;
import android.util.Log;

import com.vxg.cloud.cm.Utils.Util;

import java.util.TimeZone;

public class CameraDetail {
    private int cameraID = -1;
    private String ip;
    private String uuid;
    private String brand;
    private String model;
    private String sn;
    private String cameraVersion;
    private String tz;
    private String vendor;
    private String cmVersion;
    private boolean activity;
    private boolean streaming = true;
    private boolean status_led = false;

    public CameraDetail(String cmVersion) {
        ip = Util.getLocalIpAddress();
        brand = Build.BRAND;
        model = Build.MODEL;
        sn = Build.SERIAL;
        cameraVersion = "1";
        this.cmVersion = "Android CM " + cmVersion;
        vendor = "vendor";
        tz = TimeZone.getDefault().getID();
    }

    public String getCmVersion() {
        return cmVersion;
    }
    public void setCmVersion(String cmVersion) {
        this.cmVersion = cmVersion;
    }

    public String getVendor() {
        return vendor;
    }
    public void setVendor(String vendor) {
        this.vendor = vendor;
    }

    public String getTz() {
        return tz;
    }
    public void setTz(String tz) {
        this.tz = tz;
    }

    public boolean isStreaming() {
        return streaming;
    }
    public void setStreaming(boolean streaming) {
        this.streaming = streaming;
    }

    public boolean getStatusLed() {
        return status_led;
    }
    public void setStatusLed(boolean status_led) {
        this.status_led = status_led;
    }

    public boolean getActivity() {
        return activity;
    }
    public void setActivity(boolean activity) {
        this.activity = activity;
    }

    public boolean hasCameraID() {
        return cameraID > 0;
    }
    public int getCameraID() {
        return cameraID;
    }
    public void setCameraID(int cameraID) {
        this.cameraID = cameraID;
    }

    public String getIp() {
        return ip;
    }

    public String getUuid() {
        return uuid;
    }
    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public String getCameraVersion() {
        return cameraVersion;
    }

    public String getSn() {
        return sn;
    }

    public String getModel() {
        return model;
    }

    public String getBrand() {
        return brand;
    }
}