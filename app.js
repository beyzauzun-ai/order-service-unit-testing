const timeDisplay = document.getElementById('time');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const modeBtns = document.querySelectorAll('.mode-btn');
const circle = document.querySelector('.progress-ring__circle');

const MODES = {
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
};

// Colors for different modes
const THEMES = {
    pomodoro: { primary: '#d4fc79', secondary: '#96e6a1' }, // Calm matcha green
    shortBreak: { primary: '#a1c4fd', secondary: '#c2e9fb' }, // Calm blue
    longBreak: { primary: '#e0c3fc', secondary: '#8ec5fc' }  // Calm purple
};

let currentMode = 'pomodoro';
let timeLeft = MODES[currentMode];
let isRunning = false;
let timerInterval = null;

// Initialize SVG circle
const radius = circle.r.baseVal.value;
const circumference = radius * 2 * Math.PI;

circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = 0;

function setProgress(percent) {
    const offset = circumference - percent / 100 * circumference;
    circle.style.strokeDashoffset = offset;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateDisplay() {
    timeDisplay.textContent = formatTime(timeLeft);
    const percent = (timeLeft / MODES[currentMode]) * 100;
    setProgress(percent);
}

function switchMode(mode) {
    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
        startBtn.textContent = 'Start';
    }
    
    currentMode = mode;
    timeLeft = MODES[currentMode];
    
    // Update active button
    modeBtns.forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update theme colors
    const root = document.documentElement;
    root.style.setProperty('--primary-color', THEMES[mode].primary);
    root.style.setProperty('--secondary-color', THEMES[mode].secondary);
    
    updateDisplay();
}

function startTimer() {
    if (isRunning) {
        clearInterval(timerInterval);
        startBtn.textContent = 'Start';
        isRunning = false;
    } else {
        startBtn.textContent = 'Pause';
        isRunning = true;
        timerInterval = setInterval(() => {
            timeLeft--;
            updateDisplay();
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                isRunning = false;
                startBtn.textContent = 'Start';
                
                // Play notification sound
                try {
                    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');
                    audio.volume = 0.5;
                    audio.play();
                } catch(e) {
                    console.log("Audio playback failed", e);
                }
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.textContent = 'Start';
    timeLeft = MODES[currentMode];
    updateDisplay();
}

// Event Listeners
startBtn.addEventListener('click', startTimer);
resetBtn.addEventListener('click', resetTimer);

modeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        switchMode(e.target.dataset.mode);
    });
});

// Initialize display
updateDisplay();
