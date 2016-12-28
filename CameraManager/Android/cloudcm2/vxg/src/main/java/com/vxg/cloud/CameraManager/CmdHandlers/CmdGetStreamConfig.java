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

public class CmdGetStreamConfig implements CmdHandler {
    public static final String TAG = CmdGetStreamConfig.class.getSimpleName();

    @Override
    public String cmd() {
        return "get_stream_config";
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

            JSONObject stream_config = client.getConfig().getStreamConfig().toJSONObject();

            // add
            stream_config.put(CameraManagerParameterNames.CMD, CameraManagerCommandNames.STREAM_CONFIG);
            stream_config.put(CameraManagerParameterNames.REFID, msgid);
            stream_config.put(CameraManagerParameterNames.CAM_ID, cam_id);
            stream_config.put(CameraManagerParameterNames.ORIG_CMD, cmd());

            client.send(stream_config);
        } catch(JSONException e){
            Log.e(TAG, "Invalid json" + e);
            e.printStackTrace();
        }
    }
}
