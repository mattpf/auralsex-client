#!/usr/bin/env python
import cherrypy
from Cheetah.Template import Template

class AuralSex(object):
    @cherrypy.expose
    def index(self):
        return Template(file='templates/index.tmpl').respond()

if __name__ == '__main__':
    cherrypy.quickstart(AuralSex(), '/', 'cherrypy.conf')
