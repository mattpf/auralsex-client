AuralSex.Queue = {
    Append: function(id) {
        new Ajax.Request("/api/append/" + AURALSEX_ZONE + "?track_id=" + id);
    }
}