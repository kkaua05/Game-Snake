/* ============================================
   GAME SNAKE - SCRIPT.JS
   Todas as funcionalidades integradas
   ============================================ */

/* --- Configurações e Seleção de Elementos --- */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE;
const BASE_GAME_SPEED = 100;

// Elementos da UI
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const finalScoreEl = document.getElementById('finalScore');
const menuOverlay = document.getElementById('menuOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const pauseOverlay = document.getElementById('pauseOverlay');
const pauseBtn = document.getElementById('pauseBtn');
const soundToggle = document.getElementById('soundToggle');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const continueBtn = document.getElementById('continueBtn');
const powerupIndicator = document.getElementById('powerupIndicator');
const powerupText = document.getElementById('powerupText');

/* --- Estado do Jogo --- */
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop;
let isGameRunning = false;
let isPaused = false;
let gameSpeed = BASE_GAME_SPEED;
let soundEnabled = localStorage.getItem('snakeSound') !== 'false';

// Cobra e Comida
let snake = [];
let food = { x: 0, y: 0, type: 'normal' };
let dx = 0;
let dy = 0;

// Power-ups Ativos
let activePowerups = {
    lightning: false,
    shield: false,
    freeze: false,
    ghost: false
};
let powerupTimers = {};

// Sistema de Partículas
let particles = [];

// Skin Atual
let currentSkin = localStorage.getItem('snakeSkin') || 'classic';

/* --- Skins Config --- */
const skins = {
    classic: { body: '#4ade80', head: '#22c55e' },
    neon: { body: '#00ffff', head: '#0080ff' },
    gold: { body: '#fbbf24', head: '#f59e0b' },
    purple: { body: '#c084fc', head: '#a855f7' }
};

/* --- Tipos de Power-ups --- */
const powerupTypes = {
    normal: { color: '#f87171', points: 10, icon: '🍎', chance: 0.70 },
    lightning: { color: '#fbbf24', points: 20, icon: '⚡', chance: 0.10 },
    shield: { color: '#38bdf8', points: 15, icon: '🛡️', chance: 0.08 },
    freeze: { color: '#06b6d4', points: 15, icon: '❄️', chance: 0.07 },
    ghost: { color: '#c084fc', points: 15, icon: '🔮', chance: 0.05 }
};

/* --- Inicialização --- */
highScoreEl.innerText = highScore;
updateSoundIcon();
applySkinSelection();
draw();

/* ============================================
   SISTEMA DE SOM
   ============================================ */
function playSound(sound) {
    if (!soundEnabled) return;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch(sound) {
            case 'eat':
                oscillator.frequency.value = 600;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
            case 'eat-powerup':
                oscillator.frequency.value = 800;
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
            case 'gameover':
                oscillator.frequency.value = 200;
                oscillator.type = 'sawtooth';
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                break;
            case 'start':
                oscillator.frequency.value = 400;
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
            case 'pause':
                oscillator.frequency.value = 300;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.15);
                break;
            case 'shield-hit':
                oscillator.frequency.value = 250;
                oscillator.type = 'triangle';
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
        }
    } catch (e) {
        console.log('Audio não suportado neste navegador');
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('snakeSound', soundEnabled);
    updateSoundIcon();
}

function updateSoundIcon() {
    soundToggle.innerText = soundEnabled ? '🔊' : '🔇';
}

/* ============================================
   SISTEMA DE SKINS
   ============================================ */
function applySkinSelection() {
    const skinOptions = document.querySelectorAll('.skin-option');
    skinOptions.forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.skin === currentSkin) {
            option.classList.add('selected');
        }
    });
}

function selectSkin(skinName) {
    currentSkin = skinName;
    localStorage.setItem('snakeSkin', skinName);
    applySkinSelection();
}

/* ============================================
   SISTEMA DE PARTÍCULAS
   ============================================ */
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 4 + 2;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.decay = Math.random() * 0.03 + 0.02;
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        this.size *= 0.95;
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function createParticles(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(particle => particle.draw());
}

/* ============================================
   SISTEMA DE POWER-UPS
   ============================================ */
