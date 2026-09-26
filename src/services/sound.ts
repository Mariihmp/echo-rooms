/**
 * Procedural Web Audio Engine for Echo Rooms: The Whispering Weights
 * Features rich, clearly audible room soundscapes, ambient weather, retro sfx, and door unlocking clunks.
 */

export type RoomAudioType = 'hallway' | 'room_101' | 'room_204' | 'room_302' | 'room_405' | 'room_penthouse';

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private currentRoomAudio: RoomAudioType = 'hallway';

  // Audio nodes for room atmosphere
  private masterGain: GainNode | null = null;
  private roomGain: GainNode | null = null;
  private weatherGain: GainNode | null = null;

  // Active oscillators/sources
  private roomNodes: (AudioNode & { stop?: () => void })[] = [];
  private rainNoiseNode: AudioNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private musicBoxInterval: ReturnType<typeof setInterval> | null = null;
  private roomArpInterval: ReturnType<typeof setInterval> | null = null;

  // Haunted room whisper properties
  private currentViewMode: 'hallway' | 'room_explore' | 'puzzle' = 'hallway';
  private whisperTimeout: ReturnType<typeof setTimeout> | null = null;
  private whisperGain: GainNode | null = null;
  private activeWhisperNodes: (AudioNode & { stop?: () => void })[] = [];
  private whisperListeners: Set<(info: { variation: number; name: string }) => void> = new Set();

  public initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getCurrentRoomAudio(): RoomAudioType {
    return this.currentRoomAudio;
  }

  public getViewMode(): 'hallway' | 'room_explore' | 'puzzle' {
    return this.currentViewMode;
  }

  /**
   * Set active view mode. When set to 'room_explore', automatically triggers
   * randomized, low-volume 'whisper' sound effects periodically to make rooms feel haunted.
   */
  public setViewMode(mode: 'hallway' | 'room_explore' | 'puzzle') {
    this.currentViewMode = mode;
    if (mode === 'room_explore') {
      this.startHauntedWhispers();
    } else {
      this.stopHauntedWhispers();
    }
  }

  /**
   * Start periodic randomized whispers for room exploration
   */
  public startHauntedWhispers() {
    this.stopHauntedWhispers();
    if (this.currentViewMode !== 'room_explore') return;

    // Initial whisper triggers softly after 4 to 8 seconds of entering a room
    const initialDelay = 4000 + Math.random() * 4000;
    this.scheduleNextWhisper(initialDelay);
  }

  private scheduleNextWhisper(delayMs: number) {
    if (this.whisperTimeout) {
      clearTimeout(this.whisperTimeout);
      this.whisperTimeout = null;
    }

    this.whisperTimeout = setTimeout(() => {
      if (this.currentViewMode === 'room_explore' && !this.isMuted) {
        this.playWhisper();
      }

      // Schedule next random whisper after this one (between 10 and 22 seconds)
      if (this.currentViewMode === 'room_explore') {
        const nextDelay = 10000 + Math.random() * 12000;
        this.scheduleNextWhisper(nextDelay);
      }
    }, delayMs);
  }

  /**
   * Stop all pending and active whisper sounds immediately
   */
  public stopHauntedWhispers() {
    if (this.whisperTimeout) {
      clearTimeout(this.whisperTimeout);
      this.whisperTimeout = null;
    }
    this.stopActiveWhisperNodes();
  }

  private stopActiveWhisperNodes() {
    this.activeWhisperNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof node.stop === 'function') {
          node.stop();
        }
        node.disconnect();
      } catch {}
    });
    this.activeWhisperNodes = [];
  }

  /**
   * Register listener for whisper triggers (for optional UI subtitles / eerie sensory cues)
   */
  public onWhisper(callback: (info: { variation: number; name: string }) => void): () => void {
    this.whisperListeners.add(callback);
    return () => {
      this.whisperListeners.delete(callback);
    };
  }

  /**
   * Procedural haunted room whisper synthesis
   * Creates low-volume, filtered atmospheric breath/formant sweeps with spatial panning
   */
  public playWhisper(intensity = 1.0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      if (!this.masterGain) {
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, now);
        this.masterGain.connect(this.ctx.destination);
      }

      if (!this.whisperGain) {
        this.whisperGain = this.ctx.createGain();
        this.whisperGain.gain.setValueAtTime(1.0, now);
        this.whisperGain.connect(this.masterGain);
      }

      const sampleRate = this.ctx.sampleRate;
      const variation = Math.floor(Math.random() * 5);
      const whisperNames = [
        'Cold Corridor Sigh',
        'Sibilant Shadow Murmur',
        'Floorboard Hollow Breath',
        'Spectral Whispering Cadence',
        'Icy Draught Flutter'
      ];

      // Notify any listeners (e.g. ambient sensory effects)
      this.whisperListeners.forEach((fn) => {
        try {
          fn({ variation, name: whisperNames[variation] });
        } catch {}
      });

      // Generate soft pink/shaped noise buffer
      const duration = 2.0 + Math.random() * 1.0;
      const buffer = this.ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
      const output = buffer.getChannelData(0);
      let lastVal = 0.0;
      for (let i = 0; i < output.length; i++) {
        const white = Math.random() * 2 - 1;
        // Warm lowpass-shaped noise for unvoiced vocal breath turbulence
        lastVal = (lastVal + 0.14 * white) / 1.14;
        output[i] = lastVal * 3.2;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      // Resonant formant filters to mimic human vocal tract whispers
      const formant1 = this.ctx.createBiquadFilter();
      formant1.type = 'bandpass';
      formant1.Q.setValueAtTime(5.5, now);

      const formant2 = this.ctx.createBiquadFilter();
      formant2.type = 'bandpass';
      formant2.Q.setValueAtTime(6.0, now);

      // Dedicated envelope gain for low volume
      const envGain = this.ctx.createGain();
      const baseGain = (0.022 + Math.random() * 0.012) * intensity; // Delicate, low-volume, non-intrusive

      // Spatial stereo panner for eerie localized placement
      let pannerNode: StereoPannerNode | null = null;
      if (typeof this.ctx.createStereoPanner === 'function') {
        pannerNode = this.ctx.createStereoPanner();
        // Randomized placement: left to right (-0.7 to +0.7)
        const panValue = (Math.random() * 1.4) - 0.7;
        pannerNode.pan.setValueAtTime(panValue, now);
      }

      // Configure variation formants and envelope curves
      if (variation === 0) {
        // Cold Corridor Sigh: 780Hz sweeping down to 440Hz with smooth swell
        formant1.frequency.setValueAtTime(780, now);
        formant1.frequency.exponentialRampToValueAtTime(420, now + duration);

        formant2.frequency.setValueAtTime(1750, now);
        formant2.frequency.exponentialRampToValueAtTime(1100, now + duration);

        envGain.gain.setValueAtTime(0.0001, now);
        envGain.gain.linearRampToValueAtTime(baseGain, now + 0.6);
        envGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      } else if (variation === 1) {
        // Sibilant Shadow Murmur: 2 soft breath syllables ("sh... sal...")
        formant1.frequency.setValueAtTime(950, now);
        formant1.frequency.setValueAtTime(650, now + 0.8);

        formant2.frequency.setValueAtTime(2400, now);
        formant2.frequency.setValueAtTime(1800, now + 0.8);

        envGain.gain.setValueAtTime(0.0001, now);
        envGain.gain.linearRampToValueAtTime(baseGain * 0.85, now + 0.3);
        envGain.gain.linearRampToValueAtTime(baseGain * 0.2, now + 0.65);
        envGain.gain.linearRampToValueAtTime(baseGain, now + 0.95);
        envGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      } else if (variation === 2) {
        // Floorboard Hollow Breath: Low hollow resonance + soft sub-undertone
        formant1.frequency.setValueAtTime(520, now);
        formant1.frequency.exponentialRampToValueAtTime(320, now + duration);

        formant2.frequency.setValueAtTime(1300, now);
        formant2.frequency.exponentialRampToValueAtTime(800, now + duration);

        // Faint sub-vocal breath sine
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(72, now);
        subGain.gain.setValueAtTime(0.006 * intensity, now);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.9);
        subOsc.connect(subGain);
        if (pannerNode) {
          subGain.connect(pannerNode);
        } else if (this.whisperGain) {
          subGain.connect(this.whisperGain);
        }
        subOsc.start(now);
        subOsc.stop(now + duration);
        this.activeWhisperNodes.push(subOsc, subGain);

        envGain.gain.setValueAtTime(0.0001, now);
        envGain.gain.linearRampToValueAtTime(baseGain, now + 0.7);
        envGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      } else if (variation === 3) {
        // Spectral Whispering Cadence: 3 faint syllables
        formant1.frequency.setValueAtTime(820, now);
        formant1.frequency.linearRampToValueAtTime(1100, now + 0.7);
        formant1.frequency.linearRampToValueAtTime(700, now + duration);

        formant2.frequency.setValueAtTime(1900, now);
        formant2.frequency.linearRampToValueAtTime(2200, now + 0.7);
        formant2.frequency.linearRampToValueAtTime(1400, now + duration);

        envGain.gain.setValueAtTime(0.0001, now);
        envGain.gain.linearRampToValueAtTime(baseGain * 0.7, now + 0.25);
        envGain.gain.linearRampToValueAtTime(baseGain * 0.25, now + 0.5);
        envGain.gain.linearRampToValueAtTime(baseGain, now + 0.85);
        envGain.gain.linearRampToValueAtTime(baseGain * 0.3, now + 1.2);
        envGain.gain.linearRampToValueAtTime(baseGain * 0.8, now + 1.5);
        envGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      } else {
        // Icy Draught Flutter: Higher sibilance sweeping down
        formant1.frequency.setValueAtTime(1100, now);
        formant1.frequency.exponentialRampToValueAtTime(600, now + duration);

        formant2.frequency.setValueAtTime(2900, now);
        formant2.frequency.exponentialRampToValueAtTime(1600, now + duration);

        envGain.gain.setValueAtTime(0.0001, now);
        envGain.gain.linearRampToValueAtTime(baseGain * 0.9, now + 0.4);
        envGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      }

      // Connect nodes
      noiseSource.connect(formant1);
      noiseSource.connect(formant2);
      formant1.connect(envGain);
      formant2.connect(envGain);

      if (pannerNode && this.whisperGain) {
        envGain.connect(pannerNode);
        pannerNode.connect(this.whisperGain);
      } else if (this.whisperGain) {
        envGain.connect(this.whisperGain);
      }

      noiseSource.start(now);
      noiseSource.stop(now + duration);

      const registeredNodes: (AudioNode & { stop?: () => void })[] = [noiseSource, formant1, formant2, envGain];
      if (pannerNode) registeredNodes.push(pannerNode);
      this.activeWhisperNodes.push(...registeredNodes);

      // Clean up after playback ends
      setTimeout(() => {
        registeredNodes.forEach((node) => {
          try {
            node.disconnect();
          } catch {}
        });
        const registeredSet = new Set<AudioNode>(registeredNodes);
        this.activeWhisperNodes = this.activeWhisperNodes.filter((n) => !registeredSet.has(n));
      }, Math.ceil((duration + 0.2) * 1000));
    } catch {}
  }

  // Set and crossfade room soundscapes with rich, distinct, audible audio personalities
  public playRoomAudio(room: RoomAudioType) {
    this.initCtx();
    if (!this.ctx) return;
    this.currentRoomAudio = room;

    if (!this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (!this.roomGain) {
      this.roomGain = this.ctx.createGain();
      this.roomGain.gain.setValueAtTime(0.08, this.ctx.currentTime); // Soft, gentle, non-fatiguing ambient volume
      this.roomGain.connect(this.masterGain);
    } else {
      this.roomGain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, this.ctx.currentTime);
    }

    // Stop previous room sounds and timers
    this.stopCurrentRoomAudio();

    // Start background weather softly
    this.startAmbientWeather();

    const now = this.ctx.currentTime;

    try {
      if (room === 'hallway') {
        // Hallway: Very soft, warm, melancholic corridor drone with gentle beating
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(110, now); // A2
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(164.81, now); // E3 warm fifth

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(220, now);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(this.roomGain);

        osc1.start();
        osc2.start();
        this.roomNodes.push(osc1, osc2, filter);
      } else if (room === 'room_101') {
        // Room 101: Warm, deep, quiet basement pad - gentle and comforting
        const pad1 = this.ctx.createOscillator();
        const pad2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();

        pad1.type = 'sine';
        pad1.frequency.setValueAtTime(65.4, now); // C2 deep warm root
        pad2.type = 'sine';
        pad2.frequency.setValueAtTime(98.0, now); // G2 fifth

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, now);

        pad1.connect(filter);
        pad2.connect(filter);
        filter.connect(this.roomGain);

        pad1.start();
        pad2.start();
        this.roomNodes.push(pad1, pad2, filter);
      } else if (room === 'room_204') {
        // Room 204: cyberpunk rogue-AI den - a detuned synth drone whose filter slowly
        // breathes, a sparse neon arpeggio, and the odd digital chirp
        const saw1 = this.ctx.createOscillator();
        const saw2 = this.ctx.createOscillator();
        const sub = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const droneGain = this.ctx.createGain();
        const subGain = this.ctx.createGain();
        const lfo = this.ctx.createOscillator();
        const lfoDepth = this.ctx.createGain();

        saw1.type = 'sawtooth';
        saw1.frequency.setValueAtTime(65.41, now); // C2
        saw2.type = 'sawtooth';
        saw2.frequency.setValueAtTime(65.9, now); // slightly detuned for a wide, uneasy beat
        sub.type = 'sine';
        sub.frequency.setValueAtTime(32.7, now); // C1

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260, now);
        filter.Q.setValueAtTime(6, now);

        // Slow LFO sweeps the filter so the drone seems to breathe
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.07, now);
        lfoDepth.gain.setValueAtTime(160, now);
        lfo.connect(lfoDepth);
        lfoDepth.connect(filter.frequency);

        droneGain.gain.setValueAtTime(0.55, now);
        subGain.gain.setValueAtTime(0.5, now);

        saw1.connect(filter);
        saw2.connect(filter);
        filter.connect(droneGain);
        droneGain.connect(this.roomGain);
        sub.connect(subGain);
        subGain.connect(this.roomGain);

        saw1.start();
        saw2.start();
        sub.start();
        lfo.start();
        this.roomNodes.push(saw1, saw2, sub, lfo, lfoDepth, filter, droneGain, subGain);

        // C minor 7 arpeggio up and down, with random gaps and a soft echo
        const arpNotes = [261.63, 311.13, 392.0, 466.16, 523.25, 466.16, 392.0, 311.13];
        let step = 0;
        this.roomArpInterval = setInterval(() => {
          if (!this.ctx || this.isMuted || !this.roomGain) return;
          step++;
          if (Math.random() < 0.25) return;
          try {
            const t = this.ctx.currentTime;
            const freq = arpNotes[step % arpNotes.length];
            [
              { at: 0, level: 0.06 },
              { at: 0.28, level: 0.022 },
            ].forEach(({ at, level }) => {
              if (!this.ctx || !this.roomGain) return;
              const osc = this.ctx.createOscillator();
              const gain = this.ctx.createGain();
              osc.type = 'square';
              osc.frequency.setValueAtTime(freq, t + at);
              gain.gain.setValueAtTime(level, t + at);
              gain.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.25);
              osc.connect(gain);
              gain.connect(this.roomGain);
              osc.start(t + at);
              osc.stop(t + at + 0.26);
            });

            if (Math.random() < 0.06) {
              const chirp = this.ctx.createOscillator();
              const chirpGain = this.ctx.createGain();
              chirp.type = 'square';
              chirp.frequency.setValueAtTime(1800, t);
              chirp.frequency.exponentialRampToValueAtTime(200, t + 0.08);
              chirpGain.gain.setValueAtTime(0.03, t);
              chirpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
              chirp.connect(chirpGain);
              chirpGain.connect(this.roomGain);
              chirp.start(t);
              chirp.stop(t + 0.1);
            }
          } catch {}
        }, 320);
      } else if (room === 'room_302') {
        // Room 302: Soft, storytelling mystery ambient (NO DRILLING NOISE, NO HARSH SINE BUZZ)
        // Gentle D minor atmospheric chord: D3 (146.8Hz) + A3 (220Hz) + F3 (174.6Hz)
        const noteD = this.ctx.createOscillator();
        const noteA = this.ctx.createOscillator();
        const noteF = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();

        noteD.type = 'sine';
        noteD.frequency.setValueAtTime(146.83, now); // D3
        noteA.type = 'sine';
        noteA.frequency.setValueAtTime(220.0, now);  // A3
        noteF.type = 'sine';
        noteF.frequency.setValueAtTime(174.61, now); // F3

        // Lowpass filter to ensure buttery soft texture
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, now);

        noteD.connect(filter);
        noteA.connect(filter);
        noteF.connect(filter);
        filter.connect(this.roomGain);

        noteD.start();
        noteA.start();
        noteF.start();
        this.roomNodes.push(noteD, noteA, noteF, filter);
      } else if (room === 'room_405') {
        // Room 405: Storytelling icy resonance - calm, hollow, and peaceful
        const calmPad1 = this.ctx.createOscillator();
        const calmPad2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();

        calmPad1.type = 'sine';
        calmPad1.frequency.setValueAtTime(82.41, now); // E2
        calmPad2.type = 'sine';
        calmPad2.frequency.setValueAtTime(123.47, now); // B2

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);

        calmPad1.connect(filter);
        calmPad2.connect(filter);
        filter.connect(this.roomGain);

        calmPad1.start();
        calmPad2.start();
        this.roomNodes.push(calmPad1, calmPad2, filter);
      } else if (room === 'room_penthouse') {
        // Penthouse: Atmospheric storytelling cathedral chords - peaceful resolution
        const chord1 = this.ctx.createOscillator();
        const chord2 = this.ctx.createOscillator();
        const chord3 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();

        chord1.type = 'sine';
        chord1.frequency.setValueAtTime(174.61, now); // F3
        chord2.type = 'sine';
        chord2.frequency.setValueAtTime(220.0, now);  // A3
        chord3.type = 'sine';
        chord3.frequency.setValueAtTime(261.63, now); // C4

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(360, now);

        chord1.connect(filter);
        chord2.connect(filter);
        chord3.connect(filter);
        filter.connect(this.roomGain);

        chord1.start();
        chord2.start();
        chord3.start();
        this.roomNodes.push(chord1, chord2, chord3, filter);
      }
    } catch {}
  }

  private stopCurrentRoomAudio() {
    if (this.musicBoxInterval) {
      clearInterval(this.musicBoxInterval);
      this.musicBoxInterval = null;
    }
    if (this.roomArpInterval) {
      clearInterval(this.roomArpInterval);
      this.roomArpInterval = null;
    }

    this.roomNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof node.stop === 'function') {
          node.stop();
        }
        node.disconnect();
      } catch {}
    });
    this.roomNodes = [];
  }

  // Rain weather procedural sound
  public startAmbientWeather() {
    if (this.rainNoiseNode || !this.ctx) return;

    try {
      if (!this.masterGain) {
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }

      this.weatherGain = this.ctx.createGain();
      this.weatherGain.gain.setValueAtTime(0.045, this.ctx.currentTime);
      this.weatherGain.connect(this.masterGain);

      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      this.rainFilter = this.ctx.createBiquadFilter();
      this.rainFilter.type = 'lowpass';
      this.rainFilter.frequency.setValueAtTime(1100, this.ctx.currentTime);

      whiteNoise.connect(this.rainFilter);
      this.rainFilter.connect(this.weatherGain);
      whiteNoise.start();

      this.rainNoiseNode = whiteNoise;
    } catch {}
  }

  // Thunder rumble for storm ambience
  public playThunder() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(45, now);
      osc.frequency.exponentialRampToValueAtTime(18, now + 2.5);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(95, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 3.0);
    } catch {}
  }

  // Heavy metal bolt unlock and echo for solving a room
  public playHeavyDoorUnlock() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Heavy metal clank (unlatching deadbolt)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(150, now);
      osc1.frequency.exponentialRampToValueAtTime(35, now + 0.22);
      gain1.gain.setValueAtTime(0.28, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // 2. Heavy gear tumbler click at +0.15s
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(260, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(50, now + 0.38);
      gain2.gain.setValueAtTime(0.25, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);

      // 3. Deep resonant door swing echo at +0.35s
      const osc3 = this.ctx.createOscillator();
      const gain3 = this.ctx.createGain();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(110, now + 0.35);
      osc3.frequency.linearRampToValueAtTime(45, now + 1.2);
      gain3.gain.setValueAtTime(0.22, now + 0.35);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
      osc3.connect(gain3);
      gain3.connect(this.ctx.destination);
      osc3.start(now + 0.35);
      osc3.stop(now + 1.4);
    } catch {}
  }

  // Dark gothic episodic harp chime
  public playEpistleChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [220, 261.63, 329.63, 440, 523.25, 659.25]; // A minor arpeggio
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 1.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 1.5);
      });
    } catch {}
  }

  // Radio squelch / walkie static
  public playWalkieSquelch() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1200, now + 0.03);
      osc.frequency.setValueAtTime(450, now + 0.06);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch {}
  }

  public playGlitch() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.setValueAtTime(80, now + 0.04);
      osc.frequency.setValueAtTime(210, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch {}
  }

  // Quiet stuttering data glitch, for a surveillance feed dropping out
  public playDataGlitch() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [0, 0.06, 0.13].forEach((offset, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime([1400, 380, 2100][i], now + offset);
        gain.gain.setValueAtTime(0.035, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.045);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.05);
      });
    } catch {}
  }

  public playGearBoyBeep(freq = 440, duration = 0.08) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch {}
  }

  public playDoorOpen() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Heavy creak
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.3);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  public playSuccessFanfare() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [261.63, 329.63, 392.0, 523.25]; // C major
      const now = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.08, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.4);
      });
    } catch {}
  }
}

export const sound = new SoundManager();
