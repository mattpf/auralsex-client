import cherrypy
import sqlite3
import json
import urllib2, urllib
import time
from threading import Lock

import config
import main

class AuralAPI(object):
    """The exposed API for the UI"""
    log_lock = Lock()
    
    def current_user(self, ):
        return cherrypy.request.wsgi_environ['REMOTE_USER'] if 'REMOTE_USER' in cherrypy.request.wsgi_environ else None
    
    def log_event(self, zone, event):
        with self.log_lock:
            with open('%s/action_log.txt' % main.current_dir, 'a+') as log:
                log.write("[%s] [%s] [%s] %s\n" % (time.strftime('%x %X'), zone, self.current_user(), event))
    
    @cherrypy.expose
    def library(self, **args):
        db = sqlite3.connect("music.dat")
        c = db.cursor()
        c.execute("SELECT ROWID, title, artist, album FROM music")
        musics = []
        for row in c:
            musics.append({'id': row[0], 'title': row[1], 'artist': row[2], 'album': row[3]})
        
        c.close()
        db.close()
        response = cherrypy.response
        response.headers['Content-Type'] = 'text/plain'
        return json.dumps({'music': musics})
    
    @cherrypy.expose
    def search(self, search=None, **args):
        if search is None or len(search) < 3:
            raise cherrypy.HTTPError(400, "Must search for at least three characters.")
        db = sqlite3.connect("music.dat")
        c = db.cursor()
        c.execute("SELECT ROWID, title, artist, album FROM music WHERE title LIKE '%%%s%%' OR artist LIKE '%%%s%%' OR album LIKE '%%%s%%'" % (search, search, search))
        musics = []
        for row in c:
            musics.append({'id': row[0], 'title': row[1], 'artist': row[2], 'album': row[3]})

        c.close()
        db.close()
        response = cherrypy.response
        response.headers['Content-Type'] = 'text/plain'
        return json.dumps({'music': musics})
    
    def command(self, zone, command, params=None):
        if zone not in config.zones:
            raise cherrypy.HTTPError(410)
        uri = "http://%s/%s" % (config.zones[zone], command)
        if params is not None:
            uri += "?%s" % urllib.urlencode(params)
        try:
            urllib2.urlopen(uri).close()
        except:
            return False
        return True
    
    def id_to_filename(self, track_id):
        db = sqlite3.connect("music.dat")
        c = db.cursor()
        c.execute("SELECT filename FROM music WHERE ROWID = ?", (int(track_id),))
        filename = c.fetchone()[0]
        c.close()
        db.close()
        return filename
    
    @cherrypy.expose
    def pause(self, zone):
        self.log_event(zone, "toggled pause")
        return "{success: %s}" % self.command(zone, "pause")
    
    @cherrypy.expose
    def play(self, zone, track_id=None, **args):
        if track_id is None:
            raise cherry.HTTPError(410)
        self.log_event(zone, "played track #%s" % track_id)
        self.command(zone, "play", {'filename': self.id_to_filename(track_id)})
        
    @cherrypy.expose
    def skip(self, zone, to=None):
        if to is None:
            self.log_event(zone, "skipped to next track")
            return "{success: %s}" % self.command(zone, "skip")
        else:
            self.log_event(zone, "skipped to track #%s" % to)
            return "{success: %s}" % self.command(zone, "skip", {'to': to})
        
    @cherrypy.expose
    def back(self, zone):
        self.log_event(zone, "skipped back one track")
        return "{success: %s}" % self.command(zone, "back")
    
    @cherrypy.expose
    def volume(self, zone, **args):
        if 'volume' in args:
            url = 'http://%s/volume?volume=%s' % (config.zones[zone], int(args['volume']))
        else:
            url = 'http://%s/volume' % config.zones[zone]
        volume = int(urllib2.urlopen(url).read())
        cherrypy.response.headers['Content-Type'] = 'application/json'
        return "{volume: %s}" % volume
    
    @cherrypy.expose
    def append(self, zone, track_id=None, **args):
        if track_id is None:
            raise cherry.HTTPError(410)
        self.log_event(zone, "added track #%s to the queue" % track_id)
        return "{success: %s}" % self.command(zone, "add", {'filename': self.id_to_filename(track_id)})
    
    @cherrypy.expose
    def get_queue(self, zone, **args):
        filenames = urllib2.urlopen('http://%s/list' % config.zones[zone]).read().split("\n")
        cherrypy.response.headers['Content-Type'] = 'application/json'
        songs = []
        if len(filenames) == 1 and filenames[0] == '':
            return json.dumps(songs)
        db = sqlite3.connect("music.dat")
        c = db.cursor()
        i = 0
        for filename in filenames:
            c.execute("SELECT ROWID, title, artist, album FROM music WHERE filename = ?", (filename,))
            try:
                track_id, title, artist, album = c.fetchone()
            except:
                track_id, title, artist, album = None, filename, None, None
            songs.append({'index': i, 'track_id': track_id, 'title': title, 'artist': artist, 'album': album})
            i += 1
        c.close()
        db.close()
        return json.dumps({'queue': songs})
    
    @cherrypy.expose
    def remove(self, zone, index, **args):
        self.log_event(zone, "removed track(s) #%s from the queue" % index)
        return "{success: %s}" % self.command(zone, "remove", {'index': index})
    
    @cherrypy.expose
    def now_playing(self, zone, **args):
        current_file = urllib2.urlopen('http://%s/current_file' % config.zones[zone]).read()
        cherrypy.response.headers['Content-Type'] = 'application/json'
        if len(current_file) == 0:
            return '{"playing": null}'
        db = sqlite3.connect("music.dat")
        c = db.cursor()
        c.execute("SELECT ROWID, title, artist, album FROM music WHERE filename = ?", (current_file,))
        try:
            track_id, title, artist, album = c.fetchone()
        except:
            track_id, title, artist, album = None, current_file, None, None
        c.close()
        db.close()
        return json.dumps({'playing': {'track_id': track_id, 'title': title, 'artist': artist, 'album': album}})
