#ifndef ACCPCLIENT_H
#define ACCPCLIENT_H

#include <QtCore/QObject>
#include <QtNetwork/QSslError>
#include <QtNetwork/QAbstractSocket>
#include <QtCore/QList>
#include <QtCore/QString>
#include <QtCore/QUrl>
#include <QtCore/QObject>
#include <QNetworkAccessManager>
#include "../cloudstreamersettings.h"

class AccpClient : public QObject
{
    Q_OBJECT
public:
    explicit AccpClient(CloudStreamerSettings *pSettings, QObject *parent = Q_NULLPTR);
	void login(QString username, QString password);
	void reg_tokens();
	QString create_reg_token();

private:
	QNetworkAccessManager *m_pManager;
	CloudStreamerSettings *m_pSettings;	
};

#endif // ACCPCLIENT_H
