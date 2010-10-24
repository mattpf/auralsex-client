AuralSex.Queue = {
    Append: function(id) {
        new Ajax.Request("/api/append/" + AURALSEX_ZONE + "?track_id=" + id);
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
    }
}
