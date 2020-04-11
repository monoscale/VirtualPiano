var audioContext;
var oscillator;
var NOTE_ON_EVENT = 144;
var NOTE_OFF_EVENT = 128;
var selectBox = document.getElementById('midi-select');
var notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
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
    oscillator.start(0);
    selectedMidiInputPort = midiInputPorts[selectBox.selectedIndex - 1];
    console.log(selectBox.selectedIndex);
    selectedMidiInputPort.onmidimessage = function (e) {
        var eventType = e.data[0];
        if (eventType == NOTE_ON_EVENT) {
            var m = e.data[1];
            var f = Math.pow(2, (m - 69) / 12) * 440;
            oscillator.frequency.setTargetAtTime(f, audioContext.currentTime, 0);
            oscillator.connect(audioContext.destination);
        }
        else if (eventType == NOTE_OFF_EVENT) {
            oscillator.disconnect(audioContext.destination);
        }
    };
}
