module.exports = function(roomId, channelService) {
     return new GameRoom(roomId, channelService);
};

var GameRoom = function(roomId, channelService) {
     this.roomId = roomId;
     this.channelService = channelService;
     this.status = 'empty';
     this.host = null;
     this.guest = null;
};

/**
 * Api function
 */
GameRoom.prototype.begin = function(player) {
     this.board = [];
     for (var i = 0; i < 15; i++) {
          this.board[i] = [];
          for (var j = 0; j < 15; j++)
          this.board[i][j] = 'empty';
     }
     this.currentPlayer = this.host;
     if(player == this.host)
          this.sendChessBegin(this.guest);
     else if(player == this.guest)
          this.sendChessBegin(this.host);
}

GameRoom.prototype.playChess = function(player, position) {
     if (this.status != 'playing') return {
          code: 500,
          msg: "Game not begin!"
     };
     //var player = this.getPlayer(name);
     if (player != this.currentPlayer) return {
          code: 500,
          msg: "Wait for other to play!"
     };
     var y = parseInt(position / 15);
     var x = parseInt(position % 15);
     this.board[x][y] = player.name;
     var otherPlayer;
     if (player == this.host) otherPlayer = this.guest;
     else if (player == this.guest) otherPlayer = this.host;
     this.currentPlayer = otherPlayer;
     var chessParam = {
          route: 'onChess',
          cmd: 'playChess',
          position: position
     };
     this.pushMessageToPlayer(chessParam, otherPlayer);
     if (this.check(x, y, player.name)) {
          this.status = 'finish';
          var finishParam = {
               route: 'onChess',
               cmd: 'result',
               winner: player.name
          };
          this.pushMessageToPlayer(finishParam, this.host);
          this.pushMessageToPlayer(finishParam, this.guest);
     }
     return {
          code: 200,
          position: position
     };
}

GameRoom.prototype.sendGuestJoin = function() {
     var param = {
          route: 'onChess',
          cmd: 'guestJoin',
          guestName: this.guest.name
     };
     this.pushMessageToPlayer(param, this.host);
}

GameRoom.prototype.sendChessBegin = function(player) {
     var param = {
          route: 'onChess',
          cmd: 'chessBegin'
     };
     this.pushMessageToPlayer(param, player);
}

GameRoom.prototype.sendChessReset = function(player) {
     var param = {
          route: 'onChess',
          cmd: 'chessReset',
          name:player.name
     };
     this.pushMessageToPlayer(param, player);
}

GameRoom.prototype.sendPlayerExit = function(name, player) {
     var param = {
          route: 'onChess',
          cmd: 'playerExit',
          name: name
     };
     this.pushMessageToPlayer(param, player);
}

GameRoom.prototype.getRoomStatus = function() {
     if(!this.host)
          return [this.roomId,'',this.status];
     else
          return [this.roomId,this.host.name,this.status];
}

/**
 * Util function
 */
GameRoom.prototype.getPlayer = function(name) {
     if (name == this.host.name) return this.host;
     else if (name == this.guest.name) return this.guest;
     else
     return null;
}

GameRoom.prototype.pushMessageToPlayer = function(param, player) {
     this.channelService.pushMessageByUids(param, player.getUidSid());
}

GameRoom.prototype.check = function(x, y, name) {
     var i = x,
         j = y;
     var count = 0; //棋子计数器
     /*计算水平方向连续棋子个数*/
     while (i > -1 && this.board[i][j] == name) {
          i--;
          count++; //累加左侧
     }
     i = x + 1;
     while (i < 15 && this.board[i][j] == name) {
          i++;
          count++; //累加右侧
     }
     if (count >= 5) return true; //获胜
     /*计算竖直方向连续棋子个数*/
     i = x;
     count = 0;
     while (j > -1 && this.board[i][j] == name) {
          j--;
          count++; //累加上方
     }
     j = y + 1;
     while (j < 15 && this.board[i][j] == name) {
          j++;
          count++; //累加下方
     }
     if (count >= 5) return true; //获胜
     /*计算左上右下方向连续棋子个数*/
     j = y;
     count = 0;
     while (i > -1 && j > -1 && this.board[i][j] == name) {
          i--;
          j--;
          count++; //累加左上
     }
     i = x + 1;
     j = y + 1;
     while (i < 15 && j < 15 && this.board[i][j] == name) {
          i++;
          j++;
          count++; //累加右下
     }
     if (count >= 5) return true; //获胜
     /*计算右上左下方向连续棋子个数*/
     i = x;
     j = y;
     count = 0;
     while (i < 15 && j > -1 && this.board[i][j] == name) {
          i++;
          j--;
          count++; //累加右上
     }
     i = x - 1;
     j = y + 1;
     while (i > -1 && j < 15 && this.board[i][j] == name) {
          i--;
          j++;
          count++; //累加左下
     }
     if (count >= 5) return true; //获胜
     return false; //该步没有取胜
}