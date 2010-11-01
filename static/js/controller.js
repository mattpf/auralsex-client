AuralSex = {
    init: function() {
        AuralSex.SongStore = new Ext.data.JsonStore({
            url: '/api/search',
            root: 'music',
            fields: ['id', 'title', 'artist', 'album']
        });
        AuralSex.QueueStore = new Ext.data.JsonStore({
            url: '/api/get_queue/' + AURALSEX_ZONE,
            root: 'queue',
            fields: ['index', 'track_id', 'title', 'artist', 'album']
        })
        AuralSex.SongGrid = new Ext.grid.GridPanel({
            border: false,
            store: AuralSex.SongStore,
            columns: [
                {id: 'title', header: 'Title', sortable: true, dataIndex: 'title'},
                {id: 'album', header: 'Album', sortable: true, dataIndex: 'album', width: 200},
                {id: 'artist', header: 'Artist', sortable: true, dataIndex: 'artist', width: 200}
            ],
            stripeRows: true,
            autoExpandColumn: 'title',
            emptyText: "Search for something!",
            deferEmptyText: false,
            enableDragDrop: true,
            ddGroup: "tracks",
            view: new Ext.ux.grid.BufferView({scrollDelay: false}),
            listeners: {
                rowdblclick: function(self, rowIndex) {
                    AuralSex.Play(AuralSex.SongStore.getAt(rowIndex).get('id'))
                }
            }
        });
        AuralSex.QueueGrid = new Ext.grid.GridPanel({
            border: false,
            store: AuralSex.QueueStore,
            columns: [
                {id: 'title', header: 'Title', sortable: false, dataIndex: 'title'},
                {id: 'album', header: 'Album', sortable: false, dataIndex: 'album', width: 200},
                {id: 'artist', header: 'Artist', sortable: false, dataIndex: 'artist', width: 200}
            ],
            stripeRows: true,
            autoExpandColumn: 'title',
            emptyText: 'The queue is empty.',
            listeners: {
                rowdblclick: function(self, rowIndex) {
                    AuralSex.Queue.Play(rowIndex);
                }
            },
            keys: {
                key: [8, 46], // Backspace, delete
                stopEvent: true,
                handler: function() {
                    rows = AuralSex.QueueGrid.selModel.getSelections();
                    to_die = []
                    rows.each(function(item) {
                        to_die.push(item.get('index'));
                    });
                    AuralSex.QueueStore.remove(rows);
                    AuralSex.Queue.Remove(to_die);
                    
                    // Fixup indices.
                    var i = 0;
                    AuralSex.QueueStore.getRange().each(function(item){
                        item.set('index', i++);
                    });
                    AuralSex.QueueStore.commitChanges();
                }
            }
        });
        AuralSex.PlaylistTree = new Ext.tree.TreePanel({
            animate: true,
            border: false,
            rootVisible: false,
            enableDrop: true,
            ddGroup: "tracks",
            id: "playlist-tree",
            listeners: {
                beforenodedrop: function(e) {
                    tracks = AuralSex.SongGrid.selModel.getSelections();
                    tracks.each(function(track) {
                        AuralSex.Queue.Append(track.get('id'));
                    });
                },
                nodedragover: function(e) {
                    return (e.target.id == "tree-node-queue");
                },
                click: function(node, e) {
                    AuralSex.Viewport.getComponent('table-panel').removeAll(false);
                    AuralSex.Viewport.getComponent("table-panel").update();
                    if(node.id == "tree-node-queue") {
                        AuralSex.QueueStore.load();
                        AuralSex.Viewport.getComponent('table-panel').add(AuralSex.QueueGrid);
                    } else if(node.id == "tree-node-library") {
                        AuralSex.Viewport.getComponent('table-panel').add(AuralSex.SongGrid);
                    }
                    AuralSex.Viewport.doLayout();
                }
            },
            root: new Ext.tree.TreeNode({
                expanded: true
            })
        });
        AuralSex.PlaylistTree.root.appendChild(new Ext.tree.TreeNode({
            text: "Library",
            leaf: true,
            id: "tree-node-library"
        }));
        AuralSex.PlaylistTree.root.appendChild(new Ext.tree.TreeNode({
            text: "Queue",
            leaf: true,
            id: "tree-node-queue"
        }));
        AuralSex.PlaylistTree.root.appendChild(new Ext.tree.TreeNode({
            text: "Playlists",
            leaf: false,
            id: "tree-node-playlists"
        }));
        
        var volume_ready = false;
        
        AuralSex.VolumeSlider = new Ext.Slider({
            id: 'volume-slider',
            width: 100,
            increment: 1,
            minValue: 1,
            maxValue: 10,
            disabled: true,
            listeners: {
                change: function(slider) {
                    if(volume_ready) {
                        AuralSex.SetVolume(slider.getValue())
                    }
                }
            }
        });
        AuralSex.Viewport = new Ext.Viewport({
            layout:'border',
            items:[{
                region: 'north',
                id: 'toolbar-panel',
                height: 28,
                items: [new Ext.Toolbar({
                    border: false,
                    items: [{
                        text: 'Play/Pause',
                        listeners: {
                            click: AuralSex.Pause
                        }
                    }, '-', {
                        text: 'Back',
                        listeners: {
                            click: AuralSex.Back
                        }
                    }, {
                        text: 'Next',
                        listeners: {
                            click: AuralSex.Next
                        }
                    }, '->', 'Volume: ', AuralSex.VolumeSlider, ' ', {
                        xtype: 'textfield',
                        emptyText: "Search",
                        id: 'search-field'
                    }]
                })]
            },{
                region:'west',
                id:'sidebar-panel',
                title:'Playlists',
                split:true,
                width: 250,
                resizable: false,
                margins:'5 0 5 5',
                cmargins:'5 5 5 5',
                layout: 'fit',
                items: [AuralSex.PlaylistTree]
            },{
                region:'center',
                layout: 'fit',
                id: 'table-panel',
                margins:'5 5 5 0',
                autoScroll:true,
                items:[AuralSex.SongGrid]
            }]
        });
        Ext.get('search-field').on('keyup', function() {
            val = Ext.get('search-field').getValue()
            if(val.length >= 3) {
                AuralSex.SongStore.load({params: {search: val}})
            } else {
                AuralSex.SongStore.removeAll();
            }
        });

        // Look up the current volume
        AuralSex.GetVolume(function(volume) {
            AuralSex.VolumeSlider.setDisabled(false);
            AuralSex.VolumeSlider.setValue(volume, false);
            volume_ready = true;
        });
        
        // Initial load of the queue
        AuralSex.QueueStore.load();
    },
    
    Pause: function() {
        new Ajax.Request("/api/pause/" + AURALSEX_ZONE);
    },
    
    Play: function(id) {
        new Ajax.Request("/api/play/" + AURALSEX_ZONE + "?track_id=" + id);
    },
    
    Next: function() {
        new Ajax.Request("/api/skip/" + AURALSEX_ZONE);
    },
    
    Back: function() {
        new Ajax.Request("/api/back/" + AURALSEX_ZONE);
    },

    GetVolume: function(callback) {
        new Ajax.Request("/api/volume/" + AURALSEX_ZONE, {
            onSuccess: function(response) {
                callback(response.responseJSON.volume);
            }
        });
    },
    
    SetVolume: function(volume) {
        new Ajax.Request("/api/volume/" + AURALSEX_ZONE + "?volume=" + volume);
    }
}

Ext.onReady(AuralSex.init);
