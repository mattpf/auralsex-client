#!/usr/bin/env python
import os
import random
import anydbm
import cherrypy
from Cheetah.Template import Template

import config
import api
import auth

current_dir = os.path.dirname(os.path.abspath(__file__))

class AuralSex(object):
    def __init__(self):
        self.api = api.AuralAPI()
        self.auth = auth.Auth(config.moira_list, config.moira_cache_time)
        self.user_tokens = {}
        self.kvs = anydbm.open('data/settings', 'c')
    
    def authenticate_user(self, allow_empty_remote=True):
        environ = cherrypy.request.wsgi_environ
        if allow_empty_remote and 'REMOTE_USER' not in environ:
            return True # Useful for debugging; lighttpd won't let this happen (except on port 444)
        if 'REMOTE_USER' not in environ or not self.auth.check_user(environ['REMOTE_USER']):
            # Showing off is fun.
            name = environ['SSL_CLIENT_S_DN_CN']
            first = name.split(' ', 1)[0]
            raise cherrypy.HTTPError(401, "Sorry %s; only Beast residents may receieve aural sex. If you are a Beast resident, please email beast-auralsex@mit.edu." % first)
        else:
            return True
    
    @cherrypy.expose
    def index(self):
        self.authenticate_user()
        stuff = {'zones': sorted(config.zones.keys())}
        return Template(file='templates/index.tmpl', searchList=[stuff]).respond()
    
    @cherrypy.expose
    def control(self, zone, firstrun=False):
        self.authenticate_user()
        if zone not in config.zones:
            raise cherrypy.HTTPError(400)
        env = cherrypy.request.wsgi_environ
        username = env['REMOTE_USER'] if 'REMOTE_USER' in env else 'tester@TEST.COM'
        name = env['SSL_CLIENT_S_DN_CN'] if 'SSL_CLIENT_S_DN_CN' in env else 'Test User'
        serial = self.user_tokens[username] if username in self.user_tokens else hex(random.getrandbits(256))[2:-1]
        self.user_tokens[username] = serial
        if not self.kvs.has_key('firstrun_%s' % username):
            firstrun = True
            self.kvs['firstrun_%s' % username] = '1'
        stuff = {'zone': zone, 'user': username, 'name': name, 'token': serial, 'server': config.music_server, 'firstrun': firstrun}
        return Template(file='templates/interface.tmpl', searchList=[stuff]).respond()
    
    @cherrypy.expose
    def stream(self, track_id, username=None, token=None):
        if username not in self.user_tokens or self.user_tokens[username] != token:
            self.authenticate_user(allow_empty_remote=False)
        if '.' in track_id:
            track_id = track_id.split('.')[0]
        c = self.api.mdb().cursor()
        c.execute("SELECT filename FROM music WHERE ROWID = ?", (int(track_id),))
        try:
            filename = c.fetchone()[0]
        except:
            c.close()
            raise cherrypy.HTTPError(404, "Track not found.")
        # Fuck you, Safari. See preview.js.
        cherrypy.response.headers["Content-Type"] = "application/octet-stream"
        c.close()
        return open("%s/%s" % (config.music_dir, filename))

if __name__ == '__main__':
    cherrypy.quickstart(AuralSex(), '/', 'cherrypy.conf')
