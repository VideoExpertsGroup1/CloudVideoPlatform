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
