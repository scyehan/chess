var GameRoom = require('../../../model/gameRoom');
var ChessHandler = require('../handler/chessHandler');
var Player = require('../../../model/player');
module.exports = function(app) {
  return new ChessRemote(app);
};
var ROOMSIZE = 10;

var ChessRemote = function(app) {
  this.app = app;
  this.channelService = app.get('channelService');
  this.handler = ChessHandler(app);

};

ChessRemote.prototype.login = function(channelId, name,uid, sid, cb) {
  console.log('remote login', 'server id:' + this.app.get('serverId'));
  console.log('remote login', 'channel id:' + channelId);
  var channel = this.channelService.getChannel(channelId, false);
  if (!channel) {
    channel = this.initChannel(channelId);
  }
  channel.add(uid, sid);
  channel.userMap[uid] = Player(name,uid,sid);
  cb(ChessHandler.getRoomStatus(channel));
}

ChessRemote.prototype.initChannel = function(channelId) {
  var channel = this.channelService.getChannel(channelId, true);
  channel.rooms = [];
  for (var i = 0; i < ROOMSIZE; i++) {
    channel.rooms[i] = GameRoom(i, this.channelService);
  }
  channel.userMap = {};
  return channel;
}

ChessRemote.prototype.kick = function(chennelId, uid) {
  var channel = this.channelService.getChannel(channelId, false);
  channel.leave(player.uid, player.sid);
  var player = channel.userMap[player.uid];
  this.handler.doExit(channel, player);
}