function activatePowerup(type) {
    if (powerupTimers[type]) {
        clearTimeout(powerupTimers[type]);
    }
    
    activePowerups[type] = true;
    showPowerupIndicator(type);
    
    if (type === 'lightning') {
        gameSpeed = BASE_GAME_SPEED * 0.6;
        clearInterval(gameLoop);
        gameLoop = setInterval(update, gameSpeed);
        
        powerupTimers[type] = setTimeout(() => {
            deactivatePowerup(type);
            gameSpeed = BASE_GAME_SPEED;
            clearInterval(gameLoop);
            gameLoop = setInterval(update, gameSpeed);
        }, 5000);
    }
    
    if (type === 'shield') {
        powerupTimers[type] = setTimeout(() => {
            deactivatePowerup(type);
        }, 10000);
    }
    
    if (type === 'freeze') {
        powerupTimers[type] = setTimeout(() => {
            deactivatePowerup(type);
        }, 5000);
    }
    
    if (type === 'ghost') {
        powerupTimers[type] = setTimeout(() => {
            deactivatePowerup(type);
        }, 3000);
    }
}

function deactivatePowerup(type) {
    activePowerups[type] = false;
    if (powerupTimers[type]) {
        clearTimeout(powerupTimers[type]);
    }
    hidePowerupIndicator();
    updateCanvasEffect();
}

function showPowerupIndicator(type) {
    const icons = {
        lightning: '⚡ Relâmpago Ativo! (5s)',
        shield: '🛡️ Escudo Ativo! (10s)',
        freeze: '❄️ Congelar Ativo! (5s)',
        ghost: '🔮 Fantasma Ativo! (3s)'
    };
    powerupText.innerText = icons[type] || '';
    powerupIndicator.classList.add('active');
    updateCanvasEffect();
}

function hidePowerupIndicator() {
    const hasActivePowerup = Object.values(activePowerups).some(v => v);
    if (!hasActivePowerup) {
        powerupIndicator.classList.remove('active');
    }
}

function updateCanvasEffect() {
    canvas.classList.remove('powerup-active', 'shield-active', 'ghost-active');
    
    if (activePowerups.lightning) {
        canvas.classList.add('powerup-active');
    }
    if (activePowerups.shield) {
        canvas.classList.add('shield-active');
    }
    if (activePowerups.ghost) {
        canvas.classList.add('ghost-active');
    }
}

function getRandomPowerupType() {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [type, data] of Object.entries(powerupTypes)) {
        cumulative += data.chance;
        if (rand <= cumulative) {
            return type;
        }
    }
    return 'normal';
}

/* ============================================
   FUNÇÕES PRINCIPAIS DO JOGO
   ============================================ */
function startGame() {
    playSound('start');
    
    snake = [{ x: 10, y: 10 }];
    score = 0;
    dx = 0;
    dy = 0;
    isPaused = false;
    gameSpeed = BASE_GAME_SPEED;
    scoreEl.innerText = score;
    isGameRunning = true;
    particles = [];
    
    Object.keys(activePowerups).forEach(key => {
        activePowerups[key] = false;
        if (powerupTimers[key]) {
            clearTimeout(powerupTimers[key]);
        }
    });
    hidePowerupIndicator();
    updateCanvasEffect();
    
    menuOverlay.style.display = 'none';
    gameOverOverlay.style.display = 'none';
    pauseOverlay.style.display = 'none';
    
    createFood();
    
    pauseBtn.style.display = 'inline-block';
    pauseBtn.innerHTML = '⏸️ Pausar';
    pauseBtn.classList.remove('active');
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, gameSpeed);
}

function update() {
    if (!isGameRunning || isPaused) return;
    
    updateParticles();
    
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    if (dx === 0 && dy === 0) {
        draw();
        return;
    }
    
    if (checkCollision(head)) {
        gameOver();
        return;
    }
    
    snake.unshift(head);
    
    if (head.x === food.x && head.y === food.y) {
        const powerupData = powerupTypes[food.type];
        createParticles(
            head.x * GRID_SIZE + GRID_SIZE/2,
            head.y * GRID_SIZE + GRID_SIZE/2,
            powerupData.color,
            food.type === 'normal' ? 10 : 20
        );
        
        score += powerupData.points;
        scoreEl.innerText = score;
        
        if (food.type !== 'normal') {
            playSound('eat-powerup');
            activatePowerup(food.type);
        } else {
            playSound('eat');
        }
        
        createFood();
    } else {
        snake.pop();
    }
    
    draw();
}

