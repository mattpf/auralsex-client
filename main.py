#!/usr/bin/env python
import os
import cherrypy
from Cheetah.Template import Template

import zones
import api

current_dir = os.path.dirname(os.path.abspath(__file__))

class AuralSex(object):
    def __init__(self):
        self.api = api.AuralAPI()
    
    @cherrypy.expose
    def index(self):
        stuff = {'zones': sorted(zones.zones.keys())}
        return Template(file='templates/index.tmpl', searchList=[stuff]).respond()
    
    @cherrypy.expose
    def control(self, zone):
        if zone not in zones.zones:
            raise cherrypy.HTTPError(400)
        stuff = {'zone': zone}
        return Template(file='templates/interface.tmpl', searchList=[stuff]).respond()

if __name__ == '__main__':
    cherrypy.quickstart(AuralSex(), '/', 'cherrypy.conf')
