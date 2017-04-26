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

#include "cmd_cam_hello_handler.h"

QString CmdCamHelloHandler::cmd(){
	return "cam_hello";
}

void CmdCamHelloHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	wsc->sendMessage(wsc->makeCommandDone(cmd(), obj["msgid"].toInt(), "OK"));
	
	wsc->settings()->camera_id(obj["cam_id"].toInt());
	wsc->settings()->camera_mode(obj["mode"].toString());
	wsc->settings()->camera_media_url(obj["media_url"].toString());
	
	if(wsc->settings()->camera_mode() == "p2p"){
		QJsonObject cam_event = wsc->makeCommand("cam_event");
		cam_event["cam_id"] = obj["cam_id"].toInt();
		cam_event["event"] = "net";
		cam_event["time"] = (float)QDateTime::currentDateTimeUtc().toTime_t()*1000;
		
		QJsonObject net_info;
		net_info["ip"] = wsc->settings()->camera_ip();
		
		QJsonObject p2p;
		QJsonObject p2p_local;
		p2p_local["web_port"] = 80;
		p2p_local["rtmp_port"] = 1935;
		p2p["local"] = p2p_local;
		net_info["p2p"] = p2p;
		cam_event["net_info"] = net_info;

		wsc->sendMessage(cam_event);
	}
}
