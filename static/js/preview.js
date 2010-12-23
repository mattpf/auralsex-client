AuralSex.Preview = function(container, track) {
    var mAudioElement = null;
    var mContainer = null;
    var mButton = null;
    var mShouldBePlaying = false;
    var mTrackID = null;
    
    // Internal handlers
    function on_have_enough_data() {
        set_song_percent(0);
        mAudioElement.play();
    }
    
    function on_paused() {
        mShouldBePlaying = false;
        mContainer.removeClassName('auralsex-playing');
        update_button_pos();
        set_song_percent(0);
    }
    
    function on_error() {
        error = mAudioElement.error;
        if(error.code == error.MEDIA_ERR_SRC_NOT_SUPPORTED) {
            if(Prototype.Browser.Gecko || Prototype.Browser.Opera) {
                Ext.MessageBox.alert("Ideological Differences", 
                    "For ideological reasons, Firefox and Opera do not support MP3/MP4 audio.<br />" +
                    "Try switching to <a href='http://www.google.com/chrome'>Chrome</a> or " +
                    "<a href='http://www.apple.com/safari/'>Safari</a>."
                );
            } else {
                Ext.MessageBox.alert("Unsupported format", "That track can't be played by your browser.")
            }
        } else if(error.code == error.MEDIA_ERR_DECODE) {
            Ext.MessageBox.alert("Error", "This track appears to be corrupt.");
        } else {
            Ext.MessageBox.alert("Error", "An error occurred playing this file.")
        }
        mShouldBePlaying = false;
        set_song_percent(0);
        update_button_pos();
    }

    function play_url(url) {
        mShouldBePlaying = true;
        mContainer.addClassName('auralsex-playing');
        mContainer.setStyle({
            backgroundImage: 'url(/static/images/preview-loading.gif)',
            backgroundPosition: '0px 0px'
        });
        mAudioElement.src = url;
        mAudioElement.load();
    }

    function play_id(id) {
        // We have to append .mp3 because Safari is fucking retarded and only plays MP3s
        // reliably on OS X if we serve with an application/octet-stream mimetype (but not
        // with an audio/mpeg one!) and the extension is .mp3. This appears to not break
        // its ability to play MP4s, however.
        // Chrome is unfased by this idiocy (though it actually gets it right anyway).
        // I know of no other browser that supports <audio> decently anyway:
        // Opera and Firefox both refuse to play anything useful solely for ideological
        // reasons and I can't test IE9 anyway.
        // ADDENDUM: Because Safari is even more retarded than previously believed,
        // we also now have to request the music from a different server. We pass
        // some basic authentication so random people can't just start listening.
        // Fuck Safari.
        play_url(AURALSEX_PREVIEW_SERVER + "/stream/" + id + ".mp3" + "?username=" + AURALSEX_USER + "&token=" + AURALSEX_PREVIEW_TOKEN);
    }
    
    function play() {
        play_id(mTrackID);
    }
    
    function pause() {
        mAudioElement.pause();
        on_paused();
    }
    
    function update_button_pos(offset) {
        if(!offset) offset = 0;
        var base_offset = !mShouldBePlaying ? 0 : -2;
        mButton.setStyle({backgroundPosition: (base_offset * 63 - offset * 21) + 'px 0px'});
    }
    
    function set_song_percent(percent) {
        mContainer.setStyle({
            backgroundPosition: (percent * -21) + 'px 0px',
            backgroundImage: 'url(/static/images/preview-progress-sprites.png)'
        });
    }
    
    function remove() {
        mShouldBePlaying = false;
        if(mContainer.parentNode) {
            mContainer.parentNode.removeChild(mContainer);
        }
    }
    
    function init(container, track) {
        if(track) {
            mTrackID = track;
        }
        mAudioElement = $(new Audio());
        mAudioElement.observe('canplaythrough', on_have_enough_data);
        mAudioElement.observe('paused', on_paused);
        mAudioElement.observe('ended', on_paused);
        mAudioElement.observe('abort', on_paused);
        mAudioElement.observe('error', on_error);
        mAudioElement.observe('timeupdate', function() {
            if(mShouldBePlaying) {
                var progress = Math.round((mAudioElement.currentTime / mAudioElement.duration) * 100);
                set_song_percent(progress);
            }
        });
        mContainer = (new Element('div', {className: 'auralsex-audio-preview'})).setStyle({
            height: '21px',
            width: '21px',
            backgroundImage: 'url(/static/images/preview-progress-sprites.png)',
        });
        mButton = (new Element('div')).setStyle({
            height: '21px',
            width: '21px',
            backgroundImage: 'url(/static/images/preview-button-sprites.png)'
        });
        mButton.observe('mousedown', function() {
            update_button_pos(2);
        })
        mButton.observe('mouseup', function() {
            update_button_pos();
        })
        mButton.observe('click', function() {
            if(mAudioElement.paused) {
                play();
            } else {
                pause();
                mContainer.setStyle({backgroundPosition: '0px 0px'});
            }
            update_button_pos();
        })
        mContainer.appendChild(mButton);
        mContainer.appendChild(mAudioElement);
        if(container) {
            container.appendChild(mContainer);
        }
    }
    
    init(container, track);
    return {
        Play: function() {
            play_id(mCurrentTrack);
        },
        SetTrack: function(track) {
            mTrackID = track;
        },
        Pause: function() {
            pause();
        },
        Playing: function() {
            return mShouldBePlaying;
        },
        Destroy: function() {
            remove();
            mAudioElement.pause();
            delete mAudioElement;
            delete mContainer;
            delete mButton;
        },
        AppendTo: function(parent) {
            parent.appendChild(mContainer);
        },
        PrependTo: function(parent) {
            parent.insertBefore(mContainer, parent.firstChild);
        },
        Remove: function(parent) {
            remove();
        }
    }
}

AuralSex.PreviewElement = {
    init: function() {
        AuralSex.PreviewElement = new AuralSex.Preview();
        element = AuralSex.PreviewElement;
    }
};
