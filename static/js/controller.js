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
            view: new Ext.ux.grid.BufferView({scrollDelay: false})
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
                        text: 'Play',
                        listeners: {
                            click: AuralSex.Play
                        }
                    }, {
                        text: 'Pause',
                        listeners: {
                            click: AuralSex.Pause
                        }
                    }, {
                        text: 'Stop',
                        listeners: {
                            click: AuralSex.Stop
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
                    }, '->', 'Volume: ', {
                        xtype: 'slider',
                        width: 100,
                        increment: 1,
                        minValue: 0,
                        maxValue: 10,
                        disabled: true
                    },' ', {
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
        })
    },
    
    Stop: function() {
        new Ajax.Request("/api/stop/" + AURALSEX_ZONE)
    },
    
    Pause: function() {
        new Ajax.Request("/api/pause/" + AURALSEX_ZONE)
    },
    
    Play: function() {
        new Ajax.Request("/api/play/" + AURALSEX_ZONE)
    },
    
    Next: function() {
        new Ajax.Request("/api/skip/" + AURALSEX_ZONE)
    },
    
    Back: function() {
        new Ajax.Request("/api/back/" + AURALSEX_ZONE)
    }
}

Ext.onReady(AuralSex.init)
