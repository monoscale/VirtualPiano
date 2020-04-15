'use strict';


class VirtualPiano {
    /* HTML BINDINGS */
    private selectMIDIDeviceBox = <HTMLSelectElement>document.getElementById('select-midi');
    private selectBendRangeBox = <HTMLSelectElement>document.getElementById('select-bend-range');
    private selectOscillatorWaveformBox = <HTMLSelectElement>document.getElementById('select-oscillator-waveform');

    private oscillatorWaveforms: string[] = ['sine', 'sawtooth', 'square', 'triangle'];
    private selectOscillatorWaveFormCircles: SVGCircleElement[] = [];
    private activeOscillatorWaveform: string;

    private buttonStartRecording = <HTMLButtonElement>document.getElementById('button-start-record');
    private buttonStopRecording = <HTMLButtonElement>document.getElementById('button-stop-record');
    private buttonPlaybackRecording = <HTMLButtonElement>document.getElementById('button-playback');

    private knobMainVolume = <SVGCircleElement>(<unknown>document.getElementById('knob-master-volume'));
    private knobMainVolumeIndex = <SVGLineElement>(<unknown>document.getElementById('knob-master-volume-index'));


    private visualPiano = <HTMLDivElement>document.getElementById('piano');

    private bendRange = 2 * 128; // 2 semitones
    private currentBend = 0;

    private isRecording: boolean = false;
    private recording: WebMidi.MIDIMessageEvent[] = []



    private midiInputPorts: WebMidi.MIDIInput[] = [];
    private selectedMIDIInputPort: WebMidi.MIDIInput;

    private audioContext: AudioContext;
    private mainVolume: GainNode;
    private oscillators: OscillatorNode[] = [];
    private activeOscillators: number[] = [];
    private modulatorOscillator: OscillatorNode;
    private modulatorVolume: GainNode;

    private FREQUENCIES = [8.18, 8.66, 9.18, 9.72, 10.3, 10.91, 11.56, 12.25, 12.98, 13.75, 14.57, 15.43, 16.35, 17.32, 18.35, 19.45, 20.6, 21.83, 23.12, 24.5, 25.96, 27.5, 29.14, 30.87, 32.7, 34.65, 36.71, 38.89, 41.2, 43.65, 46.25, 49, 51.91, 55, 58.27, 61.74, 65.41, 69.3, 73.42, 77.78, 82.41, 87.31, 92.5, 98, 103.83, 110, 116.54, 123.47, 130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185, 196, 207.65, 220, 233.08, 246.94, 261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392, 415.30, 440, 466.16, 493.88, 523.25, 554.37, 587.33, 622.25, 659.26, 698.46, 739.99, 783.99, 830.61, 880, 932.33, 987.77, 1046.5, 1108.73, 1174.66, 1244.51, 1318.51, 1396.91, 1479.98, 1567.98, 1661.22, 1760, 1864.66, 1975.53, 2093, 2217.46, 2349.32, 2489.02, 2637.02, 2793.83, 2959.96, 3135.96, 3322.44, 3520, 3729.31, 3951.07, 4186.01, 4434.92, 4698.64, 4978.03, 5274.04, 5587.65, 5919.91, 6271.93, 6644.88, 7040, 7458.62, 7902.13, 8372.02, 8869.84, 9397.27, 9956.06, 10548.08, 11175.3, 11839.82, 12543.85, 13289.75]

    private NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    private KEY_COLORS = ['white', 'black', 'white', 'black', 'white', 'white', 'black', 'white', 'black', 'white', 'black', 'white']


    constructor() {
        navigator.requestMIDIAccess()
            .then(
                (midiAccess) => { this.requestMIDIAccessResolve(midiAccess) },
                (exception) => this.requestMIDIAccessReject(exception));
    }

