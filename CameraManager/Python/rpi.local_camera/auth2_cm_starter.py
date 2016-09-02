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
Edit these fields
"""
# AccP server address without trailing slash
accp_host = 'http://cnvrclient2.videoexpertsgroup.com'
# AccP user credentials to register CM to
username = ''
password = ''
# CM server address. Do not edit that if you not sure what does it means.
cm_host = 'auth2-cm-1778017050.us-east-1.elb.amazonaws.com'

globals.init_config()

cm_registration_required = not globals.config.get('connection_id', '') or \
                           globals.config.get('server_hostname', '') != cm_host
cm_registered = False
if cm_registration_required:
    api = auth2_webapi_wrapper.Auth2WebAPIWrapper(accp_host)
    try:
        api.login(username, password)
        token = api.create_regtoken()['token']

        globals.config['reg_token'] = token
        globals.config['server_hostname'] = cm_host
        globals.config['connection_id'] = ""
        globals.config['camera_uuid'] = ""
        globals.config.write()

        cm_registered = True
    except Exception as e:
        print e

    if api.is_connected():
        try:
            api.logout()
        except:
            pass

if not cm_registration_required or (cm_registration_required and cm_registered):
    client.init_signals()
    client.main()
