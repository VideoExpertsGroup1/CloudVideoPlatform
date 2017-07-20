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
import com.vxg.cloud.CameraManager.Enums.CameraManagerDoneStatus;
import com.vxg.cloud.CameraManager.Enums.CameraManagerParameterNames;
import com.vxg.cloud.CameraManager.Interfaces.CameraManagerClientListener;
import com.vxg.cloud.CameraManager.Interfaces.CmdHandler;

import org.json.JSONException;
import org.json.JSONObject;

public class CmdBackwardStop implements CmdHandler {
    public static final String TAG = CmdBackwardStop.class.getSimpleName();

    @Override
    public String cmd() {
        return CameraManagerCommandNames.BACKWARD_STOP;
    }

    @Override
    public void handle(JSONObject request, CameraManagerClientListener client) {
        try {
            int cmd_id = request.getInt(CameraManagerParameterNames.MSGID);
            String url = request.getString(CameraManagerParameterNames.URL);
            client.onBackwardStop();
            client.sendCmdDone(cmd_id, cmd(), CameraManagerDoneStatus.OK);
        } catch(JSONException e) {
            Log.e(TAG, "Invalid json" + e);
            e.printStackTrace();
        }
    }
}
