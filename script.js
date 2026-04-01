/* --- Configurações e Seleção de Elementos --- */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE;
const GAME_SPEED = 100;

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

/* --- Estado do Jogo --- */
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop;
let isGameRunning = false;
let isPaused = false;
let soundEnabled = localStorage.getItem('snakeSound') !== 'false';

// Cobra e Comida
let snake = [];
let food = { x: 0, y: 0 };
let dx = 0;
let dy = 0;

// Skin Atual
let currentSkin = localStorage.getItem('snakeSkin') || 'classic';

/* --- Skins Config --- */
const skins = {
    classic: { body: '#4ade80', head: '#22c55e' },
    neon: { body: '#00ffff', head: '#0080ff' },
    gold: { body: '#fbbf24', head: '#f59e0b' },
    purple: { body: '#c084fc', head: '#a855f7' }
};

// Inicializa o High Score e Skin na tela
highScoreEl.innerText = highScore;
updateSoundIcon();
applySkinSelection();

/* --- Funções de Som --- */
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

/* --- Funções de Skin --- */
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

/* --- Funções Principais --- */
function startGame() {
    playSound('start');
    
    // Resetar variáveis
    snake = [{ x: 10, y: 10 }];
    score = 0;
    dx = 0;
    dy = 0;
    isPaused = false;
    scoreEl.innerText = score;
    isGameRunning = true;
    
    // Esconder menus
    menuOverlay.style.display = 'none';
    gameOverOverlay.style.display = 'none';
    pauseOverlay.style.display = 'none';
    
    // Criar primeira comida
    createFood();
    
    // Mostrar botão de pausa
    pauseBtn.style.display = 'inline-block';
    pauseBtn.innerHTML = '⏸️ Pausar';
    pauseBtn.classList.remove('active');
    
    // Iniciar o loop
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, GAME_SPEED);
}

function update() {
    if (!isGameRunning || isPaused) return;
    
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
        score += 10;
        scoreEl.innerText = score;
        playSound('eat');
        createFood();
    } else {
        snake.pop();
    }
    
    draw();
}

function draw() {
    // Limpar tela
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar Comida
    ctx.fillStyle = '#f87171';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#f87171';
    ctx.beginPath();
    ctx.arc(
        food.x * GRID_SIZE + GRID_SIZE/2, 
        food.y * GRID_SIZE + GRID_SIZE/2, 
        GRID_SIZE/2 - 2, 
        0, 
        Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Desenhar Cobra com Skin
    const skin = skins[currentSkin];
    snake.forEach((part, index) => {
        ctx.fillStyle = index === 0 ? skin.head : skin.body;
        ctx.fillRect(
            part.x * GRID_SIZE + 1, 
            part.y * GRID_SIZE + 1, 
            GRID_SIZE - 2, 
            GRID_SIZE - 2
        );
    });
}

function createFood() {
    food = {
        x: Math.floor(Math.random() * TILE_COUNT),
        y: Math.floor(Math.random() * TILE_COUNT)
    };
    
    snake.forEach(part => {
        if (part.x === food.x && part.y === food.y) {
            createFood();
        }
    });
}

function checkCollision(head) {
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        return true;
    }
    
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

function gameOver() {
    isGameRunning = false;
    clearInterval(gameLoop);
    playSound('gameover');
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreEl.innerText = highScore;
    }
    
    finalScoreEl.innerText = score;
    gameOverOverlay.style.display = 'block';
    pauseBtn.style.display = 'none';
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
        gameLoop = setInterval(update, GAME_SPEED);
        pauseBtn.innerHTML = '⏸️ Pausar';
        pauseBtn.classList.remove('active');
        pauseOverlay.style.display = 'none';
    }
}

/* --- Controles de Teclado --- */
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

/* --- Controles Mobile (Touch) --- */
// Botões de direção
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

// Swipe Detection no Canvas
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
        // Horizontal
        if (diffX > 30 && !goingLeft) {
            dx = 1;
            dy = 0;
        } else if (diffX < -30 && !goingRight) {
            dx = -1;
            dy = 0;
        }
    } else {
        // Vertical
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

/* --- Event Listeners --- */
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
continueBtn.addEventListener('click', togglePause);
pauseBtn.addEventListener('click', togglePause);
soundToggle.addEventListener('click', toggleSound);

// Seleção de Skins
document.querySelectorAll('.skin-option').forEach(option => {
    option.addEventListener('click', () => {
        selectSkin(option.dataset.skin);
    });
});

// Renderização inicial
draw();
