const gameConfig = {
    maxCharacters: 20,
    volume: 0.8,
    characterSize: 100,
    bombSize: 140,
    spawnInterval: 60
};

async function loadSettingsJson() {
    try {
        const response = await fetch('setting.json');
        if (response.ok) {
            const data = await response.json();
            if (data.maxCharacters !== undefined) gameConfig.maxCharacters = parseInt(data.maxCharacters);
            if (data.volume !== undefined) gameConfig.volume = parseFloat(data.volume);
            if (data.characterSize !== undefined) gameConfig.characterSize = parseInt(data.characterSize);
            if (data.bombSize !== undefined) gameConfig.bombSize = parseInt(data.bombSize);
            if (data.spawnInterval !== undefined) gameConfig.spawnInterval = parseInt(data.spawnInterval);
            console.log('setting.json successfully loaded:', gameConfig);
        }
    } catch (err) {
        console.log('setting.json not found or local fetch blocked, using standard defaults.', err);
    }
    updateSettingsUI();
}

function updateSettingsUI() {
    document.getElementById('volRange').value = gameConfig.volume;
    document.getElementById('volVal').innerText = gameConfig.volume;

    document.getElementById('maxCharRange').value = gameConfig.maxCharacters;
    document.getElementById('maxCharVal').innerText = gameConfig.maxCharacters;

    document.getElementById('charSizeRange').value = gameConfig.characterSize;
    document.getElementById('charSizeVal').innerText = gameConfig.characterSize + 'px';

    document.getElementById('bombSizeRange').value = gameConfig.bombSize;
    document.getElementById('bombSizeVal').innerText = gameConfig.bombSize + 'px';
}

const sound = {
    muted: false,
    initialized: false,
    synth: null,
    noiseSynth: null,

    init() {
        if (this.initialized) return;
        try {
            if (window.Tone) {
                Tone.start();
                this.noiseSynth = new Tone.NoiseSynth({
                    noise: { type: 'pink' },
                    envelope: { attack: 0.005, decay: 0.3, sustain: 0 }
                }).toDestination();

                this.synth = new Tone.Synth({
                    oscillator: { type: 'triangle' },
                    envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
                }).toDestination();
            }
            this.initialized = true;
        } catch (e) {
            console.log("Audio init fallback error", e);
        }
    },

    playExplosion() {
        if (this.muted || gameConfig.volume <= 0) return;
        this.init();

        try {
            const audio = new Audio('bomb.mp3');
            audio.volume = gameConfig.volume;
            const playPromise = audio.play();

            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    if (this.noiseSynth) {
                        try {
                            this.noiseSynth.volume.value = Tone.gainToDb(gameConfig.volume);
                            this.noiseSynth.triggerAttackRelease("8n");
                        } catch(e){}
                    }
                });
            }
        } catch (e) {
            if (this.noiseSynth) {
                try {
                    this.noiseSynth.volume.value = Tone.gainToDb(gameConfig.volume);
                    this.noiseSynth.triggerAttackRelease("8n");
                } catch(err) {}
            }
        }
    },

    playPop() {
        if (this.muted || gameConfig.volume <= 0) return;
        this.init();
        if (this.synth) {
            try {
                this.synth.volume.value = Tone.gainToDb(gameConfig.volume) - 6;
                this.synth.triggerAttackRelease("C3", "32n");
            } catch(e) {}
        }
    },

    playCombo(combo) {
        if (this.muted || gameConfig.volume <= 0) return;
        this.init();
        if (this.synth) {
            try {
                this.synth.volume.value = Tone.gainToDb(gameConfig.volume) - 6;
                const notes = ["C4", "E4", "G4", "B4", "C5", "E5", "G5"];
                const note = notes[Math.min(combo, notes.length - 1)];
                this.synth.triggerAttackRelease(note, "16n");
            } catch(e) {}
        }
    }
};

