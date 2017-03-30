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

package com.vxg.cloud.ServiceProvider;

import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.TimeZone;

public class ServiceProviderRecordDetails {
    public static final String TAG = ServiceProviderRecordDetails.class.getSimpleName();
    private String mURL = null;
    private long mStart = 0;
    private long mEnd = 0;
    private long mSize = 0;

    public ServiceProviderRecordDetails(){
        // nothing
    }

    public ServiceProviderRecordDetails(JSONObject details){
        try {
            if (details.has("errorType") && details.has("errorDetail")) {
                Log.e(TAG, "Unknown json type: " + details.toString());
            } else {
                if(details.has("start") && !details.isNull("start")){
                    String start = details.getString("start");
                    mStart = ServiceProviderHelper.parseTime(start);
                    Log.i(TAG, "Start: " + start + ", time: " + mStart + ", StartAsString: " + getStartAsString());
                }

                if(details.has("end") && !details.isNull("end")){
                    String end = details.getString("end");
                    mEnd = ServiceProviderHelper.parseTime(end);
                }

                if(details.has("size") && !details.isNull("size")){
                    mSize = details.getLong("size");
                }

                if(details.has("url") && !details.isNull("url")){
                    mURL = details.getString("url");
                }
            }
        } catch(JSONException e) {
            Log.e(TAG, "Constructor ServiceProviderRecordDetails error: ", e);
            e.printStackTrace();
        }
    }

    public String getURL(){
        return mURL;
    }

    public void setURL(String val){
        mURL = val;
    }

    public long getStart(){
        return mStart;
    }

    public String getStartAsString(){
        return ServiceProviderHelper.formatTime(mStart);
    }

    public void setStart(long start){
        mStart = start;
    }

    public void setEnd(long end){
        mEnd = end;
    }

    public long getEnd(){
        return mEnd;
    }

    public String getEndAsString(){
        return ServiceProviderHelper.formatTime(mEnd);
    }

    public void setSize(long size){
        mSize = size;
    }

    public long getSize(){
        return mSize;
    }

    public long getDuration(){
        return mEnd - mStart;
    }

    public String toLogString(){
        String result = "";
        result += "url=" + mURL + "\n";
        result += "start=" + mStart + "\n";
        result += "end=" + mEnd + "\n";
        result += "duration=" + (mEnd - mStart) + "\n";
        result += "size=" + mSize + "\n";
        return result;
    }
}
