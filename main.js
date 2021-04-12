const message = document.getElementById('message');
const controls = document.getElementById('controls');

const clock = document.getElementById('clock');

const focusInput = document.getElementById('focus-time');
const restInput = document.getElementById('rest-time');

const logTable = document.getElementById('log');
const progress = document.getElementById('progressBar')

const overallTime = document.getElementById('overallTime')

// const addTime = time => {
//     overallTime
// }
/**
 * Create new record for log table
 */
const createRow = (i, item) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    const btn = document.createElement('button');
    btn.classList.add('button', 'is-inverted', 'is-small')
    btn.textContent = 'Remove';
    btn.addEventListener('click', () => {
        pomodoro.removeLog(i)
        logTable.removeChild(logTable.children[i])
    })

    const tr = document.createElement('tr');
    tr.innerHTML = `
                    <td class="has-text-grey-light">${i + 1}</td>
                    <td><span class="tag has-text-weight-bold has-text-link">${(item.initialTime / 60).toFixed(2)} / ${(item.actualTime / 60).toFixed(2)} m</span></td>
                    <td style="text-transform: capitalize;"><span class="has-text-weight-bold tag ${item.mode === 'focus' ? 'is-warning' : 'is-success'}">${item.mode}</span></td>
                    <td>${new Date(item.date).toLocaleDateString(undefined, options)}</td>
                    <td><span class="has-text-weight-semibold tag ${(item.initialTime - item.actualTime) <= 0 ? 'is-success' : 'is-danger'}">${(item.initialTime - item.actualTime) < 0 ? 'Finished' : 'Not finished'}</span></td>
                `;
    tr.append(btn)
    return tr;
}

/**
 * Draw single or multiple log records
 */
const drawLogs = (log) => {

    const logs = pomodoro.constructor.fullLog;
    if (!logs) return logTable.innerHTML = '';

    if (!log) {
        logTable.innerHTML = '';
        for (let i = 0; i < logs.length; i++) {
            logTable.prepend(createRow(i, logs[i]))
        }
    } else {
        logTable.prepend(createRow(logs.length, log))
    }
}

const resetBtnSize = () => {
    pause.classList.remove('is-normal')
    skip.classList.remove('is-normal')
    reset.classList.remove('is-normal')
}
/**
 * Set initial modes and times(in seconds)
 */
const modes = {
    'focus': 10,
    'rest': 5,
}
/**
 * Initialize Pomodoro
 */
const pomodoro = new Pomodoro(modes, clock, m => {
    message.classList.remove('is-hidden')
    message.classList.remove('is-warning', 'is-danger', 'is-success')
    message.classList.add(`is-${m.status}`)
    const btn = document.createElement('button')
    btn.setAttribute('class', 'delete');
    btn.addEventListener('click', e => {
        e.target.parentElement.classList.add('is-hidden')
    })
    message.innerHTML = `
    <p class="is-capitalized has-text-weight-semibold m-0">${m.message}</p>
    `
    message.append(btn)

    if (m.action === 'finished') next.disabled = false;
}, percent => {

    progressBar.value = percent;
});
drawLogs()

/**
 * Start
 */
const start = controls.querySelector('[data-action=start]');
start.addEventListener('click', e => {
    if (pomodoro.status === 'running') {
        start.textContent = 'Start';
        pomodoro.stop()

        next.classList.add('is-small')
        next.classList.add('is-inverted')
        start.classList.remove('is-small')
        start.classList.remove('is-inverted')

        reset.disabled = true;
        skip.disabled = true;
        pause.disabled = true;

        drawLogs(pomodoro.lastLog)
    } else {
        start.textContent = 'Stop';
        pomodoro.start()

        next.classList.remove('is-small')
        next.classList.remove('is-inverted')
        start.classList.add('is-inverted')
        start.classList.add('is-small')

        skip.disabled = false;
        pause.disabled = false;

    }
    resetBtnSize()
    pause.textContent = 'Pause'
})

/**
 * Pause
 */
const pause = controls.querySelector('[data-action=pause]');
pause.addEventListener('click', () => {
    resetBtnSize()
    if (pomodoro.status === 'running') {
        pause.classList.add('is-normal')
        pause.textContent = 'Resume'
        start.textContent = 'Start';
        reset.disabled = false;
    } else {
        pause.classList.remove('is-normal')
        pause.textContent = 'Pause'
        start.textContent = 'Stop';
        reset.disabled = true;
    }
    pomodoro.pause()
})

/**
 * Skip
 */
const skip = controls.querySelector('[data-action=skip]');
skip.addEventListener('click', e => {
    resetBtnSize()

    pomodoro.next(true)
    drawLogs()
})

/**
 * Reset
 */
const reset = controls.querySelector('[data-action=reset]');
reset.addEventListener('click', e => {
    pause.disabled = true;
    pause.textContent = 'Pause';
    skip.disabled = true;
    reset.disabled = true;

    resetBtnSize()
    pomodoro.reset()
})

/**
 * Next
 */
const next = controls.querySelector('[data-action=next]');
next.addEventListener('click', e => {
    pomodoro.next()
    drawLogs()
    next.disabled = true;
    reset.disabled = true;
    pause.textContent = 'Pause';
    start.textContent = 'Stop';
})

/**
 * Clean logs
 */
const cleanLog = document.getElementById('cleanLog');
cleanLog.addEventListener('click', () => {
    pomodoro.cleanLog();
    drawLogs()
})

/**
 * Update time
 */
const updateBtn = document.getElementById('update-time');
updateBtn.addEventListener('click', () => {
    pomodoro.setTime(focusInput.value * 60, 'focus')
    pomodoro.setTime(restInput.value * 60, 'rest')
})