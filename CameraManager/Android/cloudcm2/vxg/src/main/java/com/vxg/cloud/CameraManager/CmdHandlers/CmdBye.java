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

import com.vxg.cloud.CameraManager.Enums.CameraManagerByeReasons;
import com.vxg.cloud.CameraManager.Enums.CameraManagerCommandNames;
import com.vxg.cloud.CameraManager.Enums.CameraManagerParameterNames;
import com.vxg.cloud.CameraManager.Interfaces.CameraManagerClientListener;
import com.vxg.cloud.CameraManager.Interfaces.CmdHandler;

import org.json.JSONException;
import org.json.JSONObject;

public class CmdBye implements CmdHandler {
    public static final String TAG = CmdBye.class.getSimpleName();

    @Override
    public String cmd() {
        return CameraManagerCommandNames.BYE;
    }

    @Override
    public void handle(JSONObject request, CameraManagerClientListener client) {
        try {
            int cmd_id = request.getInt(CameraManagerParameterNames.MSGID);
            String reason = request.getString(CameraManagerParameterNames.REASON);
            Log.i(TAG, " REASON: " + reason);
            if(reason.equals(CameraManagerByeReasons.ERROR.toString())){
                client.onByeError();
            }else if(reason.equals(CameraManagerByeReasons.SYSTEM_ERROR.toString())){
                client.onByeSystemError();
            }else if(reason.equals(CameraManagerByeReasons.INVALID_USER.toString())){
                client.onByeInvalidUser();
            }else if(reason.equals(CameraManagerByeReasons.AUTH_FAILURE.toString())){
                client.onByeAuthFailure();
            }else if(reason.equals(CameraManagerByeReasons.CONN_CONFLICT.toString())){
                client.onByeConnConflict();
            }else if(reason.equals(CameraManagerByeReasons.RECONNECT.toString())){
                client.onByeReconnect();
            }else if(reason.equals(CameraManagerByeReasons.SHUTDOWN.toString())){
                client.onByeShutdown();
            }else if(reason.equals(CameraManagerByeReasons.DELETED.toString())){
                client.onByeDelete();
            }else{
                Log.e(TAG, "Unhandled reason: " + reason);
            }
        } catch(JSONException e) {
            Log.e(TAG, "Invalid json" + e);
            e.printStackTrace();
        }
    }
}
