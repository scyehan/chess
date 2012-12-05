module.exports = function(app) {
  return new ChessRemote(app);
};

var INDEX = 0;
var HOST = 1;
var STATUS = 2;

var channelStatus = [];
for (var i = 0; i < 5; i++)
channelStatus[i] = [i, '', 'empty'];

var ChessRemote = function(app) {
  this.app = app;
  this.channelService = app.get('channelService');
};

var getOtherUids = function(channel, role) {
  var tuid, tsid;
  if (role == 'host') {
    tuid = channel.guestUser;
    tsid = channel.getMember(tuid)['sid'];
  } else if (role == 'guest') {
    tuid = channel.hostUser;
    tsid = channel.getMember(tuid)['sid'];
  }
  return [{
    uid: tuid,
    sid: tsid
  }];
}

ChessRemote.prototype.informGuestComing = function(channel, username) {
  var param = {
    route: 'onChess',
    cmd: 'guestJoin',
    guestName: username
  };
  this.channelService.pushMessageByUids(param, getOtherUids(channel, 'guest'));
}

ChessRemote.prototype.checkRoom = function(room, role, cb) {
  console.log("checkRoom:room "+room);
  if(role == "host")
  {
    console.log("checkRoom:host");
    if(channelStatus[room][STATUS] == 'empty')
      cb(true);
    else
      cb(false);
  }
  else if(role == "guest")
  {
    if(channelStatus[room][STATUS] == 'waiting')
      cb(true);
    else
      cb(false);
  }
}

/**
 * Add user into chat channel.
 *
 * @param {String} uid unique id for user
 * @param {String} sid server id
 * @param {String} name channel name
 * @param {boolean} flag channel parameter
 * @param {Callback} cb
 *
 */
ChessRemote.prototype.add = function(username, sid, room, role, cb) {
  var channel = null;
  switch (role) {
  case 'host':
    channel = this.channelService.getChannel(room, true);
    channel.hostUser = username;
    channel.userCount = 1;
    channel.rid = room;
    channelStatus[room][HOST] = username;
    channelStatus[room][STATUS] = 'waiting';
    //channel.watchers = [];
    break;
  case 'guest':
    channel = this.channelService.getChannel(room, false);
    channel.guestUser = username;
    channel.userCount++;
    this.informGuestComing(channel, username);
    channelStatus[room][STATUS] = 'ready';
    break;
    //case 'watcher':
    //  channel = this.channelService.getChannel(room, false);
    //  channel.watchers.push(username);
    //  break;
  }

  if ( !! channel) {
    channel.add(username, sid);
  }
  cb(this.get(room));
};

/**
 * Get user from chat channel.
 *
 * @param {Object} opts parameters for request
 * @param {String} name channel name
 * @param {boolean} flag channel parameter
 * @return {Array} users uids in channel
 *
 */
ChessRemote.prototype.get = function(room) {
  var users = null;
  var channel = this.channelService.getChannel(room, false);
  if ( !! channel) {
    users = {};
    users.host = channel.hostUser;
    users.guest = channel.guestUser;
    //console.log(users);
  }

  return users;
};

/**
 * Kick user out chat channel.
 *
 * @param {String} uid unique id for user
 * @param {String} sid server id
 * @param {String} name channel name
 *
 */
ChessRemote.prototype.kick = function(uid, sid, room, role, cb) {
  var channel = this.channelService.getChannel(room, false);
  // leave channel
  if ( !! channel) {
    channel.userCount--;
    channel.leave(uid, sid);
    if (channel.userCount == 0) {
      channel.destroy();
      channelStatus[room][HOST] = '';
      channelStatus[room][STATUS] = 'empty';
      return;
    }
    console.log(role);
    switch (role) {
    case 'host':
      this.hostExit(channel);
      channel.hostUser = channel.guestUser;
      channelStatus[room][HOST] = channel.hostUser;
      channel.guestUser = null;
      break;
    case 'guest':
      this.guestExit(channel);
      channel.guestUser = null;
      break;
    }
    channelStatus[room][STATUS] = 'waiting';
  }
};

ChessRemote.prototype.hostExit = function(channel) {
  console.info('function hostExit');
  var param = {
    route: 'onChess',
    cmd: 'hostExit',
    username:channel.hostUser
  };
  this.channelService.pushMessageByUids(param, getOtherUids(channel, 'host'));
}

ChessRemote.prototype.guestExit = function(channel) {
  console.info('function guestExit');
  var param = {
    route: 'onChess',
    cmd: 'guestExit',
    username:channel.guestUser
  };
  this.channelService.pushMessageByUids(param, getOtherUids(channel, 'guest'));
}


module.exports.getOtherUids = getOtherUids;
module.exports.channelStatus = channelStatus;
module.exports.INDEX = INDEX;
module.exports.HOST = HOST;
module.exports.STATUS = STATUS;