const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const COLS = 12;
const ROWS = 20;
const BLOCK_SIZE = 32;

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;


// ========================================
// GAME UI
// ========================================

const gameOverScreen =
    document.getElementById("gameOverScreen");

const finalScore =
    document.getElementById("finalScore");

const restartBtn =
    document.getElementById("restartBtn");

const startScreen =
    document.getElementById("startScreen");

const playBtn =
    document.getElementById("playBtn");

const pauseScreen =
    document.getElementById("pauseScreen");

const resumeBtn =
    document.getElementById("resumeBtn");


// ========================================
// GAME VARIABLES
// ========================================

let board = [];

let currentPiece = null;

let gameRunning = false;
let isPaused = false;

let score = 0;
let lines = 0;
let level = 1;

let dropInterval = 600;
let lastDropTime = 0;

let pieceBag = [];


// Touch variables

let touchStartX = 0;
let touchStartY = 0;


// ========================================
// CREATE EMPTY BOARD
// ========================================

function createBoard() {

    board = [];

    for (let row = 0; row < ROWS; row++) {

        board.push(
            new Array(COLS).fill(0)
        );

    }

}


// ========================================
// DRAW GRID
// ========================================

function drawGrid() {

    ctx.strokeStyle = "#252525";
    ctx.lineWidth = 1;


    for (let col = 0; col <= COLS; col++) {

        ctx.beginPath();

        ctx.moveTo(
            col * BLOCK_SIZE,
            0
        );

        ctx.lineTo(
            col * BLOCK_SIZE,
            canvas.height
        );

        ctx.stroke();

    }


    for (let row = 0; row <= ROWS; row++) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            row * BLOCK_SIZE
        );

        ctx.lineTo(
            canvas.width,
            row * BLOCK_SIZE
        );

        ctx.stroke();

    }

}


// ========================================
// DRAW BLOCK
// ========================================

function drawBlock(col, row, color) {

    ctx.fillStyle = color;

    ctx.fillRect(
        col * BLOCK_SIZE,
        row * BLOCK_SIZE,
        BLOCK_SIZE,
        BLOCK_SIZE
    );


    ctx.strokeStyle = "#111";

    ctx.lineWidth = 2;

    ctx.strokeRect(
        col * BLOCK_SIZE,
        row * BLOCK_SIZE,
        BLOCK_SIZE,
        BLOCK_SIZE
    );

}


// ========================================
// DRAW BOARD
// ========================================

function drawBoard() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    drawGrid();


    // Draw locked blocks

    for (let row = 0; row < ROWS; row++) {

        for (let col = 0; col < COLS; col++) {

            if (board[row][col]) {

                drawBlock(
                    col,
                    row,
                    board[row][col]
                );

            }

        }

    }


    // Draw current piece

    if (currentPiece) {

        currentPiece.shape.forEach(
            (row, y) => {

                row.forEach(
                    (value, x) => {

                        if (value) {

                            drawBlock(
                                currentPiece.x + x,
                                currentPiece.y + y,
                                currentPiece.color
                            );

                        }

                    }
                );

            }
        );

    }

}


// ========================================
// TETROMINO DEFINITIONS
// ========================================

const PIECES = [

    // I

    {
        shape: [
            [1, 1, 1, 1]
        ],

        color: "#00f0f0"
    },


    // O

    {
        shape: [
            [1, 1],
            [1, 1]
        ],

        color: "#f0f000"
    },


    // T

    {
        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ],

        color: "#a000f0"
    },


    // S

    {
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ],

        color: "#00f000"
    },


    // Z

    {
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ],

        color: "#f00000"
    },


    // J

    {
        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ],

        color: "#0000f0"
    },


    // L

    {
        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ],

        color: "#f0a000"
    }

];


// ========================================
// CREATE 7-PIECE BAG
// ========================================

function refillBag() {

    pieceBag = [
        0,
        1,
        2,
        3,
        4,
        5,
        6
    ];


    // Fisher-Yates shuffle

    for (
        let i = pieceBag.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );


        [
            pieceBag[i],
            pieceBag[j]
        ] = [
                pieceBag[j],
                pieceBag[i]
            ];

    }

}


// ========================================
// CREATE PIECE
// ========================================

function createPiece() {

    if (pieceBag.length === 0) {

        refillBag();

    }


    const pieceIndex =
        pieceBag.shift();


    const selected =
        PIECES[pieceIndex];


    const shape =
        selected.shape.map(
            row => [...row]
        );


    return {

        shape: shape,

        color: selected.color,

        x: Math.floor(
            (COLS - shape[0].length) / 2
        ),

        y: 0

    };

}


// ========================================
// COLLISION DETECTION
// ========================================

