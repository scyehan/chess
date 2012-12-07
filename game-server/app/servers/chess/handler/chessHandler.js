var Player = require('../../../model/player');
module.exports = function(app) {
     return new Handler(app);
};

var Handler = function(app) {
     this.app = app;
     this.channelService = this.app.get('channelService');
};

var handler = Handler.prototype;

handler.create = function(msg, session, next) {
     var channel = this.channelService.getChannel(session.get('channel'), false);
     console.log('create channelId:' + session.get('channel'));
     if ( !! channel) {

          if (channel.rooms[msg.room].status != 'empty') {
               next(null, {
                    code: 500,
                    msg: 'The room is in use!'
               });
               return;
          }
          var gameRoom = channel.rooms[msg.room];
          var player = channel.userMap[session.uid];
          //console.log('player',player.getUidSid());
          gameRoom.host = player;
          player.room = msg.room;
          gameRoom.status = 'waiting';
          this.postRoomStatus(channel);
          next(null, {
               code: 200,
               room: msg.room
          });
     } else
     console.log('create channel not found');
}

handler.join = function(msg, session, next) {
     var channel = this.channelService.getChannel(session.get('channel'), false);

     if ( !! channel) {
          console.log('join room:' + msg.room);
          if (channel.rooms[msg.room].status != 'waiting') {
               next(null, {
                    code: 500,
                    msg: 'Can not join this room!'
               });
               return;
          }
          var gameRoom = channel.rooms[msg.room];
          var player = channel.userMap[session.uid];
          gameRoom.guest = player;
          player.room = msg.room;
          gameRoom.status = 'ready';
          gameRoom.sendGuestJoin();
          this.postRoomStatus(channel);
          next(null, {
               code: 200,
               room: msg.room,
               host: gameRoom.host.name
          });
     }
}

handler.begin = function(msg, session, next) {
     var channel = this.channelService.getChannel(session.get('channel'), false);

     if ( !! channel) {
          console.log('begin room:' + msg.room);
          var player = channel.userMap[session.uid];
          if (channel.rooms[player.room].status == 'ready' || channel.rooms[player.room].status == 'finish') {
               channel.rooms[player.room].begin();
               channel.rooms[player.room].status = 'playing';
               this.postRoomStatus(channel);
               next(null, {
                    code: 200,
                    cmd: 'chessBegin'
               });
          }
     }
}

handler.chess = function(msg, session, next) {
     var channel = this.channelService.getChannel(session.get('channel'), false);
     console.log('chess room:' + msg.room);
     if ( !! channel) {
          var player = channel.userMap[session.uid];
          var result = channel.rooms[player.room].playChess(player, msg.position);
          next(null, result);
     }
}

handler.exit = function(msg, session, next) {
     var channel = this.channelService.getChannel(session.get('channel'), false);
     console.log('exit room:' + msg.room);
     if ( !! channel) {
          var player = channel.userMap[session.uid];
          var gameRoom = channel.rooms[player.room];
          if (player == gameRoom.host) {
               if (gameRoom.guest != null) {
                    gameRoom.sendPlayerExit(player.name, gameRoom.guest);
                    gameRoom.host = gameRoom.guest;
                    gameRoom.status = 'waiting';
               } else {
                    gameRoom.host = null;
                    gameRoom.status = 'empty';
               }
          } else if (player == gameRoom.guest) {
               console.log('exit guest exit');
               gameRoom.sendPlayerExit(player.name, gameRoom.host);
               gameRoom.status = 'waiting';
          }
          gameRoom.guest = null;
          this.postRoomStatus(channel);
          next(null, {
                    code: 200
               });
     }
}

handler.doExit = function(channel, player) {

     console.log('do exit room:' + player.room);
     if ( !! channel) {
          var gameRoom = channel.rooms[player.room];
          if (player == gameRoom.host) {
               if (gameRoom.guest != null) {
                    gameRoom.sendPlayerExit(player.name, gameRoom.guest);
                    gameRoom.host = gameRoom.guest;
                    gameRoom.status = 'waiting';
               } else {
                    gameRoom.host = null;
                    gameRoom.status = 'empty';
               }
          } else if (player == gameRoom.guest) {
               console.log('doExit guest exit');
               gameRoom.sendPlayerExit(player.name, gameRoom.host);
               gameRoom.status = 'waiting';
          }
          gameRoom.guest = null;
          this.postRoomStatus(channel);
     }
}

handler.postRoomStatus = function(channel) {
     console.log('postRoomStatus');
     var data = getRoomStatus(channel);
     channel.pushMessage({
          route: 'onStatus',
          rooms: data
     });
}

function getPlayer(session) {
     return Player(session.get('name'), session.uid, session.get('sid'));
}

function getRoomStatus(channel) {
     var data = [];
     for (var i = 0; i < channel.rooms.length; i++) {
          data[i] = channel.rooms[i].getRoomStatus();
     }
     return data;
}

module.exports.getRoomStatus = getRoomStatus;