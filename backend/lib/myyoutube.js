const request = require('request')
const {EventEmitter} = require('events')
const util = require('util');
var Bottleneck = require("bottleneck/es5");

var fs = require('fs');
var readline = require('readline');
const { google } = require('googleapis');
var OAuth2 = google.auth.OAuth2;

const youtube = google.youtube('v3');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/youtube'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'youtube-nodejs-quickstart.json';

function authorize(clientId, clientSecret, callback) {
  var redirectUrl = 'http://localhost:3000/callback'
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      return callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) throw err;
    console.log('Token stored to ' + TOKEN_PATH);
  });
}

async function findActiveChat (auth){
 const response = await youtube.liveBroadcasts.list({
    auth,
    part: 'snippet',
    broadcastStatus: 'active'
  });
  
  const latestChat = response.data.items[0];
  const liveChatId = latestChat.snippet.liveChatId; 
  return liveChatId;
};


/**
 * The main hub for acquire live chat with the YouTube Date API.
 * @extends {EventEmitter}
 */
class MyYouTube extends EventEmitter {
  /**
   * @param {string} ChannelID ID of the channel to acquire with
   * @param {string} APIKey You'r API key
   */
  constructor(channelId, apiKey) {
    super()
    this.id = channelId
    this.key = apiKey
  }
  
  async init(){
    //this.chatId = authorize(this.id, this.key, findActiveChat);
    authorize(this.id, this.key, async (oauth2Client) => {
        const chatId = await findActiveChat(oauth2Client)
        this.chatId = chatId
        this.auth = oauth2Client
        console.log(this.chatId);
        this.emit('ready');
    }) 
  }

  /**
   * Gets live chat messages.
   * See {@link https://developers.google.com/youtube/v3/live/docs/liveChatMessages/list#response|docs}
   * @return {object}
   */
  async getChat() {
    console.log("Getting youtube messages " + new Date().toUTCString());
    if (!this.chatId) return this.emit('error', 'Chat id is invalid.')
    const auth = this.auth
    const response = await youtube.liveChatMessages.list({
      auth,
      part: 'snippet, authorDetails',
      liveChatId: this.chatId
    });
    const { data } = response;  
    this.emit('json', data)
  }
  
  async sendMessage(messageText) {
      const auth = this.auth
    youtube.liveChatMessages.insert(
    {
      auth,
      part: 'snippet',
      resource: {
        snippet: {
          type: 'textMessageEvent',
          liveChatId: this.chatId,
          textMessageDetails: {
            messageText
          }
        }
      }
    });
  }

  /**
   * Gets live chat messages at regular intervals.
   * @param {number} delay Interval to get live chat messages
   * @fires YouTube#message
   */
  listen(delay) {
    let lastRead = 0, time = 0;
    
    const limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: delay
    });
    
    this.interval = setInterval(() => limiter.schedule(() => this.getChat()), delay)
    
    this.on('json', data => {
      for (const item of data.items) {
        time = new Date(item.snippet.publishedAt).getTime()
        if (lastRead < time) {
          lastRead = time
          this.emit('message', item)
        }
      }
    })       
  }

  /**
   * Stops getting live chat messages at regular intervals.
   */
  stop() {
    clearInterval(this.interval)
  }
}

module.exports = MyYouTube
