ready(function () {
    'use strict';

    var $dialogContent;

    if (!window.pupilViews.unapprovedView) {
        window.pupilViews.unapprovedView = new UnapprovedView();
    } else {
        window.pupilViews.unapprovedView = null;
        $(document).off('click', '#saveSettings');
        $(document).off('click', '.settings-list-item.editable');
        $(document).off('click', '#sendRequestBtn');
        $(document).off('click', '#saveRequest');
        window.pupilViews.unapprovedView = new UnapprovedView();
    }
    $dialogContent = $('.view-dialog-content').detach();

    function UnapprovedView() {
        var settingView;

        $(document).on('click', '#saveSettings', saveSettings);
        $(document).on('click', '.settings-list-item.editable', openSettingsDialog);


        function saveSettings() {
            var data = {};
            if (settingView === 'profile') {
                if ($('#profileInput').val() != 'Выберите профиль') {
                    data = {
                        profile: $('#profileInput').val()
                    };
                    updateProfile(data);
                }
            }
        }

        function openSettingsDialog(e) {
            e.preventDefault();
            e.stopPropagation();
            settingView = $(e.currentTarget).attr('href')

            if (settingView === 'logout') {
                $(document).trigger('lyceum:logout');
            } else {
                $(document).trigger('lyceum:openDialog', $dialogContent.find('#' + settingView).html());
            }
        }


        function updateProfile(data) {
            $.ajax({
                url: '/api/pupils/profile',
                method: 'POST',
                data: data,
                statusCode: {
                    200: function (response) {
                        if (response.message === 'ok') {
                            var pupil = response.pupil;
                            //TODO loadingEnd();
                            $('#profileInput').val(pupil.profile);

                            $(document).trigger('lyceum:needReload');
                        } else {
                            //  auth.login(response.access_token, response.refresh_token);
                            // signInView.hide();
                            //  getUser();
                        }
                    },
                    403: function (response) {
                        console.log(response);
                        //TODO Error handle
                        if (response.responseText === '{"error":"invalid_grant","error_description":"Invalid resource owner credentials"}') {
                            loadingEnd();
                            $('#loginPassInput').val('');
                            showUserNotFoundError();
                        }
                    }
                }
            });
        }
    }
});