# Demo VXG cloud Camera Manager (CM)
## v1.0.0

## INSTALLATION
This sample is written in Python 2.7+. You need to install it to launch.

Besides python framework you need to install additional python libraries by command (from admin\root user):

    `python -m pip install -r <PATH_TO_CM_DIR>/requirements.txt`


## LAUNCHING
* Follow to cnvrclient2.videoexpertsgroup.com/accounts/login/ and Sign Up, if you already have an account on this site, skip this step;
* Open auth2_cm_starter.py and edit 'username' and 'password' variables with your credentials like this:

    username = 'my_acc'
    
    password = 'my_secure_pass'
    
* Launch application:

    `python auth2_cm_starter.py`
* After some time (camera registration takes 1-2 minutes), go to cnvrclient2.videoexpertsgroup.com/accounts/login/ and login with your credentials, click to 'Start video streaming' and you'll see the camera list with your Raspberry PI.
