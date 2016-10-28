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
