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

public class CmdGetMotionDetection implements CmdHandler {
    public static final String TAG = CmdGetMotionDetection.class.getSimpleName();

    @Override
    public String cmd() {
        return CameraManagerCommandNames.GET_MOTION_DETECTION;
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

            JSONObject motion_detection_conf = new JSONObject();
            motion_detection_conf.put(CameraManagerParameterNames.CMD, CameraManagerCommandNames.MOTION_DETECTION_CONF);
            motion_detection_conf.put(CameraManagerParameterNames.REFID, cmd_id);
            motion_detection_conf.put(CameraManagerParameterNames.ORIG_CMD, cmd());
            motion_detection_conf.put(CameraManagerParameterNames.CAM_ID, cam_id);

            motion_detection_conf.put(CameraManagerParameterNames.COLUMNS, 23);
            motion_detection_conf.put(CameraManagerParameterNames.ROWS, 15);
            // number of detection cells by X and Y coordinate
            JSONObject caps = new JSONObject();
            caps.put(CameraManagerParameterNames.MAX_REGIONS, 8);
            caps.put(CameraManagerParameterNames.SENSITIVITY, "region"); // optional (“region”, “frame”), default “region”; indicates if sensitivity can be set for region or for whole frame only
            caps.put(CameraManagerParameterNames.REGION_SHAPE, "rect"); // optional (“rect”, “any”), default “any”; specifies limitation of region shape
            motion_detection_conf.put(CameraManagerParameterNames.CAPS, caps);

            JSONArray regions = new JSONArray();
            for(int i = 0; i < 8; i++){
                JSONObject motion = new JSONObject();
                motion.put(CameraManagerParameterNames.ENABLED, true);
                motion.put(CameraManagerParameterNames.NAME, "motion" + Integer.toString(i));
                motion.put(CameraManagerParameterNames.MAP, "MGUwMDAxZmUwMDAzZmMwMDA3ZjgwMDBmZjAwMDFmZTBlNDAw");
                /* map: string. Bitstring where “1” denotes an active cell and a “0” an inactive cell.
                 * The first cell is in the upper left corner. Then the cell order goes first from
                 * left to right and then from up to down. If the number of cells is not a multiple
                 * of 8 the last byte is padded with zeros. String is packed with Packbit algorithm
                 * and after that encoded with Base64.
                */
                motion.put(CameraManagerParameterNames.SENSITIVITY, 5);
                regions.put(motion);
            }
            motion_detection_conf.put(CameraManagerParameterNames.REGIONS, regions);
            client.send(motion_detection_conf);
        } catch(JSONException e){
            Log.e(TAG, "Invalid json" + e);
            e.printStackTrace();
        }
    }
}
