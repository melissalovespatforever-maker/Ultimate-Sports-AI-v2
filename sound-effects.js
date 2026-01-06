// ============================================
// SOUND EFFECTS SYSTEM
// Audio feedback for celebrations and events
// ============================================

console.log('🔊 Loading Sound Effects System');

const SoundEffects = {
    audioContext: null,
    masterVolume: 0.5,
    isMuted: false,

    // Initialize audio context
    init() {
        // Get mute preference from localStorage
        this.isMuted = localStorage.getItem('soundMuted') === 'true';
        this.masterVolume = parseFloat(localStorage.getItem('soundVolume') || '0.5');
        
        console.log(`🔊 Sound Effects initialized (Volume: ${Math.round(this.masterVolume * 100)}%, Muted: ${this.isMuted})`);
    },

    // Set master volume (0-1)
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('soundVolume', this.masterVolume.toString());
    },

    // Toggle mute
    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('soundMuted', this.isMuted.toString());
        return this.isMuted;
    },

    // Create audio context if needed
    getAudioContext() {
        if (!this.audioContext) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.audioContext = audioContext;
            } catch (e) {
                console.warn('⚠️ Web Audio API not supported');
                return null;
            }
        }
        return this.audioContext;
    },

    // Create oscillator tone
    playTone(frequency, duration, type = 'sine', volume = 1) {
        if (this.isMuted) return;

        const ctx = this.getAudioContext();
        if (!ctx) return;

        try {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = type;
            oscillator.frequency.value = frequency;

            gainNode.gain.setValueAtTime(volume * this.masterVolume, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + duration);
        } catch (e) {
            console.warn('⚠️ Error playing tone:', e);
        }
    },

    // Victory fanfare (ascending notes)
    playVictoryFanfare() {
        if (this.isMuted) return;

        const ctx = this.getAudioContext();
        if (!ctx) return;

        const notes = [
            { freq: 523.25, duration: 0.1 },  // C5
            { freq: 659.25, duration: 0.1 },  // E5
            { freq: 783.99, duration: 0.1 },  // G5
            { freq: 1046.50, duration: 0.3 }  // C6 - hold longer
        ];

        let currentTime = ctx.currentTime;

        notes.forEach(note => {
            try {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = 'sine';
                osc.frequency.value = note.freq;

                gain.gain.setValueAtTime(0.3 * this.masterVolume, currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration);

                osc.start(currentTime);
                osc.stop(currentTime + note.duration);

                currentTime += note.duration;
            } catch (e) {
                console.warn('⚠️ Error in fanfare:', e);
            }
        });
    },

    // Celebration chime (higher pitched notes)
    playCelebrationChime() {
        if (this.isMuted) return;

        const ctx = this.getAudioContext();
        if (!ctx) return;

        const notes = [
            { freq: 800, duration: 0.15 },
            { freq: 1000, duration: 0.15 },
            { freq: 1200, duration: 0.3 }
        ];

        let currentTime = ctx.currentTime;

        notes.forEach(note => {
            try {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = 'sine';
                osc.frequency.value = note.freq;

                gain.gain.setValueAtTime(0.25 * this.masterVolume, currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration);

                osc.start(currentTime);
                osc.stop(currentTime + note.duration);

                currentTime += note.duration;
            } catch (e) {
                console.warn('⚠️ Error in chime:', e);
            }
        });
    },

    // Trumpet-like victory sound
    playTrumpetVictory() {
        if (this.isMuted) return;

        const ctx = this.getAudioContext();
        if (!ctx) return;

        const notes = [
            { freq: 440, duration: 0.15 },   // A4
            { freq: 493.88, duration: 0.15 }, // B4
            { freq: 587.33, duration: 0.15 }, // D5
            { freq: 659.25, duration: 0.15 }, // E5
            { freq: 783.99, duration: 0.4 }   // G5 - hold
        ];

        let currentTime = ctx.currentTime;

        notes.forEach(note => {
            try {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = 'sine';
                osc.frequency.value = note.freq;

                gain.gain.setValueAtTime(0.3 * this.masterVolume, currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration);

                osc.start(currentTime);
                osc.stop(currentTime + note.duration);

                currentTime += note.duration;
            } catch (e) {
                console.warn('⚠️ Error in trumpet victory:', e);
            }
        });
    },

    // Pop sound effect
    playPop() {
        if (this.isMuted) return;

        const ctx = this.getAudioContext();
        if (!ctx) return;

        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.3 * this.masterVolume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) {
            console.warn('⚠️ Error playing pop:', e);
        }
    },

    // Success ping
    playSuccessPing() {
        if (this.isMuted) return;

        const ctx = this.getAudioContext();
        if (!ctx) return;

        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.value = 1200;

            gain.gain.setValueAtTime(0.2 * this.masterVolume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.2);
        } catch (e) {
            console.warn('⚠️ Error playing ping:', e);
        }
    },

    // Coin sound
    playCoinSound() {
        if (this.isMuted) return;

        const ctx = this.getAudioContext();
        if (!ctx) return;

        const notes = [
            { freq: 800, duration: 0.1 },
            { freq: 1200, duration: 0.1 }
        ];

        let currentTime = ctx.currentTime;

        notes.forEach(note => {
            try {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = 'sine';
                osc.frequency.value = note.freq;

                gain.gain.setValueAtTime(0.2 * this.masterVolume, currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration);

                osc.start(currentTime);
                osc.stop(currentTime + note.duration);

                currentTime += note.duration;
            } catch (e) {
                console.warn('⚠️ Error in coin sound:', e);
            }
        });
    },

    // Announcement/level up sound
    playLevelUp() {
        if (this.isMuted) return;

        const ctx = this.getAudioContext();
        if (!ctx) return;

        const notes = [
            { freq: 523.25, duration: 0.12 },  // C5
            { freq: 659.25, duration: 0.12 },  // E5
            { freq: 783.99, duration: 0.12 },  // G5
            { freq: 1046.50, duration: 0.4 }   // C6
        ];

        let currentTime = ctx.currentTime;

        notes.forEach(note => {
            try {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = 'sine';
                osc.frequency.value = note.freq;

                gain.gain.setValueAtTime(0.25 * this.masterVolume, currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration);

                osc.start(currentTime);
                osc.stop(currentTime + note.duration);

                currentTime += note.duration;
            } catch (e) {
                console.warn('⚠️ Error in level up:', e);
            }
        });
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        SoundEffects.init();
    });
} else {
    SoundEffects.init();
}

// Export for global access
window.SoundEffects = SoundEffects;

console.log('✅ Sound Effects System Loaded');
