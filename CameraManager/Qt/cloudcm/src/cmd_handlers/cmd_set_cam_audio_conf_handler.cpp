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

#include "cmd_set_cam_audio_conf_handler.h"

QString CmdSetCamAudioConfHandler::cmd(){
	return "set_cam_audio_conf";
}

void CmdSetCamAudioConfHandler::handle(QJsonObject obj, IWebSocketClient *wsc){

	int nCamid = 0;
	if(obj.contains("cam_id")){
		nCamid = obj["cam_id"].toInt();
	}

	if(obj.contains("spkr_mute")){
		wsc->settings()->audioconf_spkr_mute(obj["spkr_mute"].toBool());
	}
	
	if(obj.contains("spkr_vol")){
		wsc->settings()->audioconf_spkr_vol(obj["spkr_vol"].toInt());
	}
	
	if(obj.contains("mic_mute")){
		wsc->settings()->audioconf_mic_mute(obj["mic_mute"].toBool());
	}
	
	if(obj.contains("mic_gain")){
		wsc->settings()->audioconf_mic_gain(obj["mic_gain"].toInt());
	}

	wsc->sendMessage(wsc->makeCommandDone(cmd(), obj["msgid"].toInt(), "OK"));	
}
