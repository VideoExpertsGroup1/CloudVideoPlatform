#ifndef CLOUDSTREAMER_INTERFACES_ICMDHANDLER_H
#define CLOUDSTREAMER_INTERFACES_ICMDHANDLER_H

#include <QString>
#include <QJsonObject>
#include "iwebsocketclient.h"

class ICmdHandler {
	public:
		virtual QString cmd() = 0;
		virtual void handle(QJsonObject obj, IWebSocketClient *wsc) = 0;
};

#endif // CLOUDSTREAMER_INTERFACES_ICMDHANDLER_H
