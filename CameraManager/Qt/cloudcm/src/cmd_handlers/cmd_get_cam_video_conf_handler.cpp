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

#include "cmd_get_cam_video_conf_handler.h"

QString CmdGetCamVideoConfHandler::cmd(){
	return "get_cam_video_conf";
}

void CmdGetCamVideoConfHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	QJsonObject cam_video_conf = wsc->makeCommand("cam_video_conf");
	cam_video_conf["refid"] = obj["msgid"].toInt();
	cam_video_conf["cam_id"] = wsc->settings()->camera_id();
	cam_video_conf["vert_flip"] = wsc->settings()->videoconf_vert_flip();
	cam_video_conf["horz_flip"] = wsc->settings()->videoconf_horz_flip();
	cam_video_conf["tdn"] = wsc->settings()->videoconf_tdn();
	cam_video_conf["ir_light"] = wsc->settings()->videoconf_ir_light();

	QJsonObject caps;

	{
		QJsonArray vert_flip;
		QStringList caps_vert_flip = wsc->settings()->videoconf_caps_vert_flip();
		for(int i = 0; i < caps_vert_flip.size(); i++){
			QString s = caps_vert_flip.at(i).trimmed();
			if(s != ""){
				vert_flip.append(s);
			}
		}
		caps["vert_flip"] = vert_flip;
	}

	{
		QJsonArray horz_flip;
		QStringList caps_horz_flip = wsc->settings()->videoconf_caps_horz_flip();
		for(int i = 0; i < caps_horz_flip.size(); i++){
			QString s = caps_horz_flip.at(i).trimmed();
			if(s != ""){
				horz_flip.append(s);
			}
		}
		caps["horz_flip"] = horz_flip;
	}
	
	{
		QJsonArray tdn;
		QStringList caps_tdn = wsc->settings()->videoconf_caps_tdn();
		for(int i = 0; i < caps_tdn.size(); i++){
			QString s = caps_tdn.at(i).trimmed();
			if(s != ""){
				tdn.append(s);
			}
		}
		caps["tdn"] = tdn;
	}

	{
		QJsonArray ir_light;
		QStringList caps_ir_light = wsc->settings()->videoconf_caps_ir_light();
		for(int i = 0; i < caps_ir_light.size(); i++){
			QString s = caps_ir_light.at(i).trimmed();
			if(s != ""){
				ir_light.append(s);
			}
		}
		caps["ir_light"] = ir_light;
	}
	
	cam_video_conf["caps"] = caps;
	wsc->sendMessage(cam_video_conf);
}
