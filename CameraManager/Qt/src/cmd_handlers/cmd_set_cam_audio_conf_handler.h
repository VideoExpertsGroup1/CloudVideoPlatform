#ifndef VXGCLOUDCAMERA_CMD_SET_CAM_AUDIO_CONF_HANDLER_H
#define VXGCLOUDCAMERA_CMD_SET_CAM_AUDIO_CONF_HANDLER_H

#include "../interfaces/icmdhandler.h"
#include "../interfaces/iwebsocketclient.h"

#include <QString>
#include <QVariant>

class CmdSetCamAudioConfHandler : public ICmdHandler {
	
	public:
		virtual QString cmd();
		virtual void handle(QJsonObject obj, IWebSocketClient *wsc);
};

#endif // VXGCLOUDCAMERA_CMD_SET_CAM_AUDIO_CONF_HANDLER_H
