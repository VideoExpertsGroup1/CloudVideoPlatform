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

package com.vxg.cloud.CameraManager.Interfaces;

import com.vxg.cloud.CameraManager.CameraManagerConfig;
import com.vxg.cloud.CameraManager.Enums.CameraManagerDoneStatus;

import org.json.JSONObject;

public interface CameraManagerClientListener {
    CameraManagerConfig getConfig();
    void setConfig(CameraManagerConfig config);
    void sendCmdDone(int cmd_id, String cmd, CameraManagerDoneStatus status);
    void send(JSONObject response);
    void sendPreview(long cam_id);
    void onUpdatedConfig();
    void onByeReconnect();
    void onByeError();
    void onByeSystemError();
    void onByeInvalidUser();
    void onByeAuthFailure();
    void onByeConnConflict();
    void onByeShutdown();
    void onByeDelete();
    void onStreamStart(String reason);
    void onStreamStop(String reason);
}
