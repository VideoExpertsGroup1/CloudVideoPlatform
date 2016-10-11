#include "cmd_get_stream_by_event_handler.h"

QString CmdGetStreamByEventHandler::cmd(){
	return "get_stream_by_event";
}

void CmdGetStreamByEventHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	// TODO
}
