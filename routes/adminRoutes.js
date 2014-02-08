module.exports = function(app) {
	require('../routes/adminLogin')(app);
	require('../routes/adminUsers')(app);
	require('../routes/adminPages')(app);
	require('../routes/adminNews')(app);
	require('../routes/adminMedia')(app);
	require('../routes/adminContacts')(app);
	require('../routes/adminCongratulations')(app);
	require('../routes/adminImages')(app);
}