// This is a brief tutorial shown on the first run of the site.

AuralSex.FirstRun = function() {
    // Create a bunch of pointy arrows.
    var search_arrow = new Element('img', {
        className: 'firstrun-arrow',
        style: 'top: 20px; right: 60px;',
        src: '/static/images/tutorial/arrow-tr.png'
    });
    var now_playing_arrow = new Element('img', {
        className: 'firstrun-arrow',
        style: 'bottom: 25px; left: 100px',
        src: '/static/images/tutorial/arrow-bl.png'
    });
    var controls_arrow = new Element('img', {
        className: 'firstrun-arrow',
        style: 'top: 20px; left: 60px;',
        src: '/static/images/tutorial/arrow-tl.png'
    });
    var volume_arrow = new Element('img', {
        className: 'firstrun-arrow',
        style: 'top: 20px; right: 190px;',
        src: '/static/images/tutorial/arrow-tr.png'
    });
    var playlists_arrow = new Element('img', {
        className: 'firstrun-arrow',
        style: 'top: 63px; left: 110px;',
        src: '/static/images/tutorial/arrow-l.png'
    });
    
    var tutorial_steps = [
        [
            function(win) {
                win.setTitle("Welcome to Aural Sex!");
                win.update(
                    "<p>This tutorial will briefly demonstrate how to play music around Beast " + 
                    "(or, at least, in one of the bathrooms...).</p>" + 
                    "<p>You will only see this window <em>once</em>. Click \"next\" at the bottom" +
                    " of this window to continue, or the close button to quit the tutorial. This is advisable" + 
                    " if you object to patronising red arrows (like that one down there).</p>" + 
                    "<img src='/static/images/tutorial/arrow-br.png' style='position: absolute; display: block; bottom: 35px; right: 55px;'>"
                );
            },
            Prototype.emptyFunction
        ], [
            function(win) {
                win.setTitle("Finding Music");
                win.update(
                    "<p>To find music, type search terms into the search box at the top right. Results " +
                    "will appear as you type.</p>" + 
                    "<p class='nb'>You must enter at least three characters before a search is performed.</p>" +
                    "<p>If your web browser supports it (Safari or Chrome), you can press the play button that " +
                    "appears to the left of each row as you hover over it to preview the track on your computer.</p>" +
                    "<table><tr><td><p>For instance:</p></td><td><div id='tutorial_preview_button'></div></td></tr></table>"
                );
                new AuralSex.Preview($('tutorial_preview_button'), 6287); // 6287 = "Love Me Do" by The Beatles.
                document.body.appendChild(search_arrow);
                AuralSex.SearchField.setValue("The Beatles");
                AuralSex.SongStore.load({params: {search: "The Beatles"}});
            },
            function(win) {
                search_arrow.parentNode.removeChild(search_arrow);
            }
        ], [
            function(win) {
                win.setTitle("Playing Music");
                var is_mac = (navigator.appVersion.indexOf("Mac")!=-1);
                var ctrl = 'ctrl';
                if(is_mac) {
                    ctrl = 'command';
                }
                win.update(
                    "<p>The simplest way to play music is to double-click it; this will cause the track to play " + 
                    "immediately. <em>However</em>, this approach is not recommended; instead you should " +
                    "add the music to the <b>queue</b>." +
                    "<p>To add music to the queue drag the music from the list of tracks into the \'Queue\'" +
                    " on the left.</p><p><img src='/static/images/tutorial/queue_dragdrop.png'></p>" +
                    "<p class='nb'>You can select multiple tracks to drag by shift-clicking or " + ctrl + "-clicking.</em></p>"
                );
                document.body.appendChild(playlists_arrow);
            },
            function(win) {
                playlists_arrow.parentNode.removeChild(playlists_arrow);
            }
        ], [
            function(win) {
                document.body.appendChild(playlists_arrow);
                win.setTitle("Controlling the Queue");
                win.update(
                    "<p>You can control the music in the queue by clicking <strong>Queue</strong> in the sidebar.</p>" +
                    "<p>From there you can perform the following actions:</p>" + 
                    "<ul>" +
                        "<li><strong>Delete tracks</strong> &ndash; Select the track(s) in question and " + 
                            "press the <b>delete</b> or <b>backspace</b> key on your keyboard.</li>" +
                        "<li><strong>Skip to a song</strong> &ndash; Double click on a track in the queue. Playback" + 
                            " will immediately skip to that track.</li>" +
                    "</ul>" +
                    "<p>Additionally, you can clear the queue by right-clicking the Queue entry on the left" + 
                    " and selecting <strong>Empty queue</strong>.</p>" +
                    "<p class='nb'>After adding songs to the queue you may wish to skip to a song to ensure that it is playing.</p>"
                );
            },
            function(win) {
                playlists_arrow.parentNode.removeChild(playlists_arrow);
            }
        ], [
            function(win) {
                win.setTitle("Controling Playback");
                win.update(
                    "<p>For general control of the music, you can use the highlighted controls:</p>" +
                    "<ul>" +
                        "<li><strong>Play/pause/back/next</strong> (top left) let you play/pause playback " +
                            "or skip back and forth through the queue.</li>" +
                        "<li><strong>Volume</strong> (top right) enables you to change the playback volume. " +
                            "<span class='nb'>Hint: you probably want this quite high if you're showering.</span></li>" +
                        "<li><strong>Now playing</strong> (bottom left) shows what's currently playing, if anything.</li>" +
                    "</ul>" +
                    "<p class='nb'>The Now Playing display lags by several seconds; do not assume that changes will cause " +
                    "it to instantaneously update.</p>"
                );
                document.body.appendChild(now_playing_arrow);
                document.body.appendChild(controls_arrow);
                document.body.appendChild(volume_arrow);
            },
            function(win) {
                volume_arrow.parentNode.removeChild(volume_arrow);
                controls_arrow.parentNode.removeChild(controls_arrow);
                now_playing_arrow.parentNode.removeChild(now_playing_arrow);
            }
        ], [
            function(win) {
                var name = AURALSEX_NAME.split(' ')[0];
                var possessive = "'";
                if(name[name.length - 1] != "s") possessive += 's';
                var playlist_name = name + possessive + " Playlist";
                document.body.appendChild(playlists_arrow);
                win.setTitle("Using Playlists");
                win.update(
                    "<p>If you find that you frequently play the same music, you can add it to your " +
                    "<strong>playlist</strong>.</p>" +
                    "<p>You can add tracks to your playlist by dragging them from either the queue or " +
                    "the library to <strong>" + playlist_name + "</strong>. To play the " +
                    "music you may either drag tracks from your playlist into the queue, or right click" +
                    " on <strong>" + playlist_name + "</strong> and select <strong>Play</strong>."
                );
                next_button.setText("Finish");
            },
            function(win) {
                playlists_arrow.parentNode.removeChild(playlists_arrow);
                next_button.setText("Next");
            }
        ]
    ];
    
    var tutorial_pointer = 0;
    
    var win = null;
    
    function handle_back_button(b, e) {
        if(tutorial_pointer <= 0) return;
        tutorial_steps[tutorial_pointer][1](win);
        tutorial_steps[--tutorial_pointer][0](win);
        if(tutorial_pointer <= 0) {
            b.disable();
        }
    }
    
    function handle_next_button(b, e) {
        if(tutorial_pointer >= tutorial_steps.length - 1) {
            handle_close_button(null, e);
            return;
        }
        tutorial_steps[tutorial_pointer][1](win);
        tutorial_steps[++tutorial_pointer][0](win);
        back_button.enable();
    }

    function handle_close_button(b, e) {
        win.close();
    }
    
    function handle_closed() {
        tutorial_steps[tutorial_pointer][1](win);
        return true;
    }
    
    var back_button = new Ext.Button({text: 'Back', disabled: true, handler: handle_back_button});
    var next_button = new Ext.Button({text: 'Next', handler: handle_next_button});
    
    var win = new Ext.Window({
        floating: true,
        width: 400,
        height: 330,
        modal: true,
        autoCreate: true,
        resizable: false,
        title: "First Run Tutorial",
        cls: 'tutorial',
        footer: true,
        fbar: new Ext.Toolbar({
            items: [back_button, next_button]
        }),
        listeners: {
            beforeclose: handle_closed
        }
    });
    win.render(document.body);
    tutorial_steps[0][0](win);
    win.show();
    
};

Ext.onReady(AuralSex.FirstRun);
