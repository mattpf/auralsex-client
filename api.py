import cherrypy
import sqlite3
import json
import urllib2, urllib
import time
import subprocess
from threading import Lock, local

import config
import main

class AuralAPI(object):
    """The exposed API for the UI"""
    log_lock = Lock()
    dbs = local()
    
    def mdb(self):
        try:
            return self.dbs.m
        except AttributeError:
            self.dbs.m = sqlite3.connect("data/music.dat")
            return self.dbs.m
    
    def pdb(self):
        try:
            return self.dbs.p
        except AttributeError:
            self.dbs.p = sqlite3.connect("data/playlists.dat")
            return self.dbs.p
    
    def current_user(self):
        return cherrypy.request.wsgi_environ['REMOTE_USER'] if 'REMOTE_USER' in cherrypy.request.wsgi_environ else 'tester@TEST.COM'
    
    def log_event(self, zone, event):
        subprocess.call(["zwrite", "-d", "-c", "auralsex", "-i", "activity", "-s", "Aural Sex)  (%s in %s" % (self.current_user().split('@')[0], zone), "-m", event])
        with self.log_lock:
            with open('%s/action_log.txt' % main.current_dir, 'a+') as log:
                log.write("[%s] [%s] [%s] %s\n" % (time.strftime('%x %X'), zone, self.current_user(), event))
    
    @cherrypy.expose
    def library(self, **args):
        c = self.mdb().cursor()
        c.execute("SELECT ROWID, title, artist, album FROM music")
        musics = []
        for row in c:
            musics.append({'track_id': row[0], 'title': row[1], 'artist': row[2], 'album': row[3]})
        
        c.close()
        response = cherrypy.response
        response.headers['Content-Type'] = 'text/plain'
        return json.dumps({'music': musics})
    
    @cherrypy.expose
    def search(self, search=None, **args):
        if search is None or len(search) < 3:
            raise cherrypy.HTTPError(400, "Must search for at least three characters.")
        c = self.mdb().cursor()
        c.execute("SELECT ROWID, title, artist, album FROM music WHERE title LIKE '%%%s%%' OR artist LIKE '%%%s%%' OR album LIKE '%%%s%%'" % (search, search, search))
        musics = []
        for row in c:
            musics.append({'track_id': row[0], 'title': row[1], 'artist': row[2], 'album': row[3]})

        c.close()
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
        c = self.mdb().cursor()
        c.execute("SELECT filename FROM music WHERE ROWID = ?", (int(track_id),))
        filename = c.fetchone()[0]
        c.close()
        return filename
    
    def id_to_title(self, track_id):
        c = self.mdb().cursor()
        c.execute("SELECT title FROM music WHERE ROWID = ?", (int(track_id),))
        title = c.fetchone()[0]
        c.close()
        return title
    
    @cherrypy.expose
    def pause(self, zone):
        self.log_event(zone, "Toggled pause.")
        return "{success: %s}" % self.command(zone, "pause")
    
    @cherrypy.expose
    def play(self, zone, track_id=None, **args):
        if track_id is None:
            raise cherry.HTTPError(410)
        self.log_event(zone, "Played \"%s\"." % self.id_to_title(track_id))
        self.command(zone, "play", {'filename': self.id_to_filename(track_id)})
        
    @cherrypy.expose
    def skip(self, zone, to=None):
        if to is None:
            self.log_event(zone, "Skipped to next track.")
            return "{success: %s}" % self.command(zone, "skip")
        else:
            self.log_event(zone, "Skipped to track #%s." % to)
            return "{success: %s}" % self.command(zone, "skip", {'to': to})
        
    @cherrypy.expose
    def back(self, zone):
        self.log_event(zone, "Skipped to previous track.")
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
    def state(self, zone, **args):
        url = 'http://%s/state' % config.zones[zone]
        state = urllib2.urlopen(url).read()
        cherrypy.response.headers['Content-Type'] = 'application/json'
        return json.dumps({'state': state})
    
    @cherrypy.expose
    def append(self, zone, track_id=None, **args):
        if track_id is None:
            raise cherry.HTTPError(410)
        self.log_event(zone, "Added tracks to the queue:\n- %s" % '\n- '.join(self.id_to_title(x) for x in track_id.split(',')))
        
        to_play = ["filename=%s" % urllib.quote_plus(self.id_to_filename(int(x))) for x in track_id.split(',')]
        uri = "http://%s/add?%s" % (config.zones[zone], '&'.join(to_play))
        print "URI: %s" % uri
        try:
            urllib2.urlopen(uri).close()
        except:
            return "{success: false}"
        return "{success: true}"
    
    @cherrypy.expose
    def get_queue(self, zone, **args):
        filenames = urllib2.urlopen('http://%s/list' % config.zones[zone]).read().split("\n")
        cherrypy.response.headers['Content-Type'] = 'application/json'
        songs = []
        if len(filenames) == 1 and filenames[0] == '':
            return json.dumps(songs)
        c = self.mdb().cursor()
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
        return json.dumps({'queue': songs})
    
    @cherrypy.expose
    def remove(self, zone, index, **args):
        self.log_event(zone, "Removed %s track(s) from the queue." % len(index.split(',')))
        return "{success: %s}" % self.command(zone, "remove", {'index': index})
    
    @cherrypy.expose
    def clear_queue(self, zone, **args):
        self.log_event(zone, "Cleared the queue.")
        return "{success: %s}" % self.command(zone, "clear")
    
    @cherrypy.expose
    def now_playing(self, zone, **args):
        current_file = urllib2.urlopen('http://%s/current_file' % config.zones[zone]).read()
        cherrypy.response.headers['Content-Type'] = 'application/json'
        if len(current_file) == 0:
            return '{"playing": null}'
        c = self.mdb().cursor()
        c.execute("SELECT ROWID, title, artist, album FROM music WHERE filename = ?", (current_file,))
        try:
            track_id, title, artist, album = c.fetchone()
        except:
            track_id, title, artist, album = None, current_file, None, None
        c.close()
        return json.dumps({'playing': {'track_id': track_id, 'title': title, 'artist': artist, 'album': album}})
    
    def get_playlist_for_principle(self, principle):
        c = self.pdb().cursor()
        c.execute("SELECT id FROM playlists WHERE principle = ?", (principle,))
        try:
            pid = c.fetchone()[0]
        except:
            c.execute("INSERT INTO playlists (principle) VALUES (?)", (principle,))
            pid = c.lastrowid
            self.pdb().commit()
            print c.execute("SELECT principle FROM playlists WHERE id = ?", (pid,)).fetchone()[0]
        c.close()
        return int(pid)
    
    def get_playlist(self):
        user = self.current_user()
        if user is None:
            user = 'tester@TEST.COM'
        return self.get_playlist_for_principle(user)
    
    def normalise_playlist(self, playlist):
        read = self.pdb().cursor()
        write = self.pdb().cursor()
        read.execute("SELECT ROWID FROM tracks WHERE playlist = ? ORDER BY ordering", (playlist,))
        i = 1
        for row in read:
            write.execute("UPDATE tracks SET ordering = ? WHERE ROWID = ?", (i, row[0]))
            i += 1
        self.pdb().commit()
        read.close()
        write.close()
    
    @cherrypy.expose
    def playlist(self, **args):
        user = self.current_user()
        if user is None:
            user = 'tester@TEST.COM'
        playlist = []
        pc = self.pdb().cursor()
        mc = self.mdb().cursor()
        pc.execute("SELECT ROWID, track, ordering FROM tracks WHERE playlist = (SELECT id FROM playlists WHERE principle = ?) ORDER BY ordering", (user,))
        for row in pc:
            # For some reason the standard placeholder approach throws a ValueError, so...
            mc.execute("SELECT title, artist, album FROM music WHERE ROWID = %s" % int(row[1]))
            try:
                title, artist, album = mc.fetchone()
            except:
                title, artist, album = 'Track #%s' % row[1], None, None
            playlist.append({'entry_id': row[0], 'track_id': row[1], 'index': row[2], 'title': title, 'artist': artist, 'album': album})
        pc.close()
        mc.close()
        return json.dumps({'playlist': playlist})
    
    @cherrypy.expose
    def playlist_append(self, tracks=None, **args):
        tracks = [int(x) for x in tracks.split(',')]
        playlist = self.get_playlist()
        c = self.pdb().cursor()
        try:
            current_order = c.execute("SELECT ordering FROM tracks WHERE playlist = ? ORDER BY ordering DESC LIMIT 1", (playlist,)).fetchone()[0]
        except:
            current_order = 0
        for track in tracks:
            current_order += 1
            c.execute("INSERT INTO tracks (playlist, track, ordering) VALUES (?, ?, ?)", (playlist, track, current_order))
        self.pdb().commit()
        return "{success: true}"
    
    @cherrypy.expose
    def playlist_delete(self, tracks=None, **args):
        playlist = self.get_playlist()
        playlist_ids = [int(x) for x in tracks.split(',')]
        c = self.pdb().cursor()
        for pid in playlist_ids:
            c.execute("DELETE FROM tracks WHERE ROWID = ? AND playlist = ?", (pid, playlist))
        self.normalise_playlist(playlist)
        self.pdb().commit()
        c.close()
        return "{success: true}"
    
    @cherrypy.expose
    def playlist_reorder(self, order=None, **args):
        playlist = self.get_playlist()
        playlist_ids = [int(x) for x in order.split(',')]
        c = self.pdb().cursor()
        i = 0
        for pid in playlist_ids:
            i += 1
            c.execute("UPDATE tracks SET ordering = ? WHERE ROWID = ? AND playlist = ?", (i, pid, playlist))
        self.pdb().commit()
        c.close()
        return "{success: true}"
    
    @cherrypy.expose
    def clear_playlist(self, **args):
        playlist = self.get_playlist()
        c = self.pdb().cursor()
        c.execute("DELETE FROM tracks WHERE playlist = ?", (playlist,))
        c.close()
        self.pdb().commit()
        return "{success: true}"
    
    @cherrypy.expose
    def play_playlist(self, zone, **args):
        if zone not in config.zones:
            raise cherrypy.HTTPError(410)
        playlist = self.get_playlist()
        self.log_event(zone, "Played playlist #%s." % playlist)
        c = self.pdb().cursor()
        c.execute("SELECT track FROM tracks WHERE playlist = ? ORDER BY ordering", (playlist,))
        to_play = ["filename=%s" % urllib.quote_plus(self.id_to_filename(row[0])) for row in c]
        c.close()
        self.command(zone, "clear")
        uri = "http://%s/add?%s" % (config.zones[zone], '&'.join(to_play))
        try:
            urllib2.urlopen(uri).close()
            return "{success: %s}" % self.command(zone, "skip", {'to': 0})
        except:
            return "{success: false}"
