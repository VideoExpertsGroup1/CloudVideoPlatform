# Demo VXG Cloud Camera Manager (CM)
## v1.0.0

## INSTALLATION

    start install.sh script or make all 1-4 steps manually

1. This sample is written in Python 2.7+. Please make sure you have it installed.

2. Besides python framework you'll need to install additional python libraries using this command (as admin\root user):

    ```sh
    sudo apt-get install --fix-missing python-pip libpython-dev libxslt1-dev libyaml-dev
    sudo python -m pip install -r <PATH_TO_CM_DIR>/requirements.txt
    ```

3. Copy all files to a local folder on rPI and set the files execute permission.

    ```sh
    sudo chmod -R 777 *
    ```
    
4.   Add video driver loading on device start . Please note that reboot is required after following command:

    ```sh
    sudo su -c 'echo 'bcm2835_v4l2' >> /etc/modules'
    sudo echo gpu_mem=128 >> /boot/config.txt
    sudo reboot;
    ```

## LAUNCH

1. Configure your video source by editing the auth2\_cm\_starter.py file and filling the variable REG\_TOKEN with your Registration Token like this:
	```python
	REG_TOKEN = 'ABCDEF123456'
	```
	Your Registration token can be obtained by the multiple ways, for example it can be done in admin panel of integration kit:
	1. Select your user account in the 'User list'
	2. Press the 'Create "Push" Camera' button
	3. Press the 'Create reg_token' button near newly created camera

2. Launch application:
	```sh
	python auth2_cm_starter.py
	```
3. You can watch video from the source by the following ways:
   - On web browser, for example you can use the Video player from the integration kit
   - On your mobile device using VXG Cloud Client applications:
     - Google Play: https://play.google.com/store/apps/details?id=com.vxg.cnvrclient2&hl=en
     - App Store: https://itunes.apple.com/en/app/vxg-cloud-client/id1129124647?mt=8


