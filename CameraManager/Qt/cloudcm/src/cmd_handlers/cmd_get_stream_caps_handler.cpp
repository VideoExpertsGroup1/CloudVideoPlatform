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

#include "cmd_get_stream_caps_handler.h"

QString CmdGetStreamCapsHandler::cmd(){
	return "get_stream_caps";
}

void CmdGetStreamCapsHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	
	QJsonObject stream_caps = wsc->makeCommand("stream_caps");
	stream_caps["refid"] = obj["msgid"].toInt();
	stream_caps["cam_id"] = wsc->settings()->camera_id();
	
	QJsonArray caps_video;
	{
		QJsonObject video1;
		QJsonArray streams;
		streams.append("Vid");
		video1["streams"] = streams;
		
		QJsonArray formats;
		formats.append("H.264");
		video1["formats"] = formats;
		
		QJsonArray resolutions;
		QJsonArray resolutions_352x240;
		resolutions_352x240.append(352);
		resolutions_352x240.append(240);
		resolutions.append(resolutions_352x240);
		QJsonArray resolutions_720x480;
		resolutions_720x480.append(720);
		resolutions_720x480.append(240);
		resolutions.append(resolutions_720x480);
		QJsonArray resolutions_1280x720;
		resolutions_1280x720.append(1280);
		resolutions_1280x720.append(720);
		resolutions.append(resolutions_1280x720);
		QJsonArray resolutions_1920x1080;
		resolutions_1920x1080.append(1920);
		resolutions_1920x1080.append(1080);
		resolutions.append(resolutions_1920x1080);
		video1["resolutions"] = resolutions;
		
		QJsonArray fps;
		fps.append(6.0);
		fps.append(8.0);
		fps.append(10.0);
		fps.append(15.0);
		fps.append(20.0);
		fps.append(25.0);
		fps.append(30.0);
		video1["fps"] = fps;
		
		QJsonArray gop;
		gop.append(1); // min
		gop.append(255); // max
		gop.append(1); // step
		video1["gop"] = gop;
		
		QJsonArray brt;
		brt.append(512); // min
		brt.append(2048); // max
		brt.append(128); // step
		video1["brt"] = brt;
		
		QJsonArray quality;
		quality.append(-4); // min
		quality.append(4); // max
		video1["quality"] = quality;
		
		video1["vbr"] = true; // VBR is supported
		caps_video.append(video1);
	}
	
	stream_caps["caps_video"] = caps_video;

	QJsonArray caps_audio;
	{
		QJsonObject video1;
		QJsonArray streams;
		streams.append("Aud");
		video1["streams"] = streams;
		
		QJsonArray formats;
		formats.append("AAC");
		video1["formats"] = formats;

		QJsonArray brt;
		brt.append(64); // min
		brt.append(128); // max
		brt.append(64); // step
		video1["brt"] = brt;

		QJsonArray srt;
		srt.append(32.0);
		srt.append(44.1);
		srt.append(48.0);
		video1["srt"] = srt;
		caps_audio.append(video1);
	}
	
	stream_caps["caps_audio"] = caps_audio;
	wsc->sendMessage(stream_caps);
}
