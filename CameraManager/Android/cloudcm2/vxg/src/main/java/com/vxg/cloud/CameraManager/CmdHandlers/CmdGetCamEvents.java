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
import com.vxg.cloud.CameraManager.Responses.CameraManagerMemoryCardEvent;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class CmdGetCamEvents implements CmdHandler {
    public static final String TAG = CmdGetCamEvents.class.getSimpleName();

    @Override
    public String cmd() {
        return CameraManagerCommandNames.GET_CAM_EVENTS;
    }

    @Override
    public void handle(JSONObject request, CameraManagerClientListener client) {
        Log.i(TAG, "Handle " + cmd());
        try {
            int msgid = request.getInt(CameraManagerParameterNames.MSGID);
            long cam_id = request.getLong(CameraManagerParameterNames.CAM_ID);

            if(cam_id != client.getConfig().getCamID()){
                Log.e(TAG, "Unknown camera !!!" + cam_id + " (expected " + client.getConfig().getCamID() + ")");
            }

            JSONObject data = new JSONObject();
            data.put(CameraManagerParameterNames.CMD, CameraManagerCommandNames.CAM_EVENTS_CONF);
            data.put(CameraManagerParameterNames.REFID, msgid);
            data.put(CameraManagerParameterNames.ORIG_CMD, cmd());
            data.put(CameraManagerParameterNames.CAM_ID, cam_id);

            data.put(CameraManagerParameterNames.ENABLED, true); //bool, indicates global events and event-driven streaming enabling flag
            data.put(CameraManagerParameterNames.EVENTS, prepareEvents(client));
            client.send(data);
        } catch(JSONException e){
            Log.e(TAG, "Invalid json" + e);
            e.printStackTrace();
        }

        // send event
        CameraManagerMemoryCardEvent cameraManagerMemoryCardEvent = new CameraManagerMemoryCardEvent(client);
        client.send(cameraManagerMemoryCardEvent.toJSONObject());
    }

    private JSONArray prepareEvents(CameraManagerClientListener client){
        JSONArray events = new JSONArray();
        events.put(prepareEventsRecord(client));
        events.put(prepareEventsMemoryCard(client));
        return events;
    }

    private JSONObject prepareEventsRecord(CameraManagerClientListener client){
        JSONObject events_record = new JSONObject();
        try {
            events_record.put(CameraManagerParameterNames.CAPS, prepareEventsRecordCaps(client));
            /*
                Events:
                – “motion”  for motion detection events
                – “sound” for audio detection
                – “net” for the camera network status change
                – “record” CM informs server about necessity of changing of recording state
                – “memorycard” camera's memory-card status change
                – “wifi” status of camera's currently used Wi-Fi
                 */
            events_record.put(CameraManagerParameterNames.EVENT, "record");
            events_record.put(CameraManagerParameterNames.ACTIVE, true);
            events_record.put(CameraManagerParameterNames.STREAM, true);
            events_record.put(CameraManagerParameterNames.SNAPSHOT, false);

        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }
        return events_record;
    }

    private JSONObject prepareEventsRecordCaps(CameraManagerClientListener client){
        JSONObject caps = new JSONObject();
        try {
            caps.put(CameraManagerParameterNames.STREAM, true);
            caps.put(CameraManagerParameterNames.SNAPSHOT, false);
        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }
        return caps;
    }

    private JSONObject prepareEventsMemoryCard(CameraManagerClientListener client){
        JSONObject events_memorycard = new JSONObject();
        try {
            events_memorycard.put(CameraManagerParameterNames.CAPS, prepareEventsMemoryCardCaps(client));
            events_memorycard.put(CameraManagerParameterNames.EVENT, "memorycard");
            events_memorycard.put(CameraManagerParameterNames.ACTIVE, true);
            events_memorycard.put(CameraManagerParameterNames.STREAM, true);
            events_memorycard.put(CameraManagerParameterNames.SNAPSHOT, false);

        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }
        return events_memorycard;
    }

    private JSONObject prepareEventsMemoryCardCaps(CameraManagerClientListener client){
        JSONObject caps = new JSONObject();
        try {
            caps.put(CameraManagerParameterNames.STREAM, true);
            caps.put(CameraManagerParameterNames.SNAPSHOT, false);
        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }
        return caps;
    }
}
