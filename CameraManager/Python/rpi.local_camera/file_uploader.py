"""
Async HTTP(s) file uploader for CM
"""

from threading import Thread
from Queue import Queue
from utils import get_logger, error_str
from httplib import HTTPConnection
from urlparse import urlparse
import os

logger = get_logger()


class HTTPUploader(Thread):
    STOP_SIGNAL = 'stop_please'

    def __init__(self):
        super(HTTPUploader, self).__init__()
        self._queue = Queue()

    def upload_async(self, path, url, delete, make_snapshot_cb=None, args=None, kwargs=None):
        self._queue.put({'path': path, 'url': url, 'delete': delete, 'make_snapshot_cb': make_snapshot_cb,
                         'args': args, 'kwargs': kwargs})

    def run(self):
        while True:
            data = self._queue.get(True)
            if data == self.STOP_SIGNAL:
                break

            try:
                self._upload_file(data)
            except:
                logger.error('Failed to upload file %s: %s', str(data), error_str())

    def _upload_file(self, data):
        if callable(data['make_snapshot_cb']):
            args = data['args'] if data['args'] is not None else []
            kwargs = data['kwargs'] if data['kwargs'] is not None else {}
            data['path'] = data['make_snapshot_cb'](*args, **kwargs)

        with open(data['path'], 'rb') as file_handle:
            url = data['url']
            parsed = urlparse(url)
            connection = HTTPConnection(parsed.netloc, timeout=10)
            try:
                connection.connect()
                request_url = parsed.path
                if parsed.query is not None and parsed.query != '':
                    request_url += '?'
                    request_url += parsed.query
                connection.request('POST', request_url, file_handle)
                resp = connection.getresponse()
                if resp.status >= 400:
                    logger.error('Failed to upload file: http error %s: %s', resp.status, resp.read())
            except Exception:
                logger.error('Failed to upload file: Network error %s', error_str())
            finally:
                connection.close()
        if data.get('delete', False):
            os.unlink(data['path'])

    def stop(self):
        self._queue.put(self.STOP_SIGNAL)
        self.join()
