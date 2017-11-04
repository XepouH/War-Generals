var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var MongoClient = require('mongodb');
var dbUrl = "mongodb://localhost:27017/players";

app.use(express.static(__dirname + '/client'));

http.listen(90, function(){
    console.log('Server started');
});

io.on('connection', function(socket){
    console.log('connection found');
    socket.emit('data', {name: 'dan'});

    socket.on('playPressed', function(data){
        if (data.playerName.length > 2) console.log('player ' + data.playerName + ' pressed play');
        else socket.emit('invalidName');
    });
    socket.on('attackPressed', function(data){
        console.log('attack launched on: ' + data.possitionX + ' ' + data.possitionY);
    });
    socket.on('movePressed', function(data){
        console.log('moved on: ' + data.possitionX + ' ' + data.possitionY);
    });
});