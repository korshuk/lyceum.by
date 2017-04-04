var SITEKEY = '6LeX2BUUAAAAAAns3g0pRiKL7TC9hlcEH-LqhcRV';
var requestCaptcha;
var signInCaptcha;

function onloadCallback() {
    console.log('ready');
    window.signInCaptcha = grecaptcha.render('signInCaptcha', {'sitekey': SITEKEY, callback: captchaCallbackSI });
    window.requestCaptcha = grecaptcha.render('passCaptcha', {'sitekey': SITEKEY, callback: captchaCallbackRQ });
}

function captchaCallbackSI() {
    captchaValidator(window.signInCaptcha, '#signInCaptcha');
}

function captchaCallbackRQ() {
    captchaValidator(window.requestCaptcha, '#passCaptcha');
}

function captchaValidator(captchaId, element) {
    var captchaValid = captchaValidation(captchaId);
    var $element = $(element);
    $element.parent().removeClass('has-error error-required');
    if (!captchaValid) {
        $element.parent().addClass('has-error error-required');
    }
    return captchaValid;
}

function captchaValidation(captchaId) {
    var res = grecaptcha.getResponse(captchaId);
    return res.length > 0;
}

ready(function () {
    var TOKEN_URL = '/api/oauth/token';
    var REGISTER_URL = '/api/pupils/register';
    var RESETPASS_URL = '/api/oauth/requestPassword';
    var REGEMAIL = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    var signInView = new SignInView();
    var requestPasswordView = new RequestPasswordView();
    var userView = new UserView();
    var settingView;
    var $pupilSettingsDialogContent;

    window.pupilViews = {};

    window.loadingStart = loadingStart;
    window.loadingEnd = loadingEnd;

    var auth = new jqOAuth({
        events: {
            login: function () {},
            logout: function () {},
            tokenExpiration: function () {
                // this event is fired when 401 calls are
                // received from the server. Has to return
                // an ajax promise.
                // New tokens are set with auth.setAccessToken()

                return $.post(TOKEN_URL, {
                        grant_type: 'refresh_token',
                        refresh_token: auth.data.refreshToken
                    })
                    .done(function (response) {
                        console.log(auth.data.refreshToken, response.refresh_token);
                        auth.setAccessToken(response.access_token, response.refresh_token);
                    })
                    .fail(function () {
                        signInView.show();
                        userView.hide();
                    });
            }
        }
    });
    var dialog = document.getElementById('settingsDialog');
    var settingsDialog = document.getElementById('pupilSettingsDialog');
    var requestDialog = document.getElementById('sendRequestDialog')
    var dialogTransition;
    var settingsDialogTransition;
    var requestDialogTransition;

    $(document).on('lyceum:dataready', onDataViewReady);
    $(document).on('lyceum:needReload', getUser);
    $(document).on('lyceum:logout', logout);
    $(document).on('lyceum:globalError', globalError);

    $(document).on('lyceum:openDialog', openDialog);
    $(document).on('lyceum:openRequestDialog', openRequestDialog);
    $(document).on('lyceum:openSettingsDialog', openSettingsDialog);

    $(document).on('click', '#settingsDialog .close-dialog', closeDialog);
    $(document).on('click', '#sendRequestDialog .close-dialog', closeRequestDialog);
    $(document).on('click', '#pupilSettingsDialog .close-dialog', closeSettingsDialog);

    $(document).on('click', '#savePupilSettings', savePupilSettings);
    $(document).on('click', '.settings-list-item.pupil-settingd', openPupilSettingsDialog);
    $(document).on('keyup', '#pupilSettingsDialog .form-input', pupilSettingsValidation);

    createDialog();
    getUser();

    function getUser() {
        if (dialog.opened) {
            closeDialog();
        }
        if (requestDialog.opened) {
            closeRequestDialog();
        }
        if (settingsDialog.opened) {
            closeSettingsDialog();
        }
        $.get('/api/pupils/userInfo')
            .done(function (response) {
                signInView.hide();
                userView.show(response);
                $pupilSettingsDialogContent = $('#pupilSettingsDialogContent').detach();
            })
            .fail(function () {
                signInView.show();
                userView.hide();
            });
    }

    function onDataViewReady(event, status) {
        componentHandler.upgradeAllRegistered();
    }

    function RequestPasswordView() {
        var $passRequestView = $('#passRequestView');
        
        var captchaId;

        this.show = show;
        this.hide = hide;
        
        $(document).on('click', '#requestPassBtn', requestPass);
        $(document).on('click', '#requestCancelBtn', requestCancel);
        $(document).on('click', '#returnToLogin', returnToLogin);
        $(document).on('keyup', '#passEmail', emailValidator);
        
        function show() {
            if (window.requestCaptcha && window.grecaptcha) {
                grecaptcha.reset(requestCaptcha);
            }

            $passRequestView
                .removeClass('hiddenView')
                .addClass('visibleView');
            $('#passReqNotFoundError')
                .removeClass('visibleView')
                .addClass('hiddenView');
            $('#passReqFound')
                .removeClass('visibleView')
                .addClass('hiddenView');
            $('#passReqForm')
                .removeClass('hiddenView')
                .addClass('visibleView');
            $('#passEmail').val('');
        }

        function hide() {
            $passRequestView
                .removeClass('visibleView')
                .addClass('hiddenView');
        }

        function requestPass() {
            var captchaValid = captchaValidator(window.requestCaptcha, '#passCaptcha'),
                emailValid = emailValidator();
            $('#passReqNotFoundError')
                .removeClass('visibleView')
                .addClass('hiddenView');

            if (captchaValid && emailValid) {
                loadingStart();
                $.post(RESETPASS_URL, {
                    mail: $('#passEmail').val()
                })
                .done(function(res){
                    if (res.error && res.error === "user not found") {
                        $('#passReqNotFoundError')
                            .removeClass('hiddenView')
                            .addClass('visibleView');
                    }
                    if (res.error && res.error === "error") {
                        $(document).trigger('lyceum:globalError');
                    }
                    if (res === "Email Sent") {
                        $('#passReqFound')
                            .removeClass('hiddenView')
                            .addClass('visibleView');
                        $('#passReqForm')
                            .removeClass('visibleView')
                            .addClass('hiddenView');
                    }
                    loadingEnd();
                })
                .fail(function(){
                    $(document).trigger('lyceum:globalError');
                    loadingEnd();
                });
            }
        }

        function requestCancel() {
            signInView.show();
            requestPasswordView.hide();
        }

        function returnToLogin(e) {
            e.preventDefault();
            signInView.show();
            requestPasswordView.hide();
        }

        function emailValidator() {
            var emailContainer = $('#passEmail').parent().removeClass('has-error');
            var email = $('#passEmail').val();

            if (email.length === 0) {
                emailContainer.addClass('has-error').addClass('error-required');
            } else {
                emailContainer.removeClass('error-required');
            }

            if (email.length > 100) {
                emailContainer.addClass('has-error').addClass('error-maxlength');
            } else {
                emailContainer.removeClass('error-maxlength');
            }

            if (email.length > 0 && email.length < 100 && !REGEMAIL.test(email)) {
                emailContainer.addClass('has-error').addClass('error-characters');
            } else {
                emailContainer.removeClass('error-characters');
            }
            return !emailContainer.hasClass('has-error');
        }

    }

    function SignInView() {
        var $signInView = $('#signInView');

        var submittedLogin = false;
        var submittedSignIn = false;
        var captchaId;

        this.show = show;
        this.hide = hide;

        $(document).on('click', '#loginBtn', login);
        $(document).on('click', '#registerBtn', signIn);

        $(document).on('keyup', '#loginForm .form-input', loginKeyUp);
        $(document).on('keyup', '#registerForm .form-input', signinKeyUp);

        $(document).on('click', '.requestPasswordView', goToRequestPassword);

        function goToRequestPassword(e) {
            e.preventDefault();
            signInView.hide();
            requestPasswordView.show();
        }

        function login() {
            var data = {};
            submittedLogin = true;

            if (loginValidation()) {
                hideUserNotFoundError();
                data = {
                    grant_type: 'password',
                    username: $('#loginEmailInput').val(),
                    password: $('#loginPassInput').val()
                };
                postData(TOKEN_URL, data);
            }
        }
        
        function signIn() {
            var data;
            submittedSignIn = true;
            data = signinValidation();
            if (data.email) {
                postData(REGISTER_URL, data);
            }
        }

        function signinValidation() {
            var data = {};

            var emailContainer = $('#registerEmailInput').parent('.form-input-group');
            var email = $('#registerEmailInput').val();

            var passwordContainer = $('#registerPassInput').parent('.form-input-group');
            var password = $('#registerPassInput').val();

            var confirmContainer = $('#registerPassConfirmInput').parent('.form-input-group');
            var confirm = $('#registerPassConfirmInput').val();

            if (submittedSignIn) {
                emailContainer.removeClass('has-error');
                passwordContainer.removeClass('has-error');
                confirmContainer.removeClass('has-error');

                if (password.length === 0) {
                    passwordContainer.addClass('has-error').addClass('error-required');
                } else {
                    passwordContainer.removeClass('error-required');
                }

                if (password.length !== 0 && password.length < 8) {
                    passwordContainer.addClass('has-error').addClass('error-minlength');
                } else {
                    passwordContainer.removeClass('error-minlength');
                }

                if (password.length > 100) {
                    passwordContainer.addClass('has-error').addClass('error-maxlength');
                } else {
                    passwordContainer.removeClass('error-maxlength');
                }

                if (confirm.length === 0) {
                    confirmContainer.addClass('has-error').addClass('error-required');
                } else {
                    confirmContainer.removeClass('error-required');
                }

                if (confirm.length > 0 && password.length > 0 && confirm !== password) {
                    confirmContainer.addClass('has-error').addClass('error-characters');
                } else {
                    confirmContainer.removeClass('error-characters');
                }

                if (email.length === 0) {
                    emailContainer.addClass('has-error').addClass('error-required');
                } else {
                    emailContainer.removeClass('error-required');
                }

                if (email.length > 100) {
                    emailContainer.addClass('has-error').addClass('error-maxlength');
                } else {
                    emailContainer.removeClass('error-maxlength');
                }

                if (email.length > 0 && email.length < 100 && !REGEMAIL.test(email)) {
                    emailContainer.addClass('has-error').addClass('error-characters');
                } else {
                    emailContainer.removeClass('error-characters');
                }

                captchaValidator(window.signInCaptcha, '#signInCaptcha')

                if ($('#registerForm .has-error').length === 0) {
                    data = {
                        email: email,
                        password: password
                    };
                }
            }
            return data;
        }

        function loginValidation() {
            var errorsFlag = false;
            if (submittedLogin) {
                if ($('#loginEmailInput').val().length === 0) {
                    $('#loginEmailInput').parent('.form-input-group').addClass('has-error');
                    errorsFlag = true;
                } else {
                    $('#loginEmailInput').parent('.form-input-group').removeClass('has-error');
                }
                if ($('#loginPassInput').val().length === 0) {
                    $('#loginPassInput').parent('.form-input-group').addClass('has-error');
                    errorsFlag = true;
                } else {
                    $('#loginPassInput').parent('.form-input-group').removeClass('has-error');
                }

                if (errorsFlag) {
                    $('#loginBtn').attr('disabled', true);
                } else {
                    $('#loginBtn').attr('disabled', false);
                }
            }

            return !errorsFlag;
        }

        function loginKeyUp(e) {
            if (e.keyCode == 13) {
                login();
            } else {
                loginValidation();
            }
        }

        function signinKeyUp(e) {
            if (e.keyCode == 13) {
                signIn();
            } else {
                signinValidation();
            }
        }

        function show() {
            $signInView
                .removeClass('hiddenView')
                .addClass('visibleView');
            if (window.signInCaptcha && window.grecaptcha) {
                grecaptcha.reset(signInCaptcha);
            }
            loadingEnd();
        }

        function hide() {
            $signInView
                .removeClass('visibleView')
                .addClass('hiddenView');
            $('#userExistsError')
                .removeClass('visibleView')
                .addClass('hiddenView');
            loadingEnd();
        }

        function postData(url, data) {
            $('#userExistsError')
                .removeClass('visibleView')
                .addClass('hiddenView');
            loadingStart();
            $.ajax({
                url: url,
                method: 'POST',
                data: data,
                statusCode: {
                    200: function (response) {
                        if (response.message === 'registered') {
                            loadingEnd();
                            showRegisteredMessage(data.email);
                        } else {
                            auth.login(response.access_token, response.refresh_token);
                            signInView.hide();
                            getUser();
                        }
                    },
                    401: function (response) {
                        $(document).trigger('lyceum:needReload');
                    },
                    403: function (response) {
                        console.log(response);
                        if (response.responseText === '{"error":"invalid_grant","error_description":"Invalid resource owner credentials"}') {
                            loadingEnd();
                            $('#loginPassInput').val('');
                            showUserNotFoundError();
                        }
                        if (response.responseJSON.message === 'email exists') {
                            loadingEnd();
                            showNameExistsError();
                        }
                    }
                }
            });
        }

        function showUserNotFoundError() {
            $('#userNotFoundError')
                .removeClass('hiddenView')
                .addClass('visibleView');
        }

        function hideUserNotFoundError() {
            $('#userNotFoundError')
                .removeClass('visibleView')
                .addClass('hiddenView');
        }
        
        function showNameExistsError() {
            $('#userExistsError')
                .removeClass('hiddenView')
                .addClass('visibleView');
        }
        
        function showRegisteredMessage(email) {
            $('#registeredMessage')
                .removeClass('hiddenView')
                .addClass('visibleView');
            $('#userMail').text(email);
            $('#registerInputs')
                .removeClass('visibleView')
                .addClass('hiddenView');
        }
    }
    
    function UserView() {
        var $userView = $('#userView');

        this.show = show;
        this.hide = hide;

        function show(html) {
            $userView
                .html(html)
                .removeClass('hiddenView')
                .addClass('visibleView');
            loadingEnd();
        }

        function hide() {
            $userView
                .removeClass('visibleView')
                .addClass('hiddenView');
            loadingEnd();
        }
    }

    function openPupilSettingsDialog(e) {
        e.preventDefault();
        e.stopPropagation();
        settingView = $(e.currentTarget).attr('href')

        if (settingView === 'logout') {
            $(document).trigger('lyceum:logout');
        } else {
            $(document).trigger('lyceum:openSettingsDialog', $pupilSettingsDialogContent.find('#' + settingView).html());
        }
    }
    
    function pupilSettingsValidation() {
        var data = {};
        if (settingView === 'password') {
            var password = $('#pupilPassword').val();
            var confirm = $('#pupilPasswordConfirm').val();
            var passwordContainer = $('#pupilPassword').parent();
            var confirmContainer = $('#pupilPasswordConfirm').parent();

            passwordContainer.removeClass('has-error');
            confirmContainer.removeClass('has-error');

            if (password.length === 0) {
                passwordContainer.addClass('has-error').addClass('error-required');
            } else {
                passwordContainer.removeClass('error-required');
            }

            if (password.length !== 0 && password.length < 8) {
                passwordContainer.addClass('has-error').addClass('error-minlength');
            } else {
                passwordContainer.removeClass('error-minlength');
            }

            if (password.length > 100) {
                passwordContainer.addClass('has-error').addClass('error-maxlength');
            } else {
                passwordContainer.removeClass('error-maxlength');
            }

            if (confirm.length === 0) {
                confirmContainer.addClass('has-error').addClass('error-required');
            } else {
                confirmContainer.removeClass('error-required');
            }

            if (confirm.length > 0 && password.length > 0 && confirm !== password) {
                confirmContainer.addClass('has-error').addClass('error-characters');
            } else {
                confirmContainer.removeClass('error-characters');
            }

            if ($('#pupilSettingsDialog .has-error').length === 0) {
                data = {
                    password: password
                };
            }
        }
        return data;
    }
    
    function savePupilSettings() {
        console.log(settingView);
        if (settingView === 'password') {
            console.log(21124)
            var data = pupilSettingsValidation();
            if (data.password) {
                updatePassword(data);
            }
        }
    }


    function updatePassword(data) {
        $.ajax({
            url: '/api/pupils/password',
            method: 'POST',
            data: data,
            statusCode: {
                200: function (response) {
                    if (response.message === 'ok') {
                        $(document).trigger('lyceum:needReload');
                    } else {
                        //  auth.login(response.access_token, response.refresh_token);
                        // signInView.hide();
                        //  getUser();
                    }
                },
                401: function (response) {
                    $(document).trigger('lyceum:needReload');
                },
                403: function (response) {
                    console.log(response);
                    //TODO Error handle
                    if (response.responseText === '{"error":"invalid_grant","error_description":"Invalid resource owner credentials"}') {
                        loadingEnd();
                        $('#loginPassInput').val('');
                        showUserNotFoundError();
                    }
                    if (response.responseJSON.message === 'email exists') {
                        loadingEnd();
                        showNameExistsError();
                    }
                }
            }
        });
    }

    function loadingStart() {
        if (dialog.opened || settingsDialog.opened || requestDialog.opened) {
            $('.cs-loader').not('.page-loader').addClass('loading-start');
        } else {
            $('.cs-loader').addClass('loading-start');
        }
    }

    function loadingEnd() {
        $('.cs-loader').removeClass('loading-start');
    }
    
    function logout() {
        auth.logout();
        window.location.reload();
    }

    function createDialog() {
        //TODO add polifil
        dialog.opened = false;
        if (!dialog.showModal) {
            dialogPolyfill.registerDialog(dialog);
        }

        requestDialog.opened = false;
        if (!requestDialog.showModal) {
            dialogPolyfill.registerDialog(requestDialog);
        }

        settingsDialog.opened = false;
        if (!settingsDialog.showModal) {
            dialogPolyfill.registerDialog(settingsDialog);
        }

    }

    function openDialog(e, html) {
        dialog.opened = true;
        $('.modal-settings-container').html(html);
        $('.dropify').dropify();
        dialog.showModal();
        dialogTransition = setTimeout(function () {
            $('#settingsDialog').addClass('dialog-scale');
            componentHandler.upgradeAllRegistered();
        }, 0.5);
    }

    function openSettingsDialog(e, html) {
        settingsDialog.opened = true;
        $('.modal-pupil-settings-container').html(html);

        settingsDialog.showModal();
        settingsDialogTransition = setTimeout(function () {
            $('#pupilSettingsDialog').addClass('dialog-scale');
            componentHandler.upgradeAllRegistered();
        }, 0.5);
    }

    function openRequestDialog() {
        var $rulesContainer = $("#rulesContainer");
        var $saveRequestBtn = $("#saveRequest");
        var $rulesOk = $('#rulesOk');
        var $rulesOkLabel = $("#rulesOkLabel");

        requestDialog.opened = true;
        requestDialog.scrolledToBottom = false;

        $rulesContainer.off( 'scroll');
        $saveRequestBtn.attr('disabled', true);
        $rulesOkLabel.addClass('is-disabled');
        $rulesOk.attr('disabled', true);
        document.querySelector('#rulesOkLabel').MaterialCheckbox.uncheck()

        requestDialog.showModal();
        $rulesContainer.animate({
            scrollTop: 0
        }, 0);

        requestDialogTransition = setTimeout(function () {
            $('#sendRequestDialog').addClass('dialog-scale');
        }, 0.5);

        $rulesContainer.on( 'scroll', function(){
            if ($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
                requestDialog.scrolledToBottom = true;
                $saveRequestBtn.attr('disabled', false);
                $rulesOk.attr('disabled', false);
                $rulesOkLabel.removeClass('is-disabled');
                $rulesContainer.off( 'scroll');
            }
        });
    }
    
    function closeDialog(e) {
        dialog.opened = false;
        $('#settingsDialog').removeClass('dialog-scale');
        dialog.close();
        clearTimeout(dialogTransition);
    }

    function closeRequestDialog(e) {
        requestDialog.opened = false;
        $('#sendRequestDialog').removeClass('dialog-scale');
        requestDialog.close();
        clearTimeout(requestDialogTransition);
    }

    function closeSettingsDialog() {
        settingsDialog.opened = false;
        $('#pupilSettingsDialog').removeClass('dialog-scale');
        settingsDialog.close();
        clearTimeout(settingsDialogTransition);
    }
    
    function globalError() {
        //TODO handle it
        console.log('GLOBAL ERROR');
    }
});