class Pomodoro {
    constructor(modes, clock, notify, updateCb) {
        this.modes = modes;
        this.clock = clock;
        this.notify = notify;
        this.updateCb = updateCb;

        this.#currentMode = Object.keys(this.modes)[this.#modeIndex]
        this.#setLog()
        this.#resetTime()
        this.#updateClock()

    }

    /**
     * set log / log index
     */
    #setLog() {
        let log = localStorage.getItem('pomolog');
        if (!log) {
            localStorage.setItem('pomolog', '[]')
        } else {
            log = JSON.parse(localStorage.getItem('pomolog'))
        }
    }

    #status = 'not running'

    #interval;
    #currentMode;

    #seconds = 0;

    #modeIndex = 0;

    start() {
        if (this.status === 'running') return this.notify({ status: 'warning', message: 'pomodoro is already running' })

        this.notify({ status: 'success', message: 'pomodoro started' })

        this.status = 'running';

        this.#resetTime()
        this.#updateClock()
        this.#interval = setInterval(this.#updateClock.bind(this), 1000);
    }

    stop() {
        if (this.status === 'not running') return this.notify({ status: 'danger', message: 'pomodoro is not running' })

        this.notify({ status: 'warning', message: 'pomodoro stopped' })
        this.newLog = {
            'initialTime': this.modes[this.#currentMode],
            'actualTime': this.modes[this.#currentMode] - this.#seconds - 1,
            'mode': this.#currentMode,
            'date': new Date,
        };

        this.status = 'not running';
        this.#stopAlarm()

        this.#resetTitle()

        clearInterval(this.#interval)
        this.#interval = 0;

        this.#resetTime()
        this.#updateClock()
    }

    pause() {
        if (this.status === 'not running') return this.notify({ status: 'warning', message: 'pomodoro is not running' });

        if (this.#interval) {
            this.status = 'paused';

            this.#stopAlarm()

            clearInterval(this.#interval)
            this.#interval = 0;

            this.notify({ status: 'warning', message: 'pomodoro paused' })
        } else {
            this.status = 'running';

            this.#interval = setInterval(this.#updateClock.bind(this), 1000);

            this.notify({ status: 'success', message: 'pomodoro resumed' })
        }
    }

    next(skip) {
        if (this.status === 'not running') return this.notify({ status: 'warning', message: 'pomodoro is not running' })

        if (this.#seconds > 0 && !skip) {
            this.notify({ status: 'warning', message: 'mode not yet finished.' })
            return;
        }

        // this.status = 'running';

        this.notify({ status: 'warning', message: 'mode not yet finished.' })

        let wasPaused = this.status === 'paused'

        this.stop()
        this.#modeIndex = this.nextMode
        this.#currentMode = Object.keys(this.modes)[this.#modeIndex];
        this.start()
        if (wasPaused) this.pause()
    }

    reset() {
        if (this.status === 'not running') return this.notify({ status: 'warning', message: 'pomodoro is not running' });
        else if (this.status === 'running') return this.notify({ status: 'warning', message: 'pomodoro is running. Pause it first' });

        this.status = 'not running';

        this.notify({ status: 'warning', message: 'pomodoro reset.' })

        clearInterval(this.#interval)
        this.#interval = 0;

        this.#resetTime()
        this.#updateClock()
    }

    /**
     * Change mode time
     * 
     * if no mode is specified 
     * changes current mode time
     */
    setTime(time, mode) {
        if (this.status !== 'not running') return this.notify({ status: 'warning', message: 'pomodoro is running. Stop it first' });

        if (!time) return this.notify({ status: 'setTime', message: 'time not provided' })
        if (!mode) {
            this.modes[this.#currentMode] = time;
        } else {
            this.modes[mode] = time;
        }
        this.#resetTime()
        this.#updateClock()
        this.notify({ status: 'success', message: `Time updated` })
    }

    #updateClock() {
        let h = Math.floor(Math.abs(this.#seconds / 3600));
        let m = Math.floor(Math.abs((this.#seconds / 60) % 60));
        let s = Math.floor(Math.abs(this.#seconds % 60));
        if (h < 10) h = `0${Math.abs(h)}`
        if (m < 10) m = `0${Math.abs(m)}`
        if (s < 10) s = `0${Math.abs(s)}`
        this.clock.textContent = `${h}:${m}:${s}`;

        if (this.#seconds === 0) {
            this.#initAlarm()
            this.#startAlarm()
            this.notify({
                status: 'success',
                action: 'finished',
                message: `${this.#currentMode} finished! Start ${Object.keys(this.modes)[this.nextMode]} mode`
            })
        } else if (this.#seconds < 0) {
            this.#toggleTitle()
            this.clock.textContent = '-' + this.clock.textContent;

            if (this.#seconds % 5 === 0) this.#toggleAlarm()
        }
        if (this.updateCb) this.updateCb(this.#seconds / this.modes[this.#currentMode] * 100)
        this.#seconds--;
    }

    #resetTime() {
        this.#seconds = modes[this.#currentMode];
    }

    /**
     * Document title 
     */
    #toggleTitle() {
        document.title = document.title === 'Pomodoro' ? '🚨__/FINISHED\\__🚨' : 'Pomodoro'
    }

    #resetTitle() {
        document.title = 'Pomodoro'
    }

    /**
     * Alarm sound
     */
    #audio = new Audio();
    #isPlaying = false;
    #initAlarm() {
        this.#audio.src = './alarm_1.mp3'
        this.#audio.loop = true;
    }
    #startAlarm() {
        this.#audio.play()
        this.#isPlaying = true;
    }
    #stopAlarm() {
        this.#audio.pause()
        this.#isPlaying = false;
    }
    #toggleAlarm() {
        if (this.#isPlaying)
            this.#audio.pause()
        else
            this.#audio.play()
        this.#isPlaying = !this.#isPlaying
    }

    /**
     * Pomodoro Status
     */
    set status(status) {
        this.#status = status;
    }

    get status() {
        return this.#status;
    }

    get nextMode() {
        return (this.#modeIndex + 1) % Object.keys(this.modes).length
    }

    /**
     * Log
     */
    static get fullLog() {
        return JSON.parse(localStorage.getItem('pomolog'));
    }

    #lastLog;
    get lastLog() {
        return this.#lastLog;
    }

    set newLog(log) {
        this.#lastLog = log;
        const fullLog = JSON.parse(localStorage.getItem('pomolog'));
        fullLog.push(log)

        localStorage.setItem('pomolog', JSON.stringify(fullLog))
    }

    cleanLog() {
        localStorage.setItem('pomolog', '[]');
    }

    removeLog(index) {
        const fullLog = JSON.parse(localStorage.getItem('pomolog'));
        fullLog.splice(index, 1)
        localStorage.setItem('pomolog', JSON.stringify(fullLog))
    }

}