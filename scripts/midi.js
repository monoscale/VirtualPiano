'use strict';
var VirtualPiano = (function () {
    function VirtualPiano() {
        var _this = this;
        this.selectMIDIDeviceBox = document.getElementById('select-midi');
        this.selectBendRangeBox = document.getElementById('select-bend-range');
        this.selectOscillatorWaveformBox = document.getElementById('select-oscillator-waveform');
        this.oscillatorWaveforms = ['sine', 'sawtooth', 'square', 'triangle'];
        this.selectOscillatorWaveFormCircles = [];
        this.buttonStartRecording = document.getElementById('button-start-record');
        this.buttonStopRecording = document.getElementById('button-stop-record');
        this.buttonPlaybackRecording = document.getElementById('button-playback');
        this.knobMainVolume = document.getElementById('knob-master-volume');
        this.knobMainVolumeIndex = document.getElementById('knob-master-volume-index');
        this.visualPiano = document.getElementById('piano');
        this.bendRange = 2 * 128;
        this.currentBend = 0;
        this.isRecording = false;
        this.recording = [];
        this.midiInputPorts = [];
        this.oscillators = [];
        this.activeOscillators = [];
        this.FREQUENCIES = [8.18, 8.66, 9.18, 9.72, 10.3, 10.91, 11.56, 12.25, 12.98, 13.75, 14.57, 15.43, 16.35, 17.32, 18.35, 19.45, 20.6, 21.83, 23.12, 24.5, 25.96, 27.5, 29.14, 30.87, 32.7, 34.65, 36.71, 38.89, 41.2, 43.65, 46.25, 49, 51.91, 55, 58.27, 61.74, 65.41, 69.3, 73.42, 77.78, 82.41, 87.31, 92.5, 98, 103.83, 110, 116.54, 123.47, 130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185, 196, 207.65, 220, 233.08, 246.94, 261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392, 415.30, 440, 466.16, 493.88, 523.25, 554.37, 587.33, 622.25, 659.26, 698.46, 739.99, 783.99, 830.61, 880, 932.33, 987.77, 1046.5, 1108.73, 1174.66, 1244.51, 1318.51, 1396.91, 1479.98, 1567.98, 1661.22, 1760, 1864.66, 1975.53, 2093, 2217.46, 2349.32, 2489.02, 2637.02, 2793.83, 2959.96, 3135.96, 3322.44, 3520, 3729.31, 3951.07, 4186.01, 4434.92, 4698.64, 4978.03, 5274.04, 5587.65, 5919.91, 6271.93, 6644.88, 7040, 7458.62, 7902.13, 8372.02, 8869.84, 9397.27, 9956.06, 10548.08, 11175.3, 11839.82, 12543.85, 13289.75];
        this.NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        this.KEY_COLORS = ['white', 'black', 'white', 'black', 'white', 'white', 'black', 'white', 'black', 'white', 'black', 'white'];
        navigator.requestMIDIAccess()
            .then(function (midiAccess) { _this.requestMIDIAccessResolve(midiAccess); }, function (exception) { return _this.requestMIDIAccessReject(exception); });
    }
    VirtualPiano.prototype.requestMIDIAccessResolve = function (midiAccess) {
        var _this = this;
        var midiInputs = midiAccess.inputs;
        midiInputs.forEach(function (input) {
            _this.midiInputPorts.push(input);
        });
        this.updateMIDISelectBox();
        this.selectMIDIDeviceBox.onchange = function () { return _this.selectMIDIInputPort(); };
        this.selectBendRangeBox.onchange = function () { return _this.setBendRange(); };
        this.buttonStartRecording.onclick = function () { return _this.startRecording(); };
        this.buttonStopRecording.onclick = function () { return _this.stopRecording(); };
        this.buttonPlaybackRecording.onclick = function () { return _this.playBackRecording(); };
        this.knobMainVolume.onmousedown = function () { return _this.enableVolumeSelection(); };
        var _loop_1 = function (waveform) {
            var circle = document.getElementById('oscillator-waveform-select-' + waveform);
            circle.onclick = function () { return _this.setWaveForm(circle); };
            this_1.selectOscillatorWaveFormCircles.push(circle);
        };
        var this_1 = this;
        for (var _i = 0, _a = this.oscillatorWaveforms; _i < _a.length; _i++) {
            var waveform = _a[_i];
            _loop_1(waveform);
        }
        this.activeOscillatorWaveform = this.oscillatorWaveforms[0];
        this.selectOscillatorWaveFormCircles[0].classList.add('active');
        for (var i = 0; i < 127; i++) {
            var key = document.createElement('div');
            key.id = i.toString();
            key.innerHTML = '&nbsp;';
            key.classList.add(this.KEY_COLORS[i % 12] + '-key');
            this.visualPiano.appendChild(key);
        }
    };
    VirtualPiano.prototype.enableVolumeSelection = function () {
        var _this = this;
        var knobRect = this.knobMainVolume.getBoundingClientRect();
        var circleRadius = this.knobMainVolume.r.baseVal.value;
        window.onmousemove = function (event) {
            var centerX = knobRect.x + circleRadius;
            var centerY = knobRect.y + circleRadius;
            var degree = 180 * Math.atan((centerY - event.clientY) / (event.clientX - centerX));
            var x = 30 * Math.cos(degree);
            var y = 30 * Math.sin(degree);
            _this.knobMainVolumeIndex.x2.baseVal.value = x;
            _this.knobMainVolumeIndex.y2.baseVal.value = y;
        };
        window.onmouseup = function () {
            window.onmousemove = undefined;
        };
    };
    VirtualPiano.prototype.playBackRecording = function () {
    };
    VirtualPiano.prototype.startRecording = function () {
        this.recording = [];
        this.isRecording = true;
    };
    VirtualPiano.prototype.stopRecording = function () {
        this.isRecording = false;
    };
    VirtualPiano.prototype.setWaveForm = function (circle) {
        for (var _i = 0, _a = this.selectOscillatorWaveFormCircles; _i < _a.length; _i++) {
            var oscillatorCircle = _a[_i];
            oscillatorCircle.classList.remove('active');
        }
        circle.classList.add('active');
        this.activeOscillatorWaveform = circle.id.split('-')[3];
        for (var _b = 0, _c = this.oscillators; _b < _c.length; _b++) {
            var oscillator = _c[_b];
            oscillator.type = this.activeOscillatorWaveform;
        }
    };
    VirtualPiano.prototype.setBendRange = function () {
        this.bendRange = parseInt(this.selectBendRangeBox.value) * 128;
    };
    VirtualPiano.prototype.requestMIDIAccessReject = function (exception) {
        alert(exception);
    };
    VirtualPiano.prototype.selectMIDIInputPort = function () {
        var _this = this;
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
                var oscillator = this.audioContext.createOscillator();
                oscillator.frequency.setValueAtTime(this.FREQUENCIES[i], this.audioContext.currentTime);
                oscillator.type = this.activeOscillatorWaveform;
                oscillator.start(0);
                this.oscillators.push(oscillator);
                this.modulatorVolume.connect(oscillator.frequency);
            }
        }
        this.selectedMIDIInputPort = this.midiInputPorts[this.selectMIDIDeviceBox.value];
        this.selectedMIDIInputPort.onmidimessage = function (e) { return _this.processMIDIMessage(e); };
        console.log(this.selectedMIDIInputPort);
    };
    VirtualPiano.prototype.processMIDIMessage = function (e) {
        var data = e.data;
        var channel = data[0] & 0xF;
        var command = data[0] & ~0xF;
        switch (command) {
            case 0x80:
                this.noteOff(data[1], data[2]);
                break;
            case 0x90:
                this.noteOn(data[1], data[2]);
                break;
            case 0xB0:
                this.setModulation(data[2]);
                break;
            case 0xE0:
                this.setBend(data[1], data[2]);
                break;
        }
        if (this.isRecording) {
            this.recording.push(e);
        }
    };
    VirtualPiano.prototype.noteOn = function (note, force) {
        this.oscillators[note].detune.setValueAtTime(this.currentBend, this.audioContext.currentTime);
        this.oscillators[note].connect(this.mainVolume);
        this.activeOscillators.push(note);
        this.visualPiano.children[note].classList.add('pressed-key');
    };
    VirtualPiano.prototype.noteOff = function (note, velocity) {
        this.oscillators[note].disconnect(this.mainVolume);
        this.oscillators[note].detune.setValueAtTime(0, this.audioContext.currentTime);
        this.activeOscillators.splice(this.activeOscillators.indexOf(note), 1);
        this.visualPiano.children[note].classList.remove('pressed-key');
    };
    VirtualPiano.prototype.setBend = function (highNibble, lowNibble) {
        var combination = (lowNibble << 7) | highNibble;
        var bend = (combination - 8192) * (this.bendRange * 100 / 127) / 8192;
        this.currentBend = bend;
        for (var _i = 0, _a = this.activeOscillators; _i < _a.length; _i++) {
            var oscillator = _a[_i];
            this.oscillators[oscillator].detune.setValueAtTime(bend, this.audioContext.currentTime);
        }
    };
    VirtualPiano.prototype.setModulation = function (value) {
        this.modulatorOscillator.frequency.value = value * 6 / 127;
        if (value === 0) {
            this.modulatorVolume.gain.value = 0;
        }
        else if (this.modulatorVolume.gain.value === 0) {
            this.modulatorVolume.gain.value = 20;
        }
    };
    VirtualPiano.prototype.updateMIDISelectBox = function () {
        this.selectMIDIDeviceBox.innerHTML = '';
        var option = document.createElement('option');
        option.innerHTML = '----------';
        this.selectMIDIDeviceBox.appendChild(option);
        for (var i = 0; i < this.midiInputPorts.length; i++) {
            var inputPort = this.midiInputPorts[i];
            var option_1 = document.createElement('option');
            option_1.value = i.toString();
            option_1.innerHTML = inputPort.name;
            this.selectMIDIDeviceBox.appendChild(option_1);
        }
        this.selectMIDIDeviceBox.selectedIndex = 0;
    };
    return VirtualPiano;
}());
new VirtualPiano();
