#ifndef CLOUDSTREAMER_INTERFACES_IPROCESS_H
#define CLOUDSTREAMER_INTERFACES_IPROCESS_H

#include <QString>
#include <QJsonObject>

class IProcess {
	public:
		virtual void start(QString command) = 0;
		virtual void stop() = 0;
		virtual bool isStarted() = 0;
};

#endif // CLOUDSTREAMER_INTERFACES_IPROCESS_H
