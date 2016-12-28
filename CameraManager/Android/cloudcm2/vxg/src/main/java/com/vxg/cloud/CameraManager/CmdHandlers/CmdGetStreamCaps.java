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

package com.vxg.cloud.CameraManager.CmdHandlers;

import android.util.Log;

import com.vxg.cloud.CameraManager.Enums.CameraManagerCommandNames;
import com.vxg.cloud.CameraManager.Enums.CameraManagerParameterNames;
import com.vxg.cloud.CameraManager.Interfaces.CameraManagerClientListener;
import com.vxg.cloud.CameraManager.Interfaces.CmdHandler;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class CmdGetStreamCaps implements CmdHandler {
    public static final String TAG = CmdGetStreamCaps.class.getSimpleName();

    @Override
    public String cmd() {
        return CameraManagerCommandNames.GET_STREAM_CAPS;
    }

    @Override
    public void handle(JSONObject request, CameraManagerClientListener client) {
        Log.i(TAG, "Handle " + cmd());
        try {
            int cmd_id = request.getInt(CameraManagerParameterNames.MSGID);
            long cam_id = request.getLong(CameraManagerParameterNames.CAM_ID);

            if(cam_id != client.getConfig().getCamID()){
                Log.e(TAG, "Unknown camera !!!" + cam_id + " (expected " + client.getConfig().getCamID() + ")");
            }

            JSONArray video_es = request.getJSONArray(CameraManagerParameterNames.VIDEO_ES);
            JSONArray audio_es = request.getJSONArray(CameraManagerParameterNames.AUDIO_ES);

            JSONObject data = new JSONObject();
            data.put(CameraManagerParameterNames.CMD, CameraManagerCommandNames.STREAM_CAPS);
            data.put(CameraManagerParameterNames.REFID, cmd_id);
            data.put(CameraManagerParameterNames.ORIG_CMD, cmd());
            data.put(CameraManagerParameterNames.CAM_ID, cam_id);

            //TODO hardcoded
            data.put(CameraManagerParameterNames.CAPS_VIDEO, prepareCapsVideo(client, video_es));
            data.put(CameraManagerParameterNames.CAPS_AUDIO, prepareCapsAudio(client, audio_es));
            client.send(data);
        } catch(JSONException e){
            Log.e(TAG, "Invalid json" + e);
            e.printStackTrace();
        }
    }

    private JSONArray prepareCapsVideo(CameraManagerClientListener client, JSONArray streams){
        JSONArray caps_video = new JSONArray();
        try {
            JSONObject caps_video1 = new JSONObject();

            caps_video1.put(CameraManagerParameterNames.STREAMS, streams);

            JSONArray formats = new JSONArray();
            formats.put("H.264"); // support only this format
            caps_video1.put(CameraManagerParameterNames.FORMATS, formats);

            JSONArray resolutions = new JSONArray();
            resolutions.put(makeResolution(640, 480));
            resolutions.put(makeResolution(1920,1080));
            resolutions.put(makeResolution(1280,720));
            caps_video1.put(CameraManagerParameterNames.RESOLUTIONS, resolutions);

            JSONArray fps = new JSONArray();
            fps.put(30);
            caps_video1.put(CameraManagerParameterNames.FPS, fps);

            JSONArray gop = new JSONArray();
            gop.put(60); // min
            gop.put(120); // max
            gop.put(60); // step
            caps_video1.put(CameraManagerParameterNames.GOP, gop);

            JSONArray brt = new JSONArray();
            brt.put(1024); // min
            brt.put(2048); // max
            brt.put(128); // step
            caps_video1.put(CameraManagerParameterNames.BRT, brt);

            JSONArray quality = new JSONArray();
            quality.put(0); // min
            quality.put(4); // max
            caps_video1.put(CameraManagerParameterNames.QUALITY, quality);

            caps_video1.put(CameraManagerParameterNames.VBR, true);

            caps_video.put(caps_video1);
        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }

        return caps_video;
    }

    private JSONArray makeResolution(int w, int h){
        JSONArray resolution = new JSONArray();
        resolution.put(w);
        resolution.put(h);
        return resolution;
    }

    private JSONArray prepareCapsAudio(CameraManagerClientListener client, JSONArray streams){
        JSONArray caps_audio = new JSONArray();
        try {
            JSONObject caps_audio1 = new JSONObject();
            caps_audio1.put(CameraManagerParameterNames.STREAMS, streams);

            JSONArray formats = new JSONArray();
            formats.put("AAC"); // support only this format
            caps_audio1.put(CameraManagerParameterNames.FORMATS, formats);

            JSONArray brt = new JSONArray();
            brt.put(64); // min
            brt.put(128); // max
            brt.put(64); // step
            caps_audio1.put(CameraManagerParameterNames.BRT, brt);

            JSONArray srt = new JSONArray();
            srt.put(32.0);
            srt.put(44.1);
            srt.put(48.0);
            caps_audio1.put(CameraManagerParameterNames.SRT, srt);

            caps_audio.put(caps_audio1);
        }catch(JSONException e){
            Log.e(TAG, "Invalid json " + e.getMessage());
            e.printStackTrace();
        }
        return caps_audio;
    }


}
