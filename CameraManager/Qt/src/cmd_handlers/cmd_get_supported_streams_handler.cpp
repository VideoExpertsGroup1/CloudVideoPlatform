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

#include "cmd_get_supported_streams_handler.h"

QString CmdGetSupportedStreamsHandler::cmd(){
	return "get_supported_streams";
}

void CmdGetSupportedStreamsHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	
	QJsonObject supported_streams = wsc->makeCommand("supported_streams");
	supported_streams["refid"] = obj["msgid"].toInt();
	supported_streams["cam_id"] = wsc->settings()->camera_id();
	
	QJsonArray audio_es;
	audio_es.append("Aud");
	supported_streams["audio_es"] = wsc->settings()->camera_brand();
	
	QJsonArray video_es;
	video_es.append("Aud");
	supported_streams["video_es"] = video_es;
	
	QJsonArray streams;
	QJsonObject main_stream;
	main_stream["id"] = "Main";
	main_stream["video"] = "Vid";
	main_stream["audio"] = "Aud";
	streams.append(main_stream);
	
	supported_streams["streams"] = streams;
	wsc->sendMessage(supported_streams);
}
