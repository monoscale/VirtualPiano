const selectBox = <HTMLSelectElement>document.getElementById('midi-select');

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

let midiInputPorts: MIDIInput[] = [];
let selectedMidiInputPort: MIDIInput;


/* https://www.w3.org/TR/webmidi/ */
window.onload = function () {
    /* https://www.w3.org/TR/webmidi/#requestmidiaccess */
    navigator.requestMIDIAccess()
        .then(requestMIDIAccessResolve, requestMIDIAccessReject);

    selectBox.onchange = selectMIDIInputPort;
}

/* https://www.w3.org/TR/webmidi/#midiaccess-interface */
function requestMIDIAccessResolve(midiAccess: MIDIAccess) {
    let midiInputs: MIDIInputMap = midiAccess.inputs;
    midiInputs.forEach(function (input: MIDIInput) {
        midiInputPorts.push(input);
    });
    updateMIDISelectBox();
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
    selectMIDIInputPort();
}

function selectMIDIInputPort() {
    selectedMidiInputPort = midiInputPorts[selectBox.selectedIndex];
    selectedMidiInputPort.onmidimessage = function(e: MIDIMessageEvent) {
        let noteValue = notes[e.data[1] % 12];
        console.log(noteValue);
    }
}

export { };