const StitchMiddleware = {
    state: new Map(),
    pollInterval: 1000,
    timeout: null,
    errors: 0
};

async function fetchMemory() {
    try {
        const res = await fetch('http://localhost:8787');
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('Invalid Schema');

        StitchMiddleware.errors = 0;
        processData(data);
        
        StitchMiddleware.timeout = setTimeout(fetchMemory, StitchMiddleware.pollInterval);
    } catch (err) {
        StitchMiddleware.errors++;
        const backoff = Math.min(StitchMiddleware.pollInterval * Math.pow(2, StitchMiddleware.errors), 30000);
        StitchMiddleware.timeout = setTimeout(fetchMemory, backoff);
    }
}

function getStatusColor(status) {
    if (status === 'thinking') return '#ffcc00'; // Yellow
    if (status === 'executing') return '#007aff'; // Blue
    if (status === 'success' || status === 'completed') return '#30d158'; // Green
    if (status === 'error') return '#ff3b30'; // Red
    return 'var(--gray-lt)';
}

function processData(newData) {
    const feed = document.getElementById('live-activity-feed');
    if (!feed) return;
    
    let hasChanges = false;
    const elementsToAnimateIn = [];
    const elementsToUpdate = [];
    const elementsToPulse = [];

    newData.forEach(item => {
        const existing = StitchMiddleware.state.get(item.id);
        
        if (!existing) {
            StitchMiddleware.state.set(item.id, { ...item });
            hasChanges = true;
            
            const div = document.createElement('div');
            div.className = 'crystal-1'; 
            div.setAttribute('data-id', item.id);
            div.id = `activity-item-${item.id}`;
            
            const bulletColor = getStatusColor(item.status);
            
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:6px;height:6px;border-radius:50%;background:${bulletColor};"></div>
                    <strong style="color:var(--gray); font-variant-numeric:tabular-nums; font-size:0.75rem;">[${item.time}]</strong>
                    <span style="font-size:0.7rem; padding:2px 6px; border-radius:4px; background:rgba(0,0,0,0.05); color:var(--gray-lt); font-weight:700;">${item.agent}</span>
                </div>
                <div style="margin-top:6px; padding-left:14px;">${item.task}</div>
            `;
            
            div.style.padding = '12px 18px';
            div.style.borderRadius = '16px';
            div.style.fontSize = '0.85rem';
            div.style.fontWeight = '500';
            div.style.marginBottom = '8px';
            div.style.opacity = '0';
            div.style.border = '1px solid rgba(255,255,255,0.7)';
            div.dataset.status = item.status;
            
            feed.prepend(div);
            elementsToAnimateIn.push(div);
            
            if (item.status === 'executing') {
                elementsToPulse.push(div);
                if (window.triggerCpuSpike) window.triggerCpuSpike();
            }
        } else if (existing.status !== item.status) {
            StitchMiddleware.state.set(item.id, { ...item });
            hasChanges = true;
            
            const el = document.getElementById(`activity-item-${item.id}`);
            if (el) {
                el.dataset.status = item.status;
                const bulletColor = getStatusColor(item.status);
                const bullet = el.querySelector('div > div:first-child');
                if(bullet) bullet.style.background = bulletColor;
                
                elementsToUpdate.push({ el, status: item.status });
                
                if (item.status === 'executing') {
                    elementsToPulse.push(el);
                    if (window.triggerCpuSpike) window.triggerCpuSpike();
                }

                if (item.status === 'success' || item.status === 'completed') {
                    // 1. Cognitive Graph Expansion Trigger
                    if (window.addGraphNode) window.addGraphNode(item.agent);

                    // 2. Artifact Synthesis Sequence Trigger
                    if (item.artifact_path && !existing.artifact_path) {
                        const splits = item.artifact_path.split('/');
                        const fileName = splits[splits.length-1];
                        if (window.triggerSynthesis) window.triggerSynthesis(fileName);
                        
                        if (window.addArtifact) {
                            setTimeout(() => window.addArtifact(fileName, item.artifact_path), 500);
                        }
                    }
                }
            }
        }
    });

    if (!hasChanges) return;

    if (window.gsap) {
        if (elementsToAnimateIn.length > 0) {
            // "Assembly" Animation (Stitch Layer)
            gsap.fromTo(elementsToAnimateIn, 
                { y: -30, opacity: 0, scale: 0.9, rotationX: 15 },
                { opacity: 1, y: 0, scale: 1, rotationX: 0, duration: 0.8, stagger: 0.1, ease: 'back.out(1.4)' }
            );
        }
        
        elementsToUpdate.forEach(u => {
            let bdColor = 'rgba(48, 209, 88, 0.3)'; // Default green for success/update
            if (u.status === 'executing') bdColor = 'rgba(0, 122, 255, 0.4)'; // Blue pulse
            if (u.status === 'thinking') bdColor = 'rgba(255, 204, 0, 0.4)';
            
            const tl = gsap.timeline();
            tl.to(u.el, { backgroundColor: bdColor.replace('0.4', '0.1').replace('0.3', '0.1'), borderColor: bdColor, duration: 0.3, ease: 'power2.out' })
              .to(u.el, { backgroundColor: '', borderColor: 'rgba(255,255,255,0.7)', duration: 1.0, ease: 'power2.inOut', delay: 0.5 });
        });
        
        // Continuous executing glow
        elementsToPulse.forEach(el => {
            gsap.to(el, {
                boxShadow: '0 0 15px rgba(0, 122, 255, 0.2)',
                borderColor: 'rgba(0, 122, 255, 0.4)',
                duration: 0.8,
                yoyo: true,
                repeat: 5, // Pulse 5 times then stop
                ease: 'sine.inOut',
                onComplete: () => {
                    gsap.to(el, { boxShadow: 'none', borderColor: 'rgba(255,255,255,0.7)', duration: 0.5 });
                }
            });
        });
    } else {
        elementsToAnimateIn.forEach(el => el.style.opacity = '1');
    }
}

if (StitchMiddleware.timeout) clearTimeout(StitchMiddleware.timeout);
StitchMiddleware.timeout = setTimeout(fetchMemory, 300);
