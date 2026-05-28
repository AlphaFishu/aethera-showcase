import React, { useEffect, useRef } from 'react';

interface FluidSandboxProps {
  mode: 'cosmic' | 'biolume' | 'hanabi' | 'sands';
  audioEnabled: boolean;
  onAudioStateChange: (enabled: boolean) => void;
  onSetAnalyser: (analyser: AnalyserNode | null) => void;
  isPlayingMelody: boolean;
  songIndex: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  hue: number;
  isBurst?: boolean;
  spin?: number;
}

interface VisualRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  elapsedTime: number;
  duration: number;
  angle: number;   // Asymmetry rotation angle
  stretch: number; // Asymmetry scale factor
}

interface FallingNote {
  id: number;
  x: number;
  y: number;
  targetY: number;
  freq: number;
  color: string;
  strikeTime: number;
  hasPlayed: boolean;
}

const PENTATONIC = [
  130.81, 146.83, 164.81, 196.0, 220.0, 
  261.63, 293.66, 329.63, 392.0, 440.0, 
  523.25, 587.33, 659.25, 783.99, 880.0,
  1046.5, 1174.66, 1318.51, 1567.98, 1760.0
];

const LYRE_FREQS: Record<string, number> = {
  'Z': 130.81, 'X': 146.83, 'C': 164.81, 'V': 174.61, 'B': 196.00, 'N': 220.00, 'M': 246.94,
  'A': 261.63, 'S': 293.66, 'D': 329.63, 'F': 349.23, 'G': 392.00, 'H': 440.00, 'J': 493.88,
  'Q': 523.25, 'W': 587.33, 'E': 659.25, 'R': 698.46, 'T': 783.99, 'Y': 880.00, 'U': 987.77
};

const DIHUA_MELODY = [
  // Phrase 1
  { time: 0, note: 'H' },     // Melody: A4
  { time: 0, note: 'N' },     // Bass: A3
  { time: 0, note: 'A' },     // Chord: C4
  { time: 500, note: 'Q' },   // Melody: C5
  { time: 1000, note: 'W' },  // Melody: D5
  { time: 1000, note: 'S' },  // Chord: D4
  { time: 1500, note: 'E' },  // Melody: E5
  { time: 1500, note: 'D' },  // Chord: E4
  { time: 2000, note: 'W' },  // Melody: D5
  { time: 2250, note: 'E' },  // Melody: E5
  { time: 2500, note: 'W' },  // Melody: D5
  { time: 3000, note: 'Q' },  // Melody: C5
  { time: 3000, note: 'A' },  // Chord: C4
  { time: 3500, note: 'J' },  // Melody: B4
  { time: 3500, note: 'M' },  // Bass: B3
  { time: 4000, note: 'D' },  // Melody: E4
  { time: 4000, note: 'C' },  // Bass: E3
  { time: 4500, note: 'J' },  // Melody: B4
  { time: 5000, note: 'J' },  // Melody: B4
  { time: 5000, note: 'M' },  // Bass: B3

  // Phrase 2
  { time: 6000, note: 'H' },     // Melody: A4
  { time: 6000, note: 'N' },     // Bass: A3
  { time: 6000, note: 'A' },     // Chord: C4
  { time: 6500, note: 'Q' },     // Melody: C5
  { time: 7000, note: 'W' },     // Melody: D5
  { time: 7000, note: 'S' },     // Chord: D4
  { time: 7500, note: 'E' },     // Melody: E5
  { time: 7500, note: 'D' },     // Chord: E4
  { time: 8000, note: 'W' },     // Melody: D5
  { time: 8250, note: 'E' },     // Melody: E5
  { time: 8500, note: 'W' },     // Melody: D5
  { time: 9000, note: 'Q' },     // Melody: C5
  { time: 9000, note: 'A' },     // Chord: C4
  { time: 9500, note: 'J' },     // Melody: B4
  { time: 10000, note: 'J' },    // Melody: B4
  { time: 10000, note: 'M' },    // Bass: B3
  { time: 10500, note: 'T' },    // Melody: G5
  { time: 10500, note: 'G' },    // Chord: G4
  { time: 11000, note: 'T' },    // Melody: G5
  { time: 11500, note: 'Y' },    // Melody: A5
  { time: 11500, note: 'N' },    // Bass: A3
  { time: 11500, note: 'H' },    // Chord: A4
  { time: 12000, note: 'T' },    // Melody: G5
  { time: 12500, note: 'E' },    // Melody: E5
  { time: 12500, note: 'C' },    // Bass: E3
  { time: 12500, note: 'D' },    // Chord: E4

  // Phrase 3
  { time: 14000, note: 'H' },    // Melody: A4
  { time: 14000, note: 'N' },    // Bass: A3
  { time: 14000, note: 'A' },    // Chord: C4
  { time: 14500, note: 'E' },    // Melody: E5
  { time: 15000, note: 'E' },    // Melody: E5
  { time: 15000, note: 'D' },    // Chord: E4
  { time: 15500, note: 'W' },    // Melody: D5
  { time: 16000, note: 'Q' },    // Melody: C5
  { time: 16000, note: 'A' },    // Chord: C4
  { time: 16500, note: 'J' },    // Melody: B4
  { time: 17000, note: 'D' },    // Melody: E4
  { time: 17000, note: 'C' },    // Bass: E3
  { time: 17500, note: 'J' },    // Melody: B4
  { time: 18000, note: 'J' },    // Melody: B4
  { time: 18000, note: 'M' },    // Bass: B3

  // Phrase 4
  { time: 19000, note: 'H' },    // Melody: A4
  { time: 19000, note: 'N' },    // Bass: A3
  { time: 19000, note: 'A' },    // Chord: C4
  { time: 19500, note: 'Q' },    // Melody: C5
  { time: 20000, note: 'W' },    // Melody: D5
  { time: 20000, note: 'S' },    // Chord: D4
  { time: 20500, note: 'E' },    // Melody: E5
  { time: 20500, note: 'D' },    // Chord: E4
  { time: 21000, note: 'W' },    // Melody: D5
  { time: 21250, note: 'E' },    // Melody: E5
  { time: 21500, note: 'W' },    // Melody: D5
  { time: 22000, note: 'Q' },    // Melody: C5
  { time: 22000, note: 'A' },    // Chord: C4
  { time: 22500, note: 'G' },    // Melody: G4
  { time: 22500, note: 'B' },    // Bass: G3
  { time: 23000, note: 'H' },    // Melody: A4
  { time: 23000, note: 'N' },    // Bass: A3
  { time: 23500, note: 'G' },    // Melody: G4
  { time: 24000, note: 'H' },    // Melody: A4
  { time: 24000, note: 'N' }     // Bass: A3
];

