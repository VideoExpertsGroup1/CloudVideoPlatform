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

#include "websocketclient.h"
#include <QtCore/QDebug>
#include <QtWebSockets/QWebSocket>
#include <QCoreApplication>
#include <iostream>
#include <QSslConfiguration>
#include <QUuid>
#include "cmd_handlers/create_cmd_handlers.h"
#include "process.h"

WebSocketClient::WebSocketClient(CloudStreamerSettings *pSettings, QObject *parent) :
    QObject(parent) 
{
	m_pSettings = pSettings;
	create_cmd_handlers(m_mapCmdHandlers);
	m_pProcess = new Process();

	m_sProtocol = "ws";
	m_sHost = m_pSettings->servercm_host();
	m_nPort = m_pSettings->servercm_ws_port();
	m_pSettings->servercm_needreconnect(false);
	
	QUrl url = makeURL();
	
	m_nMessageID = 0;
	m_pWebSocket = new QWebSocket("", QWebSocketProtocol::Version13);
	m_pConf = new QSslConfiguration();
	m_pConf->setPeerVerifyMode(QSslSocket::VerifyNone);
	m_pWebSocket->setSslConfiguration(*m_pConf);
	
	qDebug() << "WebSocket open url: " << url.toString();
	qDebug() << url.host();

	connect(m_pWebSocket, SIGNAL(connected()), this, SLOT(onWebSocketConnected()));
    connect(m_pWebSocket, &QWebSocket::disconnected, this, &WebSocketClient::onWebSocketDisconnect);
	connect(m_pWebSocket,SIGNAL(error(QAbstractSocket::SocketError)),this,SLOT(onWebSocketError(QAbstractSocket::SocketError)));
	connect(m_pWebSocket,SIGNAL(stateChanged(QAbstractSocket::SocketState)),this,SLOT(onWebSocketStateChanged(QAbstractSocket::SocketState)));
	connect(m_pWebSocket, SIGNAL(textMessageReceived(QString)),this, SLOT(onWebSocketTextMessageReceived(QString)));
	
	qDebug() << "WebSocket opening...";
    m_pWebSocket->open(QUrl(url));
	qDebug() << "... " << m_pWebSocket->requestUrl().toString();

    // connect(&m_webSocket, &QWebSocket::connected, this, &SslEchoClient::onConnected);
    /*typedef void (QWebSocket:: *sslErrorsSignal)(const QList<QSslError> &);
    connect(&m_webSocket, static_cast<sslErrorsSignal>(&QWebSocket::sslErrors),
            this, &SslEchoClient::onSslErrors);*/
    
    // connect(&m_webSocket, &QWebSocket::connected, this, &WebSocketClient::onConnected);
    // connect(&m_webSocket, &QWebSocket::disconnected, this, &WebSocketClient::closed);

    // m_webSocket.open(QUrl(url));
    
}

// ---------------------------------------------------------------------

QUrl WebSocketClient::makeURL(){
	
	QString suffix = "";
	if(m_pSettings->cm_isRegistered()){
		suffix  = "/ctl/" + m_pSettings->cm_connid() + "/";
	}else{
		suffix  = "/ctl/NEW/" + m_pSettings->accp_reg_token() + "/";
	}

	QUrl url;
	if(m_pSettings->servercm_needreconnect()){
		url = QUrl(m_sProtocol + "://" + m_pSettings->servercm_reconnection_host() + ":" + QString::number(m_nPort) + suffix);
	}else{
		url = QUrl(m_sProtocol + "://" + m_sHost + ":" + QString::number(m_nPort) + suffix);
	}
	return url;
}

// ---------------------------------------------------------------------

void WebSocketClient::onWebSocketDisconnect()
{
    qDebug() << "WebSocket onDisconnect";

	if(m_pSettings->servercm_needreconnect()){
		QUrl url = makeURL();
		qDebug() << "WebSocket reconnect to url: " << url.toString();
		m_pSettings->servercm_needreconnect(false);
		m_pWebSocket->open(url);
	}
}

// ---------------------------------------------------------------------

QJsonObject WebSocketClient::makeCommandDone(QString orig_cmd, int refid, QString status){
	QJsonObject obj = makeCommand("done");
	obj["orig_cmd"] = orig_cmd;
	obj["refid"] = refid;
	obj["status"] = status;
	return obj;
}

