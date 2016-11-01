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

#include "cmd_set_cam_parameter_handler.h"

QString CmdSetCamParameterHandler::cmd(){
	return "set_cam_parameter";
}

void CmdSetCamParameterHandler::handle(QJsonObject obj, IWebSocketClient *wsc){

	int nCamid = 0;
	if(obj.contains("cam_id")){
		nCamid = obj["cam_id"].toInt();
	}

	if(obj.contains("status_led")){
		// wsc->settings()->audioconf_spkr_mute(obj["status_led"].toBool());
	}
	
	if(obj.contains("activity")){
		// wsc->settings()->audioconf_spkr_mute(obj["status_led"].toBool());
	}
	
	

	wsc->sendMessage(wsc->makeCommandDone(cmd(), obj["msgid"].toInt(), "OK"));	
}
