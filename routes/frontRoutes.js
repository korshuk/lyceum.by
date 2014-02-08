module.exports = function(app) {
	require('../routes/frontIndex')(app);
	require('../routes/frontNews')(app);
	require('../routes/frontMedia')(app);
	require('../routes/frontCongratulations')(app);
	require('../routes/frontContacts')(app);
}