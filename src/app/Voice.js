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
        const eqWidth = 28;

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
                    let vol = dataArray.slice(i * skip, (i + 1) * skip).reduce((a, b) => a + b);
                    let height = Math.abs((vol / skip) - 128);
                    height = Math.sqrt(height);
                    if (height < 1) height = 1;
                    else height *= 2;
                    if (height > 4) height = 4;

                    let opacity = .1 * height + .6;
                    bars[i].style.opacity = opacity;
                    bars[i].style.height = `${height}vh`;
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
                audioMediaStream.getAudioTracks().map(v => v.stop());
                clearTimeout(eqInterval);
            });
        })
        .catch((err) => {
            eventHandler.emit('stop', 'mic-denied');
        });
    }
}

module.exports = Voice;