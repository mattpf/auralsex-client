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
    },
    PreviewColumn: function(value, metaData, record, rowIndex, colIndex, store) {
        metaData.attr = 'id="auralsex-queue-preview-' + rowIndex + '"';
        return "<span class='auralsex-track-number'>" + (rowIndex + 1) + "</span>";
    }
};

AuralSex.Queue.Grid = new Ext.grid.GridPanel({
    border: false,
    store: AuralSex.Queue.Store,
    columns: [
        {id: 'index', header: '', dataIndex: 'index', width: 30, renderer: AuralSex.Queue.PreviewColumn},
        {id: 'title', header: 'Title', dataIndex: 'title'},
        {id: 'album', header: 'Album', dataIndex: 'album', width: 200},
        {id: 'artist', header: 'Artist', dataIndex: 'artist', width: 200}
    ],
    stripeRows: true,
    autoExpandColumn: 'title',
    enableDragDrop: true,
    ddGroup: "tracks",
    listeners: {
        rowdblclick: function(self, rowIndex) {
            AuralSex.Queue.Play(rowIndex);
        },
        mouseover: function(e) {
            var target = e.getTarget();
            var row = AuralSex.Queue.Grid.view.findRowIndex(target);
            if(!AuralSex.PreviewElement.Playing()) {
                if(row !== false) {
                    AuralSex.PreviewElement.PrependTo($('auralsex-queue-preview-' + row));
                    AuralSex.PreviewElement.SetTrack(AuralSex.Queue.Store.getAt(row).get('track_id'));
                } else {
                    AuralSex.PreviewElement.Remove();
                } 
            }
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
