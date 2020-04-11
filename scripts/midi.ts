

let audioContext: AudioContext;
let oscillator: OscillatorNode;

const NOTE_ON_EVENT = 144;
const NOTE_OFF_EVENT = 128;

const selectBox = <HTMLSelectElement>document.getElementById('midi-select');

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
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
    oscillator.start(0);
    selectedMidiInputPort = midiInputPorts[selectBox.selectedIndex - 1];
    console.log(selectBox.selectedIndex);
    selectedMidiInputPort.onmidimessage = function (e: WebMidi.MIDIMessageEvent) {
        const eventType = e.data[0];
        if (eventType == NOTE_ON_EVENT) {
            const m = e.data[1];
            const f = Math.pow(2, (m - 69) / 12) * 440;
            oscillator.frequency.setTargetAtTime(f, audioContext.currentTime, 0);
            oscillator.connect(audioContext.destination);
            
        } else if (eventType == NOTE_OFF_EVENT) {
            oscillator.disconnect(audioContext.destination);
        }

    }

}

/*const audioContext = new AudioContext();
const oscillator = audioContext.createOscillator();
oscillator.frequency.setTargetAtTime(440, audioContext.currentTime, 0);
oscillator.connect(audioContext.destination);
oscillator.start(0);
audioContext.resume();*/

export { };