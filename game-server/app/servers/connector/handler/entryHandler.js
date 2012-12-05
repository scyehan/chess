module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
	this.app = app;
};

var handler = Handler.prototype;

/**
 * New client entry chess server. 
 * 
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
handler.create = function(msg, session, next) {
	var self = this;
	this.app.rpc.chess.chessRemote.checkRoom(session, msg.room, "host", function(result) {
		if (result) {
			console.log('create:before add');
			self.add(msg, session, 'host', next);
		} else
		next(null, {
			code: 500,
			msg: "The room is in use!"
		});
	});
};

handler.join = function(msg, session, next) {
	var self = this;
	this.app.rpc.chess.chessRemote.checkRoom(session, msg.room, "guest", function(result) {
		if (result) self.add(msg, session, 'guest', next);
		else
		next(null, {
			code: 500,
			msg: "The room is in use!"
		});
	});
};

handler.bind = function(msg, session, next) {
	var sessionService = this.app.get('sessionService');
	var uid = msg.username;
	if ( !! sessionService.getByUid(uid)) {
		next(null, {
			code: 500,
			msg: "This user name has already exist!"
		});
		return;
	}
	session.bind(uid);
	session.on('closed', onUserLeave.bind(null, this.app));
	next(null, {
		code: 200,
		msg: "Login success!"
	});
}

handler.add = function(msg, session, role, next) {
	console.log('add:begin add');
	var self = this;
	var rid = msg.room;
	session.set('rid', rid);
	session.set('role', role);
	session.push('rid', function(err) {
		if (err) {
			console.error('set rid for session service failed! error is : %j', err.stack);
		}
	});
	session.push('role', function(err) {
		if (err) {
			console.error('set role for session service failed! error is : %j', err.stack);
		}
	});

	//put user into channel
	self.app.rpc.chess.chessRemote.add(session, msg.username, self.app.get('serverId'), rid, session.get('role'), function(users) {
		next(null, {
			code: 200,
			users: users
		});
	});
}

/**
 * User log out handler
 *
 * @param {Object} app current application
 * @param {Object} session current session object
 *
 */
var onUserLeave = function(app, session) {
	if (!session || !session.uid) {
		return;
	}
	app.rpc.chess.chessRemote.kick(session, session.uid, app.get('serverId'), session.get('rid'), session.get('role'), null);
};