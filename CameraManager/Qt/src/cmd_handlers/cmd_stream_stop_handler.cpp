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
	if(wsc->process()->isStarted()){
		wsc->process()->stop();
	}
	wsc->sendMessage(wsc->makeCommandDone(cmd(), obj["msgid"].toInt(), "OK"));
}
