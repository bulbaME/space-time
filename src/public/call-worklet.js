class Float32AudioBuffer {
    constructor(sampleRate, size, reset) {
        this.sampleRate = sampleRate[0];
        this.size = size[0];
        this.bufferSize = 0;

        this.buffer = new Float32Array(this.size);
        this.resetFunc = reset;
    }

    reset() {
        this.bufferSize = 0;
        this.resetFunc(this);
    }

    append(buffer) {
        for(let c = 0; c < (buffer ? buffer.length:0); c++) {
            if(this.bufferSize >= this.size) this.reset();

            this.buffer[this.bufferSize] = buffer[c];
            this.bufferSize++;
        }
    }
}

class Processor extends AudioWorkletProcessor {
    static get parameterDescriptors() { return [ 
        {
            name: 'init',
            defaultValue: false
        },
        {
            name: 'sampleRate',
            defaultValue: 1
        },
        {
            name: 'size',
            defaultValue: 1
        }
    ];}

    constructor() {
        super();

        this.bufferClass = false;
        this.run = true;

        this.port.onmessage = (event) => {
            if (event.data === 'end') this.run = false;
        }
    }

    process(input, output, parameters) {
        if (!this.bufferClass) {
            if (parameters.init) this.bufferClass = new Float32AudioBuffer(parameters.sampleRate, parameters.size, (that) => {
                this.port.postMessage(that.buffer);
            });
            else return true;
        }

        const buffer = input[0][0];
        this.bufferClass.append(buffer);
        return this.run;
    }
}

registerProcessor('processor', Processor);