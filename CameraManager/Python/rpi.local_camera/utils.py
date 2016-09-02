#-*- coding: utf-8 -*-
""" 
Support functions
"""

import ctypes
import logging
import os
import os.path
import signal
import time
from base64 import b64encode
from tzlocal import get_localzone
import sys
import traceback
from datetime import datetime


g_logger = None
def get_logger():
    global g_logger
    if g_logger is not None:
        return g_logger
    logger = logging.getLogger("skyvr")
    logger.setLevel(logging.DEBUG)
    logger.propagate = False
    ch = logging.StreamHandler()
    ch.setFormatter(
        logging.Formatter('%(asctime)s %(levelname)s %(module)s:%(lineno)d %(message)s',
                          '%y%m%d-%H%M%S'))
    logger.addHandler(ch)

    g_logger = logger
    return g_logger

logger = get_logger()

if os.name == 'posix':
    class _timespec(ctypes.Structure):
        _fields_ = [
            ('tv_sec', ctypes.c_long),
            ('tv_nsec', ctypes.c_long)
        ]
    _librt = ctypes.CDLL('librt.so.1', use_errno=False)
    _clock_gettime = _librt.clock_gettime
    _clock_gettime.argtypes = [ctypes.c_int, ctypes.POINTER(_timespec)]
    _monotonic_clock_id = 4  # CLOCK_MONOTONIC_RAW
    def uptime():
        t = _timespec()
        if _clock_gettime(_monotonic_clock_id, ctypes.pointer(t)) != 0:
            errno_ = ctypes.get_errno()
            raise OSError(errno_, os.strerror(errno_))
        return t.tv_sec

elif os.name == 'nt':
    _GetTickCount = ctypes.windll.kernel32.GetTickCount64
    def uptime():
        return int(_GetTickCount()/1000)


def kill(pid):
    try:
        os.kill(pid, signal.SIGTERM)
        if os.name == 'posix':
            time.sleep(0.1)  # give app a chance to terminate
            os.kill(pid, signal.SIGKILL)
    except Exception as e:
        (eid, emsg) = e.args
        if eid != 3:  # No such process
            logger.warning("Kill %d error %s", pid, repr(e))


def error_str():
    t, v, tb = sys.exc_info()
    s = traceback.format_exception_only(t, v)[-1]
    fname, ln, fn, txt = traceback.extract_tb(tb)[-1]
    return "%s at %s:%d" % (s.strip(), os.path.basename(fname), ln)


class PackBits:
    """
    Implements PackBits algorithm
    https://en.wikipedia.org/wiki/PackBits
    """
    MAX_CHUNK_LENGTH = 127

    def __init__(self):
        """
        Unit test for algorithm realization
        """
        sample_data = '1000001111110101010101010100000001000001111111'
        if sample_data != PackBits.decode(PackBits.encode(sample_data)):
            raise AssertionError('PackBits unit test failed')

    @staticmethod
    def encode(data):
        """
        Encode data with PackBits algorithm
        :param data: bytearray with data to encode
        :return: encoded data bytes
        """
        if len(data) == 0:
            raise ValueError('data')

        result = bytearray()
        sequence_buff = bytearray()  # for unique sequences
        data_run = False
        run_count = 0
        data_array = bytearray(data)
        current = 0
        while current < len(data_array) - 1:
            if data_array[current] != data_array[current + 1]:
                if data_run:
                    # Data run is over
                    result.append(256 - run_count)
                    result.append(data_array[current])
                    data_run = False
                    run_count = 0
                else:
                    # add item to sequence if it's not big enough
                    if len(sequence_buff) == PackBits.MAX_CHUNK_LENGTH:
                        result.append(PackBits.MAX_CHUNK_LENGTH - 1)
                        result.extend(sequence_buff)
                        sequence_buff = bytearray()

                    sequence_buff.append(data_array[current])
            else:
                if data_run:
                    # add item to data run if it's not big enough
                    if run_count == PackBits.MAX_CHUNK_LENGTH:
                        result.append(256 - (run_count - 1))
                        result.append(data_array[current])
                        run_count = 0

                    run_count += 1
                else:
                    # Sequence is over
                    if len(sequence_buff) > 0:
                        result.append(len(sequence_buff) - 1)
                        result.extend(sequence_buff)
                        sequence_buff = bytearray()
                    data_run = True
                    run_count = 1

            current += 1

        if data_run:
            result.append(256 - run_count)
            result.append(data_array[current])
        else:
            sequence_buff.append(data_array[current])
            result.append(len(sequence_buff) - 1)
            result.extend(sequence_buff)

        return result

    @staticmethod
    def decode(encoded_data):
        """
        Decodes PackBits encoded data
        :param encoded_data: encoded data bytes
        :return: data bytearray
        """
        result = bytearray()
        data_arr = bytearray(encoded_data)
        current = 0
        while current < len(data_arr):
            header = data_arr[current]
            current += 1
            if header > 127:
                header -= 256

            if 0 <= header <= 127:
                result.extend(data_arr[current:(current + header + 1)])
                current += header + 1
            elif header == -128:
                pass
            else:
                result.extend([data_arr[current]] * (1 - header))
                current += 1

        return result


def get_current_tz_name():
    """
    Get current timezone in a standard string format, eg 'Asia/Seoul' or 'Canada/Eastern'
    https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
    """
    return get_localzone().zone


def get_base64_content(file_path):
    """
    Encodes the file contents with base 64
    Can raise Exception in case of error.
    :param file_path: string, source file
    :return: string, Base64 encoded content
    """
    with open(file_path, 'rb') as f:
        content = f.read()
        return b64encode(content)


def get_iso_8601_time_str(src_time):
    """
    Convert specified time to ISO8601 formatted string
    :param src_time: time.time() output
    :return: string, YYYYMMDDThhmmss.mmm
    """
    return datetime.utcfromtimestamp(src_time).strftime('%Y%m%dT%H%M%S.%f')[:-3]


if __name__ == "__main__":
    try:
        test = PackBits()
        logger.info('PackBits test successful')
    except AssertionError as ex:
        logger.error('Test for PackBits codec is failed')


class CapabilityViolatedError(Exception):
    pass


def check_value_in_range(value, interval):
    """
    :param value: value to check
    :type interval: list
    :param interval: list of 3 or 2 items [min, max, step] if step is missed, it's assumed to be 1
    :return: bool, True if value in range, False - otherwise
    """
    if len(interval) == 3:
        step = interval[2]
    elif len(interval) == 2:
        step = 1.0
    else:
        raise ValueError('interval')
    return interval[0] <= value <= interval[1] and (value - interval[0]) % step == 0
