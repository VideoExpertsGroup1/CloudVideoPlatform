#include "cmd_get_audio_detection_handler.h"

QString CmdGetAudioDetectionHandler::cmd(){
	return "get_audio_detection";
}

void CmdGetAudioDetectionHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	// TODO
}
