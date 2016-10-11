#ifndef MEMORYCARDSTATUS_H
#define MEMORYCARDSTATUS_H
#include <QString>

class MemoryCardStatus
{
	public:
	
		static QString none();
		static QString normal();
		static QString need_format();
		static QString formatting();
		static QString initialization();
	
	private:
	
};

#endif // MEMORYCARDSTATUS_H
