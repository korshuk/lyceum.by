module.exports = function (app) {
    'use strict';
    console.log('pupilRoutes')
    app.post('/getUserObject', function (req, res) {
        console.log('getUserObject!@!@!@!@!@!@!!!!!!!!')
        
        app.currentPupilController.getUserObject(req, res, function(doc) {
            res.json(doc)
        });
        

        // app.sotkaController.calculate(function(doc) {
        //     res.json(doc)
        // });
    });
}