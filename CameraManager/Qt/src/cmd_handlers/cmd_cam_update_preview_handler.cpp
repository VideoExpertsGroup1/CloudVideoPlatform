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

#include "cmd_cam_update_preview_handler.h"
#include "../mediaserverinfo.h"
#include <QDateTime>
#include <QFile>
#include <QNetworkAccessManager>
#include <QNetworkRequest>
#include <QByteArray>
#include <QHttpMultiPart>
#include <QEventLoop>
#include <QProcess>

QString CmdCamUpdatePreviewHandler::cmd(){
	return "cam_update_preview";
}

void CmdCamUpdatePreviewHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	// TODO
	if(QFile::exists("preview.jpg"))
		QFile::remove("preview.jpg");

	QString preview_command = wsc->settings()->streams_preview_command();
	preview_command.replace(QString("%PREVIEWJPG%"), QString("preview.jpg"));
	qDebug() << "[WS] create preview: " << preview_command;
	
	QProcess process;
	process.start(preview_command);
	process.waitForFinished(-1);

	QString upload_url = "http://" + wsc->settings()->servercm_upload_url() + "/" + wsc->settings()->camera_media_url();
	upload_url += "?sid=" + wsc->settings()->servercm_sid();
	upload_url += "&cat=" + MediaServerInfo::upload_cat_preview();
	upload_url += "&type=" + MediaServerInfo::upload_ftype_jpg();
	upload_url += "&start=" + QDateTime::currentDateTime().toString("yyyyMMddThhmmss.zzz");
	
	qDebug() << "[WS] upload_url: " << upload_url;
	
	QNetworkRequest request(upload_url);
	request.setHeader(QNetworkRequest::ContentTypeHeader, QVariant("image/jpeg"));
	request.setHeader(QNetworkRequest::ContentDispositionHeader, QVariant("form-data; name=\"preview\"; filename=\"preview.jpg\""));

	QFile *file = new QFile("preview.jpg");
	if (!file->exists()) {
		qDebug() << "[WS] Upload Error. File does not exist: preview.jpg";
		return;
	}
	file->open(QIODevice::ReadOnly);

	QNetworkAccessManager *networkManager = new QNetworkAccessManager();
	QNetworkReply *pReply = networkManager->post(request, file);

	// QEventLoop eventLoop;
	// QObject::connect(pReply, SIGNAL(finished()), &eventLoop, SLOT(quit()));
	// eventLoop.exec();

	wsc->sendMessage(wsc->makeCommandDone(cmd(), obj["msgid"].toInt(), "OK"));
}
