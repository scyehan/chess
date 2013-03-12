module.exports = function(app) {
       return new Handler(app);
};

var Handler = function(app) {
       this.app = app;
};

var handler = Handler.prototype;

/**
 * Gate handler that dispatch user to connectors.
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param {Function} next next stemp callback
 *
 */
handler.queryEntry = function(msg, session, next) {
    // get all connectors
	var connectors = this.app.getServersByType('connector');
	if(!connectors || connectors.length === 0) {
		next(null, {
			code: 500,
                        msg:'no connector found'
		});
		return;
	}
    // select connector
       var index = msg.channelId % connectors.length;
       var res = connectors[index];
	next(null, {
		code: 200,
		host: res.host,
		port: res.clientPort
	});
};
