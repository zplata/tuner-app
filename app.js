import { Rive } from "@rive-app/canvas-single";
import TunerRive from "data-url:./tuner.riv";
import autoCorrelate from "./autocorrelate";

const audioCtx = new window.AudioContext();
let analyserNode = audioCtx.createAnalyser();

const noteStrings = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

function getNoteFromPitchFrequency(freq) {
  return Math.round(12 * (Math.log(freq / 440) / Math.log(2))) + 69;
}

function getPitchFrequencyFromNote(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function centsOffPitch(frequencyPlayed, correctFrequency) {
  return Math.floor(
    (1200 * Math.log(frequencyPlayed / correctFrequency)) / Math.log(2)
  );
}

async function setupMic() {
  const mic = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });
  return mic;
}

function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end;
}

async function start() {
  let tuningValueInput;
  const buffer = new Float32Array(analyserNode.fftSize);
  const mediaStream = await setupMic();
  const mediaSource = audioCtx.createMediaStreamSource(mediaStream);
  mediaSource.connect(analyserNode);
  analyserNode.getFloatTimeDomainData(buffer);
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  const r = new Rive({
    src: TunerRive,
    canvas: document.getElementById("rive-canvas"),
    autoplay: true,
    stateMachines: "State Machine 1",
    onLoad: () => {
      const inputs = r.stateMachineInputs("State Machine 1");
      console.log(inputs);
      tuningValueInput = inputs[0];
      tuningValueInput.value = 50;
    },
  });

  function getSoundData() {
    analyserNode.getFloatTimeDomainData(buffer);
    const frequency = autoCorrelate(buffer, audioCtx.sampleRate);
    if (frequency > -1) {
      const midiPitch = getNoteFromPitchFrequency(frequency);
      const playingNote = noteStrings[midiPitch % 12];
      document
        .getElementById("playing-note")
        .replaceChildren(document.createTextNode(playingNote));
      const hzOffPitch = centsOffPitch(
        frequency,
        getPitchFrequencyFromNote(midiPitch)
      );
    }
  }

  setInterval(getSoundData, 1);
}

start();
