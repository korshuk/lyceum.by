module.exports = function (app) {
    'use strict';
    require('../routes/adminSettings')(app);
    require('../routes/adminSotka')(app);
    require('../routes/adminCash')(app);
    require('../routes/adminFiles')(app);
    require('../routes/adminLogin')(app);
    require('../routes/adminUsers')(app);
    require('../routes/adminCongratulations')(app);
    require('../routes/adminExams')(app);
    require('../routes/adminContacts')(app);
    require('../routes/adminPages')(app);
    require('../routes/adminNews')(app);
    require('../routes/adminMedia')(app);
    require('../routes/adminImages')(app);
};