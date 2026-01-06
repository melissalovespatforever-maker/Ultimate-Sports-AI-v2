// ============================================
// CONFETTI ANIMATION SYSTEM
// Celebratory confetti effect for winners
// ============================================

console.log('🎉 Loading Confetti System');

const ConfettiEffect = {
    canvas: null,
    ctx: null,
    particles: [],
    animationId: null,
    isRunning: false,

    // Initialize confetti canvas
    init() {
        // Create canvas if doesn't exist
        let canvas = document.getElementById('confetti-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'confetti-canvas';
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '9999';
            document.body.appendChild(canvas);
        }
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resizeCanvas();
        
        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    },

    // Resize canvas to window size
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    // Create confetti particles
    createConfetti(count = 100) {
        const colors = ['#FF6B6B', '#FFC93C', '#6BCB77', '#4D96FF', '#FF8C42', '#A78BFA', '#F472B6', '#14B8A6'];
        const shapes = ['circle', 'square', 'triangle', 'rectangle'];

        for (let i = 0; i < count; i++) {
            const particle = {
                x: Math.random() * this.canvas.width,
                y: -10,
                vx: (Math.random() - 0.5) * 8,
                vy: Math.random() * 5 + 4,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                color: colors[Math.floor(Math.random() * colors.length)],
                shape: shapes[Math.floor(Math.random() * shapes.length)],
                size: Math.random() * 8 + 4,
                life: 1,
                decay: Math.random() * 0.01 + 0.005
            };
            this.particles.push(particle);
        }
    },

    // Draw particle
    drawParticle(particle) {
        this.ctx.save();
        this.ctx.globalAlpha = particle.life;
        this.ctx.fillStyle = particle.color;
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.rotation);

        switch (particle.shape) {
            case 'circle':
                this.ctx.beginPath();
                this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
                break;
            case 'square':
                this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
                break;
            case 'triangle':
                this.ctx.beginPath();
                this.ctx.moveTo(0, -particle.size);
                this.ctx.lineTo(particle.size, particle.size);
                this.ctx.lineTo(-particle.size, particle.size);
                this.ctx.closePath();
                this.ctx.fill();
                break;
            case 'rectangle':
                this.ctx.fillRect(-particle.size, -particle.size / 2, particle.size * 2, particle.size);
                break;
        }

        this.ctx.restore();
    },

    // Update particle positions
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Update position
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;

            // Apply gravity
            p.vy += 0.1;

            // Fade out
            p.life -= p.decay;

            // Remove dead particles
            if (p.life <= 0 || p.y > this.canvas.height) {
                this.particles.splice(i, 1);
            }
        }
    },

    // Animation loop
    animate() {
        if (this.particles.length === 0) {
            this.isRunning = false;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }

        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw particles
        this.updateParticles();
        this.particles.forEach(p => this.drawParticle(p));

        // Continue animation
        this.animationId = requestAnimationFrame(() => this.animate());
    },

    // Start confetti animation
    start(count = 100, duration = 3000) {
        if (!this.canvas) {
            this.init();
        }

        this.particles = [];
        this.isRunning = true;

        // Create initial burst
        this.createConfetti(count);

        // Add waves of confetti
        const waveInterval = setInterval(() => {
            if (this.particles.length < count / 2) {
                this.createConfetti(Math.floor(count * 0.3));
            } else {
                clearInterval(waveInterval);
            }
        }, 100);

        // Start animation
        this.animate();

        // Auto-stop after duration
        setTimeout(() => {
            this.isRunning = false;
        }, duration);
    },

    // Enhanced celebration confetti - more particles, longer duration
    celebration(count = 150) {
        this.start(count, 4000);
    },

    // Victory confetti - lots of particles!
    victory(count = 200) {
        this.start(count, 5000);
    },

    // Stop confetti
    stop() {
        this.isRunning = false;
        this.particles = [];
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ConfettiEffect.init();
    });
} else {
    ConfettiEffect.init();
}

// Export for global access
window.ConfettiEffect = ConfettiEffect;

console.log('✅ Confetti System Loaded');
