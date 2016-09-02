"""
VXG AccP's WebAPI wrapper
"""

import requests
import json
import urllib
from logging import getLogger
import time
import datetime
from threading import Timer


class Auth2WebAPIWrapper:
    """
    The class can be used as a base for an end-user application that is going to work through AccP and SvcP Web-APIs
    At the moment it doesn't implements all APIs' methods - just shows how to do it...

    Example of usage:

        api = Auth2WebAPIWrapper('http://1.2.3.4:8000')
        api.login(username='test_user', password='1234')    # login to both servers: AccP and SvcP
        print api.get_regtokens_list()                      # call of AccP
        print api.get_cameras_list()                        # call of SvcP
        api.logout()

    """

    accp_endpoints = {
        'login': 'api/v1/account/login/',
        'logout': 'api/v1/account/logout/',
        'reg_tokens': 'api/v1/reg_tokens/',
        'reg_token': 'api/v1/reg_tokens/%(token)s/',
    }

    svcp_endpoints = {
        'logout': 'api/v2/account/logout/',
        'cameras': 'api/v2/cameras/',
        'apitoken': 'api/v2/account/token/api/',
    }

    ACCP_SESSION_COOKIE = 'sessionid'

    def __init__(self, accp_host, logger_instance=None):
        self.accp_host = accp_host
        self.svcp_host = None
        self.svcp_auth_url = None       # to re-login on SvcP later without login to AccP
        self.logger = logger_instance or getLogger(__name__)

        self.svcp_api_token = None
        self.svcp_api_token_expire = None
        self.accp_sessionid = None
        self.update_timer = None

        self.connected = False

    def get_accp_url(self, url_type, **kwargs):
        return ''.join([self.accp_host, '/', self.accp_endpoints[url_type] % kwargs])

    def get_svcp_url(self, url_type, **kwargs):
        return ''.join([self.svcp_host, '/', self.svcp_endpoints[url_type] % kwargs])

    @staticmethod
    def append_args_to_dictionary(dictionary, **kwargs):
        for key in kwargs:
            if kwargs[key] is not None:
                dictionary[key] = kwargs[key]

    def _make_accp_request(self, method, url, **optional_args):
        return self._make_request(method, True, url, **optional_args)

    def _make_svcp_request(self, method, url, **optional_args):
        return self._make_request(method, False, url, **optional_args)

    def _make_request(self, method, is_accp_call, url, **optional_args):
        if not self.connected:
            raise RuntimeError('You need to login first')

        kwargs = {'headers': {'Content-type': 'application/json'}}
        if is_accp_call:
            kwargs['cookies'] = {self.ACCP_SESSION_COOKIE: self.accp_sessionid}
        else:
            kwargs['headers']['Authorization'] = 'SkyVR ' + self.svcp_api_token
        self.append_args_to_dictionary(kwargs, **optional_args)

        start_time = time.time()
        if method == 'GET':
            resp = requests.get(url, **kwargs)

        elif method == 'POST':
            resp = requests.post(url, **kwargs)

        elif method == 'PUT':
            resp = requests.put(url, **kwargs)

        elif method == 'DELETE':
            resp = requests.delete(url, **kwargs)

        else:
            raise RuntimeError('Unknown method %s' % method)
        self.logger.debug('(%s) %s took %f secs', method, url, time.time() - start_time)

        resp.raise_for_status()
        return resp.text

    def _get_api_token_update_delta(self):
        if self.svcp_api_token_expire:
            seconds = (self.svcp_api_token_expire-datetime.datetime.utcnow()).total_seconds()/2
            if seconds > 0:
                return seconds
        return None

    def _update_api_token(self):
        if self.svcp_api_token:
            try:
                resp = self._make_svcp_request('GET', self.get_svcp_url('apitoken'))
                resp_json = json.loads(resp)
                self.svcp_api_token = resp_json['token']
                self.svcp_api_token_expire = datetime.datetime.strptime(resp_json['expire'], '%Y-%m-%dT%H:%M:%S')
            except:
                pass

            seconds = self._get_api_token_update_delta()
            if seconds:
                self.update_timer = Timer(seconds, self._update_api_token)
                self.update_timer.start()
            else:
                self.update_timer = None
                self.logger.error('SvcP API-token is expired and can\'t be updated. '
                                  'Please check connection, do logout and login again')

    def is_connected(self):
        return self.connected

    def login(self, username, password):
        if self.connected:
            raise RuntimeError('You need to logot first')

        try:
            payload = json.dumps({'username': username, 'password': password})
            resp = requests.post(self.get_accp_url('login'), data=payload)
            self.accp_sessionid = resp.cookies[self.ACCP_SESSION_COOKIE]

            resp_json = json.loads(resp.text)
            self.svcp_auth_url = resp_json['svcp_auth_app_url']
            self.svcp_host = 'http://' + urllib.splithost(self.svcp_auth_url[5:])[0]

            resp = requests.get(self.svcp_auth_url, cookies={self.ACCP_SESSION_COOKIE: self.accp_sessionid})
            resp_json = json.loads(resp.text)
            self.svcp_api_token = resp_json['token']
            self.svcp_api_token_expire = datetime.datetime.strptime(resp_json['expire'], '%Y-%m-%dT%H:%M:%S')

            self.update_timer = Timer(self._get_api_token_update_delta(), self._update_api_token)
            self.update_timer.start()

            self.connected = True

        except Exception as e:
            self.svcp_api_token = None
            self.svcp_api_token_expire = None
            self.svcp_host = None
            self.svcp_auth_url = None
            self.accp_sessionid = None
            if self.update_timer:
                self.update_timer.cancel()
                self.update_timer = None
            raise

    def logout(self):
        if self.svcp_api_token:
            self._make_svcp_request('POST', self.get_svcp_url('logout'))

        if self.accp_sessionid:
            self._make_accp_request('POST', self.get_accp_url('logout'))

        self.svcp_api_token = None
        self.svcp_api_token_expire = None
        self.svcp_host = None
        self.svcp_auth_url = None
        self.accp_sessionid = None

        if self.update_timer:
            self.update_timer.cancel()
            self.update_timer = None

        self.connected = False

    def update_acl(self):
        # It's necessary sometimes to get ACL again,  for example, when a client has registered new camera
        # and wants to see it in SvcP's cameras list.
        # Re-login to SvcP is required in this case
        if self.accp_sessionid and self.svcp_auth_url:
            resp = requests.get(self.svcp_auth_url, cookies={self.ACCP_SESSION_COOKIE: self.accp_sessionid})
            resp_json = json.loads(resp.text)
            self.svcp_api_token = resp_json['token']
            self.svcp_api_token_expire = datetime.datetime.strptime(resp_json['expire'], '%Y-%m-%dT%H:%M:%S')
            self.update_timer = Timer(self._get_api_token_update_delta(), self._update_api_token)
            self.update_timer.start()

    def create_regtoken(self):
        payload = json.dumps({})
        resp = self._make_accp_request('POST', self.get_accp_url('reg_tokens'), data=payload)
        return json.loads(resp)

    def get_regtoken(self, token):
        resp = self._make_accp_request('GET', self.get_accp_url('reg_token', token=token))
        return json.loads(resp)

    def get_regtokens_list(self):
        rt_list = []
        params = {'offset': 0, 'limit': 100}
        while True:
            res_str = self._make_accp_request('GET', self.get_accp_url('reg_tokens'), params=params)
            res_json = json.loads(res_str)
            rt_list += res_json['objects']
            params['offset'] += params['limit']
            if params['offset'] >= res_json['meta']['total_count']:
                break
        return rt_list

    def get_cameras_list(self):
        cam_list = []
        params = {'offset': 0, 'limit': 100}
        while True:
            res_str = self._make_svcp_request('GET', self.get_svcp_url('cameras'), params=params)
            res_json = json.loads(res_str)
            cam_list += res_json['objects']
            params['offset'] += params['limit']
            if params['offset'] >= res_json['meta']['total_count']:
                break
        return cam_list