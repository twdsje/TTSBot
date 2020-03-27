var express = require('express');
var socket = require('socket.io');
var Queue = require('better-queue');
const synthesize = require('./lib/synthesize')
const say = require('./lib/say')
const settings = require('./settings.js');
const MyYouTube = require('./lib/myyoutube.js');
const fs = require('fs');

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
    
    synthesize(data.username, msg, voice).
      then(data => {
        q.push(data.audioStream);
      })
    
  })
});


const yt = new MyYouTube(settings.youtube_client_id, settings.youtube_client_secret);
yt.init();
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
   
   if(data.snippet.type == "superChatEvent")
   {
      console.log('Superchat!')
      fs.appendFile(settings.superchat_file, data.authorDetails.displayName + " : " + data.snippet.displayMessage, (err) => {
        if (err) throw err;
        console.log('Error writing superchat!');
      });
   }
   
   var commands = data.snippet.displayMessage.split(" ");
    
    if(commands[0] === "!clip")
    {
        fs.appendFile(settings.clip_directory + (new Date()).toISOString().split('T')[0] + '.txt', data.snippet.publishedAt + " " + data.authorDetails.displayName + " : " + data.snippet.displayMessage + "        ", (err) => {
        if (err) throw 'Error writing clip!' + err;
        });
    }
    
    else if(commands[0] === "!accents")
    {
        yt.sendMessage("Use !setaccent to permanently set your accent.  Use !accent accent for a one off.  Accent choices: russiaf russiam ukrainef chinam chinaf germanyf ukm ukf japanm japanf sweedenf indiam")
    }
    
    else if(commands[0] === "!setaccent")
    {
        console.log('saving accent');
        
        let rawdata = fs.readFileSync(settings.accents_file);
        var people = JSON.parse(rawdata);
        people[data.authorDetails.displayName] = commands[1]
        console.log(people)
        fs.writeFile(settings.accents_file, JSON.stringify(people), (err) => {
        if (err) throw 'Error saving accent!' + err;
        });
        
        yt.sendMessage(`Accent set to ${commands[1]} for ${data.authorDetails.displayName}`)
    }
    else if(commands[0] === "!accent")
    {
      //Do nothing.
    }   
    else if(commands[0].charAt(0) === "!")
    {
        yt.sendMessage(`Unknown command ${commands[0]}`)
    }
});

yt.on('error', error => {
  console.error(error)
})

