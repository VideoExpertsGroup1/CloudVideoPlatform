#ifndef PROCESS_H
#define PROCESS_H
#include <QString>
#include <QProcess>
#include "interfaces/iprocess.h"

class Process : public IProcess {
	public:
		Process();
		~Process();
		virtual void start(QString command);
		virtual void stop();
		virtual bool isStarted();

	private:
		QProcess *m_pProcess;
};

#endif // PROCESS_H