function collision(piece) {

    for (
        let y = 0;
        y < piece.shape.length;
        y++
    ) {

        for (
            let x = 0;
            x < piece.shape[y].length;
            x++
        ) {

            if (!piece.shape[y][x]) {

                continue;

            }


            const newX =
                piece.x + x;

            const newY =
                piece.y + y;


            // Left/right walls

            if (
                newX < 0 ||
                newX >= COLS
            ) {

                return true;

            }


            // Bottom

            if (newY >= ROWS) {

                return true;

            }


            // Existing block

            if (
                newY >= 0 &&
                board[newY][newX]
            ) {

                return true;

            }

        }

    }


    return false;

}


// ========================================
// LOCK PIECE
// ========================================

function lockPiece() {

    currentPiece.shape.forEach(
        (row, y) => {

            row.forEach(
                (value, x) => {

                    if (value) {

                        const boardX =
                            currentPiece.x + x;

                        const boardY =
                            currentPiece.y + y;


                        if (
                            boardX >= 0 &&
                            boardX < COLS &&
                            boardY >= 0 &&
                            boardY < ROWS
                        ) {

                            board[boardY][boardX] =
                                currentPiece.color;

                        }

                    }

                }
            );

        }
    );

}


// ========================================
// CLEAR COMPLETED LINES
// ========================================

function clearLines() {

    let cleared = 0;


    for (
        let row = 0;
        row < ROWS;
        row++
    ) {

        let full = true;


        for (
            let col = 0;
            col < COLS;
            col++
        ) {

            if (
                board[row][col] === 0
            ) {

                full = false;

                break;

            }

        }


        if (full) {

            board.splice(
                row,
                1
            );


            board.unshift(
                new Array(COLS).fill(0)
            );


            cleared++;

            row--;

        }

    }


    if (cleared > 0) {

        updateScore(cleared);

    }

}


// ========================================
// UPDATE SCORE
// ========================================

function updateScore(cleared) {

    const points = [
        0,
        100,
        300,
        500,
        800
    ];


    score +=
        points[cleared] || 0;


    lines += cleared;


    level =
        Math.floor(
            lines / 10
        ) + 1;


    dropInterval =
        Math.max(
            100,
            600 -
            (level - 1) * 50
        );


    document
        .getElementById("score")
        .textContent = score;


    document
        .getElementById("lines")
        .textContent = lines;


    document
        .getElementById("level")
        .textContent = level;

}


// ========================================
// MOVE DOWN
// ========================================

function moveDown() {

    if (
        !gameRunning ||
        isPaused ||
        !currentPiece
    ) {

        return;

    }


    currentPiece.y++;


    if (
        collision(currentPiece)
    ) {

        currentPiece.y--;


        lockPiece();


        clearLines();


        currentPiece =
            createPiece();


        if (
            collision(currentPiece)
        ) {

            gameOver();

            return;

        }

    }


    drawBoard();

}


// ========================================
// MOVE LEFT
// ========================================

function moveLeft() {

    if (
        !gameRunning ||
        isPaused ||
        !currentPiece
    ) {

        return;

    }


    currentPiece.x--;


    if (
        collision(currentPiece)
    ) {

        currentPiece.x++;

    }


    drawBoard();

}


// ========================================
// MOVE RIGHT
// ========================================

function moveRight() {

    if (
        !gameRunning ||
        isPaused ||
        !currentPiece
    ) {

        return;

    }


    currentPiece.x++;


    if (
        collision(currentPiece)
    ) {

        currentPiece.x--;

    }


    drawBoard();

}


// ========================================
// ROTATE PIECE
// ========================================

function rotatePiece() {

    if (
        !gameRunning ||
        isPaused ||
        !currentPiece
    ) {

        return;

    }


    const oldShape =
        currentPiece.shape;


    const rows =
        oldShape.length;


    const cols =
        oldShape[0].length;


    const newShape = [];


    for (
        let x = 0;
        x < cols;
        x++
    ) {

        const newRow = [];


        for (
            let y = rows - 1;
            y >= 0;
            y--
        ) {

            newRow.push(
                oldShape[y][x]
            );

        }


        newShape.push(
            newRow
        );

    }


    currentPiece.shape =
        newShape;


    if (
        collision(currentPiece)
    ) {

        currentPiece.shape =
            oldShape;

    }


    drawBoard();

}


// ========================================
// HARD DROP
// ========================================

function hardDrop() {

    if (
        !gameRunning ||
        isPaused ||
        !currentPiece
    ) {

        return;

    }


    while (
        !collision(currentPiece)
    ) {

        currentPiece.y++;

    }


    currentPiece.y--;


    lockPiece();


    clearLines();


    currentPiece =
        createPiece();


    if (
        collision(currentPiece)
    ) {

        gameOver();

        return;

    }


    drawBoard();

}


// ========================================
// GAME OVER
// ========================================

function gameOver() {

    gameRunning = false;

    isPaused = false;


    if (pauseScreen) {
        pauseScreen.style.display = "none";
    }


    if (finalScore) {
        finalScore.textContent = score;
    }


    if (gameOverScreen) {
        gameOverScreen.style.display = "flex";
    }

}


// ========================================
// PAUSE
// ========================================

