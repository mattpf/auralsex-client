import os
import os.path
import mutagen
import sqlite3

"""
This scripts is used for database imports from the filesystem.
It is not very flexible, does little error checking, and is quite hackish.
"""

class MusicCatalog(object):
    def __init__(self, db):
        self.db_path = db
    
    def run(self, folder):
        self.db = sqlite3.connect(self.db_path)
        self.cursor = self.db.cursor()
        self.do_folder(folder)
        self.db.commit()
        self.cursor.close()
    
    def do_folder(self, root_path):
        files = os.listdir(root_path)
        for filename in files:
            path = root_path + '/' + filename
            if os.path.isdir(path):
                self.do_folder(path)
            else:
                try:
                    metadata = mutagen.File(path, easy=True)
                    if metadata is not None:
                        try:
                            path = unicode(path)
                        except UnicodeDecodeError:
                            print "Uninterpretable filename"
                            continue
                        album = unicode(metadata['album'][0]) if 'album' in metadata and len(metadata['album']) > 0 else None
                        track = metadata['tracknumber'][0] if 'tracknumber' in metadata and len(metadata['tracknumber']) > 0 else None
                        if track is not None and '/' in track:
                            track = track.split('/')[0]
                        try:
                            track = int(track)
                        except:
                            pass # Mehh.
                        title = unicode(metadata['title'][0]) if 'title' in metadata and len(metadata['title']) > 0 else None
                        artist = unicode(metadata['artist'][0]) if 'artist' in metadata and len(metadata['artist']) > 0 else None
                        if title is None:
                            title = unicode(filename)
                        print "%s (%s): %s - %s" % (album, track, title, artist)
                        self.cursor.execute("INSERT INTO music (filename, title, artist, album, track) VALUES (?, ?, ?, ?, ?)",
                            (unicode(path), title, artist, album, track))
                except:
                    pass

if __name__ == '__main__':
    catalog = MusicCatalog('music.dat')
    catalog.run('M:/Music')
