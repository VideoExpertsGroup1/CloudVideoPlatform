#-*- coding: utf-8 -*-
"""
Async commands sending routine with queue
"""

import json
import threading
from Queue import Queue
from websocket import WebSocketConnectionClosedException, ABNF
from utils import error_str, get_logger

logger = get_logger()

# Ping frame content
PING_DATA = json.dumps({'src': 'cm'})


class CommandQueue(threading.Thread):
    """
    infinity loop, it receives commands from queue
    and sent via websocket
    """
    STOP_SIGNAL = 'stop_please'

    def __init__(self, cmgr):
        self.cmgr = cmgr
        threading.Thread.__init__(self)
        self._queue = Queue()    # Reset queue

    def stop(self):
        self.put_command(self.STOP_SIGNAL)

    def run(self):
        logger.debug("start CommandQueue thread")

        while True:
            cd = self._queue.get(True)
            if cd == self.STOP_SIGNAL:
                break

            self._send(cd)

        logger.debug("CommandQueue finished")

    def _send(self, data):
        try:
            ws = self.cmgr.ws
            if not ws or self.cmgr.conn_state < self.cmgr.CONN_OPENED:
                logger.warning('Not connected')
                return False

            # _ping uses empty message, don't parse or log it
            if data:
                command = json.dumps(data)
                if len(command) < 1000:
                    logger.debug('[ws] => %s', command)
                else:
                    logger.debug('[ws] => %s is too big to display(%s)', data.get('cmd', 'not_set'), len(command))
                ws.send(command)
            else:
                ws.send(PING_DATA, ABNF.OPCODE_PING)

            self.cmgr.stat.set_tm("command")    # update alive dialog flag
            return True

        except WebSocketConnectionClosedException:
            logger.warning('Connection is closed')
        except:
            logger.error('Send %s error %s', str(data), error_str())

        return False

    def put_command(self, command_dict):
        self._queue.put(command_dict)
        return True
