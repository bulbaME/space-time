const EventEmitter = require('events');

class Call {
    constructor(socket, audioContext, hooks) {
        this.socket = socket;
        this.hooks = hooks;
        this.audioContext = audioContext;

        this.state = {
            muted: false,
            callId: 0,
            timestamp: 0
        }

        this.eventHandler = new EventEmitter();

        this.eventHandler.on('mute', b => this.state.muted = b);
    }

    #send(chunkData) {
        this.socket.emit('call-data', chunkData);
    }

    #play({ buffer, sample, sampleRate }) {
        const audioBuffer = this.audioContext.createBuffer(1, sample, sampleRate);
        audioBuffer.copyToChannel((new Float32Array(buffer)), 0, 1);
    
        const audioSource = this.audioContext.createBufferSource();
        audioSource.buffer = audioBuffer;
    
        audioSource.connect(this.audioContext.destination);
        audioSource.start(0);
    }

    init() {
        // create audio stream from microphone
        window.navigator.mediaDevices.getUserMedia({ audio: true })
        .then(async (audioMediaStream) => {
            const audioContext = this.audioContext;

            const bufferSize = audioContext.sampleRate / 2;
            await audioContext.audioWorklet.addModule('call-worklet.js');
            const workletNode = new AudioWorkletNode(audioContext, 'processor');
            workletNode.port.onmessage = (event) => {
                if(!this.state.muted) this.#send({
                    buffer: event.data,
                    sample: bufferSize,
                    sampleRate: audioContext.sampleRate
                });
            }

            workletNode.parameters.get('sampleRate').setValueAtTime(audioContext.sampleRate, audioContext.currentTime);
            workletNode.parameters.get('size').setValueAtTime(bufferSize, audioContext.currentTime);
            workletNode.parameters.get('init').setValueAtTime(true, audioContext.currentTime);

            const sourceNode = audioContext.createMediaStreamSource(audioMediaStream);
            sourceNode.connect(workletNode);

            this.eventHandler.on('stop', () => {
                sourceNode.disconnect();
                workletNode.port.postMessage('end');
                audioMediaStream.getAudioTracks()[0].stop();
                this.socket.emit('call', { type: 'end' } );
            });
        })
        .catch((err) => {
            console.log(err)
            this.eventHandler.emit('stop', 'mic-denied');
        });

        this.socket.on('call-data', (data) => this.#play(data));
    }

    end() {
        this.eventHandler.emit('stop');
    }
}

module.exports = Call;