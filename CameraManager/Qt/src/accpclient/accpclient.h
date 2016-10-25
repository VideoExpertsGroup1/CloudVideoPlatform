//
//  Copyright © 2016 VXG Inc. All rights reserved.
//  Contact: https://www.videoexpertsgroup.com/contact-vxg/
//  This file is part of the demonstration of the VXG Cloud Platform.
//
//  Commercial License Usage
//  Licensees holding valid commercial VXG licenses may use this file in
//  accordance with the commercial license agreement provided with the
//  Software or, alternatively, in accordance with the terms contained in
//  a written agreement between you and VXG Inc. For further information
//  use the contact form at https://www.videoexpertsgroup.com/contact-vxg/
//

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
