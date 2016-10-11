#ifndef CLOUDSTREAMER_CMD_HANDLERS_CREATE_CMD_HANDLERS_H
#define CLOUDSTREAMER_CMD_HANDLERS_CREATE_CMD_HANDLERS_H

#include "../interfaces/icmdhandler.h"
#include <QString>
#include <QMap>

void create_cmd_handlers(QMap<QString, ICmdHandler *> &pHandlers);

#endif // CLOUDSTREAMER_CMD_HANDLERS_CREATE_CMD_HANDLERS_H
