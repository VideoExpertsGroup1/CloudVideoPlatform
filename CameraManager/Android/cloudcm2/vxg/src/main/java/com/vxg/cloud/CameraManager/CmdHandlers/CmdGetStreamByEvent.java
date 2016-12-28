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

import org.json.JSONException;
import org.json.JSONObject;

public class CmdGetStreamByEvent implements CmdHandler {
    public static final String TAG = CmdGetStreamByEvent.class.getSimpleName();

    @Override
    public String cmd() {
        return CameraManagerCommandNames.GET_STREAM_BY_EVENT;
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

            //TODO

            /*JSONObject data = new JSONObject();
            data.put(CameraManagerParameterNames.CMD, CameraManagerCommandNames.STREAM_BY_EVENT_CONF);
            data.put(CameraManagerParameterNames.REFID, cmd_id);
            data.put(CameraManagerParameterNames.ORIG_CMD, cmd());
            data.put(CameraManagerParameterNames.POST_EVENT, 2000);

            //TODO  need stream_id

            client.send(data);*/
        } catch(JSONException e){
            Log.e(TAG, "Invalid json" + e);
            e.printStackTrace();
        }
    }
}
