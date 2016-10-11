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
	cam_events_conf["enabled"] = true;
	
	// events
	QJsonArray events;
	if(wsc->settings()->eventsconf_memorycard_isenabled()){
		QJsonObject events_memorycard;
		events_memorycard["event"] = "memorycard";
		events_memorycard["active"] = true;
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

	if(wsc->settings()->eventsconf_memorycard_isenabled()){
		// init memory card
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