function draw() {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < TILE_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(canvas.width, i * GRID_SIZE);
        ctx.stroke();
    }
    
    // Comida
    const powerupData = powerupTypes[food.type];
    ctx.fillStyle = powerupData.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = powerupData.color;
    
    if (food.type === 'normal') {
        ctx.beginPath();
        ctx.arc(
            food.x * GRID_SIZE + GRID_SIZE/2, 
            food.y * GRID_SIZE + GRID_SIZE/2, 
            GRID_SIZE/2 - 2, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
    } else {
        ctx.beginPath();
        ctx.roundRect(
            food.x * GRID_SIZE + 2,
            food.y * GRID_SIZE + 2,
            GRID_SIZE - 4,
            GRID_SIZE - 4,
            4
        );
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 0;
        ctx.fillText(
            powerupData.icon,
            food.x * GRID_SIZE + GRID_SIZE/2,
            food.y * GRID_SIZE + GRID_SIZE/2
        );
    }
    ctx.shadowBlur = 0;
    
    // Cobra
    const skin = skins[currentSkin];
    snake.forEach((part, index) => {
        if (activePowerups.ghost) {
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#c084fc';
        } else if (activePowerups.shield) {
            ctx.globalAlpha = 1;
            ctx.fillStyle = index === 0 ? '#60a5fa' : '#38bdf8';
        } else if (activePowerups.lightning) {
            ctx.globalAlpha = 1;
            ctx.fillStyle = index === 0 ? '#fcd34d' : '#fbbf24';
        } else {
            ctx.globalAlpha = 1;
            ctx.fillStyle = index === 0 ? skin.head : skin.body;
        }
        
        if (index === 0) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = ctx.fillStyle;
        } else {
            ctx.shadowBlur = 0;
        }
        
        ctx.fillRect(
            part.x * GRID_SIZE + 1, 
            part.y * GRID_SIZE + 1, 
            GRID_SIZE - 2, 
            GRID_SIZE - 2
        );
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    
    drawParticles();
    
    // Escudo visual
    if (activePowerups.shield && snake.length > 0) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(
            snake[0].x * GRID_SIZE + GRID_SIZE/2,
            snake[0].y * GRID_SIZE + GRID_SIZE/2,
            GRID_SIZE,
            0,
            Math.PI * 2
        );
        ctx.stroke();
    }
}

function createFood() {
    food = {
        x: Math.floor(Math.random() * TILE_COUNT),
        y: Math.floor(Math.random() * TILE_COUNT),
        type: getRandomPowerupType()
    };
    
    snake.forEach(part => {
        if (part.x === food.x && part.y === food.y) {
            createFood();
        }
    });
}

function checkCollision(head) {
    if (!activePowerups.ghost) {
        if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
            if (activePowerups.shield) {
                playSound('shield-hit');
                deactivatePowerup('shield');
                if (head.x < 0) head.x = 0;
                if (head.x >= TILE_COUNT) head.x = TILE_COUNT - 1;
                if (head.y < 0) head.y = 0;
                if (head.y >= TILE_COUNT) head.y = TILE_COUNT - 1;
                return false;
            }
            return true;
        }
    } else {
        if (head.x < 0) head.x = TILE_COUNT - 1;
        if (head.x >= TILE_COUNT) head.x = 0;
        if (head.y < 0) head.y = TILE_COUNT - 1;
        if (head.y >= TILE_COUNT) head.y = 0;
    }
    
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            if (activePowerups.shield) {
                playSound('shield-hit');
                deactivatePowerup('shield');
                return false;
            }
            return true;
        }
    }
    
    return false;
}

