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

#ifndef CLOUDSTREAMER_CMD_HANDLERS_CREATE_CMD_HANDLERS_H
#define CLOUDSTREAMER_CMD_HANDLERS_CREATE_CMD_HANDLERS_H

#include "../interfaces/icmdhandler.h"
#include <QString>
#include <QMap>

void create_cmd_handlers(QMap<QString, ICmdHandler *> &pHandlers);

#endif // CLOUDSTREAMER_CMD_HANDLERS_CREATE_CMD_HANDLERS_H
