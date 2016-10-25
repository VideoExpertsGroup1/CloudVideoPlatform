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

#include "cmd_stream_start_handler.h"
#include "../mediaserverinfo.h"
#include <QDateTime>
#include <QFile>
#include <QNetworkAccessManager>
#include <QNetworkRequest>
#include <QByteArray>
#include <QHttpMultiPart>
#include <QEventLoop>
#include <QProcess>

QString CmdStreamStartHandler::cmd(){
	return "stream_start";
}

void CmdStreamStartHandler::handle(QJsonObject obj, IWebSocketClient *wsc){

	// ; rtmp://54.173.34.172:1935/live/u1976m5453c5424_primary?sid=oCJ4s05MhUbG
	QString stream_url = "rtmp://" + wsc->settings()->servercm_media_server() + "/" + wsc->settings()->camera_media_url() + "Main";
	stream_url += "?sid=" + wsc->settings()->servercm_sid();
	
	QString video_stream_command = wsc->settings()->streams_video_stream_command();
	video_stream_command.replace(QString("%RTMPURL%"), stream_url);
	if(!wsc->process()->isStarted()){
		wsc->settings()->stream_counter(1); // set count
		qDebug() << "[WS] video_stream_command: " << video_stream_command;
		wsc->process()->start(video_stream_command);
	}else{
		int counter = wsc->settings()->stream_counter();
		qDebug() << "[WS] video_stream_command (already started): " << video_stream_command;
		wsc->settings()->stream_counter(counter + 1);
	}
	wsc->sendMessage(wsc->makeCommandDone(cmd(), obj["msgid"].toInt(), "OK"));
}