const ENTELECHY_MELODY = [
  // Phrase 1 (A minor arpeggio run)
  { time: 0, note: 'A' },     // Melody: C4
  { time: 0, note: 'N' },     // Bass: A3
  { time: 200, note: 'D' },   // Melody: E4
  { time: 400, note: 'H' },   // Melody: A4
  { time: 600, note: 'Q' },   // Melody: C5
  { time: 800, note: 'E' },   // Melody: E5
  { time: 1000, note: 'Y' },  // Melody: A5
  { time: 1200, note: 'E' },  // Melody: E5
  { time: 1400, note: 'Q' },  // Melody: C5
  { time: 1600, note: 'H' },  // Melody: A4
  { time: 1800, note: 'D' },  // Melody: E4

  // Phrase 2 (D minor / F major arpeggio run)
  { time: 2000, note: 'S' },   // Melody: D4
  { time: 2000, note: 'X' },   // Bass: D3
  { time: 2200, note: 'F' },   // Melody: F4
  { time: 2400, note: 'H' },   // Melody: A4
  { time: 2600, note: 'W' },   // Melody: D5
  { time: 2800, note: 'R' },   // Melody: F5
  { time: 3000, note: 'Y' },   // Melody: A5
  { time: 3200, note: 'R' },   // Melody: F5
  { time: 3400, note: 'W' },   // Melody: D5
  { time: 3600, note: 'H' },   // Melody: A4
  { time: 3800, note: 'F' },   // Melody: F4

  // Phrase 3 (G major arpeggio run)
  { time: 4000, note: 'G' },   // Melody: G4
  { time: 4000, note: 'B' },   // Bass: G3
  { time: 4200, note: 'J' },   // Melody: B4
  { time: 4400, note: 'W' },   // Melody: D5
  { time: 4600, note: 'T' },   // Melody: G5
  { time: 4800, note: 'U' },   // Melody: B5
  { time: 5000, note: 'T' },   // Melody: G5
  { time: 5200, note: 'W' },   // Melody: D5
  { time: 5400, note: 'J' },   // Melody: B4
  { time: 5600, note: 'G' },   // Melody: G4
  { time: 5800, note: 'D' },   // Melody: E4

  // Phrase 4 (E major/minor arpeggio run)
  { time: 6000, note: 'D' },   // Melody: E4
  { time: 6000, note: 'C' },   // Bass: E3
  { time: 6200, note: 'G' },   // Melody: G4
  { time: 6400, note: 'J' },   // Melody: B4
  { time: 6600, note: 'E' },   // Melody: E5
  { time: 6800, note: 'U' },   // Melody: B5
  { time: 7000, note: 'E' },   // Melody: E5
  { time: 7200, note: 'J' },   // Melody: B4
  { time: 7400, note: 'G' },   // Melody: G4
  { time: 7600, note: 'D' },   // Melody: E4
  { time: 7800, note: 'S' }    // Melody: D4
];

const getXNormFromFreq = (freq: number): number => {
  let closestIdx = 0;
  let minDiff = Infinity;
  for (let i = 0; i < PENTATONIC.length; i++) {
    const diff = Math.abs(PENTATONIC[i] - freq);
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = i;
    }
  }
  return (closestIdx + 0.5) / PENTATONIC.length;
};

// Fast algebraic atan2 approximation
const fastAtan2 = (y: number, x: number): number => {
  const absY = Math.abs(y) + 1e-10;
  let angle;
  if (x >= 0) {
    const r = (x - absY) / (x + absY);
    angle = (0.1963 * r * r - 0.9817) * r + 0.7854;
  } else {
    const r = (x + absY) / (absY - x);
    angle = (0.1963 * r * r - 0.9817) * r + 2.3562;
  }
  return y < 0 ? -angle : angle;
};

