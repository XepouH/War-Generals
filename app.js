var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var MongoClient = require('mongodb');
var dbUrl = "mongodb://localhost:27017/players";

var debugging = 0;

app.use(express.static(__dirname + '/client'));

http.listen(90, '192.168.0.103');

var sockets = [];
var players = [];
var rooms = [];
var map = [
    [{ value: '0', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }, { value: 'bc', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }],
    [{ value: '0', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }],
    [{ value: '0', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }],
    [{ value: '0', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }],
    [{ value: '0', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }],
    [{ value: '0', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }],
    [{ value: '0', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }, { value: 'rc', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }, { value: '0', hp: 0, ar: 0 }]
];

io.on('connection', function (socket) {

    var temp = socket.id;
    socket.id = Math.floor(Math.random() * 1000);
    sockets[socket.id] = temp;

    console.log('connection from id: ', socket.id);
    //Player login handling is here
    socket.on('playerInfo', function (data) {
        if (data.name.length === 0) socket.emit('playerInfoLogin', { info: 'username' });
        else if (data.password.length === 0) socket.emit('playerInfoLogin', { info: 'password' });
        else {
            players[socket.id] = {
                name: data.name,
                password: data.password,
                state: 'menu',
                room: '',
                id: socket.id
            };

            socket.emit('playerInfoLogin', { info: 'logged' });
        }
    });
    // Room requests. 
    // If room found and not empty player joins and gets flag for being in a room. 
    // If room found and full player doesn't join. 
    // If room not found it is created.
    socket.on('joinRoomReq', function (data) {
        if (rooms && players[socket.id].state !== 'room') {
            var roomFound = false;
            rooms.forEach(function (element) {
                if (element.name.toLowerCase() === data.room.toLowerCase()) {
                    if (!element.full) {
                        enterRoom(socket, element);
                        element.full = true;
                        element.opponent = socket.id;
                        roomFound = true;

                    } else {
                        socket.emit('roomInfo', { info: 'full' });
                        roomFound = true;
                    }
                }
            }, this);
            if (!roomFound) {
                rooms[socket.id] = {
                    name: data.room,
                    full: false,
                    roomMap: map,
                    id: socket.id,
                    opponent: '',
                    turn: true
                };
                console.log('room w/ id: ' + socket.id + ' created');
                enterRoom(socket, rooms[socket.id]);
            }
        }
    });
    //Code for disconnects, basically deletes the socket from all arrays.
    socket.on('disconnect', function () {
        delete players[socket.id];
        delete rooms[socket.id];
        console.log('connection closed: ', socket.id);
    });
    socket.on('turnFinish', function () {
        if (rooms) {
            if (rooms[players[socket.id].roomId].turn) rooms[players[socket.id].roomId].turn = false;
            else rooms[players[socket.id].roomId].turn = true;
            sendTurnIndicationToPlayers(socket);
            playerMapUpdate(socket);
            
        }
    });
    socket.on('reqMap', function(){
        playerMapUpdate(socket);
    });
    setInterval(function () {
        sendTurnIndicationToPlayers(socket);
        //playerMapUpdate(socket);
    }, 1000 / 25);
});

function sendTurnIndicationToPlayers(socket) {
    rooms.forEach(function (element) {
        if(element.turn && socket.id === element.id) socket.emit('turnIndicator', {turn: true});
        else if(!element.turn && socket.id === element.opponent) socket.emit('turnIndicator', {turn: true});
        else if(!element.turn && socket.id === element.id) socket.emit('turnIndicator', {turn: false});
        else if(element.turn && socket.id === element.opponent) socket.emit('turnIndicator', {turn: false});
    }, this);
}

// function playerMapUpdate(socket) {
//     players.forEach(function (element) {
//         if (element.state === 'room') {
//             if (rooms[element.roomId])
//                 socket.emit('roomInfo', { mapData: rooms[element.roomId].roomMap });
//         }
//     }, this);
// }

function playerMapUpdate(socket) {
    if(players[socket.id].state === 'room' && rooms[players[socket.id].roomId]){
        socket.emit('roomInfo', { mapData: rooms[players[socket.id].roomId].roomMap });
        console.log('map emitted'); 
        if(rooms[players[socket.id].roomId].id === socket.id) socket.broadcast.to(sockets[rooms[players[socket.id].roomId].opponent]).emit('roomInfo', { mapData: rooms[players[socket.id].roomId].roomMap });
        else socket.broadcast.to(sockets[players[socket.id].roomId].id).emit('roomInfo', { mapData: rooms[players[socket.id].roomId].roomMap });
    }
}

function enterRoom(socket, element) {
    players[socket.id].roomName = element.name;
    players[socket.id].roomId = element.id;
    players[socket.id].state = 'room';
    socket.emit('enteredRoom', { info: true });
    sendTurnIndicationToPlayers(socket);
    playerMapUpdate(socket);
}