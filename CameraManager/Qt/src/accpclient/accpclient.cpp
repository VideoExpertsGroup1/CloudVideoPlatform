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

#include "accpclient.h"
#include <QtCore/QDebug>
#include <QCoreApplication>
#include <iostream>
#include <QSslConfiguration>
#include <QNetworkReply>
#include <QJsonObject>
#include <QJsonDocument>
#include <QJsonArray>
#include <QJsonParseError>

AccpClient::AccpClient(CloudStreamerSettings *pSettings, QObject *parent) :
    QObject(parent) 
{
	m_pSettings = pSettings;
	m_pManager = new QNetworkAccessManager();
}

// --------------------------------------------------------------------

void AccpClient::login(QString username, QString password){
	qDebug() << "[AccpClient::login]";
	QUrl myURL(QString(m_pSettings->accp_base_url_login()));
	QNetworkRequest request(myURL);
	request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

	QJsonObject jsonData;
	jsonData["username"] = username;
	jsonData["password"] = password;
	
	QJsonDocument doc(jsonData);
	QNetworkReply *reply = m_pManager->post(request, doc.toJson(QJsonDocument::Compact));

	QEventLoop eventLoop;
	QObject::connect(m_pManager, SIGNAL(finished(QNetworkReply*)), &eventLoop, SLOT(quit()));
	eventLoop.exec();
	QString responseData = reply->readAll();
}

// --------------------------------------------------------------------

void AccpClient::reg_tokens(){
	qDebug() << "[AccpClient::reg_tokens start]";
	QUrl myURL(m_pSettings->accp_base_url_reg_tokens());
	QNetworkRequest request(myURL);
	request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

	QNetworkReply *reply = m_pManager->get(request);

	QEventLoop eventLoop;
	QObject::connect(m_pManager, SIGNAL(finished(QNetworkReply*)), &eventLoop, SLOT(quit()));
	eventLoop.exec();
	QString responseData = reply->readAll();
	// qDebug() << "Success" << responseData;

	QJsonDocument doc2 = QJsonDocument::fromJson(responseData.toUtf8());
	QJsonObject responseJsonData = doc2.object();
	QJsonArray objs = responseJsonData["objects"].toArray();
	for(int i = 0; i < objs.size(); i++){
		QJsonObject token = objs[i].toObject();
		qDebug() << "token [" << token["token"].toString() << "] " << token["status"].toString() << " (expire:" << token["expire"].toString() << ")";
	}
	qDebug() << "[AccpClient::reg_tokens finish]";
}

// --------------------------------------------------------------------

QString AccpClient::create_reg_token(){
	qDebug() << "[AccpClient::create_reg_token]";
	QUrl myURL(m_pSettings->accp_base_url_reg_tokens());
	QNetworkRequest request(myURL);
	request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

	QJsonObject jsonData;
	// jsonData["uuid"] = "664ac529-29bf-4c5e-a7f0-50fedb1148c5";
	// jsonData["username"] = username;
	// jsonData["password"] = password;
	
	QJsonDocument doc(jsonData);
	QNetworkReply *reply = m_pManager->post(request, doc.toJson(QJsonDocument::Compact));

	QEventLoop eventLoop;
	QObject::connect(m_pManager, SIGNAL(finished(QNetworkReply*)), &eventLoop, SLOT(quit()));
	eventLoop.exec();
	QString responseData = reply->readAll();
	qDebug() << "Success" << responseData;

	QVariant statusCode = reply->attribute( QNetworkRequest::HttpStatusCodeAttribute );
	if (statusCode.isValid()){
		int status = statusCode.toInt();
		qDebug() << "[AccpClient::create_reg_token] Status: " << status;
		if ( status != 201 ) {
			QString reason = reply->attribute( QNetworkRequest::HttpReasonPhraseAttribute ).toString();
			qDebug() << "[AccpClient::create_reg_token] FAIL Reason: " << reason;
			qDebug() << "Response data: " << responseData;
			return "";
		}
	}else{
		qDebug() << "[AccpClient::create_reg_token] FAIL status code is invalid";
		qDebug() << "Response data: " << responseData;
		return "";
	}

	QJsonDocument doc2 = QJsonDocument::fromJson(responseData.toUtf8());
	QJsonObject token = doc2.object();

	
	qDebug() << "token " << token["token"].toString() << " ; expire: " << token["expire"].toString() << " ; status: " << token["status"].toString();

	return token["token"].toString();
}
