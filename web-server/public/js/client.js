var pomelo = window.pomelo;
var host = "127.0.0.1";
var port = "3010";
var myrole;
var table;
var playing = false;
var userName;
var room;

function chessHandler(data) {
    switch (data.cmd) {
    case 'guestJoin':
        alert(data.guestName + ' coming');
        $("#startBtn").attr("disabled", false);
        break;
    case 'playerExit':
        alert(data.name + ' exit!');
        $("#startBtn").attr("disabled", true);
        $("#restartBtn").attr("disabled", true);
        myrole = 'host';
        break;
    case 'playChess':
        if (myrole == 'guest') {
            setPiece(data.position, 'host');
        } else if (myrole == 'host') {
            setPiece(data.position, 'guest');
        }
        break;
    case 'result':
        alert(data.winner + ' win');
        playing = false;
        if (myrole == 'host') $("#startBtn").attr("disabled", false);
        $("#restartBtn").attr("disabled", true);
        break;
    case 'chessBegin':
        alert('game begin');
        startGame();
        break;
    case 'chessReset':
        if (confirm(data.name + ' request to restart the game?')) {
            pomelo.request("chess.chessHandler.begin", {
                room: room
            }, function(data) {
                startGame();
            });
        }
        break;
    }
}

function updateRoomStatus(data) {
    table.fnClearTable();
    table.fnAddData(data.rooms, true);

    //$("#example tbody tr").dblclick(function(e) {
    //    if ( !! userName) {
    //        if (table.fnGetData(this)[2] == 'empty') createOrJoin('create');
    //        else if (table.fnGetData(this)[2] == 'waiting') createOrJoin('join');
    //    }
    //});
    $("#example tbody tr").click(function(e) {
        if (!$(this).hasClass('row_selected')) {
            table.$('tr.row_selected').removeClass('row_selected');
            $(this).addClass('row_selected');
        }
    });
}

function setEnterRoomStatus() {
    $("#exitBtn").attr("disabled", false);
    $("#createBtn").attr("disabled", true);
    $("#joinBtn").attr("disabled", true);
}

function setExitRoomStatus() {
    $("#exitBtn").attr("disabled", true);
    $("#createBtn").attr("disabled", false);
    $("#joinBtn").attr("disabled", false);
    $("#restartBtn").attr("disabled", true);
    $("#startBtn").attr("disabled", true);
}

function createOrJoin(op) {
    var anSelected = table.$('tr.row_selected')[0];

    if ( !! anSelected) {
        room = table.fnGetPosition(anSelected);
        //alert(index);
    } else {
        alert('请选择房间');
        return;
    }
    if (op == "create") {
        pomelo.request("chess.chessHandler.create", {
            room: room
        }, function(data) {
            if (data.code == 200) {
                myrole = "host";
                setEnterRoomStatus();
            } else if (data.code == 500) {
                alert(data.msg);
            }
        });
    } else if (op == "join") {
        pomelo.request("chess.chessHandler.join", {
            username: userName,
            room: room
        }, function(data) {
            if (data.code == 200) {
                myrole = "guest";
                setEnterRoomStatus();
            } else if (data.code == 500) {
                alert(data.msg);
            }
        });
    }
}

function playChess(position, cb) {
    pomelo.request("chess.chessHandler.chess", {
        position: position,
        room: room
    }, function(data) {
        if (data.code == 200) {
            cb(data.position);
        } else if (data.code == 500) alert(data.msg);
    });
}

function startGame() {
    pieceBox.innerHTML = "";
    createMap();
    bindEvent();
    playing = true;
    $("#restartBtn").attr("disabled", false);
    $("#startBtn").attr("disabled", true);
}

$(document).ready(function() {
    pomelo.init({
        host: host,
        port: port,
        log: true
    }, function() {
        pomelo.on('onStatus', updateRoomStatus);
        pomelo.on('onChess', chessHandler);
    });


    $("#loginBtn").click(function() {
        var un = $("#username").val();
        if (un != '') {
            pomelo.request("connector.entryHandler.login", {
                username: un,
                channelId: '1'
            }, function(data) {
                if (data.code == 200) {
                    userName = un;
                    $("#loginBtn").attr("disabled", true);
                    $("#username").attr("disabled", true);
                    $("#createBtn").attr("disabled", false);
                    $("#joinBtn").attr("disabled", false);

                    $('#demo').html('<table cellpadding="0" cellspacing="0" border="0" class="display" id="example"></table>');
                    table = $('#example').dataTable({
                        "aaData": data.rooms,
                        "aoColumns": [{
                            "sTitle": "Room"
                        }, {
                            "sTitle": "Host"
                        }, {
                            "sTitle": "Status"
                        }]
                    });

                    //$("#example tbody tr").dblclick(function(e) {
                    //    if ( !! userName) {
                    //        if (table.fnGetData(this)[2] == 'empty') createOrJoin('create');
                    //        else if (table.fnGetData(this)[2] == 'waiting') createOrJoin('join');
                    //    }
                    //});
                    $("#example tbody tr").click(function(e) {
                        if (!$(this).hasClass('row_selected')) {
                            table.$('tr.row_selected').removeClass('row_selected');
                            $(this).addClass('row_selected');
                        }
                    });

                } else
                alert(un + ' already exists in this channel');
            });
        }
    });

    $("#createBtn").click(function() {
        createOrJoin('create');
    });

    $("#joinBtn").click(function() {
        createOrJoin('join');
    });

    $("#startBtn").click(function() {
        pomelo.request("chess.chessHandler.begin", {
            room: room
        }, function(data) {
            startGame();
        });
    });
    
    $("#restartBtn").click(function() {
        pomelo.request("chess.chessHandler.reset", {
            room: room
        }, function(data) {
        
        });
    });

    $("#exitBtn").click(function() {
        pomelo.request("chess.chessHandler.exit", {
            room: room
        }, function(data) {
            if (data.code == 200) {
                if (iArray != null) unbindEvent();
                playing = false;
                setExitRoomStatus();

            }
        });
    });

    $("#createBtn").attr("disabled", true);
    $("#joinBtn").attr("disabled", true);
    $("#startBtn").attr("disabled", true);
    $("#restartBtn").attr("disabled", true);
    $("#exitBtn").attr("disabled", true);
});