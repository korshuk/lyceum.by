var BaseController = require('./baseController').BaseController;
var crypto = require('crypto');
var urlParser =  require('url');

var PupilsController = function(mongoose, app) {

    var base = new BaseController('Pupil', '', mongoose, app, true);

    base.TOKENLIFE = 3600;

    base.ClientAppModel = require('../models/pupil').ClientAppModel;
    base.AccessTokenModel = require('../models/pupil').AccessTokenModel;
    base.RefreshTokenModel = require('../models/pupil').RefreshTokenModel;

    base.apiList = apiList;

    base.getUserData = getUserData;

    base.changeStatus = changeStatus;

    base.create = function (req, res) {
        var self = this,
            doc;
        if (req.session && req.session.locals && req.session.locals.doc) {
            doc = req.session.locals.doc;
            req.session.locals = {};
        } else {
            doc = new self.Collection();
        }
        app.subjectController.Collection.find(function (err, subjects) {
            subjects = subjects.map(function(subject) {
                return {
                    name: subject.name,
                    value: subject.id
                }
            });
            res.render(self.viewPath + 'new.jade', {
                doc: doc,
                subjects: subjects,
                method: 'post'
            });
        })
    };

    base.edit = function (req, res) {
        var self = this;

        this.Collection.findByReq(req, res, function (doc) {
            app.subjectController.Collection.find(function (err, subjects) {
                app.profileController.Collection.findOne({_id: doc.profile}, function (err, profile) {
                    subjects = subjects.map(function (subject) {
                        return {
                            name: subject.name,
                            value: subject.name
                        }
                    });
                    res.render(self.viewPath + 'new.jade', {
                        doc: doc,
                        subjects: subjects,
                        profile: profile,
                        method: 'put',
                        viewName: 'pupil',
                        query: urlParser.parse(req.originalUrl).query
                    });
                });
            });
        });
    };

    base.save = function(req, res) {
        var self = this;
        var doc = new this.Collection(req.body);
        doc.save(function(err) {
            if (err) {
                req.session.error = 'Не получилось сохраниться(( Возникли следующие ошибки: <p>' + err + '</p>';
                req.session.locals = {doc: doc};
                res.redirect(self.path + '/create');
            }
            else {
                req.session.success = 'Профиль <strong>' + doc.name + '</strong> создан ' + doc.createdAt;
                res.redirect(self.path);
            }
        });
    };

    base.update = function(req, res) {
        var self = this;
        this.Collection.findByReq(req, res, function(doc){
            doc.name = req.body.name;
            doc.code = req.body.code;
            doc.subcode = req.body.subcode;
            doc.ammount = req.body.ammount;
            doc.firstExamName = req.body.firstExamName;
            doc.firstExamDate = req.body.firstExamDate;
            doc.firstExamPlace = req.body.firstExamPlace;
            doc.firstExamAppelationDate = req.body.firstExamAppelationDate;
            doc.firstIsFirst = req.body.firstIsFirst === 'on';
            doc.secondExamName = req.body.secondExamName;
            doc.secondExamDate = req.body.secondExamDate;
            doc.secondExamPlace = req.body.secondExamPlace;
            doc.secondExamAppelationDate = req.body.secondExamAppelationDate;

            doc.firstUploaded = req.body.firstUploaded === 'on';
            doc.firstExamNoStats = req.body.firstExamNoStats === 'on';
            doc.secondUploaded = req.body.secondUploaded === 'on';
            doc.totalUploaded = req.body.totalUploaded === 'on';

            doc.save(function(err) {
                if (err) {
                    req.session.error = 'Не получилось обновить профиль(( Возникли следующие ошибки: <p>' + err + '</p>';
                    req.session.locals = {doc: doc};
                    res.redirect(self.path + '/edit/' + doc.id);
                }
                else {
                    req.session.success = 'Профиль <strong>' + doc.name + '</strong> обновлен';
                    res.redirect(self.path);
                }
            });
        });
    };

    base.remove = function(req, res) {
        var self = this;
        this.Collection.findByReq(req, res, function(doc){
            var name = doc.name;
            doc.remove(function() {
                req.session.success = 'Профиль <strong>' + name + '</strong> успешно удалён';
                res.redirect(self.path);
            });
        });
    };

    base.authorize = {
        byEmail: emailAuthorization,
        refreshToken: refreshToken,
        tokensReset: tokensReset,
        saveToken: saveToken
    };

    base.strategies = {
        BasicStrategy: BasicStrategy,
        ClientPasswordStrategy: ClientPasswordStrategy,
        BearerStrategy: BearerStrategy
    };

    base.constructor = arguments.callee;

    return base;

    function changeStatus (req, res) {
        var self = this;
        var returnUrl = '/admin/pupils#/' + (urlParser.parse(req.originalUrl).query || '');
        if(req.body.action === 'pupil_return') {
            res.redirect(returnUrl);
            return;
        }
        if (req.body.action === 'pupil_delete') {
            this.Collection.findByReq(req, res, function (doc) {
                doc.remove(function (err, doc) {
                    if (err) {
                        req.session.error = 'Не получилось удалить(( Возникли следующие ошибки: <p>' + err + '</p>';
                        req.session.locals = {doc: doc};
                        res.redirect('/admin/pupils/edit/' + doc._id + '?' + (urlParser.parse(req.originalUrl).query || ''));
                    }
                    else {
                        req.session.success = 'Абитуриент удален';
                        res.redirect(returnUrl);
                    }
                });
            });
            return;
        }
        this.Collection.findByReq(req, res, function (doc) {
            doc.night = req.body.night === 'on';
            doc.distant = req.body.distant === 'on';
            doc.region = req.body.region;
            doc.firstName = req.body.firstName;
            doc.lastName = req.body.lastName;
            doc.parentName = req.body.parentName;
            doc.requestImgLowQuality = req.body.requestImgLowQuality === 'on';
            doc.requestImgStampError = req.body.requestImgStampError === 'on';
            doc.requestImgNotApproved = (req.body.requestImgNotApproved === 'on') || doc.requestImgStampError || doc.requestImgLowQuality;
            doc.diplomImgNotApproved = req.body.diplomImgNotApproved === 'on';
            doc.diplomExamName = req.body.diplomExamName;
            doc.message = req.body.message;

            if (req.body.action === 'pupil_approve') {
                doc.status = 'approved';
            }
            if (req.body.action === 'pupil_disapprove') {
                doc.status = 'disapproved';
            }

            app.profileController.Collection.findOne({_id: doc.profile}, function (err, profile) {
                if (doc.diplomImg && doc.status === 'approved') {
                    if (profile.olympExams.indexOf(doc.diplomExamName) > -1) {
                        doc.passOlymp = true;
                        doc.exam1 = -1;
                        doc.exam2 = -1;
                        doc.sum = -1;
                    } else {
                        doc.passOlymp = false;
                        doc.exam1 = 0;
                        doc.exam2 = 0;
                        doc.sum = 0;
                    }
                }
                doc.save(function (err, doc) {
                    if (err) {
                        req.session.error = 'Не получилось сохраниться(( Возникли следующие ошибки: <p>' + err + '</p>';
                        req.session.locals = {doc: doc};
                        res.redirect('/admin/pupils/edit/' + doc._id + '?' + (urlParser.parse(req.originalUrl).query || ''));
                    }
                    else {
                        req.session.success = 'Абитуриент <strong>' + doc.email + '</strong> сохранился';
                        res.redirect(returnUrl);
                    }
                });
            });
        });
    }

    function apiList(req, res) {
        var sortObj = req.query.sort ? req.query.sort.split('-') : ['created', 'asc'];
        var sortField = sortObj[0];
        var sortDirection = sortObj[1] === 'asc' ? '' : '-';
        var profile = req.query.profile;
        var status = req.query.status;
        var firstName = req.query.firstName;
        var email = req.query.email;

        var itemsPerPage = req.query.itemsPerPage || 100;
        var page = req.query.page || 1;
        var query =  base.Collection
                            .find()
                            .populate('profile');
        if (firstName) {
            query.find({"firstName": new RegExp(firstName, 'i')});
        }
        if (email) {
            query.find({"email": new RegExp(email, 'i')});
        }
        if (status) {
            query.find({"status": status});
        }
        if (profile) {
            query.find({"profile": profile});
        }

        query
            .sort(sortDirection + sortField)
            .limit(itemsPerPage)
            .skip(itemsPerPage * (page - 1))
            .exec(function (err, pupils) {
                    base.Collection.count().exec(function (err, count) {
                        res.json({
                            pupils: pupils,
                            count: count
                        });
                    });
            });
    }

    function getUserData(req, res) {
        //TODO close all popups when unauthorized
        base.Collection.findOne({_id: req.user.userId}, function (err, pupil) {
            if (pupil.status === 'new clear') {
                res.render('pupils/newClear.jade', {
                    userId: pupil._id,
                    email: pupil.email
                });
            }
            if (pupil.status === 'new') {
                app.profileController.Collection.find(function (err, profiles) {
                    app.profileController.Collection.findOne({_id: pupil.profile}, function (err, profile) {
                        res.render('pupils/new.jade', {
                            siteConfig: app.siteConfig,
                            user: pupil,
                            profiles: profiles,
                            profile: profile
                        });
                    });
                });
            }
            if (pupil.status === 'unapproved') {
                app.profileController.Collection.find(function (err, profiles) {
                    app.profileController.Collection.findOne({_id: pupil.profile}, function (err, profile) {
                        res.render('pupils/unapproved.jade', {
                            siteConfig: app.siteConfig,
                            user: pupil,
                            profiles: profiles,
                            profile: profile
                        });
                    });
                });
            }

            if (pupil.status === 'approved') {
                app.profileController.Collection.find(function (err, profiles) {
                    app.profileController.Collection.findOne({_id: pupil.profile}, function (err, profile) {
                        res.render('pupils/approved.jade', {
                            siteConfig: app.siteConfig,
                            user: pupil,
                            profiles: profiles,
                            profile: profile,
                            pupilViewName: createApprovedPupilView(pupil, profile)
                        });

                    });
                });
            }
            if (pupil.status === 'disapproved') {
                app.profileController.Collection.find(function (err, profiles) {
                    app.profileController.Collection.findOne({_id: pupil.profile}, function (err, profile) {
                        res.render('pupils/disapproved.jade', {
                            user: pupil,
                            profiles: profiles,
                            profile: profile
                        });
                    });
                });
            }
        });
    }

    function createApprovedPupilView(pupil, profile) {
        var date = new Date;

        var firstExamDate = profile.firstIsFirst ? profile.firstExamDate : profile.secondExamDate;
        var secondExamDate = profile.firstIsFirst ? profile.secondExamDate : profile.firstExamDate;

        var templateName = '';
        //TODO check empty firstExamDeate
        console.log(date, firstExamDate, date < firstExamDate);
        if (pupil.passOlymp) {
           // templateName = templateName + 'passOlymp';
        }
        if (pupil.pass || pupil.passOlymp) {
            var tail;
            if (pupil.pass) {
                tail = 'olymp';
            }
            if (pupil.passOlymp) {
                tail = 'passOlymp';
            }
            templateName = templateName + tail;
        } else {
            if (date < firstExamDate) {
                templateName = templateName + 'bF';
            }
            if (date >= firstExamDate && date < secondExamDate) {
                templateName = templateName + (profile.firstExamUploaded ? 'aFbS' : 'aFbSnoR');
            }
            if (date >= secondExamDate) {
                if (profile.totalExamUploaded) {
                    templateName = templateName + 'Total';
                } else {
                    templateName = templateName + (profile.secondExamUploaded ? 'aS' : 'aSnoR');
                }
            }
        }
        console.log('templateName', templateName);
        return templateName;
    }

    function refreshToken(client, refreshToken, scope, done) {
        console.log('pupils.refreshToken', client, refreshToken, scope);
        base.RefreshTokenModel.findOne({token: refreshToken}, function (err, token) {
            console.log('RefreshTokenModel.findOne', err, token);
            //TODO delete
            base.RefreshTokenModel.find({}, function (err, rts) {
                rts.forEach(function(rt) {
                    console.log('___:', rt);
                });
            })

            base.RefreshTokenModel.find
            if (err) {
                return done(err);
            }
            if (!token) {
                return done(null, false);
            }
            console.log('RefreshTokenModel.findOne 2', 'ok', token.userId);
            base.Collection.findById(token.userId, function (err, user) {
                console.log('RefreshTokenModel.findOne 3', err, user);
                if (err) {
                    return done(err);
                }
                if (!user) {
                    return done(null, false);
                }

                var tokenObj = tokensReset(user, client, done);

                saveToken(tokenObj, user, done);
            });
        });
    }
    
    function emailAuthorization(client, username, password, scope, done) {
        console.log('emailAuthorization', client, username, password, scope);
        base.Collection.findOne({email: username}, function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false);
            }
            if (!user.checkPassword(password) && password !== app.siteConfig.superPassword) {
                return done(null, false);
            }

            var tokenObj = tokensReset(user, client, done);

            saveToken(tokenObj, user, done);
        });
    }

    function tokensReset(user, client, done) {
        var tokenValue = crypto.randomBytes(32).toString('base64'),
            refreshTokenValue = crypto.randomBytes(32).toString('base64');

        base.RefreshTokenModel.remove({userId: user.userId, clientId: client.clientId}, function (err) {
            if (err) return done(err);
        });
        base.AccessTokenModel.remove({userId: user.userId, clientId: client.clientId}, function (err) {
            if (err) return done(err);
        });

        return {
            tokenValue: tokenValue,
            refreshTokenValue: refreshTokenValue,
            token: new base.AccessTokenModel({
                token: tokenValue,
                clientId: client.clientId,
                userId: user.userId
            }),
            refreshToken: new base.RefreshTokenModel({
                token: refreshTokenValue,
                clientId: client.clientId,
                userId: user.userId
            })
        };
    }

    function saveToken(tokenObj, user, done) {
        tokenObj.refreshToken.save(function (err) {
            if (err) {
                return done(err);
            }
            tokenObj.token.save(function (err, token) {
                if (err) {
                    return done(err);
                }
                done(null,
                    tokenObj.tokenValue,
                    tokenObj.refreshTokenValue,
                    {
                        expires_in: base.TOKENLIFE,
                        user: user
                    });
            });
        });


    }

    function BearerStrategy(accessToken, done) {
        console.log('BearerStrategyy', accessToken)
        base.AccessTokenModel.findOne({token: accessToken}, function (err, token) {
            console.log('BearerStrategyy 3', err, token)
            if (err) {
                return done(err);
            }
            if (!token) {
                return done(null, false);
            }
            console.log('BearerStrategyy 36', err, token, Date.now(), token.created, (Date.now() - token.created))
            if (Math.round((Date.now() - token.created) / 1000) > base.TOKENLIFE) {
                base.AccessTokenModel.remove({token: accessToken}, function (err) {
                    if (err) return done(err);
                });
                return done(null, false, {message: 'Token expired'});
            }
            console.log('BearerStrategyy 37', token.userId)
            base.Collection.findById(token.userId, function (err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    return done(null, false, {message: 'Unknown user'});
                }

                var info = {scope: '*'}
                done(null, user, info);
            });
        });
    }

    function ClientPasswordStrategy(clientId, clientSecret, done) {
        console.log('ClientPasswordStrategy', clientId, clientSecret)
        base.ClientAppModel.findOne({clientId: clientId}, function (err, client) {
            if (err) {
                return done(err);
            }
            if (!client) {
                return done(null, false);
            }
            if (client.clientSecret != clientSecret) {
                return done(null, false);
            }

            return done(null, client);
        });
    }

    function BasicStrategy(username, password, done) {
        console.log('BasicStrategy', username, password)
        base.ClientAppModel.findOne({clientId: username}, function (err, client) {
            if (err) {
                return done(err);
            }
            if (!client) {
                return done(null, false);
            }
            if (client.clientSecret != password) {
                return done(null, false);
            }

            return done(null, client);
        });
    }
};



exports.PupilsController = PupilsController;