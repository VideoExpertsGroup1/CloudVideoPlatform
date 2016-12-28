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

public class CmdConfigureHandler implements CmdHandler {
    public static final String TAG = "CmdHelloHandler";
    @Override
    public String cmd() {
        return CameraManagerCommandNames.CONFIGURE;
    }

    @Override
    public void handle(JSONObject request, CameraManagerClientListener client) {
        try {
            // TODO check with reconnect
            boolean bConfigChanged = false;
            if(request.has(CameraManagerParameterNames.PWD) && !request.isNull(CameraManagerParameterNames.PWD)){
                String pwd = request.getString(CameraManagerParameterNames.PWD);
                client.getConfig().setPwd(pwd);
                bConfigChanged = true;
            }

            if(request.has(CameraManagerParameterNames.UUID) && !request.isNull(CameraManagerParameterNames.UUID)) {
                String uuid = request.getString(CameraManagerParameterNames.UUID);
                client.getConfig().setUUID(uuid);
                bConfigChanged = true;
            }

            if(request.has(CameraManagerParameterNames.CONNID) && !request.isNull(CameraManagerParameterNames.CONNID)) {
                String connId = request.getString(CameraManagerParameterNames.CONNID);
                client.getConfig().setConnID(connId);
                bConfigChanged = true;
            }

            if(request.has(CameraManagerParameterNames.SERVER) && !request.isNull(CameraManagerParameterNames.SERVER)){
                String server = request.getString(CameraManagerParameterNames.SERVER);
                if (server != null) {
                    Log.d(TAG, "onConfigureReceive() newAddress=" + server);
                    client.getConfig().setReconnectAddress(server);
                    bConfigChanged = true;
                }
            }

            if (bConfigChanged) {
                client.onUpdatedConfig();
            }

            int cmd_id = request.getInt(CameraManagerParameterNames.MSGID);
            client.sendCmdDone(cmd_id, cmd(), CameraManagerDoneStatus.OK);
        } catch(JSONException e){
            Log.e(TAG, "Invalid json" + e);
            e.printStackTrace();
        }
    }
}
