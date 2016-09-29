# Demo VXG cloud Camera Manager (CM)
## v1.0.0

## INSTALLATION

    start install.sh script or make all 1-4 steps manually    

1. This sample is written in Python 2.7+. Please make sure you have it installed.

2. Besides python framework you'll need to install additional python libraries using this command (as admin\root user):

    sudo apt-get install --fix-missing python-pip libpython-dev libxslt1-dev libyaml-dev
    
    sudo python -m pip install -r <PATH_TO_CM_DIR>/requirements.txt

3. Copy all files to a local folder on rPI and set the files execute permission.
  
    sudo chmod -R 777 *
    
4.   Add video driver loading on device start . Please note that reboot is required after following command:

    sudo su -c 'echo 'bcm2835_v4l2' >> /etc/modules'
    
    sudo echo gpu_mem=128 >> /boot/config.txt
    
    sudo reboot;
    
    

## LAUNCH
* Go to 

    cnvrclient2.videoexpertsgroup.com/accounts/login/ 

  and Sign Up, if you already have an account on this site, skip this step.

* Open auth2_cm_starter.py and edit 'username' and 'password' variables with your credentials like this:

    username = 'my_acc'    
    password = 'my_secure_pass'
    
* Launch application:

    python auth2_cm_starter.py
    
* After some time (camera registration takes 1-2 minutes), go to cnvrclient2.videoexpertsgroup.com/accounts/login/ 
  and login with your credentials, click to 'Start video streaming' and you'll see the camera list with your Raspberry PI.
