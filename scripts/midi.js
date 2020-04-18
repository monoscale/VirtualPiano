'use strict';
var VirtualPiano = (function () {
    function VirtualPiano() {
        var _this = this;
        this.app = document.getElementById('app');
        this.messages = document.getElementById('messages');
        this.selectMIDIDeviceBox = document.getElementById('select-midi');
        this.selectBendRangeBox = document.getElementById('select-bend-range');
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
        this.refFrequency = 440;
        this.frequencies = [];
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
        var frequency = this.refFrequency / Math.pow(2, 69 / 12);
        for (var i = 0; i < 127; i++) {
            this.frequencies.push(frequency);
            frequency *= Math.pow(2, 1 / 12);
        }
        this.activeOscillatorWaveform = this.oscillatorWaveforms[0];
        this.selectOscillatorWaveFormCircles[0].classList.add('active');
        for (var i = 0; i < 127; i++) {
            var key = document.createElement('div');
            key.id = i.toString();
            key.classList.add(this.KEY_COLORS[i % 12] + '-key');
            this.visualPiano.appendChild(key);
        }
        this.app.attributes.removeNamedItem('hidden');
    };
    VirtualPiano.prototype.enableVolumeSelection = function () {
        var _this = this;
        var knobRect = this.knobMainVolume.getBoundingClientRect();
        var circleRadius = this.knobMainVolume.r.baseVal.value;
        var centerX = knobRect.x + circleRadius;
        var centerY = knobRect.y + circleRadius;
        window.onmousemove = function (event) {
            var radians = Math.atan((centerY - event.pageY) / (centerX - event.pageX));
            var x = 30 * Math.cos(radians) + centerX;
            var y = 30 * Math.sin(radians) + centerY;
            var div = document.createElement('div');
            var svgX = x;
            var svgY = y / 219 * 40;
            console.log(svgX, svgY);
            _this.knobMainVolumeIndex.x2.baseVal.value = svgX;
            _this.knobMainVolumeIndex.y2.baseVal.value = svgY;
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
        this.messages.innerHTML = exception;
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
            for (var i = 0; i < this.frequencies.length; i++) {
                var oscillator = this.audioContext.createOscillator();
                oscillator.frequency.setValueAtTime(this.frequencies[i], this.audioContext.currentTime);
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
