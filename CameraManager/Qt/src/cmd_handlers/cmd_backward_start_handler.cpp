#include "cmd_backward_start_handler.h"

QString CmdBackwardStartHandler::cmd(){
	return "backward_start";
}

void CmdBackwardStartHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	wsc->sendMessage(wsc->makeCommandDone(cmd(), obj["msgid"].toInt(), "OK"));
	// TODO some handle
}
