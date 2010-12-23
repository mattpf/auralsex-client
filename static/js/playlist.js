AuralSex.Playlist = {
    Store: new Ext.data.JsonStore({
        url: '/api/playlist',
        root: 'playlist',
        fields: ['entry_id', 'index', 'track_id', 'title', 'artist', 'album']
    }),
    Append: function(tracks) {
        var track_ids = [];
        tracks.each(function(track) {
            track_ids.push(track.get('track_id'));
        });
        new Ajax.Request('/api/playlist_append?tracks=' + track_ids.join(','));
        AuralSex.Playlist.Store.add(tracks);
        var i = 0;
        AuralSex.Playlist.Store.getRange().each(function(item){
            item.set('index', ++i);
        });
        AuralSex.Playlist.Store.commitChanges();
    },
    Remove: function(tracks) {
        var to_die = [];
        tracks.each(function(item) {
            to_die.push(item.get('entry_id'));
        });
        new Ajax.Request('/api/playlist_delete?tracks=' + to_die.join(','));
        AuralSex.Playlist.Store.remove(tracks);
        
        // Fixup indices.
        var i = 0;
        AuralSex.Playlist.Store.getRange().each(function(item){
            item.set('index', ++i);
        });
        AuralSex.Playlist.Store.commitChanges();
    },
    SetOrder: function(order) {
        new Ajax.Request('/api/playlist_reorder?order=' + order.join(','));
    },
    Play: function() {
        new Ajax.Request('/api/play_playlist/' + AURALSEX_ZONE);
        AuralSex.Queue.Store.removeAll();
        AuralSex.Queue.Store.add(AuralSex.Playlist.Store.getRange());
        AuralSex.Queue.Store.commitChanges();
    },
    Clear: function() {
        new Ajax.Request('/api/clear_playlist');
        AuralSex.Playlist.Store.removeAll();
        AuralSex.Playlist.Store.commitChanges();
    },
    PreviewColumn: function(value, metaData, record, rowIndex, colIndex, store) {
        metaData.attr = 'id="auralsex-playlist-preview-' + rowIndex + '"';
        return "<span class='auralsex-track-number'>" + value + "</span>";
    }
}

AuralSex.Playlist.Grid = new Ext.grid.GridPanel({
    border: false,
    store: AuralSex.Playlist.Store,
    columns: [
        {id: 'index', header: '', sortable: false, dataIndex: 'index', width: 30, renderer: AuralSex.Playlist.PreviewColumn},
        {id: 'title', header: 'Title', sortable: false, dataIndex: 'title', width: 200},
        {id: 'album', header: 'Album', sortable: false, dataIndex: 'album', width: 200},
        {id: 'artist', header: 'Artist', sortable: false, dataIndex: 'artist', width: 200}
    ],
    stripeRows: true,
    autoExpandColumn: 'title',
    enableDragDrop: true,
    ddGroup: "tracks",
    plugins: [new Ext.ux.dd.GridDragDropRowOrder({
        scrollable: true,
        listeners: {
            afterrowmove: function(target, r, inn, selection) {
                var new_order = [];
                var i = 0;
                AuralSex.Playlist.Store.getRange().each(function(item) {
                    item.set('index', ++i);
                    new_order.push(item.get('entry_id'));
                });
                AuralSex.Playlist.SetOrder(new_order);
                AuralSex.Playlist.Store.commitChanges();
            }
        }
    })],
    keys: {
        key: [8, 46], // Backspace, delete
        stopEvent: true,
        handler: function() {
            var rows = AuralSex.Playlist.Grid.selModel.getSelections();
            AuralSex.Playlist.Remove(rows);
        }
    },
    listeners: {
        mouseover: function(e) {
            var target = e.getTarget();
            var row = AuralSex.Playlist.Grid.view.findRowIndex(target);
            if(!AuralSex.PreviewElement.Playing()) {
                if(row !== false) {
                    AuralSex.PreviewElement.PrependTo($('auralsex-playlist-preview-' + row));
                    AuralSex.PreviewElement.SetTrack(AuralSex.Playlist.Store.getAt(row).get('track_id'));
                } else {
                    AuralSex.PreviewElement.Remove();
                } 
            }
        }
    }
});
