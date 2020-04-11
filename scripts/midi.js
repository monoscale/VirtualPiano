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
    for (var i = 0; i < midiInputPorts.length; i++) {
        var inputPort = midiInputPorts[i];
        var option = document.createElement('option');
        option.value = i.toString();
        option.innerHTML = inputPort.name;
        selectBox.appendChild(option);
    }
    selectBox.selectedIndex = 0;
    selectMIDIInputPort();
}
function selectMIDIInputPort() {
    selectedMidiInputPort = midiInputPorts[selectBox.selectedIndex];
    selectedMidiInputPort.onmidimessage = function (e) {
        var noteValue = notes[e.data[1] % 12];
        console.log(noteValue);
    };
}
