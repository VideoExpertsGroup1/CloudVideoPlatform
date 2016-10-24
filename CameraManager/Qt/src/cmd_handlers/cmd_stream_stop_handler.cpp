#include "cmd_stream_stop_handler.h"
#include "../mediaserverinfo.h"
#include <QDateTime>
#include <QFile>
#include <QNetworkAccessManager>
#include <QNetworkRequest>
#include <QByteArray>
#include <QHttpMultiPart>
#include <QEventLoop>
#include <QProcess>

QString CmdStreamStopHandler::cmd(){
	return "stream_stop";
}

void CmdStreamStopHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	
	int counter = wsc->settings()->stream_counter();
	if(counter <= 0){
		wsc->settings()->stream_counter(0);
		if(wsc->process()->isStarted()){
			wsc->process()->stop();
		}
	}else{
		wsc->settings()->stream_counter(counter-1);
	}
	wsc->sendMessage(wsc->makeCommandDone(cmd(), obj["msgid"].toInt(), "OK"));
}
