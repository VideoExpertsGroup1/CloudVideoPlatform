"""
Global project variables and configuration
"""

import os
from configobj import ConfigObj
from validate import Validator

# current app dir without ending slash, use it for any relative path
WORK_DIR = os.path.dirname(os.path.realpath(__file__))

# client config file and config template in ConfigObj semantic
CONFIGSPEC_FILE_NAME = '%s/client.conf.py.template' % WORK_DIR
CONFIG_FILE_NAME = '%s/client.conf.py' % WORK_DIR

config = None


def init_config():
    global config
    config = ConfigObj(CONFIG_FILE_NAME, configspec=CONFIGSPEC_FILE_NAME)
    # inspect config file
    validator = Validator()
    config.validate(validator, copy=True)
    config.write()
init_config()


