class SynthesisEngine {
    constructor() {
        this.overlay = document.getElementById('synthesis-overlay');
        this.docCont = document.getElementById('synthesis-doc');
        this.particlesCont = document.getElementById('synthesis-particles');
        this.title = document.getElementById('synthesis-title-display');
        this.timeline = null;
    }

    trigger(filename) {
        if (!this.overlay) return;
        
        // Setup
        this.title.innerText = filename;
        this.docCont.style.opacity = '0';
        this.docCont.style.transform = 'rotateX(45deg) rotateY(-20deg) translateZ(-200px)';
        this.particlesCont.innerHTML = '';
        
        // Update HUD
        const hudStat = document.getElementById('hud-synth-status');
        if (hudStat) hudStat.innerText = `Synthesizing ${filename}...`;

        // Create Particles Data Streams
        for(let i=0; i<40; i++) {
            const p = document.createElement('div');
            p.className = 'synth-particle';
            p.style.left = (Math.random() > 0.5 ? -100 : window.innerWidth + 100) + 'px';
            p.style.top = (Math.random() * window.innerHeight) + 'px';
            this.particlesCont.appendChild(p);
        }

        // Play sequence
        if (this.timeline) this.timeline.kill();
        this.timeline = gsap.timeline({
            onComplete: () => {
                if (hudStat) hudStat.innerText = 'Idle';
                setTimeout(() => this.hide(), 3000);
            }
        });

        // 1. Fade in overlay (backdrop blur is extreme)
        this.timeline.to(this.overlay, { opacity: 1, pointerEvents: 'auto', duration: 0.5 })
        
        // 2. Converge streams
        .to('.synth-particle', {
            x: () => window.innerWidth/2 - (Math.random()>0.5 ? -100: 100) + (Math.random() * 200 - 100),
            y: () => window.innerHeight/2 + (Math.random() * 200 - 100),
            duration: 1.2,
            stagger: 0.01,
            ease: 'expo.in'
        }, 0.2)
        .to('.synth-particle', { autoAlpha: 0, duration: 0.2 }, 1.4)
        
        // 3. Assemble document container CSS3D
        .to(this.docCont, { 
            opacity: 1,
            rotationX: 0, 
            rotationY: 0, 
            z: 0, 
            duration: 1.5, 
            ease: 'power3.out' 
        }, 1.0)
        
        // 4. Stagger document lines
        .fromTo('.doc-line', 
            { scaleX: 0, opacity: 0, transformOrigin: "left center" },
            { scaleX: 1, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power2.out' },
            1.5
        )
        
        // 5. Stamp "VERIFIED"
        .fromTo('#doc-stamp', 
            { opacity: 0, scale: 3, rotation: -20 },
            { opacity: 1, scale: 1, rotation: 0, duration: 0.4, ease: 'back.out(2)' },
            2.5
        );
    }

    hide() {
        gsap.to(this.overlay, { opacity: 0, pointerEvents: 'none', duration: 0.8 });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.synthesisEngine = new SynthesisEngine();
    window.triggerSynthesis = (filename) => {
        if(window.synthesisEngine) window.synthesisEngine.trigger(filename);
    }
});
