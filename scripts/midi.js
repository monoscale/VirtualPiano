var audioContext;
var oscillator;
var gain;
var FREQUENCIES = [8.18, 8.66, 9.18, 9.72, 10.3, 10.91, 11.56, 12.25, 12.98, 13.75, 14.57, 15.43, 16.35, 17.32, 18.35, 19.45, 20.6, 21.83, 23.12, 24.5, 25.96, 27.5, 29.14, 30.87, 32.7, 34.65, 36.71, 38.89, 41.2, 43.65, 46.25, 49, 51.91, 55, 58.27, 61.74, 65.41, 69.3, 73.42, 77.78, 82.41, 87.31, 92.5, 98, 103.83, 110, 116.54, 123.47, 130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185, 196, 207.65, 220, 233.08, 246.94, 261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392, 415.30, 440, 466.16, 493.88, 523.25, 554.37, 587.33, 622.25, 659.26, 698.46, 739.99, 783.99, 830.61, 880, 932.33, 987.77, 1046.5, 1108.73, 1174.66, 1244.51, 1318.51, 1396.91, 1479.98, 1567.98, 1661.22, 1760, 1864.66, 1975.53, 2093, 2217.46, 2349.32, 2489.02, 2637.02, 2793.83, 2959.96, 3135.96, 3322.44, 3520, 3729.31, 3951.07, 4186.01, 4434.92, 4698.64, 4978.03, 5274.04, 5587.65, 5919.91, 6271.93, 6644.88, 7040, 7458.62, 7902.13, 8372.02, 8869.84, 9397.27, 9956.06, 10548.08, 11175.3, 11839.82, 12543.85, 13289.75];
var NOTE_ON_EVENT = 144;
var NOTE_OFF_EVENT = 128;
var PITCH_BEND = 224;
var MOD_BEND = 176;
var notesArray;
var selectBox = document.getElementById('midi-select');
var midiInputPorts = [];
var selectedMidiInputPort;
window.onload = function () {
    navigator.requestMIDIAccess()
        .then(requestMIDIAccessResolve, requestMIDIAccessReject);
    selectBox.onchange = selectMIDIInputPort;
};
function requestMIDIAccessResolve(midiAccess) {
    var midiInputs = midiAccess.inputs;
    midiInputs.forEach(function (input) {
        midiInputPorts.push(input);
    });
    updateMIDISelectBox();
}
function requestMIDIAccessReject(exception) {
    alert(exception);
}
function updateMIDISelectBox() {
    selectBox.innerHTML = '';
    var option = document.createElement('option');
    option.innerHTML = '----------';
    selectBox.appendChild(option);
    for (var i = 0; i < midiInputPorts.length; i++) {
        var inputPort = midiInputPorts[i];
        var option_1 = document.createElement('option');
        option_1.value = i.toString();
        option_1.innerHTML = inputPort.name;
        selectBox.appendChild(option_1);
    }
    selectBox.selectedIndex = 0;
}
function selectMIDIInputPort() {
    audioContext = new AudioContext();
    oscillator = audioContext.createOscillator();
    oscillator.type = "sawtooth";
    oscillator.start(0);
    selectedMidiInputPort = midiInputPorts[selectBox.selectedIndex - 1];
    selectedMidiInputPort.onmidimessage = function (e) {
        var data = e.data;
        var channel = data[0] & 0xF;
        var command = data[0] & ~0xF;
        switch (command) {
            case 1:
                setModulation(data[2]);
                break;
            case 0x80:
                noteOff(data[1], data[2]);
                break;
            case 0x90:
                noteOn(data[1], data[2]);
                break;
            case 0xE0:
                setBend(data[1], data[2]);
                break;
        }
    };
}
function noteOn(note, force) {
    oscillator.frequency.setTargetAtTime(FREQUENCIES[note], audioContext.currentTime, 0);
    oscillator.connect(audioContext.destination);
}
function noteOff(note, force) {
    oscillator.disconnect(audioContext.destination);
}
function setBend(highNibble, lowNibble) {
    var combination = (lowNibble << 7) | highNibble;
    var bend = (combination - 8192) * (256 * 100 / 127) / 8192;
    oscillator.detune.setValueAtTime(bend, audioContext.currentTime);
}
function setModulation(value) {
    gain.gain.setValueAtTime(value * 100 / 127, audioContext.currentTime);
}
