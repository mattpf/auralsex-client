#!/usr/bin/env python
import main
import cherrypy

app = cherrypy.tree.mount(main.AuralSex())
cherrypy.config.update({
    "engine.autoreload_on":False,
    "log.access_file": "/tmp/cherry_access.log",
    "log.error_file": "/tmp/cherry_error.log",
    'environment': 'production',
})


from flup.server.fcgi import WSGIServer
WSGIServer(app).run()
