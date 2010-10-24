import cherrypy
import sqlite3
import json
import urllib2, urllib

import config

class AuralAPI(object):
    """The exposed API for the UI"""
    
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
        return "{success: %s}" % self.command(zone, "pause")
    
    @cherrypy.expose
    def play(self, zone, track_id=None, **args):
        if track_id is None:
            raise cherry.HTTPError(410)
        self.command(zone, "play", {'filename': self.id_to_filename(track_id)})
        
    @cherrypy.expose
    def skip(self, zone, to=None):
        if to is None:
            return "{success: %s}" % self.command(zone, "skip")
        else:
            return "{success: %s}" % self.command(zone, "skip", {'to': to})
        
    @cherrypy.expose
    def back(self, zone):
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
            i += 1
            c.execute("SELECT ROWID, title, artist, album FROM music WHERE filename = ?", (filename,))
            try:
                track_id, title, artist, album = c.fetchone()
            except:
                track_id, title, artist, album = -i, filename, None, None
            songs.append({'id': track_id, 'title': title, 'artist': artist, 'album': album})
        c.close()
        db.close()
        return json.dumps({'queue': songs})
