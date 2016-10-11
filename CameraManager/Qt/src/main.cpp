#include <QtCore/QCoreApplication>
#include "websocketclient.h"
#include "cloudstreamersettings.h"
#include "accpclient/accpclient.h"
#include <iostream>

int main(int argc, char *argv[])
{
    QCoreApplication a(argc, argv);
    CloudStreamerSettings *pSettings = new CloudStreamerSettings("vxgcloudcamera.ini", "vxgcloudcamera.session.ini");

	AccpClient accp(pSettings);
	accp.login(pSettings->accp_username(), pSettings->accp_password());

	accp.reg_tokens();
	QString sRegToken = accp.create_reg_token();

	if(sRegToken == ""){
		qDebug() << "Could not create reg token";
		return 0;
	}
	
	pSettings->accp_reg_token(sRegToken);
	WebSocketClient client(pSettings);
	
    // QObject::connect(&client, &WebSocketClient::closed, &a, &QCoreApplication::quit);

    return a.exec();
}
