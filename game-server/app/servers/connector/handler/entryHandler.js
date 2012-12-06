module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
	this.app = app;
	//console.log('connector','server id:'+this.app.get('serverId'));
};

var handler = Handler.prototype;

handler.login = function(msg, session, next) {
	var sessionService = this.app.get('sessionService');
	var uid = msg.username + '*' + msg.channelId;
	var sid = this.app.get('serverId');
	if ( !! sessionService.getByUid(uid)) {
		next(null, {
			code: 500,
			msg: "This user name has already exist in this channel!"
		});
		return;
	}
	session.bind(uid);
	session.set('sid', sid);
	session.push('sid', function(err) {
		if (err) {
			console.error('set player for session service failed! error is : %j', err.stack);
		}
	});
	session.set('name', msg.username);
	session.push('name', function(err) {
		if (err) {
			console.error('set player for session service failed! error is : %j', err.stack);
		}
	});
	session.set('channel', msg.channelId);
	session.push('channel', function(err) {
		if (err) {
			console.error('set channelId for session service failed! error is : %j', err.stack);
		}
	});
	session.on('closed', onUserLeave.bind(null, this.app));
	this.app.rpc.chess.chessRemote.login(session,msg.channelId,msg.username,uid,sid,function(data)
	{
		//console.log(data);
		next(null, {
		code: 200,
		msg: "Login success!",
		rooms:data
	});
	});
}

var onUserLeave = function(app, session) {
	if (!session || !session.uid) {
		return;
	}
	app.rpc.chess.chessRemote.kick(session, session.get('channel'),session.uid);
};