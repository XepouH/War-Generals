var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var MongoClient = require('mongodb');
var dbUrl = "mongodb://localhost:27017/players";

var debugging = 0;

app.use(express.static(__dirname + '/client'));

http.listen(91, function(){
    console.log('Server started');
});

var players = [];
var room = [
    [0,0,0,0,0],
    [0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0],
    [0,0,0,0,0]
];

io.on('connection', function(socket){
    socket.on('playerInfo', function(data){
        
        if(debugging){
            console.log(data.name.length + ' <- name' + data.password);
            console.log(data.password.length + ' <- password' + data.password);
        }

        if(data.name.length === 0) socket.emit('playerInfoLogin', {info: 'username'});
        else if(data.password.length === 0) socket.emit('playerInfoLogin', {info: 'password'});
        else {
            players[socket.id] = {
                name: data.name,
                password: data.password,
                state: 'playing'
            };

            socket.emit('playerInfoLogin', {info: 'logged'});
        }

    });

    socket.on('playPacket', function(data){
        
    });

    /*socket.on('disconnect', function(){
        console.log(players[socket.id].name);
        console.log(players[socket.id].password);
        console.log(players[socket.id].state);
    });*/



});