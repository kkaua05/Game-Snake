/* --- Configurações e Seleção de Elementos --- */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRID_SIZE = 20; // Tamanho de cada quadrado
const TILE_COUNT = canvas.width / GRID_SIZE;
const GAME_SPEED = 100; // ms por frame (quanto menor, mais rápido)

// Elementos da UI
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const finalScoreEl = document.getElementById('finalScore');
const menuOverlay = document.getElementById('menuOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');

/* --- Estado do Jogo --- */
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop;
let isGameRunning = false;

// Cobra e Comida
let snake = [];
let food = { x: 0, y: 0 };
let dx = 0;
let dy = 0;

// Inicializa o High Score na tela
highScoreEl.innerText = highScore;

/* --- Funções Principais --- */

function startGame() {
    // Resetar variáveis
    snake = [{ x: 10, y: 10 }]; // Começa no meio
    score = 0;
    dx = 0;
    dy = 0;
    scoreEl.innerText = score;
    isGameRunning = true;
    
    // Esconder menus
    menuOverlay.style.display = 'none';
    gameOverOverlay.style.display = 'none';

    // Criar primeira comida
    createFood();

    // Iniciar o loop
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, GAME_SPEED);
}

function update() {
    if (!isGameRunning) return;

    // Mover a cobra
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Se a cobra não estiver se movendo (início do jogo), apenas desenha
    if (dx === 0 && dy === 0) {
        draw();
        return;
    }

    // Verificar Colisões
    if (checkCollision(head)) {
        gameOver();
        return;
    }

    // Adicionar nova cabeça
    snake.unshift(head);

    // Verificar se comeu a comida
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.innerText = score;
        createFood();
    } else {
        // Remove a cauda se não comeu
        snake.pop();
    }

    draw();
}

function draw() {
    // Limpar tela
    ctx.fillStyle = '#1e293b'; // Cor de fundo do canvas (mesma do CSS --game-bg)
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
    ctx.shadowBlur = 0; // Resetar sombra

    // Desenhar Cobra
    snake.forEach((part, index) => {
        // Cabeça é mais clara, corpo mais escuro
        ctx.fillStyle = index === 0 ? '#22c55e' : '#4ade80';
        
        // Efeito visual simples
        ctx.fillRect(
            part.x * GRID_SIZE + 1, 
            part.y * GRID_SIZE + 1, 
            GRID_SIZE - 2, 
            GRID_SIZE - 2
        );
    });
}

function createFood() {
    // Gera posição aleatória
    food = {
        x: Math.floor(Math.random() * TILE_COUNT),
        y: Math.floor(Math.random() * TILE_COUNT)
    };

    // Verifica se a comida não nasceu em cima da cobra
    snake.forEach(part => {
        if (part.x === food.x && part.y === food.y) {
            createFood(); // Tenta de novo recursivamente
        }
    });
}

function checkCollision(head) {
    // Colisão com paredes
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        return true;
    }

    // Colisão com o próprio corpo
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
    
    // Atualizar High Score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreEl.innerText = highScore;
    }

    finalScoreEl.innerText = score;
    gameOverOverlay.style.display = 'block';
}

/* --- Controles --- */

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

    // Previne scroll da tela com as setas
    if([37, 38, 39, 40].indexOf(keyPressed) > -1) {
        event.preventDefault();
    }

    // Lógica para impedir que a cobra volte para trás instantaneamente
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

// Renderização inicial (para não aparecer tela branca antes de iniciar)
draw();