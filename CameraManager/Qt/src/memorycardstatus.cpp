#include "memorycardstatus.h"
#include <QtCore/QDebug>

QString MemoryCardStatus::none(){
	return "none";
};

QString MemoryCardStatus::normal(){
	return "normal";
};

QString MemoryCardStatus::need_format(){
	return "need-format";
};

QString MemoryCardStatus::formatting(){
	return "formatting";
};

QString MemoryCardStatus::initialization(){
	return "initialization";
};

