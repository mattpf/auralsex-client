(function () {
    function handle_dropped_tracks(e) {
        target = e.target.id;
        tracks = AuralSex.ActiveGrid.selModel.getSelections();
        if(target == 'tree-node-queue') {
            AuralSex.Queue.Append(tracks);
        } else if(target == 'tree-node-personal') {
            AuralSex.Playlist.Append(tracks);
        }
    }
    
    function check_drop(e) {
        target = e.target.id;
        if(target == "tree-node-library") { // You can never drag things into the library.
            return false;
        } else if('tree-node-' + AuralSex.ActiveView != target && !e.target.isRoot) { // You can drop onto the others, but not from themselves.
            return true;
        } else {
            return false;
        }
    }
    
    function select_view(node, e) {
        AuralSex.PreviewElement.Pause();
        AuralSex.PreviewElement.Remove();
        AuralSex.Viewport.getComponent('table-panel').removeAll(false);
        AuralSex.Viewport.getComponent("table-panel").update();
        if(node.id == "tree-node-library") {
            AuralSex.ActiveView = 'library';
            AuralSex.ActiveGrid = AuralSex.SongGrid
            AuralSex.SearchField.enable();
        } else {
            AuralSex.SearchField.disable();
            if(node.id == "tree-node-queue") {
                AuralSex.Queue.Store.load();
                AuralSex.ActiveView = 'queue';
                AuralSex.ActiveGrid = AuralSex.Queue.Grid;
            }
            else if(node.id == "tree-node-personal") {
                AuralSex.ActiveView = 'personal';
                AuralSex.ActiveGrid = AuralSex.Playlist.Grid;
            }
        }    
        AuralSex.Viewport.getComponent('table-panel').add(AuralSex.ActiveGrid);
        AuralSex.Viewport.doLayout();
    }
    
    function show_queue_menu(node, e) {
        if(!this.menu) {
            this.menu = new Ext.menu.Menu({
                id: 'queue-context',
                items: [{
                    id: 'queue-clear',
                    text: 'Empty queue',
                    handler: AuralSex.Queue.Clear
                }]
            });
        }
        node.select();
        this.menu.showAt(e.getXY());
    }
    
    function show_personal_menu(node, e) {
        if(!this.menu) {
            this.menu = new Ext.menu.Menu({
                id: 'personal-context',
                items: [{
                    id: 'personal-clear',
                    text: 'Clear playlist',
                    handler: AuralSex.Playlist.Clear
                }, {
                    id: 'personal-play',
                    text: 'Play',
                    handler: AuralSex.Playlist.Play
                }]
            });
        }
        node.select();
        this.menu.showAt(e.getXY());
    }
    
    var tree = new Ext.tree.TreePanel({
        animate: true,
        border: false,
        rootVisible: false,
        enableDrop: true,
        ddGroup: "tracks",
        id: "playlist-tree",
        lines: false,
        listeners: {
            beforenodedrop: handle_dropped_tracks,
            nodedragover: check_drop,
            click: select_view,
            contextmenu: Prototype.emptyFunction // Prevents the context menu showing.
        },
        root: new Ext.tree.TreeNode({
            expanded: true
        })
    });
    
    tree.root.appendChild(new Ext.tree.TreeNode({
        text: "Library",
        leaf: true,
        id: "tree-node-library",
        iconCls: 'playlist-icon'
    }));
    tree.root.appendChild(new Ext.tree.TreeNode({
        text: "Queue",
        leaf: true,
        id: "tree-node-queue",
        iconCls: 'playlist-icon',
        listeners: {
            contextmenu: show_queue_menu
        }
    }));
    
    var name = AURALSEX_NAME.split(' ')[0];
    var possessive = "'";
    if(name[name.length - 1] != "s") possessive += 's';
    
    tree.root.appendChild(new Ext.tree.TreeNode({
        text: name + possessive + " Playlist",
        leaf: true,
        id: "tree-node-personal",
        iconCls: 'playlist-icon',
        listeners: {
            contextmenu: show_personal_menu
        }
    }));
    
    AuralSex.Sidebar = tree;
})();
