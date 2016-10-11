#include "cmd_backward_stop_handler.h"

QString CmdBackwardStopHandler::cmd(){
	return "backward_stop";
}

void CmdBackwardStopHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	wsc->sendMessage(wsc->makeCommandDone(cmd(), obj["msgid"].toInt(), "OK"));
	// TODO some handle
}
