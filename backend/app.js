var express = require('express');
var socket = require('socket.io');
const synthesize = require('./lib/synthesize')
const say = require('./lib/say')
const Discord = require('discord.js');
const client = new Discord.Client();

var app = express();

server = app.listen(5000, function(){
    console.log('server is running on port 5000')
});

let isBusy = false

io = socket(server);



client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  if (isBusy == false) {
      isBusy = true;
      io.emit('RECEIVE_MESSAGE', msg.content);
      console.log("Synthesizing message");
      synthesize(msg.content).
      then(data => {
        return say(data.audioStream)
      }).
      then(() => {
        isBusy = false
        console.log('Message played.');
      }).
      catch(err => {
        isBusy = false
        console.error(err)
      })
  }
});

client.login('MzU4MDMxNDI4MzU4ODk3NjY2.XW6NyA.nEGKO2IbMVreAyIRLlzmh6B8X9o');

io.on('connection', (socket) => {
  console.log(socket.id);

  socket.on('SEND_MESSAGE', function(data)
  {
    if(isBusy == false)
    {
      isBusy = true;
      
    }
    
  })
});


