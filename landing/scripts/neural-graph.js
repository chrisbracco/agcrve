class NeuralGraph {
    constructor() {
        this.canvas = document.getElementById('neural-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.edges = [];
        this.w = window.innerWidth;
        this.h = window.innerHeight;
        this.canvas.width = this.w;
        this.canvas.height = this.h;
        
        window.addEventListener('resize', () => {
            this.w = window.innerWidth;
            this.h = window.innerHeight;
            this.canvas.width = this.w;
            this.canvas.height = this.h;
        });

        requestAnimationFrame((t) => this.render(t));
        
        // Add HUD state
        this.hudNodes = document.getElementById('hud-nodes-count');
        this.hudEdges = document.getElementById('hud-edges-count');
        
        // Initial node
        this.addNode('COMMAND_CORE', true);
    }

    addNode(label, isCore = false) {
        const node = {
            id: Math.random().toString(36).substring(7),
            label,
            isCore,
            x: this.w / 2 + (Math.random() - 0.5) * 100,
            y: this.h / 2 + (Math.random() - 0.5) * 100,
            vx: 0, vy: 0,
            radius: isCore ? 12 : 6
        };
        
        // Create edges to 1..2 random existing nodes
        if (this.nodes.length > 0) {
            const connectCount = Math.min(this.nodes.length, Math.floor(Math.random() * 2) + 1);
            for(let i=0; i<connectCount; i++) {
                const target = this.nodes[Math.floor(Math.random() * this.nodes.length)];
                if(!this.edges.some(e => (e.source.id === node.id && e.target.id === target.id) || (e.target.id === node.id && e.source.id === target.id))) {
                    this.edges.push({ source: node, target: target });
                }
            }
        }
        
        this.nodes.push(node);
        this.updateHUD();
        
        // Entry animation elastic effect handled via velocity pop
        node.vx += (Math.random() - 0.5) * 40;
        node.vy += (Math.random() - 0.5) * 40;
    }

    updateHUD() {
        if(this.hudNodes) this.hudNodes.innerText = this.nodes.length;
        if(this.hudEdges) this.hudEdges.innerText = this.edges.length;
    }

    render(time) {
        // Physics pass
        for (let i = 0; i < this.nodes.length; i++) {
            let n1 = this.nodes[i];
            
            // Gravity towards center
            const dxC = (this.w / 2) - n1.x;
            const dyC = (this.h / 2) - n1.y;
            n1.vx += dxC * 0.0001;
            n1.vy += dyC * 0.0001;

            // Repulsion
            for (let j = i + 1; j < this.nodes.length; j++) {
                let n2 = this.nodes[j];
                let dx = n2.x - n1.x;
                let dy = n2.y - n1.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                if (dist > 0 && dist < 150) {
                    let force = (150 - dist) / 150;
                    n1.vx -= (dx / dist) * force * 0.5;
                    n1.vy -= (dy / dist) * force * 0.5;
                    n2.vx += (dx / dist) * force * 0.5;
                    n2.vy += (dy / dist) * force * 0.5;
                }
            }
        }

        // Springs
        this.edges.forEach(e => {
            let dx = e.target.x - e.source.x;
            let dy = e.target.y - e.source.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            let force = (dist - 100) * 0.005; 
            e.source.vx += (dx / dist) * force;
            e.source.vy += (dy / dist) * force;
            e.target.vx -= (dx / dist) * force;
            e.target.vy -= (dy / dist) * force;
        });

        // Integration
        this.nodes.forEach(n => {
            n.vx *= 0.85; // friction
            n.vy *= 0.85;
            n.x += n.vx;
            n.y += n.vy;
        });

        // Draw
        this.ctx.clearRect(0, 0, this.w, this.h);
        
        // Edges
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = "rgba(100, 150, 255, 0.25)";
        this.edges.forEach(e => {
            this.ctx.beginPath();
            this.ctx.moveTo(e.source.x, e.source.y);
            this.ctx.lineTo(e.target.x, e.target.y);
            this.ctx.stroke();
        });

        // Nodes
        this.nodes.forEach(n => {
            if (n.isCore) {
                this.ctx.fillStyle = "#ffffff";
                this.ctx.shadowColor = "#007aff";
                this.ctx.shadowBlur = 30;
            } else {
                this.ctx.fillStyle = "#8ec5fc";
                this.ctx.shadowColor = "#e0c3fc";
                this.ctx.shadowBlur = 15;
            }
            this.ctx.beginPath();
            this.ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0; // reset
            
            // Label
            if (!n.isCore) {
                this.ctx.fillStyle = "rgba(255,255,255,0.4)";
                this.ctx.font = "10px JetBrains Mono";
                this.ctx.fillText(n.label, n.x + 10, n.y + 4);
            }
        });

        requestAnimationFrame((t) => this.render(t));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.neuralGraph = new NeuralGraph();
    window.addGraphNode = (label) => {
        if(window.neuralGraph) window.neuralGraph.addNode(label);
    }
});
