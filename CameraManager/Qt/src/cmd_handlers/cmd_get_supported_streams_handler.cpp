#include "cmd_get_supported_streams_handler.h"

QString CmdGetSupportedStreamsHandler::cmd(){
	return "get_supported_streams";
}

void CmdGetSupportedStreamsHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	
	QJsonObject supported_streams = wsc->makeCommand("supported_streams");
	supported_streams["refid"] = obj["msgid"].toInt();
	supported_streams["cam_id"] = wsc->settings()->camera_id();
	
	QJsonArray audio_es;
	audio_es.append("Aud");
	supported_streams["audio_es"] = wsc->settings()->camera_brand();
	
	QJsonArray video_es;
	video_es.append("Aud");
	supported_streams["video_es"] = video_es;
	
	QJsonArray streams;
	QJsonObject main_stream;
	main_stream["id"] = "Main";
	main_stream["video"] = "Vid";
	main_stream["audio"] = "Aud";
	streams.append(main_stream);
	
	supported_streams["streams"] = streams;
	wsc->sendMessage(supported_streams);
}
