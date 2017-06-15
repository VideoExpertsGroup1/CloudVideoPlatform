# Demo VXG Cloud Camera Manager (CM)
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

1. Launch camera manager:

	python auth2_cm_starter.py

There will be registered a new camera in your personal account login/password


2. Install VXG Cloud Client application and see your camera:

   Google Play: https://play.google.com/store/apps/details?id=com.vxg.cnvrclient2&hl=en
   App Store: https://itunes.apple.com/en/app/vxg-cloud-client/id1129124647?mt=8

   Before login please open settings and change latency to minimal.
   Do login and enjoy the video.
