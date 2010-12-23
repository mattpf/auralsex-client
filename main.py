#!/usr/bin/env python
import os
import cherrypy
from Cheetah.Template import Template

import config
import api

current_dir = os.path.dirname(os.path.abspath(__file__))

def authenticate_user():
    environ = cherrypy.request.wsgi_environ
    if 'REMOTE_USER' not in environ:
        return True # Useful for debugging; lighttpd won't let this happen
    if environ['REMOTE_USER'] not in config.users:
        # Showing off is fun.
        name = environ['SSL_CLIENT_S_DN_CN']
        first = name.split(' ', 1)[0]
        raise cherrypy.HTTPError(401, "Sorry %s; only Beast residents may receieve aural sex. If you are a Beast resident, please email beast-auralsex@mit.edu." % first)
    else:
        return True

class AuralSex(object):
    def __init__(self):
        self.api = api.AuralAPI()
    
    @cherrypy.expose
    def index(self):
        authenticate_user()
        stuff = {'zones': sorted(config.zones.keys())}
        return Template(file='templates/index.tmpl', searchList=[stuff]).respond()
    
    @cherrypy.expose
    def control(self, zone):
        authenticate_user()
        if zone not in config.zones:
            raise cherrypy.HTTPError(400)
        env = cherrypy.request.wsgi_environ
        username = env['REMOTE_USER'] if 'REMOTE_USER' in env else 'tester@TEST.COM'
        name = env['SSL_CLIENT_S_DN_CN'] if 'SSL_CLIENT_S_DN_CN' in env else 'Test User'
        stuff = {'zone': zone, 'user': username, 'name': name}
        return Template(file='templates/interface.tmpl', searchList=[stuff]).respond()
    
    @cherrypy.expose
    def stream(self, track_id):
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
