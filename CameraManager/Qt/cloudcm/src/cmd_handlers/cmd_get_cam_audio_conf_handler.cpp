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
#include <QStringList>

QString CmdGetCamAudioConfHandler::cmd(){
	return "get_cam_audio_conf";
}

void CmdGetCamAudioConfHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	
	QJsonObject cam_audio_conf = wsc->makeCommand("cam_audio_conf");
	cam_audio_conf["refid"] = obj["msgid"].toInt();
	cam_audio_conf["cam_id"] = wsc->settings()->camera_id();
	cam_audio_conf["mic_gain"] = wsc->settings()->audioconf_mic_gain();
	cam_audio_conf["mic_mute"] = wsc->settings()->audioconf_mic_mute();
	cam_audio_conf["spkr_vol"] = wsc->settings()->audioconf_spkr_vol();
	cam_audio_conf["spkr_mute"] = wsc->settings()->audioconf_spkr_mute();
	cam_audio_conf["echo_cancel"] = wsc->settings()->audioconf_echo_cancel();

	QJsonObject caps;
	caps["mic"] = wsc->settings()->audioconf_caps_mic();
	caps["spkr"] = wsc->settings()->audioconf_caps_spkr();
	caps["backward"] = wsc->settings()->audioconf_caps_backward();

	// TODO move to settings
	QJsonArray echo_cancel;
	echo_cancel.append("");
	QStringList caps_echo_cancel = wsc->settings()->audioconf_caps_echo_cancel();
	for(int i = 0; i < caps_echo_cancel.size(); i++){
		QString s = caps_echo_cancel.at(i).trimmed();
		if(s != ""){
			echo_cancel.append(s);
		}
	}
	caps["echo_cancel"] = echo_cancel;
	cam_audio_conf["caps"] = caps;
	wsc->sendMessage(cam_audio_conf);
}
