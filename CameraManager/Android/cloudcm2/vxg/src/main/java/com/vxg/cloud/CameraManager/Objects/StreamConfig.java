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

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;

public class StreamConfig {
    private static String TAG = StreamConfig.class.getSimpleName();

    private String VIDEO = "video";
    private String AUDIO = "audio";

    private ArrayList<VideoStreamConfig> video_streams = new ArrayList<>();
    private ArrayList<AudioStreamConfig> audio_streams = new ArrayList<>();

    public StreamConfig(JSONObject config){

        try {
            if (config.has(VIDEO) && !config.isNull(VIDEO)) {
                JSONArray video = config.getJSONArray(VIDEO);
                for(int i = 0; i < video.length(); i++){
                    video_streams.add(new VideoStreamConfig(video.getJSONObject(i)));
                }
            }

            if (config.has(AUDIO) && !config.isNull(AUDIO)) {
                JSONArray audio = config.getJSONArray(AUDIO);
                for(int i = 0; i < audio.length(); i++){
                    audio_streams.add(new AudioStreamConfig(audio.getJSONObject(i)));
                }
            }
        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }
    }

    public StreamConfig() {

    }

    public void addVideoStreamConfig(VideoStreamConfig vconf){
        boolean bExists = false;
        for(int i = 0; i < video_streams.size(); i++){
            VideoStreamConfig tmpVConf = video_streams.get(i);
            if(tmpVConf.getStream().equals(vconf.getStream())){
                bExists = true;
            }
        }
        if(!bExists) {
            video_streams.add(vconf);
        }
    }

    public void addAudioStreamConfig(AudioStreamConfig aconf){
        boolean bExists = false;
        for(int i = 0; i < audio_streams.size(); i++){
            AudioStreamConfig tmpVConf = audio_streams.get(i);
            if(tmpVConf.getStream().equals(aconf.getStream())){
                bExists = true;
            }
        }
        if(!bExists) {
            audio_streams.add(aconf);
        }
    }

    public JSONObject toJSONObject(){
        JSONObject stream_config = new JSONObject();

        // video
        try{
            JSONArray video = new JSONArray();
            for(int i = 0; i < video_streams.size(); i++){
                video.put(video_streams.get(i).toJSONObject());
            }
            stream_config.put(VIDEO, video);
        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }

        // audio
        try{
            JSONArray audio = new JSONArray();
            for(int i = 0; i < audio_streams.size(); i++){
                audio.put(audio_streams.get(i).toJSONObject());
            }
            stream_config.put(AUDIO, audio);

        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }

        return stream_config;
    }
}
