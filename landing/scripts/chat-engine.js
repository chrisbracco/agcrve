import { CRGEN_KB } from './knowledge-base.js';

const API_KEY = ""; // TODO: REEMPLAZAR CON TU API KEY LOCALMENTE O USAR BACKEND
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

let chatHistory = [];
let isChatOpen = false;

function initChat() {
    const floatBtn = document.getElementById('chat-float');
    const chatContainer = document.getElementById('chat-window-container');
    const closeBtn = document.getElementById('chat-close-btn');
    const inputEl = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const messagesEl = document.getElementById('chat-messages');

    if (!floatBtn || !chatContainer) return;

    // Toggle logic
    floatBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openChat(chatContainer);
    });

    closeBtn.addEventListener('click', () => {
        closeChat(chatContainer);
    });

    const handleSend = async () => {
        const text = inputEl.value.trim();
        if (!text) return;
        
        inputEl.value = '';
        appendMessage(text, 'user', messagesEl);
        showTyping();

        const response = await fetchGemini(text);
        hideTyping();
        appendMessage(response, 'model', messagesEl);
    };

    sendBtn.addEventListener('click', handleSend);
    inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
}

function openChat(el) {
    if (isChatOpen) return;
    isChatOpen = true;
    el.style.pointerEvents = 'auto';
    if (window.gsap) {
        gsap.to(el, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'expo.out' });
    } else {
        el.style.opacity = '1';
        el.style.transform = 'scale(1) translateY(0)';
    }
}

function closeChat(el) {
    if (!isChatOpen) return;
    isChatOpen = false;
    el.style.pointerEvents = 'none';
    if (window.gsap) {
        gsap.to(el, { opacity: 0, scale: 0.95, y: 20, duration: 0.4, ease: 'power2.in' });
    } else {
        el.style.opacity = '0';
        el.style.transform = 'scale(0.95) translateY(20px)';
    }
}

function appendMessage(text, role, container) {
    const div = document.createElement('div');
    if (role === 'user') {
        div.className = 'msg-user';
        div.style.alignSelf = 'flex-end';
        div.style.background = 'var(--black)';
        div.style.color = 'var(--white)';
        div.style.borderBottomRightRadius = '4px';
    } else if (role === 'system') {
        div.className = 'msg-sys';
        div.style.alignSelf = 'center';
        div.style.background = 'rgba(48,209,88,0.1)';
        div.style.color = '#30d158';
        div.style.border = '1px solid rgba(48,209,88,0.2)';
    } else {
        div.className = 'msg-ai crystal-1';
        div.style.alignSelf = 'flex-start';
        div.style.borderBottomLeftRadius = '4px';
    }
    div.style.padding = '12px 16px';
    div.style.borderRadius = '18px';
    div.style.maxWidth = '85%';
    div.style.fontSize = '0.85rem';
    div.style.lineHeight = '1.5';
    
    div.style.opacity = '0';
    container.appendChild(div);
    
    if (window.gsap) {
        gsap.to(div, { opacity: 1, y: -5, duration: 0.4, ease: 'ease.out', startAt: { y: 15 }});
    } else {
        div.style.opacity = '1';
    }

    if (role === 'model') {
        div.style.whiteSpace = 'pre-wrap';
        let i = 0;
        div.textContent = "";
        function typeWriter() {
            if (i < text.length) {
                div.textContent += text.charAt(i);
                i++;
                container.scrollTop = container.scrollHeight;
                setTimeout(typeWriter, 15);
            }
        }
        typeWriter();
    } else {
        div.innerText = text;
        container.scrollTop = container.scrollHeight;
    }
}

let typingInterval;
function showTyping() {
    const indicator = document.getElementById('typing-indicator');
    if (!indicator) return;
    indicator.style.opacity = '1';
    if (window.gsap) {
        const dots = indicator.querySelectorAll('.t-dot');
        gsap.to(dots, { y: -4, duration: 0.4, stagger: 0.1, yoyo: true, repeat: -1, ease: 'sine.inOut', overwrite: 'auto' });
    }
}

function hideTyping() {
    const indicator = document.getElementById('typing-indicator');
    if (!indicator) return;
    indicator.style.opacity = '0';
    if (window.gsap) {
        const dots = indicator.querySelectorAll('.t-dot');
        gsap.killTweensOf(dots);
        gsap.set(dots, { y: 0 });
    }
}

async function fetchGemini(userText) {
    if (window.triggerNeuralSync) window.triggerNeuralSync();

    // 1. RAG Retrieve Phase
    let contextStr = "";
    try {
        const srRes = await fetch('http://localhost:8787/search', {
            method: 'POST',
            body: JSON.stringify({ query: userText })
        });
        const srData = await srRes.json();
        if (srData.results && srData.results.length > 0) {
            contextStr = "\n\nCONTEXTO HISTORICO (Memoria Vectorial):\n" + srData.results.map(r => r.text).join("\n\n---\n\n");
            console.log("RAG Context Injected:", srData.results.length, "chunks");
        }
    } catch(e) {
        console.warn("RAG retrieval failed", e);
    }

    const payload = {
        system_instruction: { 
            parts: [{ text: CRGEN_KB + contextStr }]
        },
        contents: [
            ...chatHistory,
            { role: "user", parts: [{ text: userText }] }
        ],
        tools: [{
            function_declarations: [{
                name: "inject_task",
                description: "Inyecta una tarea procesable directamente a un agente del cluster autónomo.",
                parameters: {
                    type: "object",
                    properties: {
                        agent: { type: "string", description: "Rol. ej: AGENT_RESEARCHER, AGENT_ANALYST, AGENT_DEVELOPER, AGENT_ARCHIVIST" },
                        task_description: { type: "string", description: "Descripción de la acción. ej: 'Realizar scan del mercado IA hoy'" },
                        priority: { type: "string", description: "low, normal, high" }
                    },
                    required: ["agent", "task_description"]
                }
            }]
        }],
        tool_config: { function_calling_config: { mode: "AUTO" } }
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error("API Error");
        const data = await response.json();
        const responsePart = data.candidates[0].content.parts[0];
        
        // Handle target tool call
        if (responsePart.functionCall && responsePart.functionCall.name === "inject_task") {
            const args = responsePart.functionCall.args;
            try {
                await fetch('http://localhost:8787/inject', {
                    method: 'POST',
                    body: JSON.stringify({ agent: args.agent, task: args.task_description, payload: { priority: "CRITICAL", source: "chat" } })
                });
                
                chatHistory.push({ role: "user", parts: [{ text: userText }] });
                chatHistory.push({ role: "model", parts: [{ functionCall: responsePart.functionCall }] });
                chatHistory.push({ role: "function", parts: [{ functionResponse: { name: "inject_task", response: { result: "Success" } } }] });
                
                return `🚀 Orden enviada al Bridge [PRIORITY: CRITICAL]. El ${args.agent} está interrumpiendo su tarea actual para procesar: "${args.task_description}".`;
            } catch(e) {
                return `[CONNECTION ERROR] Bridge unreachable. ¿Está el local Node activado en 3001?`;
            }
        }
        
        const aiResponse = responsePart.text;
        chatHistory.push({ role: "user", parts: [{ text: userText }] });
        chatHistory.push({ role: "model", parts: [{ text: aiResponse }] });
        if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
        
        return aiResponse;
    } catch (e) {
        console.error("Chat engine error:", e);
        return "Interferencia neuronal detectada. No puedo procesar tu solicitud ahora mismo.";
    }
}

document.addEventListener('DOMContentLoaded', initChat);
