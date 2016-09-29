#!/bin/sh

sudo apt-get update
sudo apt-get install --fix-missing python-pip libpython-dev libxslt1-dev libyaml-dev
sudo python -m pip install -r requirements.txt 
chmod -R 777 . 
sudo su -c 'echo 'bcm2835_v4l2' >> /etc/modules' 
sudo cp config.txt /boot/config.txt
sudo reboot
