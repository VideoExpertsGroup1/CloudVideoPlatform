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

import android.util.Log;

import com.vxg.cloud.CameraManager.Enums.CameraManagerCommandNames;
import com.vxg.cloud.CameraManager.Enums.CameraManagerParameterNames;
import com.vxg.cloud.CameraManager.Interfaces.CameraManagerClientListener;
import com.vxg.cloud.CameraManager.Interfaces.CameraManagerResponse;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class CameraManagerSupportedStreams  implements CameraManagerResponse {
    private static String TAG = CameraManagerSupportedStreams.class.getSimpleName();
    private long mCameraID = 0;
    private long mRefID = 0;
    private String mOriginalCmd = "";

    public CameraManagerSupportedStreams(CameraManagerClientListener client, JSONObject request, String orig_cmd){
        mCameraID = client.getConfig().getCamID();
        mOriginalCmd = orig_cmd;
        try {
            mRefID = request.getInt(CameraManagerParameterNames.MSGID);
        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }
    }

    @Override
    public JSONObject toJSONObject(){
        JSONObject response = new JSONObject();
        try{
            response.put(CameraManagerParameterNames.CMD, CameraManagerCommandNames.SUPPORTED_STREAMS);
            response.put(CameraManagerParameterNames.REFID, mRefID);
            response.put(CameraManagerParameterNames.ORIG_CMD, mOriginalCmd);
            response.put(CameraManagerParameterNames.CAM_ID, mCameraID);

            JSONArray audio_es = new JSONArray();
            audio_es.put("Aud"); // TODO hardcoded
            response.put(CameraManagerParameterNames.AUDIO_ES, audio_es);

            JSONArray video_es = new JSONArray();
            video_es.put("Vid"); // TODO hardcoded
            response.put(CameraManagerParameterNames.VIDEO_ES, video_es);

            JSONObject stream1 = new JSONObject();
            stream1.put(CameraManagerParameterNames.ID, "Main"); // TODO hardcoded
            stream1.put(CameraManagerParameterNames.VIDEO, "Vid"); // TODO hardcoded
            stream1.put(CameraManagerParameterNames.AUDIO, "Aud"); // TODO hardcoded

            JSONArray streams = new JSONArray();
            streams.put(stream1);

            response.put(CameraManagerParameterNames.STREAMS, streams);

        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }
        return response;
    }
}
