#include "process.h"
#include <QtCore/QDebug>

Process::Process(){
	m_pProcess = new QProcess();
};

Process::~Process(){
	if(this->isStarted()){
		m_pProcess->kill();
	}
};

void Process::start(QString command){
	stop();
	m_pProcess->start(command);
};

void Process::stop(){
	
	if(this->isStarted()){
		m_pProcess->close();
		/*m_pProcess->kill();
		while (!m_pProcess->waitForFinished(500)) {
			qDebug() << "Wait for stop process";
		}*/
	}
};

bool Process::isStarted(){
	return m_pProcess->state() == QProcess::Starting || m_pProcess->state() == QProcess::Running;
};