function togglePause() {

    if (!gameRunning) {
        return;
    }


    isPaused = !isPaused;


    const pauseBtn =
        document.getElementById("pauseBtn");


    if (isPaused) {

        pauseBtn.textContent = "▶";


        if (pauseScreen) {
            pauseScreen.style.display = "flex";
        }

    } else {

        pauseBtn.textContent = "Ⅱ";


        if (pauseScreen) {
            pauseScreen.style.display = "none";
        }


        lastDropTime =
            performance.now();


        requestAnimationFrame(
            gameLoop
        );

    }

}


// ========================================
// GAME LOOP
// ========================================

function gameLoop(timestamp) {

    if (
        !gameRunning ||
        isPaused
    ) {

        return;

    }


    if (
        timestamp -
        lastDropTime >=
        dropInterval
    ) {

        moveDown();


        lastDropTime =
            timestamp;

    }


    drawBoard();


    requestAnimationFrame(
        gameLoop
    );

}


// ========================================
// START GAME
// ========================================

function startGame() {

    if (startScreen) {
        startScreen.style.display = "none";
    }

    if (pauseScreen) {
        pauseScreen.style.display = "none";
    }

    if (gameOverScreen) {
        gameOverScreen.style.display = "none";
    }

    if (gameOverScreen) {

        gameOverScreen.style.display =
            "none";

    }


    isPaused = false;


    const pauseBtn =
        document.getElementById(
            "pauseBtn"
        );


    if (pauseBtn) {

        pauseBtn.textContent =
            "Ⅱ";

    }


    createBoard();


    pieceBag = [];


    score = 0;
    lines = 0;
    level = 1;


    dropInterval = 600;


    document
        .getElementById("score")
        .textContent = score;


    document
        .getElementById("lines")
        .textContent = lines;


    document
        .getElementById("level")
        .textContent = level;


    currentPiece =
        createPiece();


    gameRunning = true;


    lastDropTime =
        performance.now();


    drawBoard();


    requestAnimationFrame(
        gameLoop
    );

}


// ========================================
// BUTTON CONTROLS
// ========================================

const leftBtn =
    document.getElementById(
        "leftBtn"
    );


const rightBtn =
    document.getElementById(
        "rightBtn"
    );


const rotateBtn =
    document.getElementById(
        "rotateBtn"
    );


const downBtn =
    document.getElementById(
        "downBtn"
    );


const dropBtn =
    document.getElementById(
        "dropBtn"
    );


const pauseBtn =
    document.getElementById(
        "pauseBtn"
    );


if (restartBtn) {

    restartBtn.addEventListener(
        "click",
        startGame
    );

}


if (leftBtn) {

    leftBtn.addEventListener(
        "click",
        moveLeft
    );

}


if (rightBtn) {

    rightBtn.addEventListener(
        "click",
        moveRight
    );

}


if (rotateBtn) {

    rotateBtn.addEventListener(
        "click",
        rotatePiece
    );

}


if (downBtn) {

    downBtn.addEventListener(
        "click",
        moveDown
    );

}


if (dropBtn) {

    dropBtn.addEventListener(
        "click",
        hardDrop
    );

}


if (pauseBtn) {

    pauseBtn.addEventListener(
        "click",
        togglePause
    );

}

if (playBtn) {

    playBtn.addEventListener(
        "click",
        startGame
    );

}


if (resumeBtn) {

    resumeBtn.addEventListener(
        "click",
        togglePause
    );

}


// ========================================
// MOBILE TOUCH CONTROLS
// ========================================

const SWIPE_THRESHOLD = 30;


canvas.addEventListener(
    "touchstart",
    function (event) {

        if (
            !gameRunning ||
            isPaused
        ) {

            return;

        }


        const touch =
            event.touches[0];


        touchStartX =
            touch.clientX;


        touchStartY =
            touch.clientY;

    },
    {
        passive: false
    }
);


canvas.addEventListener(
    "touchend",
    function (event) {

        if (
            !gameRunning ||
            isPaused
        ) {

            return;

        }


        event.preventDefault();


        const touch =
            event.changedTouches[0];


        const deltaX =
            touch.clientX -
            touchStartX;


        const deltaY =
            touch.clientY -
            touchStartY;


        const distance =
            Math.sqrt(
                deltaX * deltaX +
                deltaY * deltaY
            );


        // Tap = rotate

        if (
            distance <
            SWIPE_THRESHOLD
        ) {

            rotatePiece();

            return;

        }


        // Horizontal swipe

        if (
            Math.abs(deltaX) >
            Math.abs(deltaY)
        ) {

            if (
                deltaX >
                SWIPE_THRESHOLD
            ) {

                moveRight();

            } else if (
                deltaX <
                -SWIPE_THRESHOLD
            ) {

                moveLeft();

            }


            return;

        }


        // Downward swipe

        if (
            deltaY >
            SWIPE_THRESHOLD
        ) {

            moveDown();

        }

    },
    {
        passive: false
    }
);