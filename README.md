# Eye Blink Morse Code Translator

A real-time Morse code translator that uses eye blinks as input. Built with JavaScript and MediaPipe FaceMesh.

## Features

- **Real-time eye tracking** using MediaPipe Face Mesh
- **Blink detection** with Eye Aspect Ratio (EAR) algorithm
- **Morse code translation** with automatic character and word spacing
- **Visual feedback** with live status indicators and translated text

## How It Works

The web application uses your webcam to track your eyes in real-time:

- **Short blink** (< 200ms) = **DOT** (.)
- **Long blink** (≥ 200ms) = **DASH** (-)
- **1 second pause** = End of character (translates the Morse sequence)
- **3 second pause** = Space between words

## Usage

1. Open `index.html` in a modern web browser
2. Grant camera permissions when prompted
3. Position yourself in front of the camera
4. Start blinking to input Morse code!

## Technical Details

### Eye Aspect Ratio (EAR)

The application uses the Eye Aspect Ratio formula to detect blinks:

```
EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
```

Where p1-p6 are the eye landmark points. When EAR drops below 0.25, a blink is detected.
