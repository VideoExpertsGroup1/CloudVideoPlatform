sudo apt-get update
sudo apt-get install --fix-missing python-pip libpython-dev libxslt1-dev libyaml-dev gstreamer1.0-tools
sudo python -m pip install -r requirements.txt <-- requirements.txt file should contain all python script deps
chmod -R 777 . <-- What for is this?!
sudo su -c 'echo 'bcm2835_v4l2' >> /etc/modules' <-- Yes this is necessary
sudo cp config.txt /boot/config.txt <-- !!!New line, file config.txt should be placed to package, please find it in attachments.
sudo reboot
