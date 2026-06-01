import React, { useEffect, useRef } from 'react';

interface FluidSandboxProps {
  mode: 'cosmic' | 'biolume' | 'hanabi' | 'sands';
  audioEnabled: boolean;
  isMobile: boolean;
  onAudioStateChange: (enabled: boolean) => void;
  onSetAnalyser: (analyser: AnalyserNode | null) => void;
  isPlayingMelody: boolean;
  songIndex: number;
  pillPos?: { x: number; y: number; active: boolean } | null;
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
  homeX?: number;
  homeY?: number;
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
  audioEnabled,
  isMobile,
  onAudioStateChange,
  onSetAnalyser,
  isPlayingMelody,
  songIndex,
  pillPos,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Audio nodes state
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Switcher pill tracking
  const pillPosRef = useRef(pillPos);
  pillPosRef.current = pillPos;
  const lastPillPos = useRef<{ x: number; y: number } | null>(null);
  
  const pillXRef = useRef<number | null>(null);
  const pillYRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const targetXRef = useRef<number | null>(null);
  const targetYRef = useRef<number | null>(null);
  
  const pillWidthRef = useRef<number | null>(null);
  const startWidthRef = useRef<number | null>(null);
  const targetWidthRef = useRef<number | null>(null);
  
  const modeRef = useRef(mode);
  const modeChangedRef = useRef<boolean>(false);
  
  const transitionProgressRef = useRef<number>(1.0);
  const transitionStartTimeRef = useRef<number>(0);
  const lastActiveModeRef = useRef<string | null>(null);
  
  const lastXRef = useRef<number>(0);
  const lastYRef = useRef<number>(0);
  
