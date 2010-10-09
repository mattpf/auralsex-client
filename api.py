import cherrypy
import sqlite3
import json
import urllib2

import zones

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
    
    def command(self, zone, command):
        if zone not in zones.zones:
            raise cherrypy.HTTPError(410)
        uri = "http://%s/%s" % (zones.zones[zone], command)
        try:
            urllib2.urlopen(uri).close()
        except:
            return False
        return True
    
    @cherrypy.expose
    def pause(self, zone):
        return "{success: %s}" % self.command(zone, "pause")
    
    @cherrypy.expose
    def play(self, zone):
        return "{success: %s}" % self.command(zone, "play")
    
    @cherrypy.expose
    def stop(self, zone):
        return "{success: %s}" % self.command(zone, "stop")
        
    @cherrypy.expose
    def skip(self, zone):
        return "{success: %s}" % self.command(zone, "skip")
        
    @cherrypy.expose
    def back(self, zone):
        return "{success: %s}" % self.command(zone, "back")
    
    @cherrypy.expose
    def volume(self, zone, **args):
        if 'volume' in args:
            url = 'http://%s/volume?volume=%s' % (zones.zones[zone], int(args['volume']))
        else:
            url = 'http://%s/volume' % zones.zones[zone]
        volume = int(urllib2.urlopen(url).read())
        cherrypy.response.headers['Content-Type'] = 'application/json'
        return "{volume: %s}" % volume
        