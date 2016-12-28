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

package com.vxg.cloud.CameraManager.Responses;

import android.os.Environment;
import android.os.StatFs;
import android.util.Log;

import com.vxg.cloud.CameraManager.Enums.CameraManagerCommandNames;
import com.vxg.cloud.CameraManager.Enums.CameraManagerMemoryCardStatus;
import com.vxg.cloud.CameraManager.Enums.CameraManagerParameterNames;
import com.vxg.cloud.CameraManager.Interfaces.CameraManagerClientListener;
import com.vxg.cloud.CameraManager.Interfaces.CameraManagerResponse;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;

public class CameraManagerMemoryCardEvent implements CameraManagerResponse {
    private static String TAG = CameraManagerMemoryCardEvent.class.getSimpleName();
    private long mCameraID = 0;
    private long mSize = 10; // in MB
    private long mFree = 2;  // in MB

    public CameraManagerMemoryCardEvent(CameraManagerClientListener client){
        mCameraID = client.getConfig().getCamID();

        File path = Environment.getDataDirectory();
        StatFs stat = new StatFs(path.getPath());
        mSize = stat.getTotalBytes()/1024/1024;
        mFree = stat.getFreeBytes()/1024/1024;
    }

    public void setSize(long size){
        mSize = size;
    }

    public void setFree(long free){
        mFree = free;
    }

    public long getSize(){
        return mSize;
    }

    public long getFree(){
        return mFree;
    }

    @Override
    public JSONObject toJSONObject(){
        JSONObject response = new JSONObject();
        try{
            response.put(CameraManagerParameterNames.CMD, CameraManagerCommandNames.CAM_EVENT);
            response.put(CameraManagerParameterNames.EVENT, "memorycard");
            response.put(CameraManagerParameterNames.CAM_ID, mCameraID);
            Double time = Double.valueOf(System.currentTimeMillis());
            time = time/1000;
            response.put(CameraManagerParameterNames.TIME, time);

            JSONObject memorycardinfo = new JSONObject();
            memorycardinfo.put(CameraManagerParameterNames.STATUS, CameraManagerMemoryCardStatus.NORMAL);
            memorycardinfo.put(CameraManagerParameterNames.SIZE, mSize); // in MB
            memorycardinfo.put(CameraManagerParameterNames.FREE, mFree); // in MB

            response.put(CameraManagerParameterNames.MEMORYCARD_INFO, memorycardinfo);
        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }
        return response;
    }
}
