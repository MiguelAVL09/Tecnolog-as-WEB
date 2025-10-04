// --- Elementos del DOM ---
const statusDisplay = document.querySelector('#status-display');
const gameBoard = document.querySelector('#game-board');
const cells = document.querySelectorAll('.cell');
const restartButton = document.querySelector('#restart-button');
const pvcButton = document.querySelector('#pvc');
const pvpButton = document.querySelector('#pvp');

// --- Variables de Estado del Juego ---
let gameActive = true;
let currentPlayer = 'X';
let gameState = ["", "", "", "", "", "", "", "", ""];
let gameMode = 'pvp'; // 'pvp' para Jugador vs Jugador, 'pvc' para Jugador vs Computadora

// --- Mensajes ---
const winningMessage = () => `¡El jugador ${currentPlayer} ha ganado!`;
const drawMessage = () => `¡El juego ha terminado en empate!`;
const currentPlayerTurn = () => `Es el turno de ${currentPlayer}`;

// --- Lógica del Juego ---

// Condiciones de victoria (índices del array gameState)
const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

// Función para manejar el clic en una celda
function handleCellClick(clickedCellEvent) {
    const clickedCell = clickedCellEvent.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-cell-index'));

    // Si la celda ya está ocupada o el juego ha terminado, no hacer nada
    if (gameState[clickedCellIndex] !== "" || !gameActive) {
        return;
    }

    // Procesar el turno
    handleCellPlayed(clickedCell, clickedCellIndex);
    handleResultValidation();
}

// Función para actualizar el estado y la UI de la celda
function handleCellPlayed(clickedCell, clickedCellIndex) {
    gameState[clickedCellIndex] = currentPlayer;
    clickedCell.textContent = currentPlayer;
    clickedCell.classList.add(currentPlayer.toLowerCase());
}

// Función para cambiar de jugador
function handlePlayerChange() {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusDisplay.textContent = currentPlayerTurn();
}

// Función para validar el resultado del juego (victoria, empate o continuar)
function handleResultValidation() {
    let roundWon = false;
    for (let i = 0; i < winningConditions.length; i++) {
        const winCondition = winningConditions[i];
        let a = gameState[winCondition[0]];
        let b = gameState[winCondition[1]];
        let c = gameState[winCondition[2]];
        if (a === '' || b === '' || c === '') {
            continue;
        }
        if (a === b && b === c) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        statusDisplay.textContent = winningMessage();
        gameActive = false;
        return;
    }

    // Verificar si hay empate
    let roundDraw = !gameState.includes("");
    if (roundDraw) {
        statusDisplay.textContent = drawMessage();
        gameActive = false;
        return;
    }

    // Si el juego continúa, cambiar de jugador
    handlePlayerChange();

    // Si es modo PVC y es el turno de la computadora ('O')
    if (gameMode === 'pvc' && currentPlayer === 'O' && gameActive) {
        // Deshabilitar clics mientras la computadora "piensa"
        gameBoard.style.pointerEvents = 'none';
        setTimeout(computerMove, 700); // Dar una pequeña pausa para que parezca que "piensa"
    }
}

// Función para el movimiento de la computadora (IA simple)
function computerMove() {
    let availableCells = [];
    gameState.forEach((cell, index) => {
        if (cell === "") {
            availableCells.push(index);
        }
    });

    // Elegir una celda vacía al azar
    const randomIndex = Math.floor(Math.random() * availableCells.length);
    const cellIndex = availableCells[randomIndex];
    const cell = document.querySelector(`[data-cell-index='${cellIndex}']`);
    
    handleCellPlayed(cell, cellIndex);
    handleResultValidation();

    // Rehabilitar clics para el jugador
    gameBoard.style.pointerEvents = 'auto';
}

// Función para reiniciar el juego
function handleRestartGame() {
    gameActive = true;
    currentPlayer = 'X';
    gameState = ["", "", "", "", "", "", "", "", ""];
    statusDisplay.textContent = currentPlayerTurn();
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o');
    });
}

// Función para cambiar el modo de juego
function handleModeChange(mode) {
    gameMode = mode;
    if (mode === 'pvc') {
        pvcButton.classList.add('active');
        pvpButton.classList.remove('active');
    } else {
        pvpButton.classList.add('active');
        pvcButton.classList.remove('active');
    }
    handleRestartGame();
}

// --- Asignación de Eventos ---
cells.forEach(cell => cell.addEventListener('click', handleCellClick));
restartButton.addEventListener('click', handleRestartGame);
pvcButton.addEventListener('click', () => handleModeChange('pvc'));
pvpButton.addEventListener('click', () => handleModeChange('pvp'));

// --- Estado Inicial ---
statusDisplay.textContent = currentPlayerTurn();