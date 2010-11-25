(function () {
    function handle_dropped_tracks(e) {
        tracks = AuralSex.SongGrid.selModel.getSelections();
        tracks.each(function(track) {
            AuralSex.Queue.Append(track.get('id'));
        });
    }
    
    function check_drop(e) {
        return (e.target.id == "tree-node-queue");
    }
    
    function select_view(node, e) {
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
            click: select_view
        },
        root: new Ext.tree.TreeNode({
            expanded: true
        })
    });
    
    tree.root.appendChild(new Ext.tree.TreeNode({
        text: "Library",
        leaf: true,
        id: "tree-node-library"
    }));
    tree.root.appendChild(new Ext.tree.TreeNode({
        text: "Queue",
        leaf: true,
        id: "tree-node-queue"
    }));
    
    AuralSex.Sidebar = tree;
})();