// ---------------------------------------------------------------------

QJsonObject WebSocketClient::makeCommand(QString cmd){
	m_nMessageID++;
	QJsonObject jsonData;
	jsonData["cmd"] = QJsonValue(cmd);
	jsonData["msgid"] = QJsonValue(m_nMessageID);
	return jsonData;
}

// ---------------------------------------------------------------------

void WebSocketClient::sendMessage(QJsonObject obj){
	QJsonDocument doc(obj);
	QString message = doc.toJson(QJsonDocument::Compact);
	qDebug() << QDateTime::currentDateTimeUtc().toString() << " [WS] >>> " << message;
	m_pWebSocket->sendTextMessage(message);
}

// ---------------------------------------------------------------------

CloudStreamerSettings *WebSocketClient::settings(){
	return m_pSettings;
}

// ---------------------------------------------------------------------

void WebSocketClient::onWebSocketConnected()
{
    qDebug() << "WebSocket connected";
    QJsonObject jsonData = makeCommand("register");
	jsonData["pwd"] = "";
	if(m_pSettings->cm_isRegistered()){
		jsonData["prev_sid"] = m_pSettings->servercm_sid();
		jsonData["pwd"] = m_pSettings->cm_pwd();
	}else{
		jsonData["reg_token"] = m_pSettings->accp_reg_token();
	}
	jsonData["ver"] = m_pSettings->cm_version();
	jsonData["tz"] = m_pSettings->cm_timezone();
	jsonData["vendor"] = m_pSettings->cm_vendor();
	sendMessage(jsonData);
}

// ---------------------------------------------------------------------

void WebSocketClient::onWebSocketStateChanged(QAbstractSocket::SocketState state){
	qDebug() << "onStateChanged:" << state;
}

// ---------------------------------------------------------------------

IProcess *WebSocketClient::process(){
	return m_pProcess;
}

// ---------------------------------------------------------------------

void WebSocketClient::onWebSocketTextMessageReceived(QString message)
{
	qDebug() << QDateTime::currentDateTimeUtc().toString() << " [WS] <<< " << message;

	QJsonDocument doc = QJsonDocument::fromJson(message.toUtf8());
	QJsonObject jsonData = doc.object();
	
	if(jsonData.contains("cmd")){
		QString cmd = jsonData["cmd"].toString();
		if(m_mapCmdHandlers.contains(cmd)){
			m_mapCmdHandlers[cmd]->handle(jsonData, this);
		}else{
			qDebug() << "Unknown command: " << cmd;
		}
		// TODO: get_stream_caps
		// "{"video_es": ["Vid"], "msgid": 13, "cmd": "get_stream_caps", "audio_es": ["Aud"], "cam_id": 3862}"
		// TODO: stream_start
		// "{"msgid": 14, "reason": "live", "cmd": "stream_start", "stream_id": "Main", "cam_id": 3862}"
	}
}

// ---------------------------------------------------------------------

