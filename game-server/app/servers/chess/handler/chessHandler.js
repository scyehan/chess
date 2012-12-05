var chessRemote = require('../remote/chessRemote');
var chessCheck = require('../../../util/chessCheck');

module.exports = function(app) {
     return new Handler(app);
};

var Handler = function(app) {
     this.app = app;
     this.channelService = this.app.get('channelService');
     this.remote = chessRemote(this.app);
};

var handler = Handler.prototype;

handler.getChannelStatus = function(msg, session, next) {
     next(null, {
          code: 200,
          channels: chessRemote.channelStatus
     });
}

handler.chess = function(msg, session, next) {
     console.log('function chess:');
     var channel = this.channelService.getChannel(session.get('rid'), false);
     console.log('session rid:' + session.get('rid'));
     if ( !! channel) {
          if (chessRemote.channelStatus[channel.rid][chessRemote.STATUS] != 'playing') {
               console.log('not playing');
               next(null, {
                    code: 500,
                    msg: "Waiting for begin!"
               });
               return;
          }
          console.log('current player:'+channel.currentPlayer);
          if (channel.currentPlayer == msg.role) {
               console.log('play');
               next(null, {
                    code: 200,
                    role: msg.role,
                    position: msg.position
               });
               this.playChess(channel, msg.role, msg.position);
          } else {
               console.log('other play');
               next(null, {
                    code: 500,
                    msg: "Waiting for other to play!"
               });
               return;
          }
     }
}

handler.begin = function(msg, session, next) {
     var rid = session.get('rid');
     if(chessRemote.channelStatus[rid][chessRemote.STATUS] != 'ready' &&
        chessRemote.channelStatus[rid][chessRemote.STATUS] != 'finish')
     {
          next(null, {
               code: 500,
               msg: 'You should wait for guest!'
          });
          return;
     }
     
     var channel = this.channelService.getChannel(rid, false);
     if ( !! channel) {
          channel.board = [];
          for (var i = 0; i < 15; i++) {
               channel.board[i] = [];
               for (var j = 0; j < 15; j++)
               channel.board[i][j] = '';
          }
          chessRemote.channelStatus[rid][chessRemote.STATUS] = 'playing';
          channel.currentPlayer = 'host';
          var param = {
               route: 'onChess',
               cmd: 'chessBegin',
          };
          this.channelService.pushMessageByUids(param, chessRemote.getOtherUids(channel, 'host'));
          next(null, {
               code: 200,
               cmd: 'chessBegin'
          });
     }
}

handler.exit = function(msg, session, next) {
     var channel = this.channelService.getChannel(session.get('rid'), false);
     if ( !! channel) {
          var sid = channel.getMember(session.uid)['sid'];
          this.remote.kick(session.uid, sid, session.get('rid'), session.get('role'), null);
          next(null, {
               code: 200,
               room: session.get('rid')
          });
     }
     else
     next(null, {
               code: 500,
               msg: "channel not found!"
          });
}

handler.playChess = function(channel, role, position) {
     var y = parseInt(position / 15);
     var x = parseInt(position % 15);
     var winner;
     channel.board[x][y] = role;

     var param = {
          route: 'onChess',
          cmd: 'playChess',
          role: role,
          position: position
     };
     if (role == "host") {
          channel.currentPlayer = "guest";
          winner = channel.hostUser;
     } else if (role == "guest") {
          channel.currentPlayer = "host";
          winner = channel.guestUser;
     }
     this.channelService.pushMessageByUids(param, chessRemote.getOtherUids(channel, role));

     if (chessCheck.check(channel.board, x, y, role)) {
          console.log('finish');
          chessRemote.channelStatus[channel.rid][chessRemote.STATUS] = 'finish';
          var finishParam = {
               route: 'onChess',
               cmd: 'result',
               winner: winner
          };
          this.channelService.pushMessageByUids(finishParam, chessRemote.getOtherUids(channel, 'host'));
          this.channelService.pushMessageByUids(finishParam, chessRemote.getOtherUids(channel, 'guest'));
     }
}