// grabbing stuff from the DOM — probably should cache this better, but it’s fine for now
const videoEl = document.getElementsByClassName('input_video')[0];
const canvasEl = document.getElementsByClassName('output_canvas')[0];
const ctx = canvasEl.getContext('2d');

const statusEl = document.getElementById('status-indicator');
const morseLiveEl = document.getElementById('current-morse');
const outputTextEl = document.getElementById('translated-text');
const resetButton = document.getElementById('reset-btn');

// basic morse lookup table
// I copied this from an old snippet and just kept it around
const morseMap = {
  '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
  '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
  '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
  '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
  '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y',
  '--..': 'Z',
  '-----': '0', '.----': '1', '..---': '2', '...--': '3',
  '....-': '4', '.....': '5', '-....': '6', '--...': '7',
  '---..': '8', '----.': '9'
};

// thresholds — these needed some trial & error
const EAR_LIMIT = 0.25;
const DOT_TIME = 200;
const DASH_TIME = 500; // technically unused, but keeping it for clarity
const CHAR_GAP = 1000;
const WORD_GAP = 3000;

// state-ish variables
let blinkStartedAt = 0;
let blinkingNow = false;
let morseBuffer = '';
let lastBlinkAt = 0; // might be useful later?
let charTimeout = null;
let wordTimeout = null;

// distance helper
function distance(pt1, pt2) {
  const dx = pt1.x - pt2.x;
  const dy = pt1.y - pt2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// EAR calculation (eye aspect ratio)
// I always forget the exact formula, so leaving this verbose
function calcEAR(points, idx) {
  const vA = distance(points[idx[1]], points[idx[5]]);
  const vB = distance(points[idx[2]], points[idx[4]]);
  const h = distance(points[idx[0]], points[idx[3]]);

  return (vA + vB) / (2 * h);
}

function onResults(results) {
  ctx.save();
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  ctx.drawImage(results.image, 0, 0, canvasEl.width, canvasEl.height);

  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length) {
    results.multiFaceLandmarks.forEach((face) => {
      // landmark indices from MediaPipe docs
      const leftEye = [33, 160, 158, 133, 153, 144];
      const rightEye = [362, 385, 387, 263, 373, 380];

      const leftEAR = calcEAR(face, leftEye);
      const rightEAR = calcEAR(face, rightEye);

      const avg = (leftEAR + rightEAR) / 2;

      handleBlink(avg);

      // visuals (purely cosmetic)
      drawConnectors(ctx, face, FACEMESH_RIGHT_EYE, {
        color: '#9068c6ff',
        lineWidth: 2
      });
      drawConnectors(ctx, face, FACEMESH_LEFT_EYE, {
        color: '#9068c6ff',
        lineWidth: 2
      });
    });
  }

  ctx.restore();
}

// core blink → morse logic
function handleBlink(earValue) {
  const now = Date.now();

  if (earValue < EAR_LIMIT) {
    if (!blinkingNow) {
      blinkingNow = true;
      blinkStartedAt = now;

      statusEl.textContent = 'Blinking...';
      statusEl.classList.add('active');

      // cancel pending timers since user is mid-input
      clearTimeout(charTimeout);
      clearTimeout(wordTimeout);
    }
  } else {
    if (blinkingNow) {
      blinkingNow = false;

      statusEl.textContent = 'Paused.';
      statusEl.classList.remove('active');

      const blinkDuration = now - blinkStartedAt;
      let symbol;

      // quick blink = dot, long blink = dash
      if (blinkDuration < DOT_TIME) {
        symbol = '.';
      } else {
        symbol = '-';
      }

      morseBuffer += symbol;
      refreshMorseUI();

      lastBlinkAt = now;

      // schedule character + word handling
      charTimeout = setTimeout(commitCharacter, CHAR_GAP);
      wordTimeout = setTimeout(insertSpace, WORD_GAP);
    }
  }
}

// adds space between words
function insertSpace() {
  outputTextEl.textContent += ' ';
  refreshMorseUI();
}

// translate current morse buffer into a character
function commitCharacter() {
  if (!morseBuffer) return;

  const translated = morseMap[morseBuffer];
  if (translated) {
    outputTextEl.textContent += translated;
  } else {
    // unknown pattern
    outputTextEl.textContent += '?';
  }

  morseBuffer = '';
  refreshMorseUI();
}

function refreshMorseUI() {
  morseLiveEl.textContent = morseBuffer;
}

// reset everything
resetButton.addEventListener('click', () => {
  morseBuffer = '';
  outputTextEl.textContent = '';
  refreshMorseUI();
});

// ---- MediaPipe setup ----
// could probably move this into its own file later

const faceMesh = new FaceMesh({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

faceMesh.onResults(onResults);

const camera = new Camera(videoEl, {
  onFrame: async () => {
    await faceMesh.send({ image: videoEl });
  },
  width: 640,
  height: 480
});

// start camera immediately
camera.start();
