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

#include "cmd_stream_stop_handler.h"
#include "../mediaserverinfo.h"
#include <QDateTime>
#include <QFile>
#include <QNetworkAccessManager>
#include <QNetworkRequest>
#include <QByteArray>
#include <QHttpMultiPart>
#include <QEventLoop>
#include <QProcess>

QString CmdStreamStopHandler::cmd(){
	return "stream_stop";
}

void CmdStreamStopHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	
	int counter = wsc->settings()->stream_counter();
	if(counter <= 0){
		wsc->settings()->stream_counter(0);
		if(wsc->process()->isStarted()){
			wsc->process()->stop();
		}
	}else{
		wsc->settings()->stream_counter(counter-1);
	}
	wsc->sendMessage(wsc->makeCommandDone(cmd(), obj["msgid"].toInt(), "OK"));
}