void WebSocketClient::onWebSocketError(QAbstractSocket::SocketError error){

	qDebug() << "State: " << m_pWebSocket->state();
	qDebug() << "Error: " << error;
	qDebug() << "Origin: " << m_pWebSocket->origin();
	qDebug() << "closeCode: " << m_pWebSocket->closeCode();
	qDebug() << "closeReason: " << m_pWebSocket->closeReason();
	qDebug() << "version: " << m_pWebSocket->version();
	// qDebug() << "connected: " << m_pWebSocket->connected();
	
	// m_pWebSocket->sendTextMessage("hello");
	
	switch(error){
		case QAbstractSocket::ConnectionRefusedError:
			qDebug() << "[ERROR] WebSocket: The connection was refused by the peer (or timed out)";
			break;
		case QAbstractSocket::RemoteHostClosedError:
			qDebug() << "[ERROR] WebSocket: The remote host closed the connection. Note that the client socket (i.e., this socket) will be closed after the remote close notification has been sent.";
			break;
		case QAbstractSocket::HostNotFoundError:
			qDebug() << "[ERROR] WebSocket: The host address was not found.";
			break;
		case QAbstractSocket::SocketAccessError:
			qDebug() << "[ERROR] WebSocket: The socket operation failed because the application lacked the required privileges.";
			break;
		case QAbstractSocket::SocketResourceError:
			qDebug() << "[ERROR] WebSocket: The local system ran out of resources (e.g., too many sockets).";
			break;
		case QAbstractSocket::SocketTimeoutError:
			qDebug() << "[ERROR] WebSocket: The socket operation timed out.";
			break;
		case QAbstractSocket::DatagramTooLargeError:
			qDebug() << "[ERROR] WebSocket: The datagram was larger than the operating system's limit (which can be as low as 8192 bytes).";
			break;
		case QAbstractSocket::NetworkError:
			qDebug() << "[ERROR] WebSocket: An error occurred with the network (e.g., the network cable was accidentally plugged out).";
			break;
		case QAbstractSocket::AddressInUseError:
			qDebug() << "[ERROR] WebSocket: The address specified to QAbstractSocket::bind() is already in use and was set to be exclusive.";
			break;
		case QAbstractSocket::SocketAddressNotAvailableError:
			qDebug() << "[ERROR] WebSocket: The address specified to QAbstractSocket::bind() does not belong to the host.";
			break;
		case QAbstractSocket::UnsupportedSocketOperationError:
			qDebug() << "[ERROR] WebSocket: The requested socket operation is not supported by the local operating system (e.g., lack of IPv6 support).";
			break;
		case QAbstractSocket::ProxyAuthenticationRequiredError:
			qDebug() << "[ERROR] WebSocket: The socket is using a proxy, and the proxy requires authentication.";
			break;
		case QAbstractSocket::SslHandshakeFailedError:
			qDebug() << "[ERROR] WebSocket: The SSL/TLS handshake failed, so the connection was closed (only used in QSslSocket)";
			break;
		case QAbstractSocket::UnfinishedSocketOperationError:
			qDebug() << "[ERROR] WebSocket: Used by QAbstractSocketEngine only, The last operation attempted has not finished yet (still in progress in the background).";
			break;
		case QAbstractSocket::ProxyConnectionRefusedError:
			qDebug() << "[ERROR] WebSocket: Could not contact the proxy server because the connection to that server was denied";
			break;
		case QAbstractSocket::ProxyConnectionClosedError:
			qDebug() << "[ERROR] WebSocket: The connection to the proxy server was closed unexpectedly (before the connection to the final peer was established)";
			break;
		case QAbstractSocket::ProxyConnectionTimeoutError:
			qDebug() << "[ERROR] WebSocket: The connection to the proxy server timed out or the proxy server stopped responding in the authentication phase.";
			break;
		case QAbstractSocket::ProxyNotFoundError:
			qDebug() << "[ERROR] WebSocket: The proxy address set with setProxy() (or the application proxy) was not found.";
			break;
		case QAbstractSocket::ProxyProtocolError:
			qDebug() << "[ERROR] WebSocket: The connection negotiation with the proxy server failed, because the response from the proxy server could not be understood.";
			break;
		case QAbstractSocket::OperationError:
			qDebug() << "[ERROR] WebSocket: An operation was attempted while the socket was in a state that did not permit it.";
			break;
		case QAbstractSocket::SslInternalError:
			qDebug() << "[ERROR] WebSocket: The SSL library being used reported an internal error. This is probably the result of a bad installation or misconfiguration of the library.";
			break;
		case QAbstractSocket::SslInvalidUserDataError:
			qDebug() << "[ERROR] WebSocket: Invalid data (certificate, key, cypher, etc.) was provided and its use resulted in an error in the SSL library.";
			break;
		case QAbstractSocket::TemporaryError:
			qDebug() << "[ERROR] WebSocket: A temporary error occurred (e.g., operation would block and socket is non-blocking).";
			break;
		case QAbstractSocket::UnknownSocketError:
			qDebug() << "[ERROR] WebSocket: An unidentified error occurred.";
			break;
		default:
			qDebug() << "[ERROR] WebSocket: Unknown error";
	}
}

/*void WebSocketClient::onSslErrors(const QList<QSslError> &errors)
{
    Q_UNUSED(errors);
	
	qDebug() << "Some errors";

    // WARNING: Never ignore SSL errors in production code.
    // The proper way to handle self-signed certificates is to add a custom root
    // to the CA store.

    m_webSocket.ignoreSslErrors();
}*/



