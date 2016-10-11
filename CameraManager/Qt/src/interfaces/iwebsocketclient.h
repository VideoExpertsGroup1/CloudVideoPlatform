#ifndef CLOUDSTREAMER_INTERFACES_IWEBSOCKETCLIENT_H
#define CLOUDSTREAMER_INTERFACES_IWEBSOCKETCLIENT_H

#include <QtCore/QObject>
#include <QtWebSockets/QWebSocket>
#include <QtNetwork/QSslError>
#include <QtNetwork/QAbstractSocket>
#include <QtCore/QList>
#include <QtCore/QString>
#include <QtCore/QUrl>
#include <QtCore/QObject>
#include <QtWebSockets/QWebSocket>
#include <QJsonObject>
#include <QJsonDocument>
#include <QJsonArray>
#include <QJsonParseError>
#include "icmdhandler.h"
#include "iprocess.h"
#include "../cloudstreamersettings.h"

class IWebSocketClient
{
	public:
		virtual QJsonObject makeCommand(QString cmd) = 0;
		virtual QJsonObject makeCommandDone(QString orig_cmd, int refid, QString status) = 0;
		virtual void sendMessage(QJsonObject obj) = 0;
		// virtual void sendEvent_memorycard(QJsonObject obj) = 0;
		
		virtual CloudStreamerSettings *settings() = 0;
		virtual IProcess *process() = 0;
};

#endif // CLOUDSTREAMER_INTERFACES_IWEBSOCKETCLIENT_H
