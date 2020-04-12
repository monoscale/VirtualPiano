let audioContext: AudioContext;
let oscillator: OscillatorNode;
let gain: GainNode;

const FREQUENCIES = [8.18, 8.66, 9.18, 9.72, 10.3, 10.91, 11.56, 12.25, 12.98, 13.75, 14.57, 15.43, 16.35, 17.32, 18.35, 19.45, 20.6, 21.83, 23.12, 24.5, 25.96, 27.5, 29.14, 30.87, 32.7, 34.65, 36.71, 38.89, 41.2, 43.65, 46.25, 49, 51.91, 55, 58.27, 61.74, 65.41, 69.3, 73.42, 77.78, 82.41, 87.31, 92.5, 98, 103.83, 110, 116.54, 123.47, 130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185, 196, 207.65, 220, 233.08, 246.94, 261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392, 415.30, 440, 466.16, 493.88, 523.25, 554.37, 587.33, 622.25, 659.26, 698.46, 739.99, 783.99, 830.61, 880, 932.33, 987.77, 1046.5, 1108.73, 1174.66, 1244.51, 1318.51, 1396.91, 1479.98, 1567.98, 1661.22, 1760, 1864.66, 1975.53, 2093, 2217.46, 2349.32, 2489.02, 2637.02, 2793.83, 2959.96, 3135.96, 3322.44, 3520, 3729.31, 3951.07, 4186.01, 4434.92, 4698.64, 4978.03, 5274.04, 5587.65, 5919.91, 6271.93, 6644.88, 7040, 7458.62, 7902.13, 8372.02, 8869.84, 9397.27, 9956.06, 10548.08, 11175.3, 11839.82, 12543.85, 13289.75]


const NOTE_ON_EVENT = 144;
const NOTE_OFF_EVENT = 128;
const PITCH_BEND = 224;
const MOD_BEND = 176;

let notesArray;


const selectBox = <HTMLSelectElement>document.getElementById('midi-select');

let midiInputPorts: WebMidi.MIDIInput[] = [];
let selectedMidiInputPort: WebMidi.MIDIInput;


/* https://www.w3.org/TR/webmidi/ */
window.onload = function () {
    /* https://www.w3.org/TR/webmidi/#requestmidiaccess */
    navigator.requestMIDIAccess()
        .then(requestMIDIAccessResolve, requestMIDIAccessReject);

    selectBox.onchange = selectMIDIInputPort;
}

/* https://www.w3.org/TR/webmidi/#midiaccess-interface */
function requestMIDIAccessResolve(midiAccess: WebMidi.MIDIAccess) {
    let midiInputs: WebMidi.MIDIInputMap = midiAccess.inputs;
    midiInputs.forEach(function (input: WebMidi.MIDIInput) {
        midiInputPorts.push(input);
    });
    updateMIDISelectBox();
}

function requestMIDIAccessReject(exception: any) {
    alert(exception);
}


/**
 * The user can select which MIDI input device to use.
 * This function should be called when the state of the MIDIAccess object changes.
 */
function updateMIDISelectBox() {
    selectBox.innerHTML = '';
    const option = <HTMLOptionElement>document.createElement('option');
    option.innerHTML = '----------'; // this option forces the user to select their MIDI device, enabling the audiocontext (https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio)
    selectBox.appendChild(option)
    for (let i = 0; i < midiInputPorts.length; i++) {
        const inputPort = midiInputPorts[i];
        const option = <HTMLOptionElement>document.createElement('option');
        option.value = i.toString();
        option.innerHTML = inputPort.name;
        selectBox.appendChild(option);
    }
    selectBox.selectedIndex = 0;
}

function selectMIDIInputPort() {
    audioContext = new AudioContext();
    oscillator = audioContext.createOscillator();
    oscillator.type = "sawtooth";
    oscillator.start(0);
    selectedMidiInputPort = midiInputPorts[selectBox.selectedIndex - 1];
    selectedMidiInputPort.onmidimessage = function (e: WebMidi.MIDIMessageEvent) {
        const data = e.data; // data of the midi message
        const channel = data[0] & 0xF; // gets the MIDI channel: from 0 to 15
        const command = data[0] & ~0xF; // gets the command, from 
        switch (command) {
            case 1: setModulation(data[2]); break;
            case 0x80: noteOff(data[1], data[2]); break;
            case 0x90: noteOn(data[1], data[2]); break;
            case 0xE0: setBend(data[1], data[2]); break;
        }
    }
}

function noteOn(note: number, force: number): void {
    oscillator.frequency.setTargetAtTime(FREQUENCIES[note], audioContext.currentTime, 0);
    oscillator.connect(audioContext.destination);
}

function noteOff(note: number, force: number): void {
    oscillator.disconnect(audioContext.destination);
}

function setBend(highNibble: number, lowNibble: number) {
    const combination = (lowNibble << 7) | highNibble;
    const bend = (combination - 8192) * (256 * 100 / 127) / 8192;
    oscillator.detune.setValueAtTime(bend, audioContext.currentTime);
}

function setModulation(value: number) {
    gain.gain.setValueAtTime(value * 100 / 127, audioContext.currentTime);
}

export { };