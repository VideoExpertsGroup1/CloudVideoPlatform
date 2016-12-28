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

public class CmdGetCamVideoConf implements CmdHandler {
    public static final String TAG = CmdGetCamVideoConf.class.getSimpleName();

    @Override
    public String cmd() {
        return CameraManagerCommandNames.GET_CAM_VIDEO_CONF;
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

            JSONObject data = new JSONObject();
            data.put(CameraManagerParameterNames.CMD, CameraManagerCommandNames.CAM_VIDEO_CONF);
            data.put(CameraManagerParameterNames.REFID, cmd_id);
            data.put(CameraManagerParameterNames.ORIG_CMD, cmd());
            data.put(CameraManagerParameterNames.CAM_ID, cam_id);
            data.put(CameraManagerParameterNames.VERT_FLIP, "off"); // TODO hardcoded
            data.put(CameraManagerParameterNames.HORZ_FLIP, "off"); // TODO hardcoded
            data.put(CameraManagerParameterNames.TDN, "auto"); // TODO hardcoded
            data.put(CameraManagerParameterNames.IR_LIGHT, "auto"); // TODO hardcoded
            data.put(CameraManagerParameterNames.CAPS, prepareVideoCaps(client));
            client.send(data);
        } catch(JSONException e){
            Log.e(TAG, "Invalid json" + e);
            e.printStackTrace();
        }
    }

    private JSONObject prepareVideoCaps(CameraManagerClientListener client){
        JSONObject caps = new JSONObject();
        // vert flip
        try {
            JSONArray vert_flip = new JSONArray();
            vert_flip.put("off");
            vert_flip.put("on");
            vert_flip.put("auto");
            caps.put(CameraManagerParameterNames.VERT_FLIP, vert_flip);
        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }

        // horz flip
        try {
            JSONArray horz_flip = new JSONArray();
            horz_flip.put("off");
            horz_flip.put("on");
            horz_flip.put("auto");
            caps.put(CameraManagerParameterNames.HORZ_FLIP, horz_flip);
        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }

        // tdn
        try {
            JSONArray tdn = new JSONArray();
            tdn.put("off");
            tdn.put("on");
            tdn.put("auto");
            caps.put(CameraManagerParameterNames.TDN, tdn);
        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }

        // tdn
        try {
            JSONArray ir_light = new JSONArray();
            ir_light.put("off");
            ir_light.put("on");
            ir_light.put("auto");
            caps.put(CameraManagerParameterNames.IR_LIGHT, ir_light);
        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }
        return caps;
    }
}
