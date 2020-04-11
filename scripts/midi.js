var selectBox = document.getElementById('midi-select');
var midiInputPorts = [];
var selectedMidiInputPort;
window.onload = function () {
    navigator.requestMIDIAccess()
        .then(requestMIDIAccessResolve, requestMIDIAccessReject);
};
function requestMIDIAccessResolve(midiAccess) {
    var midiInputs = midiAccess.inputs;
    midiInputs.forEach(function (input) {
        midiInputPorts.push(input);
    });
    updateMIDISelectBox();
    midiAccess.onstatechange = function (midiConnectionEvent) {
    };
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
}
function selectMIDIInputPort() {
    selectedMidiInputPort = midiInputPorts[selectBox.selectedIndex];
}
