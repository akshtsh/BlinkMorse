const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const statusIndicator = document.getElementById('status-indicator');
const currentMorseDisplay = document.getElementById('current-morse');
const translatedTextDisplay = document.getElementById('translated-text');
const resetBtn = document.getElementById('reset-btn');

// Morse Code Dictionary
const morseCode = {
    '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
    '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
    '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
    '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
    '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y',
    '--..': 'Z', '-----': '0', '.----': '1', '..---': '2', '...--': '3',
    '....-': '4', '.....': '5', '-....': '6', '--...': '7', '---..': '8',
    '----.': '9'
};

// Blink Detection Constants
const EAR_THRESHOLD = 0.25; // Eye Aspect Ratio threshold for blink
const DOT_DURATION = 200;   // Max duration for a dot (ms)
const DASH_DURATION = 500;  // Min duration for a dash (ms)
const CHAR_PAUSE = 1000;    // Pause to complete a character (ms)
const WORD_PAUSE = 3000;    // Pause to add a space (ms)

// State Variables
let blinkStartTime = 0;
let isBlinking = false;
let currentSequence = '';
let lastBlinkTime = 0;
let charTimer = null;
let wordTimer = null;

// Helper: Calculate Euclidean Distance
function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

// Helper: Calculate Eye Aspect Ratio (EAR)
// Landmarks: 
// Left Eye: 33, 160, 158, 133, 153, 144
// Right Eye: 362, 385, 387, 263, 373, 380
function calculateEAR(landmarks, indices) {
    // Vertical distances
    const v1 = getDistance(landmarks[indices[1]], landmarks[indices[5]]);
    const v2 = getDistance(landmarks[indices[2]], landmarks[indices[4]]);

    // Horizontal distance
    const h = getDistance(landmarks[indices[0]], landmarks[indices[3]]);

    return (v1 + v2) / (2.0 * h);
}

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiFaceLandmarks) {
        for (const landmarks of results.multiFaceLandmarks) {
            // Draw mesh (optional, maybe just eyes for cleaner look)
            // drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {color: '#C0C0C070', lineWidth: 1});

            // Left Eye Indices
            const leftEyeIndices = [33, 160, 158, 133, 153, 144];
            // Right Eye Indices
            const rightEyeIndices = [362, 385, 387, 263, 373, 380];

            const leftEAR = calculateEAR(landmarks, leftEyeIndices);
            const rightEAR = calculateEAR(landmarks, rightEyeIndices);

            const avgEAR = (leftEAR + rightEAR) / 2;

            handleBlinkLogic(avgEAR);

            // Visual feedback for eyes
            drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, { color: '#9068c6ff', lineWidth: 2 });
            drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, { color: '#9068c6ff', lineWidth: 2 });
        }
    }
    canvasCtx.restore();
}

function handleBlinkLogic(ear) {
    const now = Date.now();

    if (ear < EAR_THRESHOLD) {
        if (!isBlinking) {
            isBlinking = true;
            blinkStartTime = now;
            statusIndicator.textContent = "Blinking...";
            statusIndicator.classList.add('active');

            // Clear timers when user starts blinking
            clearTimeout(charTimer);
            clearTimeout(wordTimer);
        }
    } else {
        if (isBlinking) {
            isBlinking = false;
            statusIndicator.textContent = "Paused.";
            statusIndicator.classList.remove('active');

            const duration = now - blinkStartTime;
            let signal = '';

            if (duration < DOT_DURATION) {
                signal = '.';
            } else {
                signal = '-';
            }

            currentSequence += signal;
            updateDisplay();
            lastBlinkTime = now;

            // Set timers for character and word completion
            charTimer = setTimeout(finalizeCharacter, CHAR_PAUSE);
            wordTimer = setTimeout(addSpace, WORD_PAUSE);
        }
    }
}

function addSpace() {
    translatedTextDisplay.textContent += ' ';
    updateDisplay();
}

function finalizeCharacter() {
    if (currentSequence) {
        const char = morseCode[currentSequence];
        if (char) {
            translatedTextDisplay.textContent += char;
        } else {
            translatedTextDisplay.textContent += '?'; // Unknown sequence
        }
        currentSequence = '';
        updateDisplay();
    }
}

function updateDisplay() {
    currentMorseDisplay.textContent = currentSequence;
}

resetBtn.addEventListener('click', () => {
    currentSequence = '';
    translatedTextDisplay.textContent = '';
    updateDisplay();
});

const faceMesh = new FaceMesh({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
});

faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

faceMesh.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await faceMesh.send({ image: videoElement });
    },
    width: 640,
    height: 480
});

camera.start();
