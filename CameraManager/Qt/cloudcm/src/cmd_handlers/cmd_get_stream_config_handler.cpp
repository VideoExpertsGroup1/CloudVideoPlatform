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

#include "cmd_get_stream_config_handler.h"

QString CmdGetStreamConfigHandler::cmd(){
	return "get_stream_config";
}

void CmdGetStreamConfigHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	
	QJsonObject stream_config = wsc->makeCommand("stream_config");
	stream_config["refid"] = obj["msgid"].toInt();
	stream_config["cam_id"] = wsc->settings()->camera_id();
	
	QJsonArray video;
	{
		QJsonObject Vid;
		Vid["stream"] = "Vid";
		Vid["format"] = "H.264";
		Vid["horz"] = 720;
		Vid["vert"] = 240;
		Vid["fps"] = 25.0;
		Vid["gop"] = 1;
		Vid["brt"] = 512;
		Vid["quality"] = 0;
		video.append(Vid);
	}
	
	stream_config["video"] = video;

	QJsonArray audio;
	{
		QJsonObject Aud;
		Aud["stream"] = "Aud";
		Aud["format"] = "AAC";
		Aud["brt"] = 64;
		Aud["srt"] = 44.1;
		audio.append(Aud);
	}
	
	stream_config["audio"] = audio;
	wsc->sendMessage(stream_config);
}
