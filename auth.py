import logging
import time
try:
    import moira
except ImportError:
    logging.warning("Will crash on moira auth. Continuing for now...")

class Auth(object):
    def __init__(self, group, max_cache_time=60):
        self.auth_users = set()
        self.group = group
        self.last_update = 0
        self.max_cache_time = max_cache_time
    
    def grab_list_members(self, lists):
        for l in lists:
            try:
                members = moira.query('get_members_of_list', l)
                self.auth_users.update(x['member_name'] for x in members if x['member_type'] == 'USER')
                self.grab_list_members(x['member_name'] for x in members if x['member_type'] == 'LIST')
            except moira.MoiraException as (errno, errstr):
                logging.warning("Moira error: %s" % errstr)
    
    def update_cache(self):
        moira.connect()
        self.auth_users.clear()
        self.grab_list_members((self.group,))
        moira.disconnect()
    
    def check_user(self, user):
        if '@' in user:
            user = user.split('@')[0]
        if self.last_update < time.time() - self.max_cache_time:
            self.update_cache()
        return user in self.auth_users
