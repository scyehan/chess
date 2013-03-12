var pomelo = require('pomelo');

/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'chess');
//app.defaultConfiguration();

var route = function(session, msg, app, cb) {
	var chessServers = app.getServersByType('chess');

	if(!chessServers || chessServers.length === 0) {
		cb(new Error('can not find chess servers.'));
		return;
	}
        console.log('route channel:'+session.get('channel'));
        var index = session.get('channel') % chessServers.length;
        var res = chessServers[index];

	cb(null, res.id);
};

app.configure('production|development', function() {
	// route configures
	app.route('chess', route);

	// filter configures
	app.filter(pomelo.timeout());
});

// start app
app.start();

process.on('uncaughtException', function (err) {
    console.error(' Caught exception: ' + err.stack);
});