  const activeHeightRef = useRef<number>(0);
  const dockRectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const headerRectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);

  // Visual ripples and melody control refs
  const ripples = useRef<VisualRipple[]>([]);
  const songTime = useRef(0);
  const nextNoteIndex = useRef(0);
  const fallingNotes = useRef<FallingNote[]>([]);
  const lastTimeRef = useRef<number | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const trailsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const refractionTempCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const isPlayingMelodyRef = useRef(isPlayingMelody);
  isPlayingMelodyRef.current = isPlayingMelody;

  const songIndexRef = useRef(songIndex);
  songIndexRef.current = songIndex;

  const audioEnabledRef = useRef(audioEnabled);
  audioEnabledRef.current = audioEnabled;

  const lastSongIndexRef = useRef<number | null>(null);

  const getHueFromFreq = (freq: number) => {
    const minF = 130.81;
    const maxF = 1760.0;
    const t = Math.min(1.0, Math.max(0.0, (freq - minF) / (maxF - minF)));
    return (200 + t * 200) % 360; // Beautiful spectrum
  };

  const addVisualRipple = (x: number, y: number) => {
    const maxRipples = isMobile ? 2 : 3;
    if (ripples.current.length >= maxRipples) {
      ripples.current.shift();
    }
    ripples.current.push({
      x,
      y,
      radius: 4,
      maxRadius: isMobile ? 123.5 : 190, // 35% smaller on mobile
      alpha: 1.0,
      elapsedTime: 0,
      duration: isMobile ? 1000 : 1300, // 1 second on mobile, 1.3 seconds on desktop
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
    const style = Math.floor(Math.random() * 6); // 6 different Japanese firework shell styles
    const rangeScale = 0.75; // 25% reduction in explosion range (particle velocity)
    const countScale = isMobile ? 0.50 : 1.0; // 50% reduction in particle amount on mobile

    if (style === 0) {
      // Style 0: Imperial Peony (Double-Ring with golden core) - Ultra dense
      // Outer magenta/pink ring
      const outerCount = Math.round(160 * countScale);
      const outerSpeed = 6.8 * rangeScale;
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
      const innerCount = Math.round(100 * countScale);
      const innerSpeed = 4.2 * rangeScale;
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
      const coreCount = Math.round(60 * countScale);
      const coreSpeed = 1.8 * rangeScale;
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
      const count = Math.round(280 * countScale);
      const speed = 7.2 * rangeScale;
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
      const outerCount = Math.round(180 * countScale);
      const outerSpeed = 6.2 * rangeScale;
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
      const innerCount = Math.round(100 * countScale);
      const innerSpeed = 3.0 * rangeScale;
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
    } else if (style === 3) {
      // Style 3: Crossette Star (Dense Ring with spoked crossette rays)
      const mainCount = Math.round(140 * countScale);
      const mainSpeed = 5.4 * rangeScale;
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
      const sparksPerSpoke = Math.round(10 * countScale);
      const spokeHue = (baseHue + 60) % 360;
      const spokeRotOffset = Math.random() * Math.PI * 2;
      for (let s = 0; s < spokesCount; s++) {
        const spokeAngle = (s / spokesCount) * Math.PI * 2 + spokeRotOffset;
        for (let pIdx = 0; pIdx < sparksPerSpoke; pIdx++) {
          const pSpeed = (4.0 + pIdx * 0.8 + Math.random() * 0.4) * rangeScale;
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
    } else if (style === 4) {
      // Style 4: Nagaoka Gold Weeping Willow & Emerald Green Fan Mines
      const canvas = canvasRef.current;
      const w = canvas ? canvas.width : window.innerWidth;
      const h = canvas ? canvas.height : window.innerHeight;

      // 1. Golden weeping crown in the sky
      const crownCount = Math.round(180 * countScale);
      const crownSpeed = 6.5 * rangeScale;
      const goldHue = 36 + Math.random() * 8; // Pure gold/orange
      for (let j = 0; j < crownCount; j++) {
        const angle = Math.random() * Math.PI * 2;
        const pSpeed = crownSpeed * (0.2 + Math.pow(Math.random(), 1.6) * 0.8);
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * pSpeed,
          vy: Math.sin(angle) * pSpeed,
          life: 1.0,
          hue: goldHue,
          isBurst: true,
          spin: -999, // Weeping/glittering physics
        });
      }

      // 2. Fanned emerald green mines shooting from the ground
      const fanPositions = [x - 80, x - 40, x, x + 40, x + 80];
      fanPositions.forEach((px) => {
        if (px >= 0 && px <= w) {
          const mineSparks = Math.round(12 * countScale);
          const greenHue = 145 + Math.random() * 20; // Vibrant emerald
          for (let m = 0; m < mineSparks; m++) {
            // Tight upward fan angles centered around -90 deg
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.32;
            const pSpeed = (Math.random() * 5.0 + 8.0) * rangeScale;
            particles.current.push({
              x: px,
              y: h,
              vx: Math.cos(angle) * pSpeed,
              vy: Math.sin(angle) * pSpeed,
              life: 1.0,
              hue: greenHue,
              isBurst: true,
            });
          }
        }
      });
    } else {
      // Style 5: Nagaoka Blue-Pink Peony Canopy with Gold Fan Mines
      const canvas = canvasRef.current;
      const w = canvas ? canvas.width : window.innerWidth;
      const h = canvas ? canvas.height : window.innerHeight;

      // 1. Upper blue peony shell (slightly offset higher)
      const blueCount = Math.round(140 * countScale);
      const blueSpeed = 5.5 * rangeScale;
      const blueHue = 190 + Math.random() * 20; // Deep cyan/blue
      for (let j = 0; j < blueCount; j++) {
        const angle = Math.random() * Math.PI * 2;
        const pSpeed = blueSpeed * (0.8 + Math.random() * 0.3);
        particles.current.push({
          x,
          y: y - 40,
          vx: Math.cos(angle) * pSpeed,
          vy: Math.sin(angle) * pSpeed,
          life: 1.0,
          hue: blueHue,
          isBurst: true,
        });
      }

      // 2. Lower pink peony shell (slightly offset lower)
      const pinkCount = Math.round(140 * countScale);
      const pinkSpeed = 5.0 * rangeScale;
      const pinkHue = 320 + Math.random() * 20; // Pink/magenta
      for (let j = 0; j < pinkCount; j++) {
        const angle = Math.random() * Math.PI * 2;
        const pSpeed = pinkSpeed * (0.8 + Math.random() * 0.3);
        particles.current.push({
          x,
          y: y + 10,
          vx: Math.cos(angle) * pSpeed,
          vy: Math.sin(angle) * pSpeed,
          life: 1.0,
          hue: pinkHue,
          isBurst: true,
        });
      }

      // 3. Fanned gold mines shooting from the ground
      const fanPositions = [x - 60, x, x + 60];
      fanPositions.forEach((px) => {
        if (px >= 0 && px <= w) {
          const mineSparks = Math.round(10 * countScale);
          const goldHue = 36 + Math.random() * 8;
          for (let m = 0; m < mineSparks; m++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.28;
            const pSpeed = (Math.random() * 4.0 + 7.0) * rangeScale;
            particles.current.push({
              x: px,
              y: h,
              vx: Math.cos(angle) * pSpeed,
              vy: Math.sin(angle) * pSpeed,
              life: 1.0,
              hue: goldHue,
              isBurst: true,
              spin: -999, // Weeping/glittering physics
            });
          }
        }
      });
    }
  };

  // Initialize AudioContext lazily
  const initAudio = () => {
    if (audioCtxRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      onSetAnalyser(analyser);
      onAudioStateChange(true);
    } catch (e) {
      console.error('Failed to init audio context', e);
    }
  };

  const playChime = (xNormalized: number, force: number, customFreq?: number) => {
    if (!audioEnabledRef.current) return;

    const ctx = audioCtxRef.current;
    const analyser = analyserRef.current;
    if (!ctx || !analyser) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
      return; // Skip this chime note to avoid queueing on suspended state
    }

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

    const baseShockRadiusPx = 220.0; // Symmetrical pixel radius on desktop
    const shockRadiusPx = isMobile ? baseShockRadiusPx * 0.65 : baseShockRadiusPx; // 35% smaller on mobile

    for (let gy = 0; gy < GRID_Y; gy++) {
      const cellY = ((gy + 0.5) / GRID_Y) * canvasHeight;
      const dy = cellY - y;

      for (let gx = 0; gx < GRID_X; gx++) {
        const idx = gx + gy * GRID_X;
        const cellX = ((gx + 0.5) / GRID_X) * canvasWidth;
        const dx = cellX - x;

        const distPx = Math.sqrt(dx * dx + dy * dy);

        if (distPx < shockRadiusPx && distPx > 0) {
          const force = (shockRadiusPx - distPx) / shockRadiusPx;
          let pushForce = force * 6.5;
          if (isMobile && modeRef.current === 'cosmic') {
            pushForce *= 0.3; // 70% reduction
          }

          // Push force vector is relative to true pixel direction (dx/distPx, dy/distPx)
          u[idx] += (dx / distPx) * pushForce;
          v[idx] += (dy / distPx) * pushForce;
          density[idx] += force * 4.0;

          // Clamp velocity in the grid to prevent explosion and dead zones
          const maxVel = 22.0;
          u[idx] = Math.max(-maxVel, Math.min(maxVel, u[idx]));
          v[idx] = Math.max(-maxVel, Math.min(maxVel, v[idx]));
        }
      }
    }
  };

  const updateDOMRects = (isTransition = false) => {
    const switcher = document.querySelector('.style-switcher') as HTMLElement;
    if (switcher) {
      const switcherRect = switcher.getBoundingClientRect();
      dockRectRef.current = {
        left: switcherRect.left,
        top: switcherRect.top,
        width: switcherRect.width,
        height: switcherRect.height,
      };

      const activeBtn = switcher.querySelector('.hud-btn.active') as HTMLElement;
      if (activeBtn) {
        const activeRect = activeBtn.getBoundingClientRect();
        const targetX = activeRect.left + activeRect.width / 2;
        const targetY = activeRect.top + activeRect.height / 2;
        const targetW = activeRect.width;
        activeHeightRef.current = activeRect.height;

        const now = performance.now();
        if (pillXRef.current === null || !isTransition) {
          pillXRef.current = targetX;
          pillYRef.current = targetY;
          startXRef.current = targetX;
          startYRef.current = targetY;
          targetXRef.current = targetX;
          targetYRef.current = targetY;
          
          pillWidthRef.current = targetW;
          startWidthRef.current = targetW;
          targetWidthRef.current = targetW;
          
          transitionProgressRef.current = 1.0;
          lastXRef.current = targetX;
          lastYRef.current = targetY;
        } else if (targetXRef.current !== targetX || targetYRef.current !== targetY) {
          startXRef.current = pillXRef.current;
          startYRef.current = pillYRef.current;
          targetXRef.current = targetX;
          targetYRef.current = targetY;
          
          startWidthRef.current = pillWidthRef.current !== null ? pillWidthRef.current : targetW;
          targetWidthRef.current = targetW;
          
          transitionProgressRef.current = 0.0;
          transitionStartTimeRef.current = now;
        }
      }
    } else {
      dockRectRef.current = null;
    }

    const header = document.querySelector('header.hud-card') as HTMLElement;
    if (header) {
      const headerRect = header.getBoundingClientRect();
      headerRectRef.current = {
        left: headerRect.left,
        top: headerRect.top,
        width: headerRect.width,
        height: headerRect.height,
      };
    } else {
      headerRectRef.current = null;
    }
  };

  const triggerClickAt = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    if (audioEnabledRef.current) {
      initAudio();
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    }

    // Trigger visual/physical shockwave and sound chime
    const norm = isMobile ? (1.0 - y / rect.height) : (x / rect.width);
    triggerShockwave(x, y, rect.width, rect.height);

    const noteIdx = Math.floor(norm * PENTATONIC.length);
    const freq = PENTATONIC[Math.min(noteIdx, PENTATONIC.length - 1)];
    
    playChime(norm, 1.5);

    // Add visual ripple
    addVisualRipple(x, y);

    // Calculate hue for particle burst
    const hue = getHueFromFreq(freq);

    // Inject small burst of particles for click
    const activeMode = modeRef.current;
    if (activeMode === 'hanabi') {
      spawnHanabi(x, y, hue);
    } else {
      const count = activeMode === 'cosmic' ? 30 : activeMode === 'sands' ? 24 : 20; // biolume
      for (let j = 0; j < count; j++) {
        const angle = Math.random() * Math.PI * 2;
        let pSpeed = Math.random() * 6.0 + 4.5; // Faster start, travels further
        if (isMobile) {
          if (activeMode === 'cosmic') {
            pSpeed *= 0.3; // 70% reduction
          } else if (activeMode === 'biolume') {
            pSpeed *= 0.65; // 35% reduction
          }
        }
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * pSpeed,
          vy: Math.sin(angle) * pSpeed,
          life: 1.0,
          hue: activeMode === 'biolume' ? Math.random() * 360 : hue,
          isBurst: true,
        });
      }
    }
  };

  // Separate useEffect to sync modeRef and flag mode changes for the draw loop
  useEffect(() => {
    if (modeRef.current !== mode) {
      modeRef.current = mode;
      modeChangedRef.current = true;

      // Update switcher coordinates and start transition animation!
      setTimeout(() => {
        updateDOMRects(true);
      }, 50);
    }
  }, [mode, isMobile]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const logicalWidth = window.innerWidth;
      const logicalHeight = window.innerHeight;
      
      canvas.width = logicalWidth * dpr;
      canvas.height = logicalHeight * dpr;

      // Scale main canvas context
      ctx.resetTransform();
      ctx.scale(dpr, dpr);

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
        trailsCtx.resetTransform();
        trailsCtx.scale(dpr, dpr);
        trailsCtx.fillStyle = '#000000';
        trailsCtx.fillRect(0, 0, logicalWidth, logicalHeight);
      }

      initParticles();

      // Reset positions and widths for style switcher liquid glass chip
      pillXRef.current = null;
      pillYRef.current = null;
      startXRef.current = null;
      startYRef.current = null;
      targetXRef.current = null;
      targetYRef.current = null;
      pillWidthRef.current = null;
      startWidthRef.current = null;
      targetWidthRef.current = null;
      transitionProgressRef.current = 1.0;
      lastActiveModeRef.current = null;
      dockRectRef.current = null;
      headerRectRef.current = null;

      // Automatically resume AudioContext if it gets suspended due to resolution/device toolbar changes
      if (audioEnabledRef.current && audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    };

    const initParticles = () => {
      particles.current = [];
      const logicalWidth = window.innerWidth;
      const logicalHeight = window.innerHeight;
      const baseArea = 1920 * 1080;
      const currentArea = logicalWidth * logicalHeight;
      const areaRatio = currentArea / baseArea;
      const activeMode = modeRef.current;

      // Soft scaling: use the square root of the area ratio so it scales down more gently for desktop
      const scale = Math.max(0.4, Math.sqrt(areaRatio));

      let baseCount = activeMode === 'cosmic' ? 6000 : activeMode === 'biolume' ? 2500 : activeMode === 'hanabi' ? 0 : 4500;
      let count = Math.round(baseCount * scale);

      if (isMobile) {
        // Use linear area ratio for mobile to scale down to lightweight levels
        const mobileScale = Math.max(0.15, areaRatio);
        count = Math.round(baseCount * mobileScale * 0.70);
        
        // Ensure a healthy minimum so it remains visually rich and interactive but extremely performant
        if (activeMode === 'cosmic') count = Math.max(600, count);
        else if (activeMode === 'biolume') count = Math.max(300, count);
        else if (activeMode === 'sands') count = Math.max(500, count);
      } else {
        // On desktop, ensure a minimum count as well
        if (activeMode === 'cosmic') count = Math.max(4000, count);
        else if (activeMode === 'biolume') count = Math.max(1800, count);
        else if (activeMode === 'sands') count = Math.max(3000, count);
      }

      particleCount.current = count;

      for (let i = 0; i < count; i++) {
        const rx = Math.random() * logicalWidth;
        const ry = Math.random() * logicalHeight;
        particles.current.push({
          x: rx,
          y: ry,
          homeX: rx,
          homeY: ry,
          vx: 0,
          vy: 0,
          life: Math.random() * 0.5 + 0.5,
          hue: Math.random() * 360,
          spin: activeMode === 'sands' ? Math.random() : undefined,
        });
      }
    };

    const drawLoop = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      const trailsCanvas = trailsCanvasRef.current;
      const trailsCtx = trailsCanvas ? trailsCanvas.getContext('2d') : null;
      const activeMode = modeRef.current;

      // 0. Handle mode transition reset
      if (modeChangedRef.current) {
        modeChangedRef.current = false;
        initParticles();

        // Completely reset fluid velocities and densities to erase any old currents
        uGrid.current.fill(0);
        vGrid.current.fill(0);
        densityGrid.current.fill(0);

        // Clear active visual ripples
        ripples.current = [];

        if (trailsCtx) {
          trailsCtx.fillStyle = '#000000';
          trailsCtx.fillRect(0, 0, w, h);
        }
      }

      // Clear the main canvas to background color before redrawing
      ctx.fillStyle = activeMode === 'hanabi' ? '#000000' : '#030303';
      ctx.fillRect(0, 0, w, h);

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

      // Check if grid has any active forces/velocities
      let hasMotion = false;
      for (let i = 0; i < gridLength; i++) {
        if (u[i] !== 0 || v[i] !== 0 || density[i] !== 0) {
          hasMotion = true;
          break;
        }
      }

      if (hasMotion) {
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

        // Apply overall friction decay scaled for frame delta time (target: 60fps / 16.67ms)
        const clampedDt = Math.min(100.0, dt || 16.67);
        const fpsRatio = clampedDt / 16.67;
        const velDecay = Math.pow(0.94, fpsRatio);
        const densityDecay = Math.pow(0.96, fpsRatio);

        for (let i = 0; i < gridLength; i++) {
          u[i] *= velDecay;
          v[i] *= velDecay;
          density[i] *= densityDecay;

          // Zero out extremely tiny velocities to prevent subnormal floating point math and keep simulation idle
          if (Math.abs(u[i]) < 0.005) u[i] = 0.0;
          if (Math.abs(v[i]) < 0.005) v[i] = 0.0;
          if (density[i] < 0.005) density[i] = 0.0;
        }
      }

      // 2b. If style switcher pill is moving, inject fluid drag force
      if (pillXRef.current !== null && pillYRef.current !== null && lastPillPos.current) {
        const px = pillXRef.current;
        const py = pillYRef.current;
        const dx = px - lastPillPos.current.x;
        const dy = py - lastPillPos.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.5) {
          const gridX = Math.floor((px / w) * GRID_X);
          const gridY = Math.floor((py / h) * GRID_Y);

          if (gridX >= 0 && gridX < GRID_X && gridY >= 0 && gridY < GRID_Y) {
            const idx = gridX + gridY * GRID_X;
            const strength = 1.8;
            u[idx] += dx * strength;
            v[idx] += dy * strength;
            density[idx] += 2.0;
          }
        }
        lastPillPos.current = { x: px, y: py };
      } else if (pillXRef.current !== null && pillYRef.current !== null) {
        lastPillPos.current = { x: pillXRef.current, y: pillYRef.current };
      } else {
        lastPillPos.current = null;
      }

      // 3. Clear/Fade trails canvas (draw background fades depending on render mode)
      if (trailsCtx) {
        // Fade the existing trails on the offscreen canvas by subtracting alpha (keeping background fully transparent)
        trailsCtx.save();
        trailsCtx.globalCompositeOperation = 'destination-out';
        if (activeMode === 'cosmic') {
          trailsCtx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        } else if (activeMode === 'hanabi') {
          trailsCtx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        } else if (activeMode === 'sands') {
          trailsCtx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        } else {
          trailsCtx.fillStyle = 'rgba(0, 0, 0, 0.08)'; // Biolume
        }
        trailsCtx.fillRect(0, 0, w, h);
        trailsCtx.restore();
      } else {
        // Fallback: without offscreen buffer, we clear with alpha directly on main canvas
        if (activeMode === 'cosmic') {
          ctx.fillStyle = 'rgba(3, 3, 3, 0.08)';
          ctx.fillRect(0, 0, w, h);
        } else if (activeMode === 'hanabi') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
          ctx.fillRect(0, 0, w, h);
        } else if (activeMode === 'sands') {
          ctx.fillStyle = 'rgba(3, 3, 3, 0.22)';
          ctx.fillRect(0, 0, w, h);
        } else {
          ctx.fillStyle = 'rgba(3, 3, 3, 0.08)';
          ctx.fillRect(0, 0, w, h);
        }
      }

      // Update burst particles life and friction
      particles.current = particles.current.filter((p) => {
        if (p.isBurst) {
          if (activeMode === 'hanabi') {
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
            let decayDivisor = 2500;
            if (activeMode === 'biolume') {
              decayDivisor = isMobile ? 2700 : 2500; // 0.2s longer on mobile (2700ms)
            }
            p.life -= dt / decayDivisor; // Fly for ~2.5s (allows lingering trails)
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
          if (activeMode === 'hanabi' && p.isBurst) {
            // Fresh sparks ignore fluid drag to keep clean radial explosion vectors
            const blend = p.life > 0.45 ? 0.015 : 0.08;
            p.vx = p.vx * (1 - blend) + u[idx] * blend;
            p.vy = p.vy * (1 - blend) + v[idx] * blend;
          } else {
            const blend = 0.15;
            p.vx = p.vx * (1 - blend) + u[idx] * blend;
            p.vy = p.vy * (1 - blend) + v[idx] * blend;
          }
        }

        // Organic random curling for Biolume Trails
        if (activeMode === 'biolume') {
          if (p.spin === undefined) {
            p.spin = (Math.random() - 0.5) * (isMobile ? 0.6 : 0.28);
          }
          // Slow random walk for spin changes (creates organic, winding curves; more 'frazzly' on mobile)
          const spinDelta = isMobile ? 0.12 : 0.04;
          p.spin += (Math.random() - 0.5) * spinDelta;
          const maxSpin = isMobile ? 0.5 : 0.25;
          p.spin = Math.max(-maxSpin, Math.min(maxSpin, p.spin));

          // Rotate velocity vector
          const cos = Math.cos(p.spin);
          const sin = Math.sin(p.spin);
          const rx = p.vx * cos - p.vy * sin;
          const ry = p.vx * sin + p.vy * cos;
          
          // Blend curved momentum (tighter curves on mobile)
          const blendCurved = isMobile ? 0.35 : 0.22;
          p.vx = p.vx * (1 - blendCurved) + rx * blendCurved;
          p.vy = p.vy * (1 - blendCurved) + ry * blendCurved;
        }

        // Flowing Sands Mode: falling and wind swirling blizzard mechanics
        if (activeMode === 'sands') {
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
            if (activeMode === 'sands') {
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

        if (activeMode === 'cosmic') {
          // Cosmic Dust Mode: Glowing blue-purple particles
          const baseAlpha = p.isBurst ? p.life : 1.0;
          const alpha = Math.min(0.8, (0.2 + speed * 0.1) * baseAlpha);
          drawCtx.beginPath();
          const r = isMobile ? 1.35 : 1.2; // 25% reduction on mobile
          drawCtx.arc(p.x, p.y, r, 0, Math.PI * 2);
          drawCtx.fillStyle = `hsla(${270 + speed * 20}, 85%, 65%, ${alpha})`;
          drawCtx.fill();
        } else if (activeMode === 'hanabi') {
          // Hanabi Theme: Fine-grain Japanese fireworks sparks with motion trails and white-hot cores
          const baseAlpha = p.isBurst ? p.life : 1.0;
          let alpha = Math.min(1.0, baseAlpha * 1.6);
          
          // Golden Kamuro Weeping Willow Strobe/Twinkle
          if (p.spin === -999) {
            alpha *= (0.35 + 0.65 * Math.sin(p.life * 70.0 + p.x));
          }

          const currentHue = (p.hue + (1.0 - p.life) * 115) % 360;

          // Draw fine glittering motion trail (disabled on mobile to optimize performance)
          if (!isMobile && speed > 0.6) {
            drawCtx.strokeStyle = p.spin === -999 
              ? `rgba(255, 180, 50, ${alpha * 0.38})` // Gold trail
              : `hsla(${currentHue}, 95%, 65%, ${alpha * 0.35})`;
            drawCtx.lineWidth = 0.45;
            drawCtx.beginPath();
            drawCtx.moveTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2); // Longer trail line
            drawCtx.lineTo(p.x, p.y);
            drawCtx.stroke();
          }

          // Draw fine-grain combustion spark core
          const radius = (0.35 + p.life * 0.65) * (isMobile ? 1.35 : 1.0); // 35% larger core on mobile
          
          if (p.life > 0.82) {
            drawCtx.fillStyle = '#ffffff'; // White-hot combustion
          } else if (p.spin === -999) {
            drawCtx.fillStyle = `rgba(255, 190, 80, ${alpha})`; // Willow gold
          } else {
            drawCtx.fillStyle = `hsla(${currentHue}, 95%, 65%, ${alpha})`; // Saturated color shift
          }

          if (isMobile) {
            // Draw spark core as flat hardware-accelerated rect square on mobile viewports to bypass vector arc path overhead
            drawCtx.fillRect(p.x - radius, p.y - radius, radius * 2, radius * 2);
          } else {
            drawCtx.beginPath();
            drawCtx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            drawCtx.fill();
          }
        } else if (activeMode === 'sands') {
          // Flowing Sands Mode: ice-white and pale-cyan blizzard sand grains (smaller on mobile)
          const alpha = Math.min(0.85, 0.35 + speed * 0.15);
          const isCyan = (p.hue % 5) === 0;
          drawCtx.fillStyle = isCyan 
            ? `rgba(165, 243, 252, ${alpha})` // Cyan-ice
            : `rgba(240, 248, 255, ${alpha})`; // Alice-blue/white
          const sSize = isMobile ? 2.0 : 1.0; // 2x larger on mobile
          drawCtx.fillRect(p.x, p.y, sSize, sSize);
        } else {
          // Biolume Trails Mode: Colorful fluid vector brush lines
          const baseAlpha = p.isBurst ? p.life : 1.0;
          // Alpha scales directly with speed so stationary background particles fade out completely
          const alpha = Math.min(0.9, (speed * 0.35) * baseAlpha);
          const hue = (p.hue + speed * 5) % 360;
          drawCtx.strokeStyle = `hsla(${hue}, 90%, 60%, ${alpha})`;
          const rawWidth = Math.min(2.5, 0.8 + speed * 0.4) * (p.isBurst ? Math.sqrt(p.life) : 1.0);
          drawCtx.lineWidth = rawWidth * (isMobile ? 0.65 : 1.0) * 1.15; // 35% smaller on mobile, 15% size increase
          drawCtx.beginPath();

          // Limit line trail length to prevent long lines connecting back to epicenter (35% shorter on mobile)
          const maxTrailLen = isMobile ? 5.2 : 8.0;
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
        ctx.drawImage(trailsCanvas, 0, 0, w, h);
      }

      // 5. Draw channel dots nodes on main canvas
      const targetY = h * 0.8 - 60;
      const targetX = isMobile ? w * 0.2 + 85 : w * 0.2;
      ctx.save();
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < PENTATONIC.length; i++) {
        const xNorm = (i + 0.5) / PENTATONIC.length;
        if (isMobile) {
          const y = h * (1.0 - xNorm);
          ctx.beginPath();
          ctx.arc(targetX, y, 0.75, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const x = w * xNorm;
          ctx.beginPath();
          ctx.arc(x, targetY, 0.75, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // 6. Update and draw falling Synthesia notes
      if (isPlayingMelodyRef.current) {
        songTime.current += dt;

        // Select active song melody and duration
        const activeSong = songIndexRef.current === 0
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
          
          let x, y;
          if (isMobile) {
            y = h * (1.0 - xNorm);
            x = w; // Spawn on the right edge
          } else {
            x = w * xNorm;
            y = 0; // Spawn on the top edge
          }

          const hue = getHueFromFreq(freq);

          fallingNotes.current.push({
            id: Math.random() + nextNoteIndex.current,
            x,
            y,
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

          if (isMobile) {
            r.x = w - (w - targetX) * progress; // Move horizontally right-to-left
          } else {
            r.y = targetY * progress; // Fall vertically top-to-bottom
          }

          if (progress >= 1.0 && !r.hasPlayed) {
            r.hasPlayed = true;

            const strikeX = isMobile ? targetX : r.x;
            const strikeY = isMobile ? r.y : targetY;

            // Trigger visual/physical shockwave and sound chime!
            triggerShockwave(strikeX, strikeY, w, h);
            
            const chimePos = isMobile ? (1.0 - strikeY / h) : (strikeX / w);
            playChime(chimePos, 2.2, r.freq);

            // Add visual ripple
            addVisualRipple(strikeX, strikeY);

            // Inject high-speed particle burst
            if (activeMode === 'hanabi') {
              spawnHanabi(strikeX, strikeY, getHueFromFreq(r.freq));
            } else {
              const burstCount = activeMode === 'cosmic' ? 40 : activeMode === 'sands' ? 32 : 28; // biolume
              for (let j = 0; j < burstCount; j++) {
                const angle = Math.random() * Math.PI * 2;
                let pSpeed = Math.random() * 6.0 + 4.5; // Faster start, travels further
                if (isMobile) {
                  if (activeMode === 'cosmic') {
                    pSpeed *= 0.3; // 70% reduction
                  } else if (activeMode === 'biolume') {
                    pSpeed *= 0.65; // 35% reduction
                  }
                }
                particles.current.push({
                  x: strikeX,
                  y: strikeY,
                  vx: Math.cos(angle) * pSpeed,
                  vy: Math.sin(angle) * pSpeed,
                  life: 1.0, // Lifespan managed in ms in loop
                  hue: activeMode === 'biolume' ? Math.random() * 360 : getHueFromFreq(r.freq), // Rainbow spray for Biolume notes!
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
          if (isMobile) {
            ctx.moveTo(r.x + 18, r.y);
            ctx.lineTo(r.x + 4, r.y); // Trail comes from the right
          } else {
            ctx.moveTo(r.x, r.y - 18);
            ctx.lineTo(r.x, r.y - 4); // Trail comes from the top
          }
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

      // 7. Update and draw visual ripples (invisible gravitational lensing refraction with chromatic aberration)
      // Optimized 1x logical-coordinate offscreen temp canvas processing (9x speedup on Retina displays)
      if (ripples.current.length > 0) {
        ctx.save();
        const dpr = window.devicePixelRatio || 1;
        
        if (!refractionTempCanvasRef.current) {
          refractionTempCanvasRef.current = document.createElement('canvas');
        }
        const tempCanvas = refractionTempCanvasRef.current;
        const tempCtx = tempCanvas ? tempCanvas.getContext('2d') : null;

        ripples.current = ripples.current.filter((r) => {
          r.elapsedTime += dt;
          const progress = Math.min(1.0, r.elapsedTime / r.duration);

          // Cubic ease-out for expansion (fast impact, slow deceleration)
          const ease = 1.0 - Math.pow(1.0 - progress, 3);
          r.radius = 4 + ease * (r.maxRadius - 4);
          
          // Smooth linear decay for alpha
          r.alpha = 1.0 - progress;

          if (progress >= 1.0) return false;

          const R = r.radius; // logical radius
          const baseAlpha = r.alpha;
          const cosA = Math.cos(r.angle);
          const sinA = Math.sin(r.angle);
          const stretch = r.stretch;

          // Bounding box for the local ripple patch (logical coordinates)
          const pad = 12;
          const x0 = Math.max(0, Math.floor(r.x - R - pad));
          const y0 = Math.max(0, Math.floor(r.y - R - pad));
          const x1 = Math.min(w, Math.ceil(r.x + R + pad));
          const y1 = Math.min(h, Math.ceil(r.y + R + pad));
          const width = x1 - x0; // logical width
          const height = y1 - y0; // logical height

          if (width > 0 && height > 0 && tempCanvas && tempCtx) {
            // Resize temp canvas to match logical bounding box size
            tempCanvas.width = width;
            tempCanvas.height = height;

            // Copy the current main canvas pixels (High-DPI) downscaled to 1x logical resolution
            tempCtx.drawImage(
              canvas,
              x0 * dpr, y0 * dpr, width * dpr, height * dpr, // source rect (physical)
              0, 0, width, height                           // dest rect (logical)
            );

            // Get logical pixel data
            const dstImgData = tempCtx.getImageData(0, 0, width, height);
            const dstData = dstImgData.data;
            const localSrc = new Uint8ClampedArray(dstData);

            // Pre-calculate constants to optimize math in the inner loops
            const stretch_cosA = cosA * stretch;
            const sinA_div_stretch = sinA / stretch;

            // Apply pixel-level displacement on 1x logical pixel grid
            for (let y = 0; y < height; y++) {
              const py = y0 + y;
              const dy = py - r.y;
              
              const dy_sinA = dy * sinA;
              const dy_cosA = dy * cosA;

              const startDx = x0 - r.x;
              let ex = (startDx * cosA - dy_sinA) * stretch;
              let ey = (startDx * sinA + dy_cosA) / stretch;

              const stepEx = stretch_cosA;
              const stepEy = sinA_div_stretch;

              for (let x = 0; x < width; x++) {
                const px = x0 + x;
                const dx = px - r.x;
                
                const distSq = ex * ex + ey * ey;

                // Increment ex and ey
                ex += stepEx;
                ey += stepEy;

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
                      const envelope = Math.sin(t * Math.PI) * Math.pow(1.0 - t, 0.5);
                      
                      const strength = 0.48 * baseAlpha;
                      const displace = wave * envelope * strength * (dist * 0.50 + 12.0);

                      if (Math.abs(displace) >= 0.1) {
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

                        // Inline Bilinear sampler directly from logical local source buffer
                        // Red Channel
                        {
                          const fx = Math.max(0, Math.min(width - 1, rx - x0));
                          const fy = Math.max(0, Math.min(height - 1, ry - y0));
                          const xf = Math.floor(fx);
                          const yf = Math.floor(fy);
                          const xc = xf < width - 1 ? xf + 1 : xf;
                          const yc = yf < height - 1 ? yf + 1 : yf;
                          const tx = fx - xf;
                          const ty = fy - yf;
                          
                          const row0 = yf * width * 4;
                          const row1 = yc * width * 4;
                          const r00 = localSrc[row0 + xf * 4];
                          const r10 = localSrc[row0 + xc * 4];
                          const r01 = localSrc[row1 + xf * 4];
                          const r11 = localSrc[row1 + xc * 4];
                          
                          const top = r00 + tx * (r10 - r00);
                          const bottom = r01 + tx * (r11 - r01);
                          dstData[idx] = top + ty * (bottom - top);
                        }

                        // Green Channel
                        {
                          const fx = Math.max(0, Math.min(width - 1, gx - x0));
                          const fy = Math.max(0, Math.min(height - 1, gy - y0));
                          const xf = Math.floor(fx);
                          const yf = Math.floor(fy);
                          const xc = xf < width - 1 ? xf + 1 : xf;
                          const yc = yf < height - 1 ? yf + 1 : yf;
                          const tx = fx - xf;
                          const ty = fy - yf;
                          
                          const row0 = yf * width * 4;
                          const row1 = yc * width * 4;
                          const g00 = localSrc[row0 + xf * 4 + 1];
                          const g10 = localSrc[row0 + xc * 4 + 1];
                          const g01 = localSrc[row1 + xf * 4 + 1];
                          const g11 = localSrc[row1 + xc * 4 + 1];
                          
                          const top = g00 + tx * (g10 - g00);
                          const bottom = g01 + tx * (g11 - g01);
                          dstData[idx + 1] = top + ty * (bottom - top);
                        }

                        // Blue Channel
                        {
                          const fx = Math.max(0, Math.min(width - 1, bx - x0));
                          const fy = Math.max(0, Math.min(height - 1, by - y0));
                          const xf = Math.floor(fx);
                          const yf = Math.floor(fy);
                          const xc = xf < width - 1 ? xf + 1 : xf;
                          const yc = yf < height - 1 ? yf + 1 : yf;
                          const tx = fx - xf;
                          const ty = fy - yf;
                          
                          const row0 = yf * width * 4;
                          const row1 = yc * width * 4;
                          const b00 = localSrc[row0 + xf * 4 + 2];
                          const b10 = localSrc[row0 + xc * 4 + 2];
                          const b01 = localSrc[row1 + xf * 4 + 2];
                          const b11 = localSrc[row1 + xc * 4 + 2];
                          
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

            // Put displaced logical image data back
            tempCtx.putImageData(dstImgData, 0, 0);

            // Draw back to main High-DPI canvas (will automatically upscale and interpolate on GPU!)
            ctx.drawImage(tempCanvas, 0, 0, width, height, x0, y0, width, height);
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

      // 8. Style switcher and top menu bar coordinates animation & rendering
      if (dockRectRef.current === null && headerRectRef.current === null) {
        updateDOMRects(false);
      }

      // 8a. Interpolate coordinates and width using cubic ease-in-out
      const px = pillXRef.current;
      const py = pillYRef.current;
      const sx = startXRef.current;
      const sy = startYRef.current;
      const tx = targetXRef.current;
      const ty = targetYRef.current;

      const pw = pillWidthRef.current;
      const sw = startWidthRef.current;
      const tw = targetWidthRef.current;

      if (px !== null && py !== null && sx !== null && sy !== null && tx !== null && ty !== null &&
          pw !== null && sw !== null && tw !== null) {
        if (transitionProgressRef.current < 1.0) {
          const elapsed = now - transitionStartTimeRef.current;
          const duration = 460; // 0.46s transition
          const progress = Math.min(1.0, elapsed / duration);
          transitionProgressRef.current = progress;
          
          // Cubic ease-in-out
          const t = progress < 0.5 
            ? 4 * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
          pillXRef.current = sx + (tx - sx) * t;
          pillYRef.current = sy + (ty - sy) * t;
          pillWidthRef.current = sw + (tw - sw) * t;
        } else {
          pillXRef.current = tx;
          pillYRef.current = ty;
          pillWidthRef.current = tw;
        }
      }

      // 8b. Cache background and draw Glass dock plate behind the HTML bar (100% colorless)
      const offscreen = offscreenCanvasRef.current;
      if (offscreen && !isMobile) {
        const offscreenCtx = offscreen.getContext('2d');
        if (offscreenCtx) {
          offscreenCtx.resetTransform();
          offscreenCtx.drawImage(canvas, 0, 0);
        }
      }

      // Draw Top Menu Bar Glass Plate (using exact same effect as bottom bar)
      if (headerRectRef.current) {
        const rect = headerRectRef.current;
        const rectX = Math.round(rect.left);
        const rectY = Math.round(rect.top);
        const rectW = Math.round(rect.width);
        const rectH = Math.round(rect.height);
        const radius = isMobile ? 12 : 16;

        ctx.save();
        
        // Clip and render GPU-accelerated frosted glass backdrop blur for the header container plate
        // Bypass only the expensive blur copy on mobile viewports to preserve high framerates
        if (!isMobile) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(rectX, rectY, rectW, rectH, radius);
          ctx.clip();
          
          if (offscreen) {
            ctx.filter = 'blur(16px)';
            ctx.drawImage(offscreen, 0, 0, w, h);
            ctx.filter = 'none';
          }
          ctx.restore();
        }

        // Soft dark shadow under header plate
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 3;
        
        ctx.fillStyle = 'rgba(8, 8, 12, 0.22)';
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, rectW, rectH, radius);
        ctx.fill();
        ctx.restore();
        
        // Sheen reflection
        const sheen = ctx.createLinearGradient(rectX, rectY, rectX + rectW * 0.2, rectY + rectH * 0.8);
        sheen.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
        sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0.01)');
        sheen.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        ctx.fillStyle = sheen;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, rectW, rectH, radius);
        ctx.fill();
        
        // Fine glass border with 45-degree diagonal gradient
        const headerStroke = ctx.createLinearGradient(rectX, rectY, rectX + rectW, rectY + rectH);
        headerStroke.addColorStop(0.0, 'rgba(255, 255, 255, 0.32)'); // Top-left highlight
        headerStroke.addColorStop(0.3, 'rgba(255, 255, 255, 0.08)'); // Sides
        headerStroke.addColorStop(0.7, 'rgba(255, 255, 255, 0.04)'); // Sides
        headerStroke.addColorStop(1.0, 'rgba(255, 255, 255, 0.22)'); // Bottom-right reflection
        
        ctx.strokeStyle = headerStroke;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, rectW, rectH, radius);
        ctx.stroke();
        
        ctx.restore();
      }

      if (dockRectRef.current) {
        const rect = dockRectRef.current;
        const rectX = Math.round(rect.left);
        const rectY = Math.round(rect.top);
        const rectW = Math.round(rect.width);
        const rectH = Math.round(rect.height);
        const radius = isMobile ? 12 : 16;

        ctx.save();
        
        // Clip and render GPU-accelerated frosted glass backdrop blur for the dock container plate
        // Bypass only the expensive blur copy on mobile viewports to preserve high framerates
        if (!isMobile) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(rectX, rectY, rectW, rectH, radius);
          ctx.clip();
          
          if (offscreen) {
            ctx.filter = 'blur(16px)';
            ctx.drawImage(offscreen, 0, 0, w, h);
            ctx.filter = 'none';
          }
          ctx.restore();
        }

        // Soft dark shadow under dock plate
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 3;
        
        ctx.fillStyle = 'rgba(8, 8, 12, 0.22)';
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, rectW, rectH, radius);
        ctx.fill();
        ctx.restore();
        
        // Sheen reflection
        const sheen = ctx.createLinearGradient(rectX, rectY, rectX + rectW * 0.2, rectY + rectH * 0.8);
        sheen.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
        sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0.01)');
        sheen.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        ctx.fillStyle = sheen;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, rectW, rectH, radius);
        ctx.fill();
        
        // Fine glass border with 45-degree diagonal gradient
        const dockStroke = ctx.createLinearGradient(rectX, rectY, rectX + rectW, rectY + rectH);
        dockStroke.addColorStop(0.0, 'rgba(255, 255, 255, 0.32)'); // Top-left highlight
        dockStroke.addColorStop(0.3, 'rgba(255, 255, 255, 0.08)'); // Sides
        dockStroke.addColorStop(0.7, 'rgba(255, 255, 255, 0.04)'); // Sides
        dockStroke.addColorStop(1.0, 'rgba(255, 255, 255, 0.22)'); // Bottom-right reflection
        
        ctx.strokeStyle = dockStroke;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, rectW, rectH, radius);
        ctx.stroke();
        
        ctx.restore();
      }

      // 8c. Draw sliding colorless liquid glass active selection pill (iOS 26 concentric glass style)
      const animX = pillXRef.current;
      const animY = pillYRef.current;
      const W = pillWidthRef.current;
      const H = activeHeightRef.current;

      if (animX !== null && animY !== null && W !== null && H > 0 && dockRectRef.current) {
        const rect = dockRectRef.current;
        ctx.save();
        
        // We update last positions to keep speed/angle tracking stable
        lastXRef.current = animX;
        lastYRef.current = animY;
        
        const gap = 4;
        const pillRadius = isMobile ? 8 : 12;
        const pillH = Math.round(rect.height - gap * 2);
        const pillY = Math.round(rect.top + gap);
        const pillW = Math.round(W - (isMobile ? 4 : 8)); // Reduced width to ensure padding from container edges
        const pillX = Math.round(animX - pillW / 2);

        // Draw ambient occlusion/shadow line under the active selection pill
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY + 1, pillW, pillH, pillRadius);
        ctx.stroke();
        ctx.restore();

        // Clip and render GPU-accelerated frosted glass backdrop blur
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, pillRadius);
        ctx.clip();
        
        if (offscreen && !isMobile) {
          ctx.filter = 'blur(16px)';
          ctx.drawImage(offscreen, 0, 0, w, h);
          ctx.filter = 'none';
        }
        ctx.restore();

        // Render neutral vertical linear gradient smoky glass fill overlay
        ctx.save();
        const fillGrad = ctx.createLinearGradient(pillX, pillY, pillX, pillY + pillH);
        fillGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.07)'); // top sheen
        fillGrad.addColorStop(1.0, 'rgba(10, 10, 15, 0.28)'); // smoky dark bottom
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, pillRadius);
        ctx.fill();
        ctx.restore();

        // Render subtle inner shadow for depth (cast dark from bottom-right, light from top-left)
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, pillRadius);
        ctx.clip();

        // Dark inner shadow along bottom-right edge
        // Offset path to the top-left by 2000px, and cast shadow back to the bottom-right
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2000 - 2;
        ctx.shadowOffsetY = 2000 - 2;
        ctx.strokeStyle = 'rgba(0, 0, 0, 1.0)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.roundRect(pillX - 2000, pillY - 2000, pillW, pillH, pillRadius);
        ctx.stroke();
        ctx.restore();

        // Soft white inner highlight along top-left edge
        // Offset path to the bottom-right by 2000px, and cast shadow back to the top-left
        ctx.save();
        ctx.shadowColor = 'rgba(255, 255, 255, 0.40)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = -2000 + 1.5;
        ctx.shadowOffsetY = -2000 + 1.5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 1.0)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(pillX + 2000, pillY + 2000, pillW, pillH, pillRadius);
        ctx.stroke();
        ctx.restore();

        ctx.restore();

        // Stroke vertical linear gradient outline simulating top-left to bottom-right diagonal bevel lighting
        ctx.save();
        const strokeGrad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY + pillH);
        strokeGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.90)'); // Top-left edge highlight (bright sunlight)
        strokeGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.20)'); // Upper-right/bottom-left translucent sides
        strokeGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.10)'); // Lower-right/top-left shadow sides
        strokeGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.55)'); // Bottom-right reflection
        
        ctx.strokeStyle = strokeGrad;
        ctx.lineWidth = isMobile ? 0.7 : 0.8; // Hairline 0.5-1px corner vector sharpness
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, pillRadius);
        ctx.stroke();
        ctx.restore();
        
        ctx.restore();
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
  }, [isMobile]);

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

  // Sync AudioContext state with audioEnabled prop
  useEffect(() => {
    if (audioEnabled) {
      if (!audioCtxRef.current) {
        initAudio();
      } else if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } else {
      if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
        audioCtxRef.current.suspend();
      }
    }
  }, [audioEnabled, isMobile]);

  // Handle pointer interactions
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // If clicking inside the style switcher dock boundaries, ignore entirely
    if (dockRectRef.current) {
      const dRect = dockRectRef.current;
      if (e.clientX >= dRect.left && e.clientX <= dRect.left + dRect.width &&
          e.clientY >= dRect.top && e.clientY <= dRect.top + dRect.height) {
        return;
      }
    }
    // If clicking inside the top menu bar boundaries, ignore entirely
    if (headerRectRef.current) {
      const hRect = headerRectRef.current;
      if (e.clientX >= hRect.left && e.clientX <= hRect.left + hRect.width &&
          e.clientY >= hRect.top && e.clientY <= hRect.top + hRect.height) {
        return;
      }
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    lastMouse.current = { x, y, active: true };
    triggerClickAt(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // If moving inside the style switcher dock boundaries, ignore entirely
    if (dockRectRef.current) {
      const dRect = dockRectRef.current;
      if (e.clientX >= dRect.left && e.clientX <= dRect.left + dRect.width &&
          e.clientY >= dRect.top && e.clientY <= dRect.top + dRect.height) {
        return;
      }
    }
    // If moving inside the top menu bar boundaries, ignore entirely
    if (headerRectRef.current) {
      const hRect = headerRectRef.current;
      if (e.clientX >= hRect.left && e.clientX <= hRect.left + hRect.width &&
          e.clientY >= hRect.top && e.clientY <= hRect.top + hRect.height) {
        return;
      }
    }

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
        const norm = isMobile ? (1.0 - y / rect.height) : (x / rect.width);
        playChime(norm, Math.min(1.0, dist * 0.08));
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
        height: '100dvh',
        display: 'block',
        touchAction: 'none',
        cursor: 'crosshair',
        zIndex: 1,
      }}
    />
  );
};
