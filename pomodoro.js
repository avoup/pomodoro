class Pomodoro {
    constructor(modes, clock, notify, updateCb) {
        this.modes = modes;
        this.clock = clock;
        this.notify = notify;
        this.updateCb = updateCb;

        this._currentMode = Object.keys(this.modes)[this._modeIndex]
        this._setLog()
        this._resetTime()
        this._updateClock()

    }

    /**
     * set log / log index
     */
    _setLog() {
        let log = localStorage.getItem('pomolog');
        if (!log) {
            localStorage.setItem('pomolog', '[]')
        } else {
            log = JSON.parse(localStorage.getItem('pomolog'))
        }
    }

    _status = 'not running'

    _interval;
    _currentMode;

    _seconds = 0;

    _modeIndex = 0;

    start() {
        if (this.status === 'running') return this.notify({ status: 'warning', message: 'pomodoro is already running' })

        this.notify({ status: 'success', message: 'pomodoro started' })

        this.status = 'running';

        this._resetTime()
        this._updateClock()
        this._interval = setInterval(this._updateClock.bind(this), 1000);
    }

    stop() {
        if (this.status === 'not running') return this.notify({ status: 'danger', message: 'pomodoro is not running' })

        this.notify({ status: 'warning', message: 'pomodoro stopped' })
        this.newLog = {
            'initialTime': this.modes[this._currentMode],
            'actualTime': this.modes[this._currentMode] - this._seconds - 1,
            'mode': this._currentMode,
            'date': new Date,
        };

        this.status = 'not running';
        this._stopAlarm()

        this._resetTitle()

        clearInterval(this._interval)
        this._interval = 0;

        this._resetTime()
        this._updateClock()
    }

    pause() {
        if (this.status === 'not running') return this.notify({ status: 'warning', message: 'pomodoro is not running' });

        if (this._interval) {
            this.status = 'paused';

            this._stopAlarm()

            clearInterval(this._interval)
            this._interval = 0;

            this.notify({ status: 'warning', message: 'pomodoro paused' })
        } else {
            this.status = 'running';

            this._interval = setInterval(this._updateClock.bind(this), 1000);

            this.notify({ status: 'success', message: 'pomodoro resumed' })
        }
    }

    next(skip) {
        if (this.status === 'not running') return this.notify({ status: 'warning', message: 'pomodoro is not running' })

        if (this._seconds > 0 && !skip) {
            this.notify({ status: 'warning', message: 'mode not yet finished.' })
            return;
        }

        // this.status = 'running';

        this.notify({ status: 'warning', message: 'mode not yet finished.' })

        let wasPaused = this.status === 'paused'

        this.stop()
        this._modeIndex = this.nextMode
        this._currentMode = Object.keys(this.modes)[this._modeIndex];
        this.start()
        if (wasPaused) this.pause()
    }

    reset() {
        if (this.status === 'not running') return this.notify({ status: 'warning', message: 'pomodoro is not running' });
        else if (this.status === 'running') return this.notify({ status: 'warning', message: 'pomodoro is running. Pause it first' });

        this.status = 'not running';

        this.notify({ status: 'warning', message: 'pomodoro reset.' })

        clearInterval(this._interval)
        this._interval = 0;

        this._resetTime()
        this._updateClock()
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
            this.modes[this._currentMode] = time;
        } else {
            this.modes[mode] = time;
        }
        this._resetTime()
        this._updateClock()
        this.notify({ status: 'success', message: `Time updated` })
    }

    _updateClock() {
        let h = Math.floor(Math.abs(this._seconds / 3600));
        let m = Math.floor(Math.abs((this._seconds / 60) % 60));
        let s = Math.floor(Math.abs(this._seconds % 60));
        if (h < 10) h = `0${Math.abs(h)}`
        if (m < 10) m = `0${Math.abs(m)}`
        if (s < 10) s = `0${Math.abs(s)}`
        this.clock.textContent = `${h}:${m}:${s}`;

        if (this._seconds === 0) {
            this._initAlarm()
            this._startAlarm()
            this.notify({
                status: 'success',
                action: 'finished',
                message: `${this._currentMode} finished! Start ${Object.keys(this.modes)[this.nextMode]} mode`
            })
        } else if (this._seconds < 0) {
            this._toggleTitle()
            this.clock.textContent = '-' + this.clock.textContent;

            if (this._seconds % 5 === 0) this._toggleAlarm()
        }
        if (this.updateCb) this.updateCb(this._seconds / this.modes[this._currentMode] * 100)
        this._seconds--;
    }

    _resetTime() {
        this._seconds = modes[this._currentMode];
    }

    /**
     * Document title 
     */
    _toggleTitle() {
        document.title = document.title === 'Pomodoro' ? '🚨__/FINISHED\\__🚨' : 'Pomodoro'
    }

    _resetTitle() {
        document.title = 'Pomodoro'
    }

    /**
     * Alarm sound
     */
    _audio = new Audio();
    _isPlaying = false;
    _initAlarm() {
        this._audio.src = './sound/gong_1.mp3'
        this._audio.loop = false;
    }
    _startAlarm() {
        this._audio.play()
        this._isPlaying = true;
    }
    _stopAlarm() {
        this._audio.pause()
        this._isPlaying = false;
    }
    _toggleAlarm() {
        if (this._isPlaying)
            this._audio.pause()
        else
            this._audio.play()
        this._isPlaying = !this._isPlaying
    }

    /**
     * Pomodoro Status
     */
    set status(status) {
        this._status = status;
    }

    get status() {
        return this._status;
    }

    get nextMode() {
        return (this._modeIndex + 1) % Object.keys(this.modes).length
    }

    /**
     * Log
     */
    static get fullLog() {
        return JSON.parse(localStorage.getItem('pomolog'));
    }

    _lastLog;
    get lastLog() {
        return this._lastLog;
    }

    set newLog(log) {
        this._lastLog = log;
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