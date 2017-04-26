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

#include "cmd_set_cam_events_handler.h"

QString CmdSetCamEventsHandler::cmd(){
	return "set_cam_events";
}

void CmdSetCamEventsHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	int nCamid = 0;
	
	if(obj.contains("enabled")){
		wsc->settings()->camevents_enabled(obj["server"].toBool());
	}
	
	if(obj.contains("cam_id")){
		nCamid = obj["cam_id"].toInt();
	}
	
	if(obj.contains("events")){
		QJsonArray events = obj["events"].toArray();
		for(int i = 0; i < events.size(); i++){
			QJsonObject event = events.at(i).toObject();
			QString eventName = event.contains("event") ? event["event"].toString() : "";
			bool bActive = event.contains("active") ? event["active"].toBool() : false;
			bool bStream = event.contains("stream") ? event["stream"].toBool() : false;
			bool bSnapshot = event.contains("stream") ? event["snapshot"].toBool() : false;
			
			// TODO implementation for other event
			if(eventName == "memorycard"){
				wsc->settings()->camevents_memorycard_active(bActive);
			}
		}
	}

	wsc->sendMessage(wsc->makeCommandDone(cmd(), obj["msgid"].toInt(), "OK"));	
}


