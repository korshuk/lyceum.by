var async = require('async');
var BaseController = require('./baseController').BaseController;
var crypto = require('crypto');
var urlParser = require('url');

var PupilsController = function (mongoose, app) {

        var base = new BaseController('Pupil', '', mongoose, app, true);

        base.TOKENLIFE = 3600;

        base.ClientAppModel = require('../models/pupil').ClientAppModel;
        base.AccessTokenModel = require('../models/pupil').AccessTokenModel;
        base.RefreshTokenModel = require('../models/pupil').RefreshTokenModel;
        base.HistoryModel = require('../models/pupil').HistoryModel;

        base.apiList = apiList;

        base.apiListExport = apiListExport;

        base.saveExams = saveExams;

        base.historyList = historyList;

        base.testPage = testPage;

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
                subjects = subjects.map(function (subject) {
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
                        app.profileController.Collection.find().exec(function (err, profiles) {
                            subjects = subjects.map(function (subject) {
                                return {
                                    name: subject.name,
                                    value: subject.name
                                }
                            });
                            profiles = profiles.map(function (profile) {
                                return {
                                    name: profile.name,
                                    value: '' + profile._id
                                }
                            });
                            res.render(self.viewPath + 'new.jade', {
                                doc: doc,
                                subjects: subjects,
                                profile: profile,
                                profiles: profiles,
                                method: 'put',
                                viewName: 'pupil',
                                query: urlParser.parse(req.originalUrl).query
                            });
                        })

                    });
                });
            });
        };

        base.save = function (req, res) {
            var self = this;
            var doc = new this.Collection(req.body);
            doc.save(function (err) {
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

        base.update = function (req, res) {
            var self = this;
            this.Collection.findByReq(req, res, function (doc) {
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

                doc.save(function (err) {
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

        base.remove = function (req, res) {
            var self = this;
            this.Collection.findByReq(req, res, function (doc) {
                var name = doc.name;
                doc.remove(function () {
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

        function changeStatus(req, res) {
            var self = this;
            var returnUrl = '/admin/pupils#/' + (urlParser.parse(req.originalUrl).query || '');
            if (req.body.action === 'pupil_return') {
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
                doc.requestImgNoPhoto = req.body.requestImgNoPhoto === 'on';
                doc.requestImgStampError = req.body.requestImgStampError === 'on';
                doc.requestImgNotApproved = (req.body.requestImgNotApproved === 'on') || doc.requestImgStampError || doc.requestImgLowQuality || doc.requestImgNoPhoto;
                doc.diplomImgNotApproved = req.body.diplomImgNotApproved === 'on';
                doc.diplomExamName = req.body.diplomExamName;
                doc.message = req.body.message;
                if (req.body.profile) {
                    doc.profile = req.body.profile;
                }

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

        function saveExams(req, res) {
            var reqUser;
            var i;
            var userIds = [];
            var reqUsers = [];
            for (i in req.body) {
                reqUser = req.body[i];
                if (reqUser._id) {
                    userIds.push(new mongoose.Types.ObjectId(reqUser._id));
                    reqUsers[reqUser._id] = reqUser;
                }
            }
            base.Collection
                .find({_id: {$in: userIds}})
                .exec(function (err, users) {
                    if (err) res.status(500).send(err);
                    else {
                        async.eachSeries(users, function (user, asyncdone) {
                            reqUser = reqUsers[user._id];
                            if (reqUser.exam1 || reqUser.exam1 === 0) {
                                user.exam1 = reqUser.exam1;
                            }
                            if (reqUser.exam2 || reqUser.exam2 === 0) {
                                user.exam2 = reqUser.exam2;
                            }
                            if (reqUser.exam1 || reqUser.exam2 || reqUser.exam1 === 0 || reqUser.exam2 === 0) {
                                user.sum = (reqUser.exam1 || 0) + (reqUser.exam2 || 0);
                            }

                            user.save(asyncdone);
                        }, function (err) {
                            if (err) return res.status(500).send(err);
                            res.status(200).send('ok');
                        });
                    }
                });

        }

        function apiListExport(req, res) {

            var pupilsQ = function (callback) {
                base.Collection.find({"status": 'approved'})
                    .exec(function (err, data) {
                        data = data.map(function (pupil) {
                            return {
                                _id: pupil._id,
                                email: pupil.email,
                                profile: pupil.profile,
                                needBel: pupil.needBel,
                                firstName: pupil.firstName,
                                phone: '37529' + (Math.floor(Math.random() * 9000000) + 1000000),
                                lastName: pupil.lastName,
                                parentName: pupil.parentName,
                            }
                        });
                        queryExecFn(err, data, callback)
                    });
            };

            var profilesQ = function (callback) {
                app.profileController.Collection.find()
                    .exec(function (err, data) {
                        data = data.map(function (profile) {
                            return {
                                _id: profile._id,
                                name:   profile.name,
                                examPlace: profile.examPlace
                            }
                        });
                        queryExecFn(err, data, callback)
                    });
            };

            var placesQ = function (callback) {
                app.placesController.Collection.find()
                    .exec(function (err, data) {
                        queryExecFn(err, data, callback)
                    });
            };

            async.parallel([pupilsQ, profilesQ, placesQ], function (err, results) {
                res.json({
                    pupils: results[0],
                    profiles: results[1],
                    places: results[2]
                });
            });

        }

        function apiList(req, res) {
            const sortObj = req.query.sort ? req.query.sort.split('-') : ['created', 'asc'];

            req.queryParams = {
                sortObj: sortObj,
                sortField: sortObj[0],
                sortDirection: sortObj[1] === 'asc' ? '' : '-',
                profile: req.query.profile,
                status: req.query.status,
                firstName: req.query.firstName,
                email: req.query.email,
                itemsPerPage: req.query.itemsPerPage || 100,
                page: req.query.page || 1
            };

            if (req.query.duplicates && req.query.duplicates === 'true') {
                duplicatesSearch(req, res);
            } else {
                simpleSearch(req, res, base.Collection.find());
            }
        }

        function duplicatesSearch(req, res) {
            var group = {
                $group:
                    {
                        _id: {firstName: "$firstName"},
                        uniqueIds: {$addToSet: "$_id"},
                        count: {$sum: 1}
                    }
            };
            var match = {
                $match: {
                    count: {"$gt": 1}
                }
            };
            var sort = {
                $sort: {
                    count: -1
                }
            };

            base.Collection
                .aggregate([group, match, sort], onDuplicatesFound);

            function onDuplicatesFound(err, results) {
                var query;
                var uniqueIds = [];

                results.forEach(function (result) {
                    result.uniqueIds.forEach(function (id) {
                        uniqueIds.push(id);
                    })
                });

                query = base.Collection
                    .find({_id: {$in: uniqueIds}});

                simpleSearch(req, res, query);
            }
        }

        function simpleSearch(req, res, query) {
            var countQuery;
            if (req.queryParams.firstName) {
                query.find({"firstName": new RegExp(req.queryParams.firstName, 'i')});
            }
            if (req.queryParams.email) {
                query.find({"email": new RegExp(req.queryParams.email, 'i')});
            }
            if (req.queryParams.status) {
                query.find({"status": req.queryParams.status});
            }
            if (req.queryParams.profile) {
                query.find({"profile": req.queryParams.profile});
            }

            countQuery = query;

            query
                .sort(req.queryParams.sortDirection + req.queryParams.sortField)
                .skip(req.queryParams.itemsPerPage * (req.queryParams.page - 1))
                .limit(req.queryParams.itemsPerPage)
                .populate('profile');

            var firstQ = function (callback) {
                query
                    .exec(function (err, data) {
                        queryExecFn(err, data, callback)
                    });
            };

            var secondQ = function (callback) {
                countQuery
                    .count()
                    .exec(function (err, data) {
                        queryExecFn(err, data, callback)
                    });
            };

            async.parallel([firstQ, secondQ], function (err, results) {
                res.json({pupils: results[0], count: results[1]});
            });
        }

        function historyList(req, res) {
            base.HistoryModel
                .find()
                .populate('pupil')
                .sort('-created')
                .exec(function (err, histories) {
                    res.render('pupil/histories.jade', {
                        histories: histories
                    });
                })
        }

        function testPage(req, res) {
            res.locals.siteConfig = app.siteConfig;
            res.render('pupil/test.jade', {});
        }

        function getUserData(req, res) {
            //TODO close all popups when unauthorized
            var findPupilQuery,
                findProfilesQuery;

            res.locals.siteConfig = app.siteConfig;

            findPupilQuery = function (callback) {
                base.Collection
                    .findOne({_id: req.user.userId})
                    .populate('profile')
                    .exec(function (err, data) {
                        queryExecFn(err, data, callback)
                    });
            };

            findProfilesQuery = function (callback) {
                app.profileController.Collection
                    .find()
                    .exec(function (err, data) {
                        queryExecFn(err, data, callback)
                    });
            };

            async.parallel([findPupilQuery, findProfilesQuery], onResultsFound);

            function onResultsFound(err, results) {
                var pupil = results[0],
                    profiles = results[1],
                    status = pupil.status,
                    viewData,
                    viewName;

                viewData = {
                    user: pupil,
                    profiles: profiles,
                    profile: pupil.profile
                };

                if (pupil.status === 'new clear') {
                    status = 'newClear';
                }
                if (status === 'approved') {
                    viewData.pupilViewName = createApprovedPupilView(pupil, profile);
                }
                viewName = 'pupils/' + status + '.jade';

                res.render(viewName, viewData);
            }
        }

        function createApprovedPupilView(pupil, profile) {
            console.log(arguments);
            var date = new Date;

            var firstExamDate = profile.firstExamDate;
            var secondExamDate = profile.secondExamDate;

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
                    templateName = templateName + (profile.firstUploaded ? 'aFbS' : 'aFbSnoR');
                }
                if (date >= secondExamDate) {
                    if (profile.totalUploaded) {
                        templateName = templateName + 'Total';
                    } else {
                        templateName = templateName + (profile.secondUploaded ? 'aS' : 'aSnoR');
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
                    rts.forEach(function (rt) {
                        console.log('___:', rt);
                    });
                });

                //base.RefreshTokenModel.find
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
            base.AccessTokenModel.findOne({token: accessToken}, function (err, token) {
                if (err) {
                    return done(err);
                }
                if (!token) {
                    return done(null, false);
                }

                if (Math.round((Date.now() - token.created) / 1000) > base.TOKENLIFE) {
                    base.AccessTokenModel.remove({token: accessToken}, function (err) {
                        if (err) return done(err);
                    });
                    return done(null, false, {message: 'Token expired'});
                }

                base.Collection.findById(token.userId, function (err, user) {
                    if (err) {
                        return done(err);
                    }
                    if (!user) {
                        return done(null, false, {message: 'Unknown user'});
                    }

                    var info = {scope: '*'};
                    done(null, user, info);
                });
            });
        }

        function ClientPasswordStrategy(clientId, clientSecret, done) {
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

        function queryExecFn(err, data, callback) {
            if (err) {
                callback(err, null)
            }
            else {
                callback(null, data);
            }
        }
    }
;


exports.PupilsController = PupilsController;