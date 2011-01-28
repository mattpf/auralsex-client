#!/usr/bin/env python
import serial
import urllib2

SERVER_ROOT = 'auralsex3.mit.edu:39868'

def alter_volume(delta):
    try:
        volume = int(urllib2.urlopen('http://%s/volume' % SERVER_ROOT).read())
        volume += delta
        if volume > 10:
            volume = 10
        elif volume < 1:
            volume = 1
        urllib2.urlopen('http://%s/volume?volume=%s' % (SERVER_ROOT, volume))
    except:
        pass # Meh?

def skip():
    try:
        urllib2.urlopen('http://%s/skip' % SERVER_ROOT)
    except:
        pass

def back():
    try:
        urllib2.urlopen('http://%s/back' % SERVER_ROOT)
    except:
        pass

def pause():
    try:
        urllib2.urlopen('http://%s/pause' % SERVER_ROOT)
    except:
        pass

def main(port):
    connection = serial.Serial(port, baudrate=9600)
    while True:
        command = connection.read(4)
        if command[0:3] != 'bem':
            continue
        button = command[3]
        if button == 'u':
            alter_volume(1)
            print "Volume up"
        elif button == 'd':
            alter_volume(-1)
            print "Volume down"
        elif button == 'r':
            skip()
            print "Skip"
        elif button == 'l':
            back()
            print "Back"
        elif button == 'm':
            pause()
            print "Pause"

if __name__ == '__main__':
    main('/dev/tty.usbserial-A700eza1')
