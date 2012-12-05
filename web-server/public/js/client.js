var pomelo = window.pomelo;
var host = "127.0.0.1";
var port = "3010";
var myrole;
var updateRoomTimer;
var table;
var playing = false;
var myturn = false;
var userName;

function hostHandler(data) {
    switch (data.cmd) {
    case 'guestJoin':
        alert(data.guestName + ' coming');
        $("#startBtn").attr("disabled", false);
        break;
    case 'guestExit':
        alert(data.username + ' exit!');
        $("#startBtn").attr("disabled", true);
        $("#restartBtn").attr("disabled", true);
        break;
    case 'playChess':
        if(data.role == 'guest')
        {
            //alert(data.position);
            myturn = true;
            setPiece(data.position,'guest');
        }
        break;
    case 'result':
        alert(data.winner + ' win');
        playing = false;
        $("#startBtn").attr("disabled", false);
        $("#restartBtn").attr("disabled", true);
        break;
    }
}

function guestHandler(data) {
    switch (data.cmd) {
    case 'hostExit':
        alert(data.username + ' exit!');
        myrole = 'host';
        pomelo.removeAllListeners('onChess');
        pomelo.on('onChess', hostHandler);
        break;
    case 'chessBegin':
        alert('game begin');
        startGame();
        break;
    case 'playChess':
        if(data.role == 'host')
        {
            //alert(data.position);
            myturn = true;
            setPiece(data.position,'host');
        }
        break;
    case 'result':
        alert(data.winner + ' win');
        playing = false;
        //$("#startBtn").attr("disabled", false);
        $("#restartBtn").attr("disabled", true);
        break;
    }
}

function updateRoomStatus() {
    pomelo.request("chess.chessHandler.getChannelStatus", function(data) {
        //alert(JSON.stringify(data.channels));
        table.fnClearTable();
        table.fnAddData(data.channels, true);
        $("#example tbody tr").dblclick(function(e) {
            if ( !! userName) {
                    if (table.fnGetData(this)[2] == 'empty') createOrJoin('create');
                    else if (table.fnGetData(this)[2] == 'waiting') createOrJoin('join');
                }
        });
        $("#example tbody tr").click(function(e) {
            if (!$(this).hasClass('row_selected')) {
                table.$('tr.row_selected').removeClass('row_selected');
                $(this).addClass('row_selected');
            }
        });
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
    var room;
    if ( !! anSelected) {
        room = table.fnGetPosition(anSelected);
        //alert(index);
    } else {
        alert('请选择房间');
        return;
    }
    if (op == "create") {
        pomelo.request("connector.entryHandler.create", {
            username: userName,
            room: room
        }, function(data) {
            if (data.code == 200) {
                pomelo.on('onChess', hostHandler);
                //alert(JSON.stringify(data.users));
                myrole = "host";
                setEnterRoomStatus();
                updateRoomStatus();
            } else if (data.code == 500) {
                alert(data.msg);
            }
        });
    } else if (op == "join") {
        pomelo.request("connector.entryHandler.join", {
            username: userName,
            room: room
        }, function(data) {
            if (data.code == 200) {
                pomelo.on('onChess', guestHandler);
                //alert(JSON.stringify(data.users));
                myrole = "guest";
                setEnterRoomStatus();
                updateRoomStatus();
            } else if (data.code == 500) {
                alert(data.msg);
            }
        });
    }
}

function playChess(position,cb)
{
    pomelo.request("chess.chessHandler.chess", {
        position: position,
        role: myrole
    }, function(data) {
        if (data.code == 200)
        {
            cb(data.position);
        }
        else if (data.code == 500) alert(data.msg);
    });
}

function startGame()
{
    pieceBox.innerHTML="";
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
        pomelo.request("chess.chessHandler.getChannelStatus", function(data) {
            //alert(JSON.stringify(data.channels));
            $('#demo').html('<table cellpadding="0" cellspacing="0" border="0" class="display" id="example"></table>');
            table = $('#example').dataTable({
                "aaData": data.channels,
                "aoColumns": [{
                    "sTitle": "Room"
                }, {
                    "sTitle": "Host"
                }, {
                    "sTitle": "Status"
                }]
            });
            updateRoomTimer = setInterval(updateRoomStatus, 5 * 1000);
            $("#example tbody tr").dblclick(function(e) {
                if ( !! userName) {
                    if (table.fnGetData(this)[2] == 'empty') createOrJoin('create');
                    else if (table.fnGetData(this)[2] == 'waiting') createOrJoin('join');
                }
            });
            $("#example tbody tr").click(function(e) {
                if (!$(this).hasClass('row_selected')) {
                    table.$('tr.row_selected').removeClass('row_selected');
                    $(this).addClass('row_selected');
                }
            });
        });
    });

    
    $("#loginBtn").click(function() {
        var un = $("#username").val();
        if (un != '') {
            pomelo.request("connector.entryHandler.bind", {
                username: un
            }, function(data) {
                if (data.code == 200) {
                    userName = un;
                    $("#loginBtn").attr("disabled", true);
                    $("#username").attr("disabled", true);
                    $("#createBtn").attr("disabled", false);
                    $("#joinBtn").attr("disabled", false);
                } else
                alert(un + ' already exists');
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
        pomelo.request("chess.chessHandler.begin", function(data) {
            startGame();
            myturn = true;
        });
    });

    $("#exitBtn").click(function() {
        pomelo.request("chess.chessHandler.exit", function(data) {
            if (data.code == 200) {
                if(iArray != null)
                    unbindEvent();
                playing = false;
                setExitRoomStatus();
                pomelo.removeAllListeners('onChess');
            }
        });
    });

    $("#createBtn").attr("disabled", true);
    $("#joinBtn").attr("disabled", true);
    $("#startBtn").attr("disabled", true);
    $("#restartBtn").attr("disabled", true);
    $("#exitBtn").attr("disabled", true);
});