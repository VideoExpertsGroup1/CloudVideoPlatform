#ifndef SSLECHOCLIENT_H
#define SSLECHOCLIENT_H

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
#include "interfaces/icmdhandler.h"
#include "interfaces/iprocess.h"

class WebSocketClient : public QObject, IWebSocketClient
{
    Q_OBJECT
public:
    explicit WebSocketClient(CloudStreamerSettings *pSettings, QObject *parent = Q_NULLPTR);
	
private slots:
	void onWebSocketDisconnect();
    void onWebSocketConnected();
    void onWebSocketTextMessageReceived(QString message);
	void onWebSocketError(QAbstractSocket::SocketError error);
	void onWebSocketStateChanged(QAbstractSocket::SocketState state);
	
    // void onSslErrors(const QList<QSslError> &errors);
    virtual QJsonObject makeCommandDone(QString orig_cmd, int refid, QString status);
	virtual QJsonObject makeCommand(QString cmd);
	virtual void sendMessage(QJsonObject obj);
	virtual CloudStreamerSettings *settings();
	virtual IProcess *process();
		
private:
	QUrl makeURL();
	
	QSslConfiguration *m_pConf;
    QWebSocket *m_pWebSocket;
    int m_nMessageID;
    QString m_sProtocol;
	QString m_sHost;
	int m_nPort;
	QMap<QString, ICmdHandler *> m_mapCmdHandlers;
	CloudStreamerSettings *m_pSettings;
	IProcess *m_pProcess;
};

#endif // SSLECHOCLIENT_H
