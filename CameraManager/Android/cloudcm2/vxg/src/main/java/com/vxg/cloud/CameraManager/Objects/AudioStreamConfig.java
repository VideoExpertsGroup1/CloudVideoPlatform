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

package com.vxg.cloud.CameraManager.Objects;

import android.util.Log;

import com.vxg.cloud.CameraManager.Enums.CameraManagerAudioFormats;
import com.vxg.cloud.CameraManager.Enums.CameraManagerParameterNames;

import org.json.JSONException;
import org.json.JSONObject;

public class AudioStreamConfig {
    private static String TAG = AudioStreamConfig.class.getSimpleName();

    private String mStream= "Aud"; // default value
    private int mBitrate = 128; // in kbps
    private CameraManagerAudioFormats mFormat = CameraManagerAudioFormats.AAC; // default value
    private double mSrt = 44.1; // default value

    private static String FORMAT = "format";
    private static String BRT = "brt";
    private static String SRT = "srt";
    private static String STREAM = "stream";

    public AudioStreamConfig(JSONObject config){
        try{

            if(config.has(STREAM) && !config.isNull(STREAM)){
                mStream = config.getString(STREAM);
            }else{
                Log.e(TAG, "Not found " + STREAM);
            }

            if(config.has(BRT) && !config.isNull(BRT)){
                mBitrate = config.getInt(BRT);
            }else{
                Log.e(TAG, "Not found " + BRT);
            }

            if(config.has(FORMAT) && !config.isNull(FORMAT)){
                if(config.getString(FORMAT).equals("AAC")){
                    mFormat = CameraManagerAudioFormats.AAC;
                }
            }else{
                Log.e(TAG, "Not found " + FORMAT);
            }

            if(config.has(SRT) && !config.isNull(SRT)){
                mSrt = config.getDouble(SRT);
            }else{
                Log.e(TAG, "Not found " + SRT);
            }

        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }
    }

    public AudioStreamConfig() {
    }

    public JSONObject toJSONObject(){
        JSONObject audioStreamConfig = new JSONObject();
        try{
            audioStreamConfig.put(STREAM, mStream);
            if(mFormat == CameraManagerAudioFormats.AAC) {
                audioStreamConfig.put(FORMAT, "AAC");
            }
            audioStreamConfig.put(BRT, mBitrate);
            audioStreamConfig.put(SRT, mSrt);

        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }
        return audioStreamConfig;
    }

    public double getSrt() {
        return mSrt;
    }

    public void setSrt(double srt) {
        this.mSrt = srt;
    }

    public int getBiterate() {
        return mBitrate;
    }
    public void setBitrate(int brt) {
        this.mBitrate = brt;
    }

    public CameraManagerAudioFormats getFormat() {
        return mFormat;
    }

    public void setFormat(CameraManagerAudioFormats format) {
        mFormat = format;
    }

    public String getStream() {
        return mStream;
    }

    public void setStream(String stream) {
        mStream = stream;
    }
}
