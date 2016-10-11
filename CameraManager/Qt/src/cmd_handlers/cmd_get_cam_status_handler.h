#ifndef CLOUDSTREAMER_CMD_HANDLERS_CMD_GET_CAM_STATUS_HANDLER_H
#define CLOUDSTREAMER_CMD_HANDLERS_CMD_GET_CAM_STATUS_HANDLER_H

#include "../interfaces/icmdhandler.h"
#include "../interfaces/iwebsocketclient.h"

#include <QString>
#include <QVariant>

class CmdGetCamStatusHandler : public ICmdHandler {
	
	public:
		virtual QString cmd();
		virtual void handle(QJsonObject obj, IWebSocketClient *wsc);
};

#endif // CLOUDSTREAMER_CMD_HANDLERS_CMD_GET_CAM_STATUS_HANDLER_H
