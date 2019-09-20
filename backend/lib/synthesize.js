'use strict'

const textToSpeech = require('@google-cloud/text-to-speech');
const stream = require('stream')

module.exports = async (text) => {
  // Creates a client
  const client = new textToSpeech.TextToSpeechClient();



  // Construct the request
  const request = {
    input: {text: text},
    // Select the language and SSML Voice Gender (optional)
    voice: {"languageCode": "en-US", "name": "en-US-Wavenet-F"},
    // Select the type of audio encoding
    audioConfig: {audioEncoding: 'LINEAR16', speakingRate : 1.25, pitch : 0, volumeGainDb : -1},
  };

  // Performs the Text-to-Speech request
  const [response] = await client.synthesizeSpeech(request);

  let mystream = new stream.PassThrough();
  mystream.end(response.audioContent);

  return {
    audioStream: mystream
  }

}