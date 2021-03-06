module.exports = function (app) {
    app.get('/admin/sotka', app.userController.Pass, function (req, res) {
        app.sotkaController.list(req, res);
    });

    app.get('/admin/sotka/renew', app.userController.Pass, function (req, res) {
        app.sotkaController.calculate(function() {
            res.redirect('/admin')
        });
    });
    app.get('/admin/sotka/getSubjectStats/:subjectId', app.userController.Pass, function(req, res) {
        var subjectId = req.params.subjectId;
		app.sotkaController.getSubjectStats(subjectId, function(data) {
            res.json(data)
        });
	});
    app.get('/admin/sotka/subjects/renew', app.userController.Pass, function (req, res) {
        app.sotkaController.calculateSubjects(function(data) {
            res.json(data)
        });
    });

    app.get('/admin/rest/sotka', app.userController.Pass, function (req, res) {
        app.sotkaController.restList(req, res);
    });
    
    app.get('/admin/rest/reports/subjects', app.userController.Pass, function (req, res) {
        app.subjectController.Collection
            .find()
            .exec(function(err, subjects) {
                res.json(subjects)
            })
    });

    app.get('/front/rest/sotka', function (req, res) {
        res.header(
            'Cache-Control',
            'private, no-cache, no-store, must-revalidate'
        );
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
        app.sotkaController.restList(req, res);
    });
    app.get('/front/rest/stats', function (req, res) {
        res.header(
            'Cache-Control',
            'private, no-cache, no-store, must-revalidate'
        );
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
        app.sotkaController.restStats(req, res);
    });
    app.post('/admin/rest/sotka', app.userController.Pass, function (req, res) {
        app.sotkaController.addProfile(req, res);
    });

    app.post(
        '/admin/rest/sotka/delete/:id',
        app.userController.Pass,
        function (req, res) {
            app.sotkaController.removeProfile(req, res);
        }
    );

    app.post(
        '/admin/rest/sotka/:id',
        app.userController.Pass,
        function (req, res) {
            app.sotkaController.updateProfile(req, res);
        }
    );

    app.post('/admin/sotka', app.userController.Pass, function (req, res) {
        app.sotkaController.save(req, res);
    });
};