    /**
     * This method gets called when MIDI access is granted. This function will initialize the whole application.
     * @param midiAccess 
     */
    private requestMIDIAccessResolve(midiAccess: WebMidi.MIDIAccess): void {
        const midiInputs: WebMidi.MIDIInputMap = midiAccess.inputs;
        midiInputs.forEach((input: WebMidi.MIDIInput) => {
            this.midiInputPorts.push(input);
        });
        this.updateMIDISelectBox();
        this.selectMIDIDeviceBox.onchange = () => this.selectMIDIInputPort(); // the user must first interact with the site to allow an audioContext to be created, we achieve this by forcing the user to select a MIDI input device
        this.selectBendRangeBox.onchange = () => this.setBendRange();
        this.buttonStartRecording.onclick = () => this.startRecording();
        this.buttonStopRecording.onclick = () => this.stopRecording();
        this.buttonPlaybackRecording.onclick = () => this.playBackRecording();
        this.knobMainVolume.onmousedown = () => this.enableVolumeSelection();




        for (const waveform of this.oscillatorWaveforms) {
            const circle = <SVGCircleElement>(<unknown>document.getElementById('oscillator-waveform-select-' + waveform));
            circle.onclick = () => this.setWaveForm(circle);
            this.selectOscillatorWaveFormCircles.push(circle);
        }

        this.activeOscillatorWaveform = this.oscillatorWaveforms[0];
        this.selectOscillatorWaveFormCircles[0].classList.add('active');

        /* Initialize the visual piano keys */
        for (let i = 0; i < 127; i++) {
            const key = document.createElement('div');
            key.id = i.toString();
            key.innerHTML = '&nbsp;'; // to make an inline element have width
            key.classList.add(this.KEY_COLORS[i % 12] + '-key');
            this.visualPiano.appendChild(key);
        }
    }

    private enableVolumeSelection(): void {
        const knobRect = this.knobMainVolume.getBoundingClientRect();
        const circleRadius = this.knobMainVolume.r.baseVal.value;
        window.onmousemove = (event: MouseEvent) => {
            const centerX = knobRect.x + circleRadius;
            const centerY = knobRect.y + circleRadius;
            const degree = 180 * Math.atan((centerY - event.clientY) / (event.clientX - centerX));
            const x = 30 * Math.cos(degree);
            const y = 30 * Math.sin(degree);
            this.knobMainVolumeIndex.x2.baseVal.value = x;
            this.knobMainVolumeIndex.y2.baseVal.value = y;


        }

        window.onmouseup = function () {
            window.onmousemove = undefined;
        }

    }

    private playBackRecording(): void {

    }

    private startRecording(): void {
        this.recording = []
        this.isRecording = true;
    }

    private stopRecording(): void {
        this.isRecording = false;
    }

    /**
     * Sets the current active waveform for the oscillator based on the circle UI element clicked.
     * @param circle One of the four circle SVG elements.
     */
    private setWaveForm(circle: SVGCircleElement): void {
        for (const oscillatorCircle of this.selectOscillatorWaveFormCircles) {
            oscillatorCircle.classList.remove('active');
        }
        circle.classList.add('active');
        this.activeOscillatorWaveform = circle.id.split('-')[3];
        for (const oscillator of this.oscillators) {
            oscillator.type = <OscillatorType>this.activeOscillatorWaveform;
        }
    }

    private setBendRange(): void {
        this.bendRange = parseInt(this.selectBendRangeBox.value) * 128;
    }

    /**
     * This method gets called when MIDI access is denied. The application is unusable.
     * @param exception 
     */
    private requestMIDIAccessReject(exception: any): void {
        alert(exception);
    }

    /**
     * Sets the MIDI Input Port based on the user selection. This method also initialized the audio context because the user needs to interact with the website
     * first before an AudioContext object can be made. 
     */
    private selectMIDIInputPort(): void {
        if (this.audioContext == null) {
            this.audioContext = new AudioContext();
            this.mainVolume = this.audioContext.createGain();
            this.mainVolume.gain.value = 0.5;
            this.mainVolume.connect(this.audioContext.destination);

            this.modulatorOscillator = this.audioContext.createOscillator();
            this.modulatorVolume = this.audioContext.createGain();
            this.modulatorVolume.gain.value = 20;
            this.modulatorOscillator.connect(this.modulatorVolume);
            this.modulatorOscillator.start(0);

            for (var i = 0; i < this.FREQUENCIES.length; i++) {
                let oscillator = this.audioContext.createOscillator();
                oscillator.frequency.setValueAtTime(this.FREQUENCIES[i], this.audioContext.currentTime);
                oscillator.type = <OscillatorType>this.activeOscillatorWaveform;
                oscillator.start(0);
                this.oscillators.push(oscillator);

                this.modulatorVolume.connect(oscillator.frequency);
            }
        }

        this.selectedMIDIInputPort = this.midiInputPorts[this.selectMIDIDeviceBox.value];

        this.selectedMIDIInputPort.onmidimessage = (e) => this.processMIDIMessage(e);
        console.log(this.selectedMIDIInputPort);
    }

