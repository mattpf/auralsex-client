AuralSex.Queue = {
    Store: new Ext.data.JsonStore({
        url: '/api/get_queue/' + AURALSEX_ZONE,
        root: 'queue',
        fields: ['index', 'track_id', 'title', 'artist', 'album']
    }),
    Append: function(tracks) {
        var to_add = [];
        tracks.each(function(track) {
            to_add.push(track.get('track_id'));
        });
        new Ajax.Request("/api/append/" + AURALSEX_ZONE + "?track_id=" + to_add.join(','));
    },
    Retrieve: function(callback) {
        new Ajax.Request("/api/get_queue/" + AURALSEX_ZONE, {
            onSuccess: function(response) {
                callback(response.responseJSON);
            },
            onError: function(response) {
                callback(null);
            }
        });
    },
    Play: function(pos) {
        new Ajax.Request("/api/skip/" + AURALSEX_ZONE + "?to=" + pos);
    },
    Remove: function(rows) {
        to_die = []
        rows.each(function(item) {
            to_die.push(item.get('index'));
        });
        new Ajax.Request("/api/remove/" + AURALSEX_ZONE + "?index=" + to_die.join(','));
        
        AuralSex.Queue.Store.remove(rows);        
        // Fixup indices.
        var i = 0;
        AuralSex.Queue.Store.getRange().each(function(item){
            item.set('index', i++);
        });
        AuralSex.Queue.Store.commitChanges();
    },
    Clear: function() {
        new Ajax.Request("/api/clear_queue/" + AURALSEX_ZONE);
        AuralSex.Queue.Store.removeAll();
    }
};

AuralSex.Queue.Grid = new Ext.grid.GridPanel({
    border: false,
    store: AuralSex.Queue.Store,
    columns: [
        {id: 'title', header: 'Title', sortable: false, dataIndex: 'title'},
        {id: 'album', header: 'Album', sortable: false, dataIndex: 'album', width: 200},
        {id: 'artist', header: 'Artist', sortable: false, dataIndex: 'artist', width: 200}
    ],
    stripeRows: true,
    autoExpandColumn: 'title',
    enableDragDrop: true,
    ddGroup: "tracks",
    listeners: {
        rowdblclick: function(self, rowIndex) {
            AuralSex.Queue.Play(rowIndex);
        }
    },
    keys: {
        key: [8, 46], // Backspace, delete
        stopEvent: true,
        handler: function() {
            rows = AuralSex.Queue.Grid.selModel.getSelections();
            AuralSex.Queue.Remove(rows);
        }
    }
});
