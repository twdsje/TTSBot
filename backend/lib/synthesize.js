'use strict'

const textToSpeech = require('@google-cloud/text-to-speech');
const stream = require('stream')

module.exports = async (text, voice = "default") => {
  // Creates a client
  const client = new textToSpeech.TextToSpeechClient();

  var voiceid = {
      default: "en-US-Wavenet-F",
      russiaf: "ru-RU-Wavenet-C",
      russiam: "ru-RU-Wavenet-D",
      ukrainef: "uk-UA-Wavenet-A",
      chinam: "cmn-CN-Wavenet-B",
      chinaf: "cmn-CN-Wavenet-A",
      germanyf: "de-DE-Wavenet-A",
      ukm: "en-GB-Wavenet-B",
      ukf: "en-GB-Wavenet-C",
      japanm: "ja-JP-Standard-D",
      japanf: "ja-JP-Standard-A",
      sweedenf: "sv-SE-Wavenet-A"
  }
  
  var langCode = {
      default: "en-US",
      russiaf: "ru-RU",
      russiam: "ru-RU",
      ukrainef: "uk-UA",
      chinam: "cmn-CN",
      chinaf: "cmn-CN",
      germanyf: "de-DE",
      ukm: "en-GB",
      ukf: "en-GB",
      japanm: "ja-JP",
      japanf: "ja-JP",
      sweedenf: "sv-SE-Wavenet-A"
  }

  // Construct the request
  const request = {
    input: {text: text},
    // Select the language and SSML Voice Gender (optional)
    voice: {"languageCode": langCode[voice] || "en-US", "name": voiceid[voice] || "en-US-Wavenet-F"},
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