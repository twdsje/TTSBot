var express = require('express');
var socket = require('socket.io');
const synthesize = require('./lib/synthesize')
const say = require('./lib/say')
const YouTube = require('youtube-live-chat');

var app = express();

server = app.listen(5000, function(){
    console.log('server is running on port 5000')
});

let isBusy = false

io = socket(server);

const yt = new YouTube('UC3G9qIPQkvMowZGWw1qM7ZQ', 'AIzaSyBMSpTHhIpzofcnpEUZ0Ijw1jGAs6ldrFo');

yt.on('ready', () => {
  console.log('ready!')
  yt.listen(1000)
})
 
yt.on('message', data => {
  console.log(data.snippet.displayMessage)
  
  io.emit('RECEIVE_MESSAGE', data.snippet.displayMessage);
      
      synthesize(data.snippet.displayMessage).
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
})
 
yt.on('error', error => {
  console.error(error)
})

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


