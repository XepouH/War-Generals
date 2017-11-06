var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var MongoClient = require('mongodb');
var dbUrl = "mongodb://localhost:27017/players";

var debugging = 0;

app.use(express.static(__dirname + '/client'));

http.listen(91, function() {
    console.log('Server started');
});

var players = [];
var rooms = [];
var map = [
    ['0', '0', 'D', '0', '0'],
    ['0', '0', '0', '0'],
    ['0', '0', '0', '0', '0'],
    ['0', '0', '0', '0'],
    ['0', '0', '0', '0', '0'],
    ['0', '0', '0', '0'],
    ['0', '0', '0', '0', '0']
];

io.on('connection', function(socket) {
    socket.id = Math.floor(Math.random() * 1000);
    console.log('connection from id: ', socket.id);
    socket.on('playerInfo', function(data) {

        if (debugging) {
            console.log(data.name.length + ' <- name' + data.password);
            console.log(data.password.length + ' <- password' + data.password);
        }

        if (data.name.length === 0) socket.emit('playerInfoLogin', { info: 'username' });
        else if (data.password.length === 0) socket.emit('playerInfoLogin', { info: 'password' });
        else {
            players[socket.id] = {
                name: data.name,
                password: data.password,
                state: 'menu',
                room: ''
            };

            socket.emit('playerInfoLogin', { info: 'logged' });
        }

    });

    socket.on('joinRoomReq', function(data) {
        if (rooms) {
            var roomFound = false;
            rooms.forEach(function(element) {
                if (element.name.toLowerCase() === data.room.toLowerCase()) {
                    if (!element.full) {
                        players[socket.id].room = data.room;
                        element.full = true;
                        opponent = socket.id;
                        roomFound = true;
                        console.log('found room not full room');
                    } else {
                        socket.emit('roomInfo', { info: 'full' });
                        console.log('found a full room');
                        roomFound = true;
                    }
                }
                console.log(element.name.toLowerCase() + ' ' + data.room.toLowerCase());
            }, this);
            if (!roomFound) {
                rooms.push({
                    name: data.room,
                    full: false,
                    roomMap: map,
                    id: socket.id,
                    opponent: ''
                });
                console.log('room created');
                console.log('room status: ' + rooms[0].full);
            }
        }
    });

    socket.on('playPacket', function(data) {

    });

    setInterval(function() {
        rooms.forEach(function(element) {
            if (element.id === socket.id || element.opponent === socket.id) {
                socket.emit('roomName: ' + { room: element.name });
            }

        }, this);
        //console.log(rooms);
    }, 10000);

});