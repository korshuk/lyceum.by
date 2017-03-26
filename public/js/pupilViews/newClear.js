ready(function () {
    'use strict';
    if (!window.pupilViews.newClearView) {
        window.pupilViews.newClearView = new newClearView();
    } else {
        window.pupilViews.newClearView = null;
        $(document).off('click', '#newClearCancelBtn');
        window.pupilViews.newClearView = new newClearView();
    }
    
    function newClearView() {
        $(document).on('click', '#newClearCancelBtn', logout);

        function logout() {
            $(document).trigger('lyceum:logout');
        }
    }

});