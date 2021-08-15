const EventEmitter = require('events');

class Voice {
    constructor(audioContext, eq) {
        this.audioContext = audioContext;
        this.eq = eq;
        this.eventHandler = new EventEmitter();
        this.eventHandler.on('start', () => this.#init(this.eventHandler));
        this.recorder = null;
    }

    start(id) {
        this.socket.emit(this.emits.start, id);
    }

    #init(eventHandler) {
        const eqWidth = 36;

        for (let e = 0; e < eqWidth; e++) {
            const elem = document.createElement('div');
            elem.className = 'eq-bar';
            this.eq.current.appendChild(elem);
        }

        // create audio stream from microphone
        window.navigator.mediaDevices.getUserMedia({ audio: true })
        .then(async (audioMediaStream) => {
            const analyser = this.audioContext.createAnalyser();
            analyser.fftSize = 2048;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteTimeDomainData(dataArray);

            const eqFrame = () => {
                analyser.getByteTimeDomainData(dataArray);

                const bars = this.eq.current.children;
                const skip = Math.floor(bufferLength / eqWidth);

                for(let i = 0; i < eqWidth; i++) {
                    let height = (Math.abs(dataArray[skip * i] - 128) / 128);
                    height = 12 * height;
                    bars[i].style.height = `${height < 1 ? 1:height > 4.5 ? 4.5:height}vh`;
                }
            };
            
            const eqInterval = setInterval(() => {
                eqFrame();
            }, 50);
            
            const source = this.audioContext.createMediaStreamSource(audioMediaStream);
            source.connect(analyser);

            this.recorder = new MediaRecorder(audioMediaStream);
            this.recorder.ondataavailable = async (blob) => eventHandler.emit('data', await blob.data.arrayBuffer());
            this.recorder.start();
            eventHandler.on('stop', () => {
                this.recorder.stop();
                audioMediaStream.getAudioTracks()[0].stop();
                clearTimeout(eqInterval);
            });
        })
        .catch((err) => {
            eventHandler.emit('stop', 'mic-denied');
        });
    }
}

module.exports = Voice;