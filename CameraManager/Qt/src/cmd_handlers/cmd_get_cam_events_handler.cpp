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

#include "cmd_get_cam_events_handler.h"
#include "../memorycardstatus.h"
#include <QDateTime>

QString CmdGetCamEventsHandler::cmd(){
	return "get_cam_events";
}

void CmdGetCamEventsHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	QJsonObject cam_events_conf = wsc->makeCommand("cam_events_conf");
	cam_events_conf["refid"] = obj["msgid"].toInt();
	cam_events_conf["cam_id"] = wsc->settings()->camera_id();
	cam_events_conf["enabled"] = wsc->settings()->camevents_enabled();
	
	// events
	QJsonArray events;
	if(wsc->settings()->camevents_enabled() && wsc->settings()->camevents_memorycard_active()){
		QJsonObject events_memorycard;
		events_memorycard["event"] = "memorycard";
		events_memorycard["active"] = wsc->settings()->camevents_memorycard_active();
		events_memorycard["stream"] = false;
		events_memorycard["snapshot"] = false;
		QJsonObject caps;
		caps["stream"] = false;
		caps["snapshot"] = false;
		events_memorycard["caps"] = caps;
		events.append(events_memorycard);
	}
	cam_events_conf["events"] = events;
	wsc->sendMessage(cam_events_conf);

	if(wsc->settings()->camevents_enabled() && wsc->settings()->camevents_memorycard_active()){
		// init memory card example
		QJsonObject cam_event = wsc->makeCommand("cam_event");
		cam_event["cam_id"] = wsc->settings()->camera_id();
		cam_event["event"] = "memorycard";
		cam_event["time"] = QJsonValue(qint64(QDateTime::currentDateTimeUtc().toTime_t()));
		QJsonObject memorycard_info;
		memorycard_info["status"] = MemoryCardStatus::normal();
		memorycard_info["size"] = 10; // in MB
		memorycard_info["free"] = 2; // in MB
		cam_event["memorycard_info"] = memorycard_info;
		wsc->sendMessage(cam_event);
	}
}
