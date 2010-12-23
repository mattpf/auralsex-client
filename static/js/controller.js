AuralSex = {
    init: function() {
        AuralSex.SongStore = new Ext.data.JsonStore({
            url: '/api/search',
            root: 'music',
            fields: ['track_id', 'title', 'artist', 'album']
        });
        AuralSex.SongGrid = new Ext.grid.GridPanel({
            border: false,
            store: AuralSex.SongStore,
            columns: [
                {id: 'preview', header: '', sortable: false, width: 30, renderer: AuralSex.SearchPreviewColumn},
                {id: 'title', header: 'Title', sortable: true, dataIndex: 'title'},
                {id: 'album', header: 'Album', sortable: true, dataIndex: 'album', width: 200},
                {id: 'artist', header: 'Artist', sortable: true, dataIndex: 'artist', width: 200}
            ],
            stripeRows: true,
            autoExpandColumn: 'title',
            enableDragDrop: true,
            ddGroup: "tracks",
            listeners: {
                rowdblclick: function(self, rowIndex) {
                    AuralSex.Play(AuralSex.SongStore.getAt(rowIndex).get('track_id'))
                },
                mouseover: function(e) {
                    var target = e.getTarget();
                    var row = AuralSex.SongGrid.view.findRowIndex(target);
                    if(!AuralSex.PreviewElement.Playing()) {
                        if(row !== false) {
                            AuralSex.PreviewElement.PrependTo($('auralsex-search-preview-' + row));
                            AuralSex.PreviewElement.SetTrack(AuralSex.SongStore.getAt(row).get('track_id'));
                        } else {
                            AuralSex.PreviewElement.Remove();
                        } 
                    }
                }
            }
        });

        AuralSex.NowPlaying = new Ext.Toolbar.TextItem({text: '(loading...)'});
        AuralSex.State = new Ext.Toolbar.TextItem({text: '', cls: 'state-display'});
        
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
        
        AuralSex.SearchField = new Ext.form.TextField({
            id: 'search-field',
            emptyText: 'Search',
            enableKeyEvents: true,
            listeners: {
                keypress: function(field) {
                    val = field.getValue()
                    if(val.length >= 3) {
                        AuralSex.SongStore.load({params: {search: val}})
                    } else {
                        AuralSex.SongStore.removeAll();
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
                    }, '->', 'Volume: ', AuralSex.VolumeSlider, ' ', AuralSex.SearchField]
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
                items: [AuralSex.Sidebar]
            },{
                region:'center',
                layout: 'fit',
                id: 'table-panel',
                margins:'5 5 5 0',
                autoScroll:true,
                items:[AuralSex.SongGrid]
            }, {
                region: 'south',
                layout: 'fit',
                id: 'nowplaying-panel',
                height: 28,
                resizable: false,
                items: [new Ext.Toolbar({
                    border: false,
                    items: [AuralSex.State, '-', AuralSex.NowPlaying]
                })]
            }]
        });
        
        AuralSex.ActiveView = 'library';
        AuralSex.ActiveGrid = AuralSex.SongGrid;

        // Look up the current volume
        AuralSex.GetVolume(function(volume) {
            AuralSex.VolumeSlider.setDisabled(false);
            AuralSex.VolumeSlider.setValue(volume, false);
            volume_ready = true;
        });
        
        // Initial load of the queue
        AuralSex.Queue.Store.load();
        AuralSex.Playlist.Store.load();
        
        // Prepare the preview
        AuralSex.PreviewElement.init();
        
        // Poll for the current track.
        new PeriodicalExecuter(AuralSex.UpdateNowPlaying, 5);
        new PeriodicalExecuter(AuralSex.UpdateState, 5);
        AuralSex.UpdateNowPlaying();
        AuralSex.UpdateState();
        
        // Highlight the first thingy.
        AuralSex.Sidebar.root.firstChild.select();
    },
    
    Pause: function() {
        new Ajax.Request("/api/pause/" + AURALSEX_ZONE);
    },
    
    Play: function(id) {
        new Ajax.Request("/api/play/" + AURALSEX_ZONE + "?track_id=" + id);
    },
    
    Next: function() {
        new Ajax.Request("/api/skip/" + AURALSEX_ZONE);
        AuralSex.UpdateNowPlaying();
    },
    
    Back: function() {
        new Ajax.Request("/api/back/" + AURALSEX_ZONE);
        AuralSex.UpdateNowPlaying();
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
    },
    
    GetNowPlaying: function(callback) {
        new Ajax.Request("/api/now_playing/" + AURALSEX_ZONE, {
            onSuccess: function(response) {
                callback(response.responseJSON.playing)
            },
            onFailure: function(response) {
                callback(null);
            }
        });
    },
    
    UpdateNowPlaying: function() {
        AuralSex.GetNowPlaying(function(track) {
            if(track == null) {
                AuralSex.NowPlaying.setText("(nothing)")
            } else {
                AuralSex.NowPlaying.setText(track.title + " (" + track.album + ") - " + track.artist);
            }
        });
    },
    
    GetState: function(callback) {
        new Ajax.Request("/api/state/" + AURALSEX_ZONE, {
            onSuccess: function(response) {
                callback(response.responseJSON.state);
            },
            onFailure: function(response) {
                callback(null);
            }
        })
    },
    
    UpdateState: function() {
        AuralSex.GetState(function(state) {
            var text;
            if(state == "playing") {
                text = "Playing";
            } else if(state == "paused") {
                text = "Paused";
            } else if(state == "stopped") {
                text = "Stopped";
            } else {
                text = "(unknown)";
            }
            AuralSex.State.setText(text);
        })
    },
    
    SearchPreviewColumn: function(value, metaData, record, rowIndex, colIndex, store) {
        metaData.attr = 'id="auralsex-search-preview-' + rowIndex + '"';
        return "";
    }
}

Ext.onReady(AuralSex.init);
