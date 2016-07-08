package com.vxg.cnvrclient2.gcm;

import android.os.Bundle;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.text.ParseException;
import java.util.Date;
import java.text.SimpleDateFormat;
import java.util.Locale;
import java.util.TimeZone;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class VXGCloudGcmMessage {
    static String TAG = "VXGCloudGcmMessage";
    private String m_sReason = "";
    private int m_nCameraId = 0;
    private String m_sTimeOrig = "";
    private String m_sTimeUTC = "";
    private String m_sTime = "";
    private String m_sEmail = "";
    private String m_sEvent = "";
    private int m_nCmngId = 0;
    private String m_sMessage = "";
    private String m_sRegions = "";
    private String m_sCollapseKey = "";
    private String m_sCameraName = "";

    VXGCloudGcmMessage(Bundle data){
        Log.i(TAG, "GCM: VXGCloudGcmMessage 2: " + data.toString());

        if(data.getString("reason") != null) {
            m_sReason = data.getString("reason");
        }else{
            Log.e(TAG, "GCM: VXGCloudGcmMessage reason is null!!!!");
        }
        if(data.getString("camera_id") != null) {
            m_nCameraId = Integer.parseInt(data.getString("camera_id"), 10);
        }else {
            Log.e(TAG, "GCM: VXGCloudGcmMessage camera id is null!!!!");
        }
        if(data.getString("time") != null) {
            m_sTimeOrig = data.getString("time");
        }else{
            Log.e(TAG, "GCM: VXGCloudGcmMessage time is null!!!!");
        }

        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSSSSZ", Locale.US);
            Date date = sdf.parse(m_sTimeOrig);
            // calculate timezone offset
            int timezoneOffset = 0;
            Pattern ptimezone = Pattern.compile("^.*(\\+|-)(\\d{2}):(\\d{2})$");
            Matcher m = ptimezone.matcher(m_sTimeOrig);
            if(m.matches()){
                Log.i(TAG, "GCM: matches 2");
                if(m.groupCount() > 2){
                    String sign = m.group(1);
                    Log.i(TAG, "GCM: matches 3");
                    int hours = Integer.parseInt(m.group(2), 10);
                    int minutes = Integer.parseInt(m.group(3), 10);
                    timezoneOffset = (60*60*hours + 60*minutes)*1000;
                    if(sign.equals("-"))
                        timezoneOffset = -1*timezoneOffset;
                    Log.i(TAG, "GCM: matches 3.1: " +  sign + m.group(2) + ":" + m.group(3));
                }
            }
            SimpleDateFormat sdf_for_js = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US);
            sdf_for_js.setTimeZone(TimeZone.getTimeZone("UTC"));
            m_sTimeUTC = sdf_for_js.format(date);

            date.setTime(date.getTime() + timezoneOffset);
            SimpleDateFormat sdf2 = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US);
            sdf2.setTimeZone(TimeZone.getTimeZone("UTC"));
            m_sTime = sdf2.format(date);

        } catch (ParseException e) {
            m_sTime = m_sTimeOrig;
            Log.i(TAG, "Could not parse date " + m_sTime);
            e.printStackTrace();
        }

        m_sEmail = data.getString("email");
        m_sEvent = data.getString("event");
        // m_nCmngId = Integer.parseInt(data.getString("cmng_id"),10);
        m_sMessage = data.getString("message");
        m_sRegions = data.getString("regions");
        m_sCollapseKey = data.getString("collapse_key");
        m_sCameraName = data.getString("camera_name");
    }

    public String getCameraName(){
        return m_sCameraName;
    }

    public String getEventType(){
        return m_sEvent;
    }

    public boolean isEvent(){
        return m_sEvent.equals("sound") || m_sEvent.equals("motion");
    }

    public boolean isMotionEvent(){
        return m_sEvent.equals("motion");
    }

    public boolean isSoundEvent(){
        return m_sEvent.equals("sound");
    }

    public String getTime(){
        return m_sTime;
    }

    public String getMessage(){
        return m_sMessage;
    }

    public String toJsonString(){
        JSONObject obj = new JSONObject();
        try {
            obj.put("camera_id", m_nCameraId);
            obj.put("time_utc", m_sTimeUTC);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return obj.toString();
    }
}
