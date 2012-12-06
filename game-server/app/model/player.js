module.exports = function(name, uid, sid) {
     return new Player(name, uid, sid);
};

var Player = function(name, uid, sid) {
     this.name = name;
     this.uid = uid;
     this.sid = sid;
};

Player.prototype.getUidSid = function() {
     return [{
          uid: this.uid,
          sid: this.sid
     }];
}