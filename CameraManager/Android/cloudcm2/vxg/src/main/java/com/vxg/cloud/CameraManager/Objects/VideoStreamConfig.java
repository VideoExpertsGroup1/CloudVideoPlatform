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

import com.vxg.cloud.CameraManager.Enums.CameraManagerParameterNames;
import com.vxg.cloud.CameraManager.Enums.CameraManagerVideoFormats;

import org.json.JSONException;
import org.json.JSONObject;

public class VideoStreamConfig {
    private static String TAG = VideoStreamConfig.class.getSimpleName();
    private int mVert = 480; // default value
    private int mHorz = 640; // default value
    private boolean mVbr = true; // default value
    private double mFps = 480; // default value
    private int mGop = 60; // default value
    private int mQuality = 0; // default value
    private CameraManagerVideoFormats mFormat = CameraManagerVideoFormats.H_264; // default value
    private String mStream= "Vid"; // default value

    private static String HORZ = "horz";
    private static String VERT = "vert";
    private static String FORMAT = "format";
    private static String VBR = "vbr";
    private static String GOP = "gop";
    private static String STREAM = "stream";
    private static String QUALITY = "quality";
    private static String FPS = "fps";

    public VideoStreamConfig(JSONObject config){
        try{

            if(config.has(VERT) && !config.isNull(VERT)){
                mVert = config.getInt(VERT);
            }else{
                Log.e(TAG, "Not found " + VERT);
            }

            if(config.has(HORZ) && !config.isNull(HORZ)){
                mHorz = config.getInt(HORZ);
            }else{
                Log.e(TAG, "Not found " + HORZ);
            }

            if(config.has(STREAM) && !config.isNull(STREAM)){
                mStream = config.getString(STREAM);
            }else{
                Log.e(TAG, "Not found " + STREAM);
            }

            if(config.has(QUALITY) && !config.isNull(QUALITY)){
                mQuality = config.getInt(QUALITY);
            }else{
                Log.e(TAG, "Not found " + QUALITY);
            }

            if(config.has(FORMAT) && !config.isNull(FORMAT)){
                if(config.getString(FORMAT).equals("H.264")){
                    mFormat = CameraManagerVideoFormats.H_264;
                }
            }else{
                Log.e(TAG, "Not found " + FORMAT);
            }

            if(config.has(VBR) && !config.isNull(VBR)){
                mVbr = config.getBoolean(VBR);
            }else{
                Log.e(TAG, "Not found " + VBR);
            }

            if(config.has(FPS) && !config.isNull(FPS)){
                mFps = config.getDouble(FPS);
            }else{
                Log.e(TAG, "Not found " + FPS);
            }

            if(config.has(GOP) && !config.isNull(GOP)){
                mGop = config.getInt(GOP);
            }else{
                Log.e(TAG, "Not found " + GOP);
            }

        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }
    }

    public VideoStreamConfig(){
    }

    public JSONObject toJSONObject(){
        JSONObject videoStreamConfig = new JSONObject();
        try{
            videoStreamConfig.put(VERT, mVert);
            videoStreamConfig.put(HORZ, mHorz);
            videoStreamConfig.put(STREAM, mStream);
            if(mFormat == CameraManagerVideoFormats.H_264){
                videoStreamConfig.put(FORMAT, "H.264");
            }
            videoStreamConfig.put(VBR, mVbr);
            videoStreamConfig.put(FPS, mFps);
            videoStreamConfig.put(QUALITY, mQuality);
            videoStreamConfig.put(GOP, mGop);

        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }
        return videoStreamConfig;
    }

    public void setVert(int vert){
        mVert = vert;
    }

    public int getVert(){
        return mVert;
    }

    public void setHorz(int horz){
        mHorz = horz;
    }

    public int getHorz(){
        return mHorz;
    }

    public boolean isVbr() {
        return mVbr;
    }

    public void setVbr(boolean mVbr) {
        this.mVbr = mVbr;
    }

    public double getFps() {
        return mFps;
    }

    public void setFps(double mFps) {
        this.mFps = mFps;
    }

    public int getGop() {
        return mGop;
    }

    public void setGop(int mGop) {
        this.mGop = mGop;
    }

    public int getQuality() {
        return mQuality;
    }

    public void setQuality(int mQuality) {
        this.mQuality = mQuality;
    }

    public CameraManagerVideoFormats getFormat() {
        return mFormat;
    }

    public void setFormat(CameraManagerVideoFormats mFormat) {
        this.mFormat = mFormat;
    }

    public String getStream() {
        return mStream;
    }

    public void setStream(String mStream) {
        this.mStream = mStream;
    }
}
