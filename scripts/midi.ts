const selectBox = <HTMLSelectElement>document.getElementById('midi-select');

let midiInputPorts: MIDIInput[] = [];
let selectedMidiInputPort: MIDIInput;


/* https://www.w3.org/TR/webmidi/ */
window.onload = function () {
    /* https://www.w3.org/TR/webmidi/#requestmidiaccess */
    navigator.requestMIDIAccess()
        .then(requestMIDIAccessResolve, requestMIDIAccessReject);
}

/* https://www.w3.org/TR/webmidi/#midiaccess-interface */
function requestMIDIAccessResolve(midiAccess: MIDIAccess) {
    let midiInputs: MIDIInputMap = midiAccess.inputs;
    midiInputs.forEach(function(input: MIDIInput){
        midiInputPorts.push(input);
    });


    updateMIDISelectBox();

    /**
     * The handler called when a new port is connected or an existing port changes the state attribute.
     */
    midiAccess.onstatechange = function (midiConnectionEvent) {
    }


}

function requestMIDIAccessReject(exception) {
    alert(exception);
}


/**
 * The user can select which MIDI input device to use.
 * This function should be called when the state of the MIDIAccess object changes.
 */
function updateMIDISelectBox() {
    selectBox.innerHTML = '';
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
    selectedMidiInputPort = midiInputPorts[selectBox.selectedIndex];
}

export { };