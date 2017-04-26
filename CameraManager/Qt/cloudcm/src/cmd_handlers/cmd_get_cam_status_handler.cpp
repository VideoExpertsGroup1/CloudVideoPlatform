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

#include "cmd_get_cam_status_handler.h"

QString CmdGetCamStatusHandler::cmd(){
	return "get_cam_status";
}

void CmdGetCamStatusHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	// TODO
	
	QJsonObject cam_status = wsc->makeCommand("cam_status");
	cam_status["refid"] = obj["msgid"].toString();
	cam_status["cam_id"] = wsc->settings()->camera_id();
	cam_status["ip"] = wsc->settings()->camera_ip();
	cam_status["activity"] = true;
	cam_status["streaming"] = true;
	cam_status["status_led"] = false;
	wsc->sendMessage(cam_status);
}
