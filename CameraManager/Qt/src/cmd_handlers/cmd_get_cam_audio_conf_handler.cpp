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

#include "cmd_get_cam_audio_conf_handler.h"

QString CmdGetCamAudioConfHandler::cmd(){
	return "get_cam_audio_conf";
}

void CmdGetCamAudioConfHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	
	QJsonObject cam_audio_conf = wsc->makeCommand("cam_audio_conf");
	cam_audio_conf["refid"] = obj["msgid"].toInt();
	cam_audio_conf["cam_id"] = wsc->settings()->camera_id();
	cam_audio_conf["mic_gain"] = 50;
	cam_audio_conf["mic_mute"] = false;
	cam_audio_conf["spkr_vol"] = 50;
	cam_audio_conf["spkr_mute"] = false;
	cam_audio_conf["echo_cancel"] = "";

	QJsonObject caps;
	caps["mic"] = true;
	caps["spkr"] = true;
	caps["backward"] = true;

	QJsonArray echo_cancel;
	echo_cancel.append("");
	echo_cancel.append("S1");
	echo_cancel.append("S2");
	caps["echo_cancel"] = echo_cancel;
	cam_audio_conf["caps"] = caps;
	wsc->sendMessage(cam_audio_conf);
}
