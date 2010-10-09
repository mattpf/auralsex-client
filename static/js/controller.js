AuralSex = {
    init: function() {
        AuralSex.SongStore = new Ext.data.JsonStore({
            url: '/api/search',
            root: 'music',
            fields: ['id', 'title', 'artist', 'album']
        });
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
            view: new Ext.ux.grid.BufferView({scrollDelay: false}),
            listeners: {
                rowdblclick: function(self, rowIndex) {
                    AuralSex.Play(AuralSex.SongStore.getAt(rowIndex).get('id'))
                }
            }
        });
		AuralSex.VolumeSlider = new Ext.Slider({
			id: 'volume-slider',
            width: 100,
            increment: 1,
            minValue: 0,
            maxValue: 10,
            disabled: true,
			listeners: {
				change: function(slider) {
					AuralSex.SetVolume(slider.getValue())
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
                cmargins:'5 5 5 5'
            },{
                region:'center',
                layout: 'fit',
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
			AuralSex.VolumeSlider.setValue(volume, false);
			AuralSex.VolumeSlider.setDisabled(false);
		});
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

Ext.onReady(AuralSex.init)
