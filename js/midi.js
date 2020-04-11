let midiInputPorts = [];


/* https://www.w3.org/TR/webmidi/ */

window.onload = function () {
    /* https://www.w3.org/TR/webmidi/#requestmidiaccess */
    navigator.requestMIDIAccess()
        .then(requestMIDIAccessResolve, requestMIDIAccessReject);
}

function updateMidiSelectBox() {
    console.log(midiInputPorts);
    const selectBox = document.getElementById('midi-select');
    selectBox.innerHTML = '';
    for (let i = 0; i < midiInputPorts.length; i++) {
        const inputPort = midiInputPorts[i];
        const option = document.createElement('option');
        option.value = inputPort.name;
        option.innerHTML = inputPort.name;
        selectBox.appendChild(option);

    }
}

/* https://www.w3.org/TR/webmidi/#midiaccess-interface */
function requestMIDIAccessResolve(midiAccess) {
    for (input of midiAccess.inputs) {
        midiInputPorts.push(input[1]);
    }

    updateMidiSelectBox();

    /**
     * The handler called when a new port is connected or an existing port changes the state attribute.
     */
    midiAccess.onstatechange = function (midiConnectionEvent) {
        /*
            interface MIDIPort : EventTarget {
                readonly    attribute DOMString               id;
                readonly    attribute DOMString?              manufacturer;
                readonly    attribute DOMString?              name;
                readonly    attribute MIDIPortType            type;
                readonly    attribute DOMString?              version;
                readonly    attribute MIDIPortDeviceState     state;
                readonly    attribute MIDIPortConnectionState connection;
                            attribute EventHandler            onstatechange;
                Promise<MIDIPort> open ();
                Promise<MIDIPort> close ();
            };
        */
        let midiPort = midiConnectionEvent.port;
        let portType = midiPort.type;
        if (portType === 'input') {
            let deviceState = midiPort.state;
            if (deviceState === 'disconnected') {
                console.log('disconnected');
            } else if (deviceState === 'connected') {
                console.log('connected');
                midiPort.onmidimessage = function () {
                    console.log("midi message");
                }
            }
        }
    }


}

function requestMIDIAccessReject(exception) {
    alert(exception);
}