function gameOver() {
    isGameRunning = false;
    clearInterval(gameLoop);
    playSound('gameover');
    
    Object.keys(powerupTimers).forEach(key => {
        if (powerupTimers[key]) {
            clearTimeout(powerupTimers[key]);
        }
    });
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreEl.innerText = highScore;
    }
    
    finalScoreEl.innerText = score;
    gameOverOverlay.style.display = 'block';
    pauseBtn.style.display = 'none';
    hidePowerupIndicator();
    updateCanvasEffect();
}

function togglePause() {
    if (!isGameRunning) return;
    
    isPaused = !isPaused;
    playSound('pause');
    
    if (isPaused) {
        clearInterval(gameLoop);
        pauseBtn.innerHTML = '▶️ Continuar';
        pauseBtn.classList.add('active');
        pauseOverlay.style.display = 'block';
    } else {
        gameLoop = setInterval(update, gameSpeed);
        pauseBtn.innerHTML = '⏸️ Pausar';
        pauseBtn.classList.remove('active');
        pauseOverlay.style.display = 'none';
    }
}

/* ============================================
   CONTROLES - TECLADO
   ============================================ */
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' || event.code === 'Escape') {
        event.preventDefault();
        togglePause();
    }
});

document.addEventListener('keydown', changeDirection);

function changeDirection(event) {
    const LEFT_KEY = 37;
    const RIGHT_KEY = 39;
    const UP_KEY = 38;
    const DOWN_KEY = 40;
    const W_KEY = 87;
    const A_KEY = 65;
    const S_KEY = 83;
    const D_KEY = 68;
    const keyPressed = event.keyCode;
    
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;
    
    if([37, 38, 39, 40].indexOf(keyPressed) > -1) {
        event.preventDefault();
    }
    
    if ((keyPressed === LEFT_KEY || keyPressed === A_KEY) && !goingRight) {
        dx = -1;
        dy = 0;
    }
    if ((keyPressed === UP_KEY || keyPressed === W_KEY) && !goingDown) {
        dx = 0;
        dy = -1;
    }
    if ((keyPressed === RIGHT_KEY || keyPressed === D_KEY) && !goingLeft) {
        dx = 1;
        dy = 0;
    }
    if ((keyPressed === DOWN_KEY || keyPressed === S_KEY) && !goingUp) {
        dx = 0;
        dy = 1;
    }
}

/* ============================================
   CONTROLES - MOBILE (TOUCH)
   ============================================ */
document.querySelectorAll('.control-btn').forEach(btn => {
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const direction = btn.dataset.direction;
        handleMobileControl(direction);
    });
    
    btn.addEventListener('click', (e) => {
        const direction = btn.dataset.direction;
        handleMobileControl(direction);
    });
});

function handleMobileControl(direction) {
    if (!isGameRunning || isPaused) return;
    
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;
    
    if (direction === 'up' && !goingDown) {
        dx = 0;
        dy = -1;
    }
    if (direction === 'down' && !goingUp) {
        dx = 0;
        dy = 1;
    }
    if (direction === 'left' && !goingRight) {
        dx = -1;
        dy = 0;
    }
    if (direction === 'right' && !goingLeft) {
        dx = 1;
        dy = 0;
    }
}

// Swipe no Canvas
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    if (!isGameRunning || isPaused) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 30 && !goingLeft) {
            dx = 1;
            dy = 0;
        } else if (diffX < -30 && !goingRight) {
            dx = -1;
            dy = 0;
        }
    } else {
        if (diffY > 30 && !goingUp) {
            dx = 0;
            dy = 1;
        } else if (diffY < -30 && !goingDown) {
            dx = 0;
            dy = -1;
        }
    }
    
    e.preventDefault();
}, { passive: false });

/* ============================================
   EVENT LISTENERS
   ============================================ */
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
continueBtn.addEventListener('click', togglePause);
pauseBtn.addEventListener('click', togglePause);
soundToggle.addEventListener('click', toggleSound);

document.querySelectorAll('.skin-option').forEach(option => {
    option.addEventListener('click', () => {
        selectSkin(option.dataset.skin);
    });
});
