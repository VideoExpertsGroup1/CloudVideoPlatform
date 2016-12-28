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

package com.vxg.cloud.CameraManager;

import com.vxg.cloud.CameraManager.CmdHandlers.CmdBye;
import com.vxg.cloud.CameraManager.CmdHandlers.CmdCamUpdatePreview;
import com.vxg.cloud.CameraManager.CmdHandlers.CmdConfigureHandler;
import com.vxg.cloud.CameraManager.CmdHandlers.CmdGetAudioDetection;
import com.vxg.cloud.CameraManager.CmdHandlers.CmdGetCamAudioConf;
import com.vxg.cloud.CameraManager.CmdHandlers.CmdGetCamEvents;
import com.vxg.cloud.CameraManager.CmdHandlers.CmdGetCamStatus;
import com.vxg.cloud.CameraManager.CmdHandlers.CmdGetCamVideoConf;
import com.vxg.cloud.CameraManager.CmdHandlers.CmdGetMotionDetection;
import com.vxg.cloud.CameraManager.CmdHandlers.CmdGetStreamByEvent;
import com.vxg.cloud.CameraManager.CmdHandlers.CmdGetStreamCaps;
import com.vxg.cloud.CameraManager.CmdHandlers.CmdGetStreamConfig;
import com.vxg.cloud.CameraManager.CmdHandlers.CmdGetSupportedStreams;
import com.vxg.cloud.CameraManager.CmdHandlers.CmdSetCamAudioConf;
import com.vxg.cloud.CameraManager.CmdHandlers.CmdSetCamEvents;
import com.vxg.cloud.CameraManager.CmdHandlers.CmdSetCamVideoConf;
import com.vxg.cloud.CameraManager.CmdHandlers.CmdSetMotionDetection;
import com.vxg.cloud.CameraManager.CmdHandlers.CmdSetStreamConfig;
import com.vxg.cloud.CameraManager.CmdHandlers.CmdStreamStart;
import com.vxg.cloud.CameraManager.CmdHandlers.CmdStreamStop;
import com.vxg.cloud.CameraManager.Interfaces.CmdHandler;
import com.vxg.cloud.CameraManager.CmdHandlers.CmdHelloHandler;

import java.util.HashMap;


public class CreateCmdHandlers {
    public static HashMap<String, CmdHandler> create(){
        HashMap<String, CmdHandler> handlers = new HashMap<>();
        CreateCmdHandlers.register(handlers, new CmdBye());
        CreateCmdHandlers.register(handlers, new CmdCamUpdatePreview());
        CreateCmdHandlers.register(handlers, new CmdConfigureHandler());
        // CreateCmdHandlers.register(handlers, new CmdGetAudioDetection());
        CreateCmdHandlers.register(handlers, new CmdGetCamAudioConf());
        CreateCmdHandlers.register(handlers, new CmdGetCamEvents());
        CreateCmdHandlers.register(handlers, new CmdGetCamStatus());
        CreateCmdHandlers.register(handlers, new CmdGetCamVideoConf());
        CreateCmdHandlers.register(handlers, new CmdGetMotionDetection());
        // CreateCmdHandlers.register(handlers, new CmdGetStreamByEvent());
        CreateCmdHandlers.register(handlers, new CmdGetStreamCaps());
        CreateCmdHandlers.register(handlers, new CmdGetStreamConfig());
        CreateCmdHandlers.register(handlers, new CmdGetSupportedStreams());
        CreateCmdHandlers.register(handlers, new CmdHelloHandler());
        CreateCmdHandlers.register(handlers, new CmdSetCamAudioConf());
        CreateCmdHandlers.register(handlers, new CmdSetCamEvents());
        CreateCmdHandlers.register(handlers, new CmdSetCamVideoConf());
        CreateCmdHandlers.register(handlers, new CmdSetMotionDetection());
        CreateCmdHandlers.register(handlers, new CmdSetStreamConfig());
        CreateCmdHandlers.register(handlers, new CmdStreamStart());
        CreateCmdHandlers.register(handlers, new CmdStreamStop());
        return handlers;
    }

    static void register(HashMap<String, CmdHandler> handlers, CmdHandler handler) {
        handlers.put(handler.cmd(), handler);
    }
}
