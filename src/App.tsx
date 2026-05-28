import { useState, useEffect, useRef } from 'react';
import { FluidSandbox } from './components/FluidSandbox';
import { Sparkles, Activity, Volume2, VolumeX, Play, Pause, Music } from 'lucide-react';
import './App.css';

const SONG_NAMES = ["DIHUA MARSH", "ENTELECHY"];

function App() {
  const [mode, setMode] = useState<'cosmic' | 'biolume' | 'hanabi' | 'sands'>('cosmic');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isPlayingMelody, setIsPlayingMelody] = useState(false);
  const [songIndex, setSongIndex] = useState(0);

  const scopeCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Sync global CSS variables with current active mode accents
  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'cosmic') {
      root.style.setProperty('--accent-active', 'var(--accent-cosmic)');
      root.style.setProperty('--accent-glow', 'rgba(139, 92, 246, 0.25)');
    } else if (mode === 'hanabi') {
      root.style.setProperty('--accent-active', '#ff453a'); // Cherry-red firework accent
      root.style.setProperty('--accent-glow', 'rgba(255, 69, 58, 0.25)');
    } else if (mode === 'sands') {
      root.style.setProperty('--accent-active', '#06b6d4'); // Ice blue/cyan blizzard accent
      root.style.setProperty('--accent-glow', 'rgba(6, 182, 212, 0.25)');
    } else {
      root.style.setProperty('--accent-active', 'var(--accent-biolume)');
      root.style.setProperty('--accent-glow', 'rgba(16, 185, 129, 0.25)');
    }
  }, [mode]);

  // Real-time Oscilloscope draw loop
  useEffect(() => {
    const scopeCanvas = scopeCanvasRef.current;
    if (!scopeCanvas || !analyser) return;

    const ctx = scopeCanvas.getContext('2d');
    if (!ctx) return;

    scopeCanvas.width = 160;
    scopeCanvas.height = 40;

    const drawScope = () => {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, scopeCanvas.width, scopeCanvas.height);
      ctx.lineWidth = 1.8;
      
      // Read dynamic accent color
      const activeColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-active').trim();
      ctx.strokeStyle = activeColor || '#8b5cf6';
      
      // Glow filter on scope
      ctx.shadowBlur = 4;
      ctx.shadowColor = ctx.strokeStyle;

      ctx.beginPath();
      const sliceWidth = scopeCanvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * scopeCanvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(scopeCanvas.width, scopeCanvas.height / 2);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      animationRef.current = requestAnimationFrame(drawScope);
    };

    drawScope();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [analyser, mode]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        background: '#030303',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 1. Full-Screen Interactive Fluid Physics Layer */}
      <FluidSandbox
        mode={mode}
        audioEnabled={audioEnabled}
        onAudioStateChange={setAudioEnabled}
        onSetAnalyser={setAnalyser}
        isPlayingMelody={isPlayingMelody}
        songIndex={songIndex}
      />

      {/* 2. Top Header HUD */}
      <header
        className="hud-card"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          width: 'calc(100vw - 40px)',
          height: '60px',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          pointerEvents: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: 'var(--accent-active)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px var(--accent-glow)',
              transition: 'all 0.3s',
            }}
          >
            <Sparkles size={12} style={{ color: '#fff' }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: '14px',
                fontWeight: 900,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              AETHERA
              <span style={{ fontSize: '9px', fontWeight: 500, color: 'var(--text-secondary)', opacity: 0.6 }}>
                // KINETIC SOUND & LIGHT
              </span>
            </h1>
          </div>
        </div>

        {/* Dynamic audio node indicator & Autoplay controller */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className={`hud-btn ${isPlayingMelody ? 'active' : ''}`}
            onClick={() => {
              setAudioEnabled(true);
              setIsPlayingMelody(!isPlayingMelody);
            }}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              height: '32px',
              padding: '0 14px',
            }}
          >
            {isPlayingMelody ? (
              <Pause size={10} fill="currentColor" />
            ) : (
              <Play size={10} fill="currentColor" />
            )}
            <Music size={10} />
            <span>{isPlayingMelody ? `PLAYING ${SONG_NAMES[songIndex]}` : 'AUTOPLAY MELODY'}</span>
          </button>

          {isPlayingMelody && (
            <button
              type="button"
              className="hud-btn"
              onClick={() => {
                setSongIndex((prev) => (prev + 1) % SONG_NAMES.length);
              }}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                height: '32px',
                padding: '0 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <span>NEXT SONG &gt;</span>
            </button>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '10px',
              padding: '6px 12px',
              fontSize: '10px',
              fontWeight: 700,
              color: audioEnabled ? '#fff' : 'var(--text-secondary)',
              height: '32px',
            }}
          >
            {audioEnabled ? <Volume2 size={12} style={{ color: 'var(--accent-active)' }} /> : <VolumeX size={12} />}
            <span>{audioEnabled ? 'SYNTH ACTIVE' : 'TAP TO UNLOCK CHIMES'}</span>
            <span className="glow-indicator" />
          </div>
        </div>
      </header>

      {/* 3. Bottom HUD controls */}
      <footer
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          width: 'calc(100vw - 40px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        {/* Left Side: Sandbox Guidelines */}
        <div
          className="hud-card"
          style={{
            padding: '16px 20px',
            width: '280px',
            fontSize: '11px',
            lineHeight: '1.5',
            color: 'var(--text-secondary)',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ fontWeight: 700, color: '#fff', marginBottom: '6px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            INSTRUCTION
          </div>
          <p style={{ opacity: 0.85 }}>
            • <strong style={{ color: 'var(--accent-active)' }}>Drag cursor</strong> to draw glowing liquid currents.
          </p>
          <p style={{ opacity: 0.85, marginTop: '2px' }}>
            • <strong style={{ color: 'var(--accent-active)' }}>Click</strong> to emit harmonic chime frequencies.
          </p>
        </div>

        {/* Center: Style Switcher Dock */}
        <div
          className="hud-card"
          style={{
            padding: '8px',
            display: 'flex',
            gap: '6px',
            pointerEvents: 'auto',
          }}
        >
          <button
            type="button"
            className={`hud-btn ${mode === 'cosmic' ? 'active' : ''}`}
            onClick={() => setMode('cosmic')}
          >
            Cosmic Dust
          </button>
          <button
            type="button"
            className={`hud-btn ${mode === 'biolume' ? 'active' : ''}`}
            onClick={() => setMode('biolume')}
          >
            Biolume Trails
          </button>
          <button
            type="button"
            className={`hud-btn ${mode === 'hanabi' ? 'active' : ''}`}
            onClick={() => setMode('hanabi')}
          >
            Hanabi Theme
          </button>
          <button
            type="button"
            className={`hud-btn ${mode === 'sands' ? 'active' : ''}`}
            onClick={() => setMode('sands')}
          >
            Flowing Sands
          </button>
        </div>

        {/* Right Side: Oscilloscope Waveform Panel */}
        <div
          className="hud-card"
          style={{
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'flex-start',
            pointerEvents: 'auto',
            width: '192px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff' }}>
            <Activity size={10} style={{ color: 'var(--accent-active)' }} />
            <span>Synth Oscilloscope</span>
          </div>

          <div
            style={{
              width: '160px',
              height: '40px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {analyser ? (
              <canvas ref={scopeCanvasRef} style={{ width: '100%', height: '100%' }} />
            ) : (
              <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>AUDIO STANDBY</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
