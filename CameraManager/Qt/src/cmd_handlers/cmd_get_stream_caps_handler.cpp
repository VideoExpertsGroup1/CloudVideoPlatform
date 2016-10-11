#include "cmd_get_stream_caps_handler.h"

QString CmdGetStreamCapsHandler::cmd(){
	return "get_stream_caps";
}

void CmdGetStreamCapsHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	
	// get_stream_caps
	
	// TODO
	/*QJsonObject supported_streams = wsc->makeCommand("supported_streams");
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
	wsc->sendMessage(supported_streams);*/
}
