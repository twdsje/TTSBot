var express = require('express');
var socket = require('socket.io');
var Queue = require('better-queue');
const synthesize = require('./lib/synthesize')
const say = require('./lib/say')
const settings = require('./settings.js');
const YouTube = require('youtube-live-chat');

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

io.on('connection', (socket) => {
  //console.log(socket.id);

  socket.on('SEND_MESSAGE', function(data)
  {
    console.log("message recieved");
    io.emit('RECEIVE_MESSAGE', data)
    
  })
  
  socket.on('READ_MESSAGE', function(data)
  {
    console.log("Synthesizing message");
    console.log(data.message);
    var voice = "default";
    var msg = data.message.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
    var commands = data.message.split(" ");
    
    if(commands[0] === "!accent")
    {
        console.log(commands[1]);
        voice = commands[1];
        commands.shift();
        commands.shift();
        msg = commands.join(" ");
    }
    
    synthesize(data.username + " says " + msg, voice).
      then(data => {
        q.push(data.audioStream);
      })
    
  })
});

const yt = new YouTube('UC3G9qIPQkvMowZGWw1qM7ZQ', 'AIzaSyBMSpTHhIpzofcnpEUZ0Ijw1jGAs6ldrFo');
console.log('Starting Youtube');
yt.on('ready', () => {
  console.log('YouTube ready!')
  yt.listen(7000)
})

yt.on('message', data => {
  console.log(data.authorDetails.displayName + " : " + data.snippet.displayMessage);
  
  io.emit('RECEIVE_MESSAGE', {
    username: data.authorDetails.displayName,
    message: data.snippet.displayMessage
   }); 
});

yt.on('error', error => {
  console.error(error)
})

