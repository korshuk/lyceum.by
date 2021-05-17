var express = require('express');
var cors = require('cors');

module.exports = function(app) {

    var router = express();
    var mailRouter = express();

    router.get('/', app.userController.Pass, function(req, res) {
        app.pupilsController.list(req, res);
    });

    router.get('/examresults', app.userController.Pass, function(req, res) {
        app.pupilsController.examresults(req, res);
    });

    router.get('/examresults/subject/:subjectId', app.userController.Pass, function(req, res) {
		app.subjectController.examresults(req, res);
	});
    router.get('/api/list', app.userController.Pass, function(req, res) {
        app.pupilsController.apiList(req, res);
    });
    router.get('/api/list/subject/:subjectId', app.userController.Pass, function(req, res) {
        app.pupilsController.apiListForSubject(req, res);
    });
    
    router.get('/api/list-export.json', app.userController.Pass, function(req, res) {
        app.pupilsController.apiListExport(req, res);
    });

    router.get('/history', app.userController.Pass, function(req, res) {
        app.pupilsController.historyList(req, res);
    });

    router.get('/test', app.userController.Pass, function(req, res) {
        app.pupilsController.testPage(req, res);
    });

    router.get('/emails', app.userController.Pass, function(req, res) {
        app.mailController.list(req, res);
    });

    router.get('/reset', app.userController.Pass, function(req, res) {
        app.pupilsController.resetPage(req, res);
    });
    router.post('/reset', app.userController.Pass, function(req, res) {
        app.pupilsController.resetData(req, res);
    });

    //router.get('/create', app.userController.Pass, function(req, res) {
    //    app.profileController.create(req, res);
    //});

    router.get('/delete/:id', app.userController.Pass, function(req, res) {
        app.pupilsController.remove(req, res);
    });

    router.get('/edit/:id', app.userController.Pass, function(req, res) {
        app.pupilsController.edit(req, res);
    });

    router.post('/edit/:id', app.userController.Pass, function(req, res) {
        app.pupilsController.changeStatus(req, res);
    });
    
    router.options('/api/examStatus/:id', cors());
    router.post('/api/examStatus/:id', cors(), function(req, res) {
        app.pupilsController.setExamStatus(req, res);
    });

    router.options('/api/savepupilseats/:examNum', cors());
    router.post('/api/savepupilseats/:examNum', cors(), function(req, res) {
        app.pupilsController.savePupilSeats(req, res);
    });

    router.post('/api/list', app.userController.Pass, function(req, res) {
        app.pupilsController.saveExams(req, res);
    });

    router.post('/api/listNew/:subjectId', app.userController.Pass, function(req, res) {
        app.pupilsController.saveExamsNew(req, res);
    });

    router.post('/api/seed-recommended', app.userController.Pass, function(req, res) {
        app.pupilsController.seedReccommended(req, res);
    });

    // router.post('/', app.userController.Pass, function(req, res) {
    //    app.profileController.save(req, res);
    //});

    router.put('/:id', app.userController.Pass, function(req, res) {
        app.pupilsController.update(req, res);
    });
    
    router.get('/images/request/:filename', app.userController.Pass, function(req, res) {
        app.pupilsController.v2.getRequestPhoto(req, res) 
    });

    

    //Emails Sender
    


    mailRouter.get('/list', app.userController.Pass, function(req, res) {
        app.mailController.emailSenderPage(req, res);
    });
    mailRouter.post('/new', app.userController.Pass, function(req, res) {
        app.mailController.sendEmailsToNew(req, res);
    });
    mailRouter.get('/log/download', app.userController.Pass, function(req, res) {
        app.mailController.logDownload(req, res);
    });
    mailRouter.get('/log/clear', app.userController.Pass, function(req, res) {
        app.mailController.logClear(req, res);
    });
    mailRouter.post('/invitation/:profileId/:examNumber', app.userController.Pass, function(req, res) {
        app.mailController.sendInvites(req, res);
    });
    


    app.use('/admin/pupils', router);
    app.use('/admin/pupils/emails', mailRouter);
};