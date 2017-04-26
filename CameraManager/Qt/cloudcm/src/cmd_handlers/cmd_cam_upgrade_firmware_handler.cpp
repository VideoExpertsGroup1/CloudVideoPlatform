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

#include "cmd_cam_upgrade_firmware_handler.h"

QString CmdCamUpgradeFirmwareHandler::cmd(){
	return "cam_upgrade_firmware";
}

void CmdCamUpgradeFirmwareHandler::handle(QJsonObject obj, IWebSocketClient *wsc){

	QString firmware_url = "";
	int cam_id = 0;
	if(obj.contains("url")){
		firmware_url = obj["url"].toString();
	}

	if(obj.contains("cam_id")){
		cam_id = obj["cam_id"].toInt();
	}
	
	// TODO firmware upgrade
	
	wsc->sendMessage(wsc->makeCommandDone(cmd(), obj["msgid"].toInt(), "OK"));
}
