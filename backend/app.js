var express = require('express');
var socket = require('socket.io');
var Queue = require('better-queue');
const synthesize = require('./lib/synthesize')
const say = require('./lib/say')
const Discord = require('discord.js');
const client = new Discord.Client();
const settings = require('./settings.js');

var app = express();

server = app.listen(5000, function(){
    console.log('server is running on port 5000')
});

let isBusy = false

io = socket(server);

var q = new Queue(function (input, cb) {
  console.log("Playing message");
  say(input).then(result => {
    cb(null, result);
  })
})

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  if (msg.channel.name == "stream") {
      io.emit('RECEIVE_MESSAGE', {
                author: "Bot",
                message: msg.content
            });     
  }
});

client.login(settings.discord_key);

io.on('connection', (socket) => {
  console.log(socket.id);

  socket.on('SEND_MESSAGE', function(data)
  {
    console.log("message recieved");
    io.emit('RECEIVE_MESSAGE', data)
    
  })
  
  socket.on('READ_MESSAGE', function(data)
  {
    console.log("Synthesizing message");
    var msg = data.message.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
    synthesize(msg).
      then(data => {
        q.push(data.audioStream);
      })
    
  })
});

