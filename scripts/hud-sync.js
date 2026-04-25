// hud-sync.js
function initHUD() {
    const hudEl = document.getElementById('system-hud');
    const cpuEl = document.getElementById('hud-cpu');
    const memEl = document.getElementById('hud-mem');
    const dotEl = document.querySelector('.hud-status-dot');
    
    if (!hudEl || !cpuEl || !memEl || !dotEl) return;

    if (window.gsap) {
        gsap.to(hudEl, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', delay: 0.5 });

        const amb1 = document.querySelector('.amb-1');
        const amb2 = document.querySelector('.amb-2');
        const amb3 = document.querySelector('.amb-3');

        document.addEventListener('mousemove', (e) => {
            const moveX = (e.clientX - window.innerWidth / 2) / 20;
            const moveY = (e.clientY - window.innerHeight / 2) / 20;

            gsap.to([amb1, amb2, amb3], {
                x: `+=${moveX}`, y: `+=${moveY}`, duration: 1.5, ease: 'power2.out', overwrite: 'auto'
            });
        });
    } else {
        hudEl.style.opacity = '1';
        hudEl.style.transform = 'translateY(0)';
    }

    let cpuSpikeActive = false;

    // Normal CPU fluctuation
    setInterval(() => {
        if (!cpuSpikeActive) {
            const cpu = (Math.random() * 8 + 3).toFixed(1); // 3-11%
            cpuEl.textContent = `${cpu}%`;
            cpuEl.style.color = 'var(--black)';
        }
    }, 2000);

    // Occasional subtle memory pulse
    setInterval(() => {
        if(Math.random() > 0.7) {
            memEl.style.color = 'var(--gray-lt)';
            setTimeout(() => { memEl.style.color = 'var(--black)'; }, 300);
        }
    }, 3000);

    // Status Dot Pulse
    if (window.gsap) {
        gsap.to(dotEl, { opacity: 0.4, scale: 0.85, duration: 1.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    }

    // Expose spike trigger
    window.triggerCpuSpike = function() {
        cpuSpikeActive = true;
        const spikeVal = (Math.random() * 19 + 80).toFixed(1);
        cpuEl.textContent = `${spikeVal}%`;
        cpuEl.style.color = '#ff3b30'; 
        
        let iterations = 0;
        const surgeInterval = setInterval(() => {
            iterations++;
            cpuEl.textContent = `${(Math.random() * 10 + 85).toFixed(1)}%`;
            if (iterations > 6) {
                clearInterval(surgeInterval);
                cpuSpikeActive = false;
                cpuEl.style.color = 'var(--black)';
            }
        }, 500);
    };

    // Expose Artifact Trigger
    window.addArtifact = function(fileName, downloadPath) {
        const deliverablesEl = document.getElementById('hud-deliverables');
        const emptyState = document.getElementById('hud-no-artifacts');
        
        if (emptyState) emptyState.style.display = 'none';

        const a = document.createElement('a');
        a.href = '#'; 
        a.title = downloadPath;
        a.style.display = 'flex';
        a.style.alignItems = 'center';
        a.style.gap = '6px';
        a.style.textDecoration = 'none';
        a.style.fontSize = '0.75rem';
        a.style.color = 'var(--black)';
        a.style.background = 'rgba(255,255,255,0.6)';
        a.style.padding = '4px 8px';
        a.style.borderRadius = '6px';
        
        a.innerHTML = `<span style="font-size:1rem; line-height:1;">📄</span><span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${fileName}</span>`;
        
        deliverablesEl.prepend(a);
        if(deliverablesEl.children.length > 5) deliverablesEl.removeChild(deliverablesEl.lastChild);
        if (window.gsap) gsap.fromTo(a, { opacity: 0, scale: 0.9, y: 5 }, { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.5)' });
    };

    // Vector Memory Sync
    const vectorEl = document.getElementById('hud-vector');
    setInterval(async () => {
        if (!vectorEl) return;
        try {
            const res = await fetch('http://localhost:8787/stats');
            const data = await res.json();
            vectorEl.textContent = `${data.total_vectors || 0}`;
        } catch(e) { }
    }, 5000);

    // Neural Connect (Background Flash)
    window.triggerNeuralSync = function() {
        if (!window.gsap) return;
        const amb1 = document.querySelector('.amb-1');
        const amb2 = document.querySelector('.amb-2');
        gsap.to([amb1, amb2], {
            scale: 1.3,
            opacity: 0.8,
            duration: 0.5,
            yoyo: true,
            repeat: 3,
            ease: 'sine.inOut'
        });
    };
}

document.addEventListener('DOMContentLoaded', initHUD);
