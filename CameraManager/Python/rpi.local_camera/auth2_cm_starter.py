"""
Default entry point for this sample. Edit mandatory fields and launch it.

The script registers CM at AccP (VXG-demo) / SvcP pair.
If the camera is already properly registered last time it reuses that registration and simply connect it.
When config is absent, or last time CM was connected to another server, script registers new CM.
"""

import client
import globals

"""
Configuration section
"""
# Please insert the reg_token here
REG_TOKEN = ''

# Source feed to retranslate to server. The following types of feeds are supported:
#  - RTSP : 'rtsp://sample.url/feed_address'
#  - hardware video source: 'dev:///dev/video0' for *nix /dev/video0 device
#  - local file: 'file://c/dir/file.mp4' for WIN and 'file:///dir/file.mp4' for *nix
#  - RTMP live streams:  'rtmp://sample.url/app/session'
SRC_FEED = 'dev:///dev/video0'

# Advanced configuration. Normally you should not edit these values.
HOSTS = {
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
    else:
        raise RuntimeError('Configuration error: Please specify REG_TOKEN')

    globals.config['camera_feed'] = SRC_FEED
    globals.config['server_hostname'] = HOSTS['cm']
    globals.config['connection_id'] = ""
    globals.config['camera_uuid'] = ""
    globals.config.write()
    cm_registered = True

if not cm_registration_required or (cm_registration_required and cm_registered):
    client.init_signals()
    client.main()