function createDefaultBgSVG() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#2d1b4e"/>
                <stop offset="50%" stop-color="#1a102f"/>
                <stop offset="100%" stop-color="#0f081d"/>
            </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#g)"/>
        <g fill="#ffffff" opacity="0.15">
            <circle cx="100" cy="100" r="80"/>
            <circle cx="700" cy="500" r="120"/>
            <path d="M 0,600 Q 400,450 800,600 Z"/>
        </g>
        <g fill="#ff6b81" opacity="0.2">
            <path d="M120,80 C120,50 80,40 80,70 C80,40 40,50 40,80 C40,110 80,140 80,140 C80,140 120,110 120,80 Z" transform="translate(100, 150) scale(0.5)"/>
            <path d="M120,80 C120,50 80,40 80,70 C80,40 40,50 40,80 C40,110 80,140 80,140 C80,140 120,110 120,80 Z" transform="translate(550, 100) scale(0.7)"/>
            <path d="M120,80 C120,50 80,40 80,70 C80,40 40,50 40,80 C40,110 80,140 80,140 C80,140 120,110 120,80 Z" transform="translate(350, 350) scale(0.6)"/>
        </g>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function createDefaultCoupleSVG(id) {
    const colors = ['#ff4b72', '#4b7bec', '#20bf6b', '#8854d0', '#fa8231', '#0fb9b1', '#e84118', '#9c88ff', '#f7b731', '#5f27cd'];
    const color = colors[(id - 1) % colors.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
        <g transform="translate(10, 20)">
            <circle cx="30" cy="25" r="16" fill="#ffe0bd"/>
            <path d="M15,22 Q30,10 45,22 Z" fill="#4a3000"/>
            <rect x="18" y="42" width="24" height="35" rx="8" fill="${color}"/>
            <circle cx="25" cy="23" r="2.5" fill="#000"/>
            <circle cx="35" cy="23" r="2.5" fill="#000"/>
            <path d="M26,30 Q30,34 34,30" stroke="#000" stroke-width="2" fill="none"/>
            
            <circle cx="70" cy="25" r="16" fill="#ffe0bd"/>
            <path d="M55,20 Q70,5 85,20 Q85,32 85,32 L55,32 Z" fill="#ff793f"/>
            <rect x="58" y="42" width="24" height="35" rx="8" fill="#ff5252"/>
            <circle cx="65" cy="23" r="2.5" fill="#000"/>
            <circle cx="75" cy="23" r="2.5" fill="#000"/>
            <path d="M66,30 Q70,35 74,30" stroke="#000" stroke-width="2" fill="none"/>

            <path d="M50,15 C50,10 42,8 42,14 C42,8 34,10 34,15 C34,20 42,25 42,25 C42,25 50,20 50,15 Z" fill="#ff3838"/>
            <text x="50" y="90" font-family="sans-serif" font-weight="bold" font-size="14" fill="#ffffff" text-anchor="middle" stroke="#000000" stroke-width="3" paint-order="stroke">リア充 #${id}</text>
        </g>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function createDefaultBombSVG() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
        <g transform="translate(75, 75)">
            <path d="M0,-65 L18,-25 L60,-50 L30,-10 L70,10 L25,20 L40,60 L0,30 L-40,60 L-25,20 L-70,10 L-30,-10 L-60,-50 L-18,-25 Z" fill="#fffa65"/>
            <path d="M0,-50 L14,-20 L45,-38 L22,-8 L50,8 L18,15 L30,45 L0,22 L-30,45 L-18,15 L-50,8 L-22,-8 L-45,-38 L-14,-20 Z" fill="#ff3838"/>
            <circle cx="0" cy="0" r="25" fill="#ffffff"/>
            <text x="0" y="8" font-family="sans-serif" font-weight="900" font-size="20" fill="#d63031" text-anchor="middle">爆発!</text>
        </g>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const assets = {
    bg: new Image(),
    characters: Array.from({ length: 10 }, () => new Image()),
    bomb: new Image(),
    bombFile: null
};

assets.bg.src = 'bg.webp';
assets.bg.onerror = () => { assets.bg.src = createDefaultBgSVG(); };

assets.bomb.src = 'bomb.webp';
assets.bomb.onerror = () => { assets.bomb.src = createDefaultBombSVG(); };

for (let i = 0; i < 10; i++) {
    const num = i + 1;
    assets.characters[i].src = `${num}.webp`;
    assets.characters[i].onerror = () => {
        assets.characters[i].src = createDefaultCoupleSVG(num);
    };
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class CoupleCharacter {
    constructor(canvasWidth, canvasHeight) {
        this.imgIndex = Math.floor(Math.random() * 10);
        this.img = assets.characters[this.imgIndex];
        
        this.baseWidth = gameConfig.characterSize;
        this.baseHeight = gameConfig.characterSize;

        const side = Math.floor(Math.random() * 4);
        if (side === 0) {
            this.x = Math.random() * canvasWidth;
            this.y = -this.baseHeight;
        } else if (side === 1) {
            this.x = canvasWidth + this.baseWidth;
            this.y = Math.random() * canvasHeight;
        } else if (side === 2) {
            this.x = Math.random() * canvasWidth;
            this.y = canvasHeight + this.baseHeight;
        } else {
            this.x = -this.baseWidth;
            this.y = Math.random() * canvasHeight;
        }

        const targetSide = (side + 2) % 4;
        if (targetSide === 0) {
            this.targetX = Math.random() * canvasWidth;
            this.targetY = -this.baseHeight * 2;
        } else if (targetSide === 1) {
            this.targetX = canvasWidth + this.baseWidth * 2;
            this.targetY = Math.random() * canvasHeight;
        } else if (targetSide === 2) {
            this.targetX = Math.random() * canvasWidth;
            this.targetY = canvasHeight + this.baseHeight * 2;
        } else {
            this.targetX = -this.baseWidth * 2;
            this.targetY = Math.random() * canvasHeight;
        }

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        const speed = 1.5 + Math.random() * 2.0;

        this.vx = (dx / dist) * speed;
        this.vy = (dy / dist) * speed;

        this.wanderAngle = Math.random() * Math.PI * 2;

        this.jumpTimer = Math.random() * Math.PI * 2;
        this.jumpSpeed = 0.08 + Math.random() * 0.05;
        this.scaleX = 1;
        this.scaleY = 1;

        this.isDead = false;
    }

    update(width, height) {
        this.baseWidth = gameConfig.characterSize;
        this.baseHeight = gameConfig.characterSize;

        this.wanderAngle += (Math.random() - 0.5) * 0.05;
        this.x += this.vx + Math.cos(this.wanderAngle) * 0.5;
        this.y += this.vy + Math.sin(this.wanderAngle) * 0.5;

        this.jumpTimer += this.jumpSpeed;
        const jumpProgress = Math.sin(this.jumpTimer);

        this.scaleY = 1 + jumpProgress * 0.25; 
        this.scaleX = 1 - jumpProgress * 0.15;

        const margin = 150;
        if (this.x < -margin || this.x > width + margin || 
            this.y < -margin || this.y > height + margin) {
            this.isDead = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const jumpOffsetY = Math.abs(Math.sin(this.jumpTimer)) * -(this.baseHeight * 0.2);
        ctx.translate(0, jumpOffsetY);

        ctx.scale(this.scaleX, this.scaleY);

        ctx.drawImage(
            this.img, 
            -this.baseWidth / 2, 
            -this.baseHeight / 2, 
            this.baseWidth, 
            this.baseHeight
        );

        ctx.restore();
    }

    containsPoint(px, py) {
        const jumpOffsetY = Math.abs(Math.sin(this.jumpTimer)) * -(this.baseHeight * 0.2);
        const dx = px - this.x;
        const dy = py - (this.y + jumpOffsetY);
        return Math.hypot(dx, dy) < (this.baseWidth / 2) * 1.1;
    }
}

class BombExplosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.timer = 0;
        this.maxDuration = 45;
        this.isFinished = false;
        this.size = gameConfig.bombSize;

        this.element = document.createElement('img');
        this.element.className = 'absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 object-contain z-30';
        
        // 画像ファイルの読み込み失敗時にデフォルトSVG爆発グラフィックへフォールバック
        this.element.onerror = () => {
            this.element.onerror = null;
            this.element.src = createDefaultBombSVG();
        };

        let srcUrl = 'bomb.webp';
        if (assets.bombFile) {
            this.objectUrl = URL.createObjectURL(assets.bombFile);
            srcUrl = this.objectUrl;
        } else if (assets.bomb.src) {
            const baseSrc = assets.bomb.src;
            if (baseSrc.startsWith('data:')) {
                srcUrl = baseSrc;
            } else {
                srcUrl = baseSrc.split('?')[0] + '?t=' + Date.now() + '_' + Math.random();
            }
        }
        
        this.element.src = srcUrl;
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        this.element.style.width = `${this.size}px`;
        this.element.style.height = `${this.size}px`;

        const container = document.getElementById('explosionContainer') || document.body;
        container.appendChild(this.element);

        this.particles = Array.from({ length: 16 }, () => ({
            x: this.x,
            y: this.y,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            size: 8 + Math.random() * 12,
            color: Math.random() > 0.5 ? '#ff3838' : '#fffa65',
            alpha: 1
        }));
    }

    update() {
        this.timer++;
        if (this.timer >= this.maxDuration) {
            this.isFinished = true;
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            if (this.objectUrl) {
                URL.revokeObjectURL(this.objectUrl);
            }
        }

        for (let p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.03;
        }
    }

    draw(ctx) {
        for (let p of this.particles) {
            if (p.alpha <= 0) continue;
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}

let characters = [];
let explosions = [];
let score = 0;
let combo = 0;
let comboTimer = null;
let frameCount = 0;

function addScore() {
    score += 100 * (combo > 0 ? combo : 1);
    combo++;
    
    const scoreText = document.getElementById('scoreText');
    scoreText.innerText = score.toLocaleString();

    const comboContainer = document.getElementById('comboContainer');
    const comboText = document.getElementById('comboText');

    if (combo >= 2) {
        comboContainer.classList.remove('hidden');
        comboText.innerText = `${combo}x COMBO!`;
    }

    sound.playCombo(combo);

    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
        combo = 0;
        comboContainer.classList.add('hidden');
    }, 1800);
}

function spawnCharacter() {
    if (characters.length < gameConfig.maxCharacters) {
        characters.push(new CoupleCharacter(canvas.width, canvas.height));
    }
}

function handleInteraction(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    for (let i = characters.length - 1; i >= 0; i--) {
        const char = characters[i];
        if (char.containsPoint(clickX, clickY)) {
            sound.playExplosion();
            explosions.push(new BombExplosion(char.x, char.y));
            characters.splice(i, 1);
            addScore();
            return;
        }
    }

    sound.playPop();
}

canvas.addEventListener('mousedown', handleInteraction);
canvas.addEventListener('touchstart', handleInteraction, { passive: false });

function gameLoop() {
    frameCount++;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (assets.bg.complete) {
        ctx.drawImage(assets.bg, 0, 0, canvas.width, canvas.height);
    }

    if (frameCount % gameConfig.spawnInterval === 0) {
        spawnCharacter();
    }

    for (let i = characters.length - 1; i >= 0; i--) {
        const char = characters[i];
        char.update(canvas.width, canvas.height);
        char.draw(ctx);

        if (char.isDead) {
            characters.splice(i, 1);
        }
    }

    for (let i = explosions.length - 1; i >= 0; i--) {
        const exp = explosions[i];
        exp.update();
        exp.draw(ctx);

        if (exp.isFinished) {
            explosions.splice(i, 1);
        }
    }

    requestAnimationFrame(gameLoop);
}

const modal = document.getElementById('assetModal');
document.getElementById('assetModalBtn').addEventListener('click', () => modal.classList.remove('hidden'));
document.getElementById('closeModalBtn').addEventListener('click', () => modal.classList.add('hidden'));
document.getElementById('saveModalBtn').addEventListener('click', () => modal.classList.add('hidden'));

const soundBtn = document.getElementById('soundBtn');
soundBtn.addEventListener('click', () => {
    sound.muted = !sound.muted;
    soundBtn.innerHTML = sound.muted 
        ? '<i class="fa-solid fa-volume-xmark text-lg text-red-400"></i>' 
        : '<i class="fa-solid fa-volume-high text-lg"></i>';
});

document.getElementById('volRange').addEventListener('input', (e) => {
    gameConfig.volume = parseFloat(e.target.value);
    document.getElementById('volVal').innerText = gameConfig.volume;
});

document.getElementById('maxCharRange').addEventListener('input', (e) => {
    gameConfig.maxCharacters = parseInt(e.target.value);
    document.getElementById('maxCharVal').innerText = gameConfig.maxCharacters;
});

document.getElementById('charSizeRange').addEventListener('input', (e) => {
    gameConfig.characterSize = parseInt(e.target.value);
    document.getElementById('charSizeVal').innerText = gameConfig.characterSize + 'px';
});

document.getElementById('bombSizeRange').addEventListener('input', (e) => {
    gameConfig.bombSize = parseInt(e.target.value);
    document.getElementById('bombSizeVal').innerText = gameConfig.bombSize + 'px';
});

document.getElementById('jsonFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const parsed = JSON.parse(evt.target.result);
                if (parsed.maxCharacters !== undefined) gameConfig.maxCharacters = parseInt(parsed.maxCharacters);
                if (parsed.volume !== undefined) gameConfig.volume = parseFloat(parsed.volume);
                if (parsed.characterSize !== undefined) gameConfig.characterSize = parseInt(parsed.characterSize);
                if (parsed.bombSize !== undefined) gameConfig.bombSize = parseInt(parsed.bombSize);
                if (parsed.spawnInterval !== undefined) gameConfig.spawnInterval = parseInt(parsed.spawnInterval);
                updateSettingsUI();
            } catch(err) {
                console.error('Invalid JSON file format', err);
            }
        };
        reader.readAsText(file);
    }
});

document.getElementById('downloadJsonBtn').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gameConfig, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "setting.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

const container = document.getElementById('characterInputsContainer');
for (let i = 1; i <= 10; i++) {
    const div = document.createElement('div');
    div.className = "flex items-center justify-between gap-2 bg-slate-800 p-2 rounded-lg";
    div.innerHTML = `
        <span class="font-bold text-xs text-pink-300 w-14">${i}.webp</span>
        <input type="file" data-index="${i - 1}" accept="image/*" class="char-input block w-full text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-slate-700 file:text-white hover:file:bg-slate-600">
    `;
    container.appendChild(div);
}

document.getElementById('bgInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => { assets.bg.src = evt.target.result; };
        reader.readAsDataURL(file);
    }
});

document.getElementById('bombInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        assets.bombFile = file;
        assets.bomb.src = URL.createObjectURL(file);
    }
});

document.querySelectorAll('.char-input').forEach(input => {
    input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'));
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => { assets.characters[idx].src = evt.target.result; };
            reader.readAsDataURL(file);
        }
    });
});

window.onload = async () => {
    await loadSettingsJson();
    for (let i = 0; i < Math.min(3, gameConfig.maxCharacters); i++) {
        spawnCharacter();
    }
    gameLoop();
};