    /**
     * Processes MIDI messages.
     * @param e The MIDI message.
     */
    private processMIDIMessage(e: WebMidi.MIDIMessageEvent) {
        const data = e.data; // data of the midi message
        const channel = data[0] & 0xF; // gets the MIDI channel: from 0 to 15
        const command = data[0] & ~0xF; // gets the command, from
        switch (command) {
            case 0x80: this.noteOff(data[1], data[2]); break;
            case 0x90: this.noteOn(data[1], data[2]); break;
            case 0xB0: this.setModulation(data[2]); break;
            case 0xE0: this.setBend(data[1], data[2]); break;
        }

        if (this.isRecording) {
            this.recording.push(e);
        }

    }


    /**
     * Play a note.
     * @param note The note (value between 0 - 127) that is being played.
     * @param force The force (value between 0 - 127) that is applied.
     */
    private noteOn(note: number, force: number): void {
        this.oscillators[note].detune.setValueAtTime(this.currentBend, this.audioContext.currentTime); // bend can be done before a note is played
        this.oscillators[note].connect(this.mainVolume);
        this.activeOscillators.push(note);

        this.visualPiano.children[note].classList.add('pressed-key');
    }

    /**
     * Release a note.
     * @param note The note (value between 0 - 127) that is being released.
     * @param force The velocity (value between 0 - 127) of the release. 
     */
    private noteOff(note: number, velocity: number): void {
        this.oscillators[note].disconnect(this.mainVolume);
        this.oscillators[note].detune.setValueAtTime(0, this.audioContext.currentTime); // remove all effects
        this.activeOscillators.splice(this.activeOscillators.indexOf(note), 1);

        this.visualPiano.children[note].classList.remove('pressed-key');
    }

    /**
     * Set the pitch wheel value.
     * @param highNibble The first data byte.
     * @param lowNibble The second data byte.
     */
    private setBend(highNibble: number, lowNibble: number) {
        const combination = (lowNibble << 7) | highNibble;
        // A value of 8192 means the pitch wheel is in neutral state
        const bend = (combination - 8192) * (this.bendRange * 100 / 127) / 8192;
        this.currentBend = bend;
        for (const oscillator of this.activeOscillators) {
            this.oscillators[oscillator].detune.setValueAtTime(bend, this.audioContext.currentTime);
        }
    }

    /**
     * Sets the modulation value.
     * @param value The value between 0 - 127.
     */
    private setModulation(value: number) {
        this.modulatorOscillator.frequency.value = value * 6 / 127; // max 6 hertz fluctuation
        if (value === 0) {
            this.modulatorVolume.gain.value = 0
        } else if (this.modulatorVolume.gain.value === 0) {
            this.modulatorVolume.gain.value = 20;
        }
    }


    /**
     * Updates the selection box of MIDI input devices.
     */
    private updateMIDISelectBox(): void {
        this.selectMIDIDeviceBox.innerHTML = '';
        const option = <HTMLOptionElement>document.createElement('option');
        option.innerHTML = '----------'; // this option forces the user to select their MIDI device, enabling the audiocontext (https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio)
        this.selectMIDIDeviceBox.appendChild(option)
        for (let i = 0; i < this.midiInputPorts.length; i++) {
            const inputPort = this.midiInputPorts[i];
            const option = <HTMLOptionElement>document.createElement('option');
            option.value = i.toString();
            option.innerHTML = inputPort.name;
            this.selectMIDIDeviceBox.appendChild(option);
        }
        this.selectMIDIDeviceBox.selectedIndex = 0;
    }


}

new VirtualPiano(); 