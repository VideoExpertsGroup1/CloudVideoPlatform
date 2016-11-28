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

#include "cmd_configure_handler.h"

QString CmdConfigureHandler::cmd(){
	return "configure";
}

void CmdConfigureHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	if(obj.contains("server")){
		// qDebug() << "WebSocket opening...";
		wsc->settings()->servercm_reconnection_host(obj["server"].toString());
	}

	if(obj.contains("uuid")){
		wsc->settings()->cm_uuid(obj["uuid"].toString());
	}

	if(obj.contains("pwd")){
		wsc->settings()->cm_pwd(obj["pwd"].toString());
	}

	if(obj.contains("connid")){
		wsc->settings()->cm_connid(obj["connid"].toString());
	}

	if(obj.contains("tz")){
		wsc->settings()->cm_timezone(obj["tz"].toString());
	}
}
