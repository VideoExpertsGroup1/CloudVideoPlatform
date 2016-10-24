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


