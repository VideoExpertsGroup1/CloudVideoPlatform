"""
Default entry point for this sample. Edit mandatory fields and launch it.

The script registers CM at AccP (VXG-demo) / SvcP pair.
If the camera is already properly registered last time it reuses that registration and simply connect it.
When config is absent, or last time CM was connected to another server, script registers new CM.
"""

import client
import globals
import auth2_webapi_wrapper

"""
Configuration section
"""
# If you already obtained the reg_token, please insert it here..
REG_TOKEN = ''
# ..If you don't, enter your AccP user credentials to register CM to
ACCP_CREDENTIALS = {
    'username': '',
    'password': '',
}

# Source feed to retranslate to server. The following types of feeds are supported:
#  - RTSP : 'rtsp://sample.url/feed_address'
#  - hardware video source: 'dev:///dev/video0' for *nix /dev/video0 device
#  - local file: 'file://c/dir/file.mp4' for WIN and 'file:///dir/file.mp4' for *nix
SRC_FEED = 'dev:///dev/video0'

# Advanced configuration. Normally you should not edit these values.
HOSTS = {
    # AccP server address without trailing slash
    'accp': 'http://cnvrclient2.videoexpertsgroup.com',
    # CM server address
    'cm': 'cam.skyvr.videoexpertsgroup.com',
}
"""
End of configuration section
"""

globals.init_config()

cm_registration_required = not globals.config.get('connection_id', '') or \
                           globals.config.get('server_hostname', '') != HOSTS['cm']
cm_registered = False
if cm_registration_required:
    if REG_TOKEN:
        globals.config['reg_token'] = REG_TOKEN
    elif ACCP_CREDENTIALS['username']:
        api = auth2_webapi_wrapper.Auth2WebAPIWrapper(HOSTS['accp'])
        try:
            api.login(**ACCP_CREDENTIALS)
            globals.config['reg_token'] = api.create_regtoken()['token']
        except Exception as e:
            raise RuntimeError('Failed to obtain reg_token from AccP: %s' % e)
        finally:
            if api.is_connected():
                try:
                    api.logout()
                except:
                    pass
    else:
        raise RuntimeError('Configuration error: Please specify either REG_TOKEN or ACCP_CREDENTIALS')

    globals.config['camera_feed'] = SRC_FEED
    globals.config['server_hostname'] = HOSTS['cm']
    globals.config['connection_id'] = ""
    globals.config['camera_uuid'] = ""
    globals.config.write()
    cm_registered = True

if not cm_registration_required or (cm_registration_required and cm_registered):
    client.init_signals()
    client.main()