export const FluidSandbox: React.FC<FluidSandboxProps> = ({
  mode,
  onAudioStateChange,
  onSetAnalyser,
  isPlayingMelody,
  songIndex,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Audio nodes state
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Visual ripples and melody control refs
  const ripples = useRef<VisualRipple[]>([]);
  const songTime = useRef(0);
  const nextNoteIndex = useRef(0);
  const fallingNotes = useRef<FallingNote[]>([]);
  const lastTimeRef = useRef<number | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const trailsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const isPlayingMelodyRef = useRef(isPlayingMelody);
  isPlayingMelodyRef.current = isPlayingMelody;

  const songIndexRef = useRef(songIndex);
  songIndexRef.current = songIndex;

  const lastSongIndexRef = useRef<number | null>(null);

  const getHueFromFreq = (freq: number) => {
    const minF = 130.81;
    const maxF = 1760.0;
    const t = Math.min(1.0, Math.max(0.0, (freq - minF) / (maxF - minF)));
    return (200 + t * 200) % 360; // Beautiful spectrum
  };

  const addVisualRipple = (x: number, y: number) => {
    ripples.current.push({
      x,
      y,
      radius: 4,
      maxRadius: 190, // Reduced by 15% (from 225 to 190)
      alpha: 1.0,
      elapsedTime: 0,
      duration: 1300, // 50% slower / 1.3 seconds duration
      angle: Math.random() * Math.PI * 2, // Random orientation for asymmetry
      stretch: 0.92 + Math.random() * 0.05, // Stretches one axis slightly
    });
  };

  // Fluid physics configuration
  const GRID_X = 40;
  const GRID_Y = 28;
  const gridLength = GRID_X * GRID_Y;

  // Velocity buffers
  const uGrid = useRef(new Float32Array(gridLength)); // horizontal velocity
  const vGrid = useRef(new Float32Array(gridLength)); // vertical velocity
  const densityGrid = useRef(new Float32Array(gridLength)); // fluid density (for biolume)

  // Particles buffer
  const particles = useRef<Particle[]>([]);
  const particleCount = useRef(4000);

  // Mouse tracking
  const lastMouse = useRef({ x: 0, y: 0, active: false });

  // Grand Hanabi Festival firework shell styles
  const spawnHanabi = (x: number, y: number, baseHue: number) => {
    const style = Math.floor(Math.random() * 4); // 4 different Japanese firework shell styles

    if (style === 0) {
      // Style 0: Imperial Peony (Double-Ring with golden core) - Ultra dense
      // Outer magenta/pink ring
      const outerCount = 160;
      const outerSpeed = 6.8;
      const outerHue = baseHue;
      const outerRot = Math.random() * Math.PI * 2;
      for (let j = 0; j < outerCount; j++) {
        const angle = (j / outerCount) * Math.PI * 2 + outerRot + (Math.random() - 0.5) * 0.08;
        const pSpeed = outerSpeed * (0.88 + Math.random() * 0.24); // organic frayed boundary
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * pSpeed,
          vy: Math.sin(angle) * pSpeed,
          life: 1.0,
          hue: outerHue,
          isBurst: true,
        });
      }
      // Inner cyan/green ring
      const innerCount = 100;
      const innerSpeed = 4.2;
      const innerHue = (baseHue + 120) % 360;
      const innerRot = Math.random() * Math.PI * 2;
      for (let j = 0; j < innerCount; j++) {
        const angle = (j / innerCount) * Math.PI * 2 + innerRot + (Math.random() - 0.5) * 0.08;
        const pSpeed = innerSpeed * (0.88 + Math.random() * 0.24);
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * pSpeed,
          vy: Math.sin(angle) * pSpeed,
          life: 1.0,
          hue: innerHue,
          isBurst: true,
        });
      }
      // Golden core pistil (glowing center)
      const coreCount = 60;
      const coreSpeed = 1.8;
      for (let j = 0; j < coreCount; j++) {
        const angle = Math.random() * Math.PI * 2;
        const pSpeed = coreSpeed * (0.4 + Math.random() * 1.2);
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * pSpeed,
          vy: Math.sin(angle) * pSpeed,
          life: 1.0,
          hue: 38, // Gold
          isBurst: true,
        });
      }
    } else if (style === 1) {
      // Style 1: Golden Kamuro Crown (Glittering Weeping Willow) - Dense gold arcs
      const count = 280;
      const speed = 7.2;
      const goldHue = 36 + Math.random() * 8; // Pure gold/orange
      for (let j = 0; j < count; j++) {
        const angle = Math.random() * Math.PI * 2;
        const pSpeed = speed * (0.15 + Math.pow(Math.random(), 1.6) * 0.85); // Weep trail speed variation
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * pSpeed,
          vy: Math.sin(angle) * pSpeed,
          life: 1.0,
          hue: goldHue,
          isBurst: true,
          spin: -999, // Golden Kamuro identifier flag
        });
      }
    } else if (style === 2) {
      // Style 2: Flashing Chrysanthemum - Dense purple sphere with flash core
      const outerCount = 180;
      const outerSpeed = 6.2;
      const outerHue = (baseHue + 240) % 360; // blue/purple contrast
      for (let j = 0; j < outerCount; j++) {
        const angle = (j / outerCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.12;
        const pSpeed = outerSpeed * (0.8 + Math.random() * 0.4); // Organic chrysanthemum jitter
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * pSpeed,
          vy: Math.sin(angle) * pSpeed,
          life: 1.0,
          hue: outerHue,
          isBurst: true,
        });
      }
      // Inner flashing core
      const innerCount = 100;
      const innerSpeed = 3.0;
      for (let j = 0; j < innerCount; j++) {
        const angle = Math.random() * Math.PI * 2;
        const pSpeed = innerSpeed * (0.6 + Math.random() * 0.8);
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * pSpeed,
          vy: Math.sin(angle) * pSpeed,
          life: 1.0,
          hue: 0, // Red which shifts to white core
          isBurst: true,
        });
      }
    } else {
      // Style 3: Crossette Star (Dense Ring with spoked crossette rays)
      const mainCount = 140;
      const mainSpeed = 5.4;
      const ringHue = baseHue;
      const ringRot = Math.random() * Math.PI * 2;
      for (let j = 0; j < mainCount; j++) {
        const angle = (j / mainCount) * Math.PI * 2 + ringRot + (Math.random() - 0.5) * 0.05;
        const pSpeed = mainSpeed * (0.92 + Math.random() * 0.16);
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * pSpeed,
          vy: Math.sin(angle) * pSpeed,
          life: 1.0,
          hue: ringHue,
          isBurst: true,
        });
      }
      // Spokes: 6 rays shooting out at high velocity
      const spokesCount = 6;
      const sparksPerSpoke = 10;
      const spokeHue = (baseHue + 60) % 360;
      const spokeRotOffset = Math.random() * Math.PI * 2;
      for (let s = 0; s < spokesCount; s++) {
        const spokeAngle = (s / spokesCount) * Math.PI * 2 + spokeRotOffset;
        for (let pIdx = 0; pIdx < sparksPerSpoke; pIdx++) {
          const pSpeed = 4.0 + pIdx * 0.8 + Math.random() * 0.4;
          particles.current.push({
            x,
            y,
            vx: Math.cos(spokeAngle) * pSpeed,
            vy: Math.sin(spokeAngle) * pSpeed,
            life: 1.0,
            hue: spokeHue,
            isBurst: true,
          });
        }
      }
    }
  };

  // Initialize AudioContext lazily
  const initAudio = () => {
    if (audioCtxRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      onSetAnalyser(analyser);
      onAudioStateChange(true);
    } catch (e) {
      console.error('Failed to init audio context', e);
    }
  };

  const playChime = (xNormalized: number, force: number, customFreq?: number) => {
    const ctx = audioCtxRef.current;
    const analyser = analyserRef.current;
    if (!ctx || !analyser || ctx.state === 'suspended') return;

    let freq = customFreq;
    if (freq === undefined) {
      const noteIdx = Math.floor(xNormalized * PENTATONIC.length);
      freq = PENTATONIC[Math.min(noteIdx, PENTATONIC.length - 1)];
    }

    // Oscillator 1 (Warm Root)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, ctx.currentTime);

    // Oscillator 2 (Bright Metallic Harmonics)
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 1.5, ctx.currentTime);

    // Gain and filter node for envelope control
    const gainNode = ctx.createGain();
    const filterNode = ctx.createBiquadFilter();

    // Volume decay
    const volume = Math.min(0.2, force * 0.15);
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);

    // Dynamic bandpass filter
    filterNode.type = 'bandpass';
    filterNode.frequency.setValueAtTime(freq * 1.8, ctx.currentTime);
    filterNode.Q.setValueAtTime(1.5, ctx.currentTime);

    // Connections: Osc -> Filter -> Gain -> Analyser -> Output
    osc1.connect(filterNode);
    osc2.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(ctx.destination);

    osc1.start();
    osc2.start();

    // Stop to clean up memory
    osc1.stop(ctx.currentTime + 1.9);
    osc2.stop(ctx.currentTime + 1.9);
  };

  // Inject a radial velocity shockwave pushing outwards
  const triggerShockwave = (x: number, y: number, canvasWidth: number, canvasHeight: number) => {
    const u = uGrid.current;
    const v = vGrid.current;
    const density = densityGrid.current;

    const gridCenterX = (x / canvasWidth) * GRID_X;
    const gridCenterY = (y / canvasHeight) * GRID_Y;
    const shockRadius = 6.0;

    for (let gy = 0; gy < GRID_Y; gy++) {
      for (let gx = 0; gx < GRID_X; gx++) {
        const idx = gx + gy * GRID_X;
        const dx = gx - gridCenterX;
        const dy = gy - gridCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < shockRadius && dist > 0) {
          const force = (shockRadius - dist) / shockRadius;
          const pushForce = force * 6.5;
          u[idx] += (dx / dist) * pushForce;
          v[idx] += (dy / dist) * pushForce;
          density[idx] += force * 4.0;

          // Clamp velocity in the grid to prevent explosion and dead zones
          const maxVel = 22.0;
          u[idx] = Math.max(-maxVel, Math.min(maxVel, u[idx]));
          v[idx] = Math.max(-maxVel, Math.min(maxVel, v[idx]));
        }
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Setup/Resize offscreen canvas
      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement('canvas');
      }
      offscreenCanvasRef.current.width = canvas.width;
      offscreenCanvasRef.current.height = canvas.height;

      // Setup/Resize trails canvas
      if (!trailsCanvasRef.current) {
        trailsCanvasRef.current = document.createElement('canvas');
      }
      trailsCanvasRef.current.width = canvas.width;
      trailsCanvasRef.current.height = canvas.height;

      const trailsCtx = trailsCanvasRef.current.getContext('2d');
      if (trailsCtx) {
        trailsCtx.fillStyle = '#000000';
        trailsCtx.fillRect(0, 0, canvas.width, canvas.height);
      }

      initParticles();
    };

    const initParticles = () => {
      particles.current = [];
      const count = mode === 'cosmic' ? 6000 : mode === 'biolume' ? 2500 : mode === 'hanabi' ? 0 : 4500;
      particleCount.current = count;

      for (let i = 0; i < count; i++) {
        particles.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: 0,
          vy: 0,
          life: Math.random() * 0.5 + 0.5,
          hue: Math.random() * 360,
          spin: mode === 'sands' ? Math.random() : undefined,
        });
      }
    };



    const drawLoop = () => {
      const w = canvas.width;
      const h = canvas.height;

      const trailsCanvas = trailsCanvasRef.current;
      const trailsCtx = trailsCanvas ? trailsCanvas.getContext('2d') : null;

      // 1. Calculate delta time unconditionally (keeps physics/particles/ripples running when autoplay is off)
      const now = performance.now();
      let dt = 0;
      if (lastTimeRef.current !== null) {
        dt = now - lastTimeRef.current;
      }
      lastTimeRef.current = now;

      // 2. Physics Solver: Velocity diffusion & decay
      const u = uGrid.current;
      const v = vGrid.current;
      const density = densityGrid.current;

      // Smooth/Diffuse grid velocities
      for (let gy = 1; gy < GRID_Y - 1; gy++) {
        for (let gx = 1; gx < GRID_X - 1; gx++) {
          const i = gx + gy * GRID_X;
          const uAvg = (u[i - 1] + u[i + 1] + u[i - GRID_X] + u[i + GRID_X]) * 0.25;
          const vAvg = (v[i - 1] + v[i + 1] + v[i - GRID_X] + v[i + GRID_X]) * 0.25;
          const densityAvg = (density[i - 1] + density[i + 1] + density[i - GRID_X] + density[i + GRID_X]) * 0.25;

          u[i] = u[i] * 0.82 + uAvg * 0.18;
          v[i] = v[i] * 0.82 + vAvg * 0.18;
          density[i] = density[i] * 0.9 + densityAvg * 0.1;
        }
      }

      // Apply overall friction decay
      for (let i = 0; i < gridLength; i++) {
        u[i] *= 0.94;
        v[i] *= 0.94;
        density[i] *= 0.96;
      }

      // 3. Clear/Fade trails canvas (draw background fades depending on render mode)
      if (trailsCtx) {
        if (mode === 'cosmic') {
          trailsCtx.fillStyle = 'rgba(3, 3, 3, 0.08)'; // Medium trails
          trailsCtx.fillRect(0, 0, w, h);
        } else if (mode === 'hanabi') {
          trailsCtx.fillStyle = 'rgba(0, 0, 0, 0.22)'; // Faster fade for sharper sparks
          trailsCtx.fillRect(0, 0, w, h);
        } else if (mode === 'sands') {
          trailsCtx.fillStyle = 'rgba(3, 3, 3, 0.22)'; // Faster fade to keep 1px sand grains crisp
          trailsCtx.fillRect(0, 0, w, h);
        } else {
          trailsCtx.fillStyle = 'rgba(3, 3, 3, 0.04)'; // Long neon trails (biolume)
          trailsCtx.fillRect(0, 0, w, h);
        }
      } else {
        if (mode === 'cosmic') {
          ctx.fillStyle = 'rgba(3, 3, 3, 0.08)';
          ctx.fillRect(0, 0, w, h);
        } else if (mode === 'hanabi') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
          ctx.fillRect(0, 0, w, h);
        } else if (mode === 'sands') {
          ctx.fillStyle = 'rgba(3, 3, 3, 0.22)';
          ctx.fillRect(0, 0, w, h);
        } else {
          ctx.fillStyle = 'rgba(3, 3, 3, 0.04)';
          ctx.fillRect(0, 0, w, h);
        }
      }

      // Update burst particles life and friction
      particles.current = particles.current.filter((p) => {
        if (p.isBurst) {
          if (mode === 'hanabi') {
            if (p.spin === -999) {
              // Golden Kamuro (Weeping Willow) spark physics: heavy gravity, high air drag
              p.life -= dt / 2200; // Weeps for ~2.2s
              if (p.life <= 0) return false;
              p.vy += 0.085; // Heavy gravity pull downwards
              p.vx *= 0.93;  // High wind resistance/drag (creates nice trailing curve)
              p.vy *= 0.93;
            } else {
              // Standard Peony/Chrysanthemum/Crossette spark physics
              p.life -= dt / 1800; // Spark burns out in ~1.8s
              if (p.life <= 0) return false;
              p.vy += 0.045; // Gentle gravity pull
              p.vx *= 0.975; // Light air resistance
              p.vy *= 0.975;
              // Introduce minor hot-air micro-turbulence/wind gusts
              p.vx += (Math.random() - 0.5) * 0.06;
            }
          } else {
            p.life -= dt / 2500; // Fly for ~2.5s (allows lingering trails)
            if (p.life <= 0) return false;
            
            // Apply gentle speed reduction so they slow down but glide much further
            p.vx *= 0.965;
            p.vy *= 0.965;
          }
        }
        return true;
      });

      // Render mode styles on trails canvas
      const pts = particles.current;
      const drawCtx = trailsCtx || ctx;

      pts.forEach((p) => {
        // Find grid index for particle
        const gx = Math.floor((p.x / w) * GRID_X);
        const gy = Math.floor((p.y / h) * GRID_Y);

        if (gx >= 0 && gx < GRID_X && gy >= 0 && gy < GRID_Y) {
          const idx = gx + gy * GRID_X;
          // Apply velocity field
          if (mode === 'hanabi' && p.isBurst) {
            // Fresh sparks ignore fluid drag to keep clean radial explosion vectors
            const blend = p.life > 0.45 ? 0.015 : 0.08;
            p.vx = p.vx * (1 - blend) + u[idx] * blend;
            p.vy = p.vy * (1 - blend) + v[idx] * blend;
          } else {
            p.vx = p.vx * 0.85 + u[idx] * 0.15;
            p.vy = p.vy * 0.85 + v[idx] * 0.15;
          }
        }

        // Organic random curling for Biolume Trails
        if (mode === 'biolume') {
          if (p.spin === undefined) {
            p.spin = (Math.random() - 0.5) * 0.28;
          }
          // Slow random walk for spin changes (creates organic, winding curves)
          p.spin += (Math.random() - 0.5) * 0.04;
          p.spin = Math.max(-0.25, Math.min(0.25, p.spin));

          // Rotate velocity vector
          const cos = Math.cos(p.spin);
          const sin = Math.sin(p.spin);
          const rx = p.vx * cos - p.vy * sin;
          const ry = p.vx * sin + p.vy * cos;
          
          // Blend curved momentum
          p.vx = p.vx * 0.78 + rx * 0.22;
          p.vy = p.vy * 0.78 + ry * 0.22;
        }

        // Flowing Sands Mode: falling and wind swirling blizzard mechanics
        if (mode === 'sands') {
          if (p.spin === undefined) {
            p.spin = Math.random();
          }
          // Per-particle gravity/falling speed coefficient
          const baseFall = 0.8 + p.spin * 1.6; // fall speed range: 0.8 to 2.4
          
          // Non-linear pattern / swirling blizzard wind
          // Global wind drift oscillating slowly
          const timeSec = now * 0.001;
          const globalWind = Math.sin(timeSec * 0.5) * 0.8 + 0.5; // -0.3 to 1.3
          
          // Local fluttering force based on position
          const flutter = Math.sin(p.y * 0.015 + p.hue) * 0.5;
          
          p.vy += baseFall * 0.12; // vertical falling acceleration
          p.vx += (globalWind + flutter) * 0.1; // horizontal wind drift
          
          p.vx *= 0.95;
          p.vy *= 0.95;
        }

        // Add ambient drift
        p.x += p.vx + (Math.random() - 0.5) * 0.1;
        p.y += p.vy + (Math.random() - 0.5) * 0.1;

        // Wrap around bounds (only for background dust; burst particles die on borders)
        if (p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
          if (p.isBurst) {
            p.life = 0; // dies next frame
          } else {
            if (mode === 'sands') {
              if (p.y > h) {
                p.y = 0;
                p.x = Math.random() * w;
                p.vx = (Math.random() - 0.5) * 2;
                p.vy = 0;
              } else if (p.y < 0) {
                p.y = h;
                p.x = Math.random() * w;
                p.vx = (Math.random() - 0.5) * 2;
                p.vy = 0;
              }
              if (p.x < 0) p.x = w;
              else if (p.x > w) p.x = 0;
            } else {
              if (p.x < 0) p.x = w; else if (p.x > w) p.x = 0;
              if (p.y < 0) p.y = h; else if (p.y > h) p.y = 0;
              p.vx = 0;
              p.vy = 0;
            }
          }
        }

        // Draw particle
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);

        if (mode === 'cosmic') {
          // Cosmic Dust Mode: Glowing blue-purple particles
          const baseAlpha = p.isBurst ? p.life : 1.0;
          const alpha = Math.min(0.8, (0.2 + speed * 0.1) * baseAlpha);
          drawCtx.beginPath();
          drawCtx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
          drawCtx.fillStyle = `hsla(${270 + speed * 20}, 85%, 65%, ${alpha})`;
          drawCtx.fill();
        } else if (mode === 'hanabi') {
          // Hanabi Theme: Fine-grain Japanese fireworks sparks with motion trails and white-hot cores
          const baseAlpha = p.isBurst ? p.life : 1.0;
          let alpha = Math.min(1.0, baseAlpha * 1.6);
          
          // Golden Kamuro Weeping Willow Strobe/Twinkle
          if (p.spin === -999) {
            alpha *= (0.35 + 0.65 * Math.sin(p.life * 70.0 + p.x));
          }

          const currentHue = (p.hue + (1.0 - p.life) * 115) % 360;

          // Draw fine glittering motion trail
          if (speed > 0.6) {
            drawCtx.strokeStyle = p.spin === -999 
              ? `rgba(255, 180, 50, ${alpha * 0.38})` // Gold trail
              : `hsla(${currentHue}, 95%, 65%, ${alpha * 0.35})`;
            drawCtx.lineWidth = 0.45; // Ultra fine trail lines
            drawCtx.beginPath();
            drawCtx.moveTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2); // Longer trail line
            drawCtx.lineTo(p.x, p.y);
            drawCtx.stroke();
          }

          // Draw fine-grain combustion spark core
          const radius = 0.35 + p.life * 0.65; // ultra fine 0.35px to 1.0px
          drawCtx.beginPath();
          drawCtx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          
          if (p.life > 0.82) {
            drawCtx.fillStyle = '#ffffff'; // White-hot combustion
          } else if (p.spin === -999) {
            drawCtx.fillStyle = `rgba(255, 190, 80, ${alpha})`; // Willow gold
          } else {
            drawCtx.fillStyle = `hsla(${currentHue}, 95%, 65%, ${alpha})`; // Saturated color shift
          }
          drawCtx.fill();
        } else if (mode === 'sands') {
          // Flowing Sands Mode: 1px ice-white and pale-cyan blizzard sand grains
          const alpha = Math.min(0.85, 0.35 + speed * 0.15);
          const isCyan = (p.hue % 5) === 0;
          drawCtx.fillStyle = isCyan 
            ? `rgba(165, 243, 252, ${alpha})` // Cyan-ice
            : `rgba(240, 248, 255, ${alpha})`; // Alice-blue/white
          drawCtx.fillRect(Math.floor(p.x), Math.floor(p.y), 1.0, 1.0);
        } else {
          // Biolume Trails Mode: Colorful fluid vector brush lines
          const baseAlpha = p.isBurst ? p.life : 1.0;
          const alpha = Math.min(0.9, (0.15 + speed * 0.25) * baseAlpha);
          const hue = (p.hue + speed * 5) % 360;
          drawCtx.strokeStyle = `hsla(${hue}, 90%, 60%, ${alpha})`;
          drawCtx.lineWidth = Math.min(2.5, 0.8 + speed * 0.4) * (p.isBurst ? Math.sqrt(p.life) : 1.0);
          drawCtx.beginPath();

          // Limit line trail length to prevent long lines connecting back to epicenter
          const maxTrailLen = 8.0;
          const trailLen = Math.min(maxTrailLen, speed * 1.5);
          const dx = speed > 0 ? (p.vx / speed) * trailLen : 0;
          const dy = speed > 0 ? (p.vy / speed) * trailLen : 0;

          drawCtx.moveTo(p.x - dx, p.y - dy);
          drawCtx.lineTo(p.x, p.y);
          drawCtx.stroke();
        }
      });

      // 4. Now copy the trails canvas back onto the main canvas
      if (trailsCanvas) {
        ctx.drawImage(trailsCanvas, 0, 0);
      }

      // 5. Draw channel dots nodes on main canvas
      const targetY = h * 0.8 - 60;
      ctx.save();
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < PENTATONIC.length; i++) {
        const xNorm = (i + 0.5) / PENTATONIC.length;
        const x = w * xNorm;
        ctx.beginPath();
        ctx.arc(x, targetY, 0.75, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 6. Update and draw falling Synthesia notes
      if (isPlayingMelodyRef.current) {
        songTime.current += dt;

        // Select active song melody and duration
        const activeSong = songIndexRef.current === 1
          ? { melody: ENTELECHY_MELODY, duration: 8000 }
          : { melody: DIHUA_MELODY, duration: 25000 };

        // Loop the song if it reaches the end
        if (songTime.current >= activeSong.duration) {
          songTime.current = 0;
          nextNoteIndex.current = 0;
        }

        // Spawn notes in lookahead window
        const LOOKAHEAD_TIME = 1400; // 1.4 seconds of falling warning

        while (
          nextNoteIndex.current < activeSong.melody.length &&
          activeSong.melody[nextNoteIndex.current].time <= songTime.current + LOOKAHEAD_TIME
        ) {
          const noteObj = activeSong.melody[nextNoteIndex.current];
          const freq = LYRE_FREQS[noteObj.note] || 440;
          const xNorm = getXNormFromFreq(freq);
          const x = w * xNorm;
          const hue = getHueFromFreq(freq);

          fallingNotes.current.push({
            id: Math.random() + nextNoteIndex.current,
            x,
            y: 0,
            targetY,
            freq,
            color: `hsla(${hue}, 95%, 65%, ALPHA)`,
            strikeTime: noteObj.time,
            hasPlayed: false,
          });

          nextNoteIndex.current += 1;
        }

        // Update and draw falling notes
        fallingNotes.current.forEach((r) => {
          const strikeTime = r.strikeTime;
          const spawnTime = strikeTime - LOOKAHEAD_TIME;
          const progress = Math.min(1.0, Math.max(0.0, (songTime.current - spawnTime) / LOOKAHEAD_TIME));

          r.y = targetY * progress;

          if (progress >= 1.0 && !r.hasPlayed) {
            r.hasPlayed = true;

            // Trigger visual/physical shockwave and sound chime!
            triggerShockwave(r.x, targetY, w, h);
            playChime(r.x / w, 2.2, r.freq);

            // Add visual ripple
            addVisualRipple(r.x, targetY);

            // Inject high-speed particle burst
            if (mode === 'hanabi') {
              spawnHanabi(r.x, targetY, getHueFromFreq(r.freq));
            } else {
              const burstCount = mode === 'cosmic' ? 40 : mode === 'sands' ? 32 : 28;
              for (let j = 0; j < burstCount; j++) {
                const angle = Math.random() * Math.PI * 2;
                const pSpeed = Math.random() * 6.0 + 4.5; // Faster start, travels further
                particles.current.push({
                  x: r.x,
                  y: targetY,
                  vx: Math.cos(angle) * pSpeed,
                  vy: Math.sin(angle) * pSpeed,
                  life: 1.0, // Lifespan managed in ms in loop
                  hue: getHueFromFreq(r.freq),
                  isBurst: true,
                });
              }
            }
          }

          // Draw falling note as a small dashed line trail (not too long)
          ctx.save();
          ctx.strokeStyle = r.color.replace('ALPHA', '0.6');
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(r.x, r.y - 18);
          ctx.lineTo(r.x, r.y - 4); // Stop just before the diamond head
          ctx.stroke();

          // Glowing diamond head: 4px square (rotated 45 degrees, half-diagonal is 2.8px)
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 8;
          ctx.shadowColor = r.color.replace('ALPHA', '1.0');
          ctx.beginPath();
          const diamondSize = 2.8;
          ctx.moveTo(r.x, r.y - diamondSize);
          ctx.lineTo(r.x + diamondSize, r.y);
          ctx.lineTo(r.x, r.y + diamondSize);
          ctx.lineTo(r.x - diamondSize, r.y);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });

        // Filter out played notes
        fallingNotes.current = fallingNotes.current.filter((n) => !n.hasPlayed);
      }

      // 7. Copy main canvas contents to offscreen canvas for liquid glass distortion
      const offscreen = offscreenCanvasRef.current;
      if (offscreen) {
        const offscreenCtx = offscreen.getContext('2d');
        if (offscreenCtx) {
          offscreenCtx.drawImage(canvas, 0, 0);
        }
      }

      // 8. Update and draw visual ripples (invisible gravitational lensing refraction with chromatic aberration)
      if (offscreen && ripples.current.length > 0) {
        const offscreenCtx = offscreen.getContext('2d');
        if (offscreenCtx) {
          // Optimization: Get the full screen image data once per frame
          const fullScreenImgData = offscreenCtx.getImageData(0, 0, w, h);
          const srcData = fullScreenImgData.data;

          ctx.save();
          ripples.current = ripples.current.filter((r) => {
            r.elapsedTime += dt;
            const progress = Math.min(1.0, r.elapsedTime / r.duration);

            // Cubic ease-out for expansion (fast impact, slow deceleration)
            const ease = 1.0 - Math.pow(1.0 - progress, 3);
            r.radius = 4 + ease * (r.maxRadius - 4);
            
            // Smooth linear decay for alpha
            r.alpha = 1.0 - progress;

            if (progress >= 1.0) return false;

            const R = r.radius;
            const baseAlpha = r.alpha;
            const cosA = Math.cos(r.angle);
            const sinA = Math.sin(r.angle);
            const stretch = r.stretch;

            // Bounding box for the local ripple patch (extended slightly to account for asymmetry)
            const pad = 12;
            const x0 = Math.max(0, Math.floor(r.x - R - pad));
            const y0 = Math.max(0, Math.floor(r.y - R - pad));
            const x1 = Math.min(w, Math.ceil(r.x + R + pad));
            const y1 = Math.min(h, Math.ceil(r.y + R + pad));
            const width = x1 - x0;
            const height = y1 - y0;

            if (width > 0 && height > 0) {
              const dstImgData = ctx.getImageData(x0, y0, width, height);
              const dstData = dstImgData.data;

              // Pre-calculate constants to optimize math in the inner loops
              const stretch_cosA = cosA * stretch;
              const sinA_div_stretch = sinA / stretch;

              // Start with a clean copy of the local destination segment from the screen-wide srcData
              for (let y = 0; y < height; y++) {
                const py = y0 + y;
                const srcRowStart = (x0 + py * w) * 4;
                const dstRowStart = y * width * 4;
                const byteLength = width * 4;
                
                // Copy segment row by row from screen-wide srcData to dstData
                dstData.set(srcData.subarray(srcRowStart, srcRowStart + byteLength), dstRowStart);
              }

              // Apply pixel-level displacement
              for (let y = 0; y < height; y++) {
                const py = y0 + y;
                const dy = py - r.y;
                
                const dy_sinA = dy * sinA;
                const dy_cosA = dy * cosA;

                // Start values for ex and ey at x = 0 (px = x0, dx = x0 - r.x)
                const startDx = x0 - r.x;
                let ex = (startDx * cosA - dy_sinA) * stretch;
                let ey = (startDx * sinA + dy_cosA) / stretch;

                for (let x = 0; x < width; x++) {
                  const px = x0 + x;
                  const dx = px - r.x;
                  
                  const distSq = ex * ex + ey * ey;

                  // Increment ex and ey for next iteration (saves multiplications)
                  ex += stretch_cosA;
                  ey += sinA_div_stretch;

                  // Check if the pixel is inside the ripple bounding region
                  if (distSq < R * R) {
                    const phi = fastAtan2(dy, dx);
                    // Circumferential waviness: 5-fold and 3-fold harmonic modulation for natural asymmetry
                    const waveWarp = 1.0 + 0.08 * Math.sin(phi * 5 + progress * 7.0) + 0.04 * Math.cos(phi * 3 - progress * 4.0);
                    const dist = Math.sqrt(distSq) * waveWarp;

                    if (dist < R) {
                      const realDist = Math.sqrt(dx * dx + dy * dy);
                      if (dist > 0 && realDist > 0) {
                        const t = dist / R;
                        
                        // Concentric ripple wave effect: multiple waves radiating out (with a secondary rhetoric wave layer)
                        const wave = Math.sin(dist * 0.15 - progress * 12.0) + 0.35 * Math.sin(dist * 0.30 - progress * 24.0);
                        // Envelope that is 0 at center (t=0) and outer edge (t=1), decaying towards edge
                        const envelope = Math.sin(t * Math.PI) * Math.pow(1.0 - t, 0.5);
                        
                        const strength = 0.48 * baseAlpha;
                        // Displacement scales with distance (amplified for prominence)
                        const displace = wave * envelope * strength * (dist * 0.50 + 12.0);

                        // Only compute bilinear interpolation if displacement is visually significant
                        if (Math.abs(displace) >= 0.1) {
                          // Chromatic aberration offsets: Red refracts most, Green normal, Blue least
                          const distR = realDist - displace * 1.15;
                          const distG = realDist - displace;
                          const distB = realDist - displace * 0.85;

                          const rx = r.x + (dx / realDist) * distR;
                          const ry = r.y + (dy / realDist) * distR;

                          const gx = r.x + (dx / realDist) * distG;
                          const gy = r.y + (dy / realDist) * distG;

                          const bx = r.x + (dx / realDist) * distB;
                          const by = r.y + (dy / realDist) * distB;

                          const idx = (x + y * width) * 4;

                          // Inline Bilinear sampler directly from full screen srcData
                          // Red Channel
                          {
                            const fx = Math.max(0, Math.min(w - 1, rx));
                            const fy = Math.max(0, Math.min(h - 1, ry));
                            const xf = Math.floor(fx);
                            const yf = Math.floor(fy);
                            const xc = xf < w - 1 ? xf + 1 : xf;
                            const yc = yf < h - 1 ? yf + 1 : yf;
                            const tx = fx - xf;
                            const ty = fy - yf;
                            
                            const row0 = yf * w * 4;
                            const row1 = yc * w * 4;
                            const r00 = srcData[row0 + xf * 4];
                            const r10 = srcData[row0 + xc * 4];
                            const r01 = srcData[row1 + xf * 4];
                            const r11 = srcData[row1 + xc * 4];
                            
                            const top = r00 + tx * (r10 - r00);
                            const bottom = r01 + tx * (r11 - r01);
                            dstData[idx] = top + ty * (bottom - top);
                          }

                          // Green Channel
                          {
                            const fx = Math.max(0, Math.min(w - 1, gx));
                            const fy = Math.max(0, Math.min(h - 1, gy));
                            const xf = Math.floor(fx);
                            const yf = Math.floor(fy);
                            const xc = xf < w - 1 ? xf + 1 : xf;
                            const yc = yf < h - 1 ? yf + 1 : yf;
                            const tx = fx - xf;
                            const ty = fy - yf;
                            
                            const row0 = yf * w * 4;
                            const row1 = yc * w * 4;
                            const g00 = srcData[row0 + xf * 4 + 1];
                            const g10 = srcData[row0 + xc * 4 + 1];
                            const g01 = srcData[row1 + xf * 4 + 1];
                            const g11 = srcData[row1 + xc * 4 + 1];
                            
                            const top = g00 + tx * (g10 - g00);
                            const bottom = g01 + tx * (g11 - g01);
                            dstData[idx + 1] = top + ty * (bottom - top);
                          }

                          // Blue Channel
                          {
                            const fx = Math.max(0, Math.min(w - 1, bx));
                            const fy = Math.max(0, Math.min(h - 1, by));
                            const xf = Math.floor(fx);
                            const yf = Math.floor(fy);
                            const xc = xf < w - 1 ? xf + 1 : xf;
                            const yc = yf < h - 1 ? yf + 1 : yf;
                            const tx = fx - xf;
                            const ty = fy - yf;
                            
                            const row0 = yf * w * 4;
                            const row1 = yc * w * 4;
                            const b00 = srcData[row0 + xf * 4 + 2];
                            const b10 = srcData[row0 + xc * 4 + 2];
                            const b01 = srcData[row1 + xf * 4 + 2];
                            const b11 = srcData[row1 + xc * 4 + 2];
                            
                            const top = b00 + tx * (b10 - b00);
                            const bottom = b01 + tx * (b11 - b01);
                            dstData[idx + 2] = top + ty * (bottom - top);
                          }

                          dstData[idx + 3] = 255;
                        }
                      }
                    }
                  }
                }
              }

              ctx.putImageData(dstImgData, x0, y0);
            }

            // 2. Ultra-faint lens edge shadow (achromatic defining rim)
            ctx.strokeStyle = `rgba(255, 255, 255, ${(baseAlpha * 0.05).toFixed(3)})`;
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.arc(r.x, r.y, R, 0, Math.PI * 2);
            ctx.stroke();

            return true;
          });
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(drawLoop);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    drawLoop();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animId);
    };
  }, [mode]);

  // Autoplay Melody state resets
  useEffect(() => {
    if (isPlayingMelody) {
      initAudio();
      
      const isSongChange = lastSongIndexRef.current !== null && lastSongIndexRef.current !== songIndex;
      lastSongIndexRef.current = songIndex;

      if (isSongChange) {
        songTime.current = -1500; // 1.5s silent delay on song change
      } else {
        songTime.current = 0; // immediate start on initial play
      }

      nextNoteIndex.current = 0;
      fallingNotes.current = [];
      lastTimeRef.current = performance.now();
    } else {
      fallingNotes.current = [];
      lastTimeRef.current = null;
      lastSongIndexRef.current = null; // reset transition tracking when stopped
    }
  }, [isPlayingMelody, songIndex]);

  // Handle pointer interactions
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    initAudio();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    lastMouse.current = { x, y, active: true };

    // Trigger visual/physical shockwave and sound chime
    const xNorm = x / rect.width;
    triggerShockwave(x, y, rect.width, rect.height);

    const noteIdx = Math.floor(xNorm * PENTATONIC.length);
    const freq = PENTATONIC[Math.min(noteIdx, PENTATONIC.length - 1)];
    
    playChime(xNorm, 1.5);

    // Add visual ripple
    addVisualRipple(x, y);

    // Calculate hue for particle burst
    const hue = getHueFromFreq(freq);

    // Inject small burst of particles for click
    if (mode === 'hanabi') {
      spawnHanabi(x, y, hue);
    } else {
      const count = mode === 'cosmic' ? 30 : mode === 'sands' ? 24 : 20;
      for (let j = 0; j < count; j++) {
        const angle = Math.random() * Math.PI * 2;
        const pSpeed = Math.random() * 6.0 + 4.5; // Faster start, travels further
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * pSpeed,
          vy: Math.sin(angle) * pSpeed,
          life: 1.0,
          hue,
          isBurst: true,
        });
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!lastMouse.current.active) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const dx = x - lastMouse.current.x;
    const dy = y - lastMouse.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1.5) {
      // Inject force vector into fluid grid
      const gridX = Math.floor((x / rect.width) * GRID_X);
      const gridY = Math.floor((y / rect.height) * GRID_Y);

      if (gridX >= 0 && gridX < GRID_X && gridY >= 0 && gridY < GRID_Y) {
        const idx = gridX + gridY * GRID_X;
        const strength = 1.6;
        uGrid.current[idx] += dx * strength;
        vGrid.current[idx] += dy * strength;
        densityGrid.current[idx] += 3.0;

        // Clamp velocity in the grid to prevent explosion and dead zones
        const maxVel = 22.0;
        uGrid.current[idx] = Math.max(-maxVel, Math.min(maxVel, uGrid.current[idx]));
        vGrid.current[idx] = Math.max(-maxVel, Math.min(maxVel, vGrid.current[idx]));
      }

      // Emit soft chimes on drag
      if (Math.random() < 0.12 && audioCtxRef.current) {
        const xNorm = x / rect.width;
        playChime(xNorm, Math.min(1.0, dist * 0.08));
      }
    }

    lastMouse.current = { x, y, active: true };
  };

  const handlePointerUp = () => {
    lastMouse.current.active = false;
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'block',
        touchAction: 'none',
        cursor: 'crosshair',
        zIndex: 1,
      }}
    />
  );
};
