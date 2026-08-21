/* =========================================================
   MOSAYAD APPS - SNAKE
   Game Engine
   ========================================================= */


/* =========================================================
   CANVAS
   ========================================================= */

const canvas = document.getElementById("game-canvas");

const ctx = canvas.getContext("2d");

const BASE_SIZE = 600;

/* =========================================================
   ELEMENTS
   ========================================================= */

const scoreElement =
    document.getElementById("score");

const bestScoreElement =
    document.getElementById("best-score");

const levelElement =
    document.getElementById("level");

const overlay =
    document.getElementById("game-overlay");

const overlayIcon =
    document.getElementById("overlay-icon");

const overlayTitle =
    document.getElementById("overlay-title");

const overlayMessage =
    document.getElementById("overlay-message");

const startButton =
    document.getElementById("start-button");

const pauseButton =
    document.getElementById("pause-button");

const restartButton =
    document.getElementById("restart-button");

const themeButton =
    document.getElementById("theme-btn");


/* =========================================================
   GAME SETTINGS
   ========================================================= */

const GRID_SIZE = 25;

const CELL_SIZE = BASE_SIZE / GRID_SIZE;


let snake;

let food;

let direction;

let nextDirection;

let score;

let level;

let gameRunning = false;

let paused = false;

let gameLoop;

let speed;

/* =========================================================
   TOUCH / SWIPE CONTROLS
   ========================================================= */

let touchStartX = 0;
let touchStartY = 0;

let touchStartTime = 0;

const SWIPE_MIN_DISTANCE = 25;
const SWIPE_MAX_TIME = 500;


function resizeCanvas() {

    const dpr = Math.min(
        window.devicePixelRatio || 1,
        2
    );

    canvas.width = BASE_SIZE * dpr;
    canvas.height = BASE_SIZE * dpr;

    canvas.style.width = "100%";
    canvas.style.height = "100%";

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

    if (snake && food) {
        draw();
    }

}

resizeCanvas();

window.addEventListener(
    "resize",
    resizeCanvas
);

/* =========================================================
   TOUCH START
   ========================================================= */

canvas.addEventListener(
    "touchstart",
    event => {

        if (!gameRunning || paused) {
            return;
        }

        const touch = event.touches[0];

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;

        touchStartTime = Date.now();

    },
    {
        passive: false
    }
);


/* =========================================================
   TOUCH MOVE
   ========================================================= */

canvas.addEventListener(
    "touchmove",
    event => {

        /*
         * Prevent the page from scrolling
         * while the player is controlling Snake.
         */

        event.preventDefault();

    },
    {
        passive: false
    }
);


/* =========================================================
   TOUCH END
   ========================================================= */

canvas.addEventListener(
    "touchend",
    event => {

        if (!gameRunning || paused) {
            return;
        }


        const touch = event.changedTouches[0];

        const touchEndX =
            touch.clientX;

        const touchEndY =
            touch.clientY;


        const deltaX =
            touchEndX - touchStartX;

        const deltaY =
            touchEndY - touchStartY;


        const distance =
            Math.sqrt(
                deltaX * deltaX +
                deltaY * deltaY
            );


        const elapsed =
            Date.now() -
            touchStartTime;


        /*
         * Ignore tiny movements.
         */

        if (
            distance <
            SWIPE_MIN_DISTANCE
        ) {

            return;

        }


        /*
         * Ignore extremely slow gestures.
         */

        if (
            elapsed >
            SWIPE_MAX_TIME
        ) {

            return;

        }


        /*
         * Horizontal swipe
         */

        if (
            Math.abs(deltaX) >
            Math.abs(deltaY)
        ) {

            if (deltaX > 0) {

                changeDirection({

                    x: 1,
                    y: 0

                });

            }

            else {

                changeDirection({

                    x: -1,
                    y: 0

                });

            }

        }


        /*
         * Vertical swipe
         */

        else {

            if (deltaY > 0) {

                changeDirection({

                    x: 0,
                    y: 1

                });

            }

            else {

                changeDirection({

                    x: 0,
                    y: -1

                });

            }

        }

    },
    {
        passive: false
    }
);

/* =========================================================
   BEST SCORE
   ========================================================= */

let bestScore =
    Number(
        localStorage.getItem("snakeBestScore")
    ) || 0;


bestScoreElement.textContent =
    bestScore;


/* =========================================================
   INITIALIZE GAME
   ========================================================= */

function initializeGame() {

    snake = [

        {
            x: 12,
            y: 12
        },

        {
            x: 11,
            y: 12
        },

        {
            x: 10,
            y: 12
        }

    ];


    direction = {

        x: 1,
        y: 0

    };


    nextDirection = {

        x: 1,
        y: 0

    };


    score = 0;

    level = 1;

    speed = 140;

    paused = false;


    updateStats();

    createFood();

    draw();

}


/* =========================================================
   START GAME
   ========================================================= */

function startGame() {

    if (gameRunning) {

        return;

    }


    initializeGame();


    gameRunning = true;


    overlay.classList.add("hidden");


    pauseButton.textContent =
        "⏸ Pause";


    startLoop();

}


/* =========================================================
   GAME LOOP
   ========================================================= */

function startLoop() {

    clearInterval(gameLoop);


    gameLoop = setInterval(

        update,

        speed

    );

}


/* =========================================================
   UPDATE
   ========================================================= */

function update() {

    if (!gameRunning || paused) {

        return;

    }


    direction = {

        x: nextDirection.x,

        y: nextDirection.y

    };


    const head = {

        x: snake[0].x + direction.x,

        y: snake[0].y + direction.y

    };


    /* =========================================================
    WALL WRAP
    Snake comes out from the opposite side
    ========================================================= */

    if (head.x < 0) {

        head.x = GRID_SIZE - 1;

    }

    else if (head.x >= GRID_SIZE) {

        head.x = 0;

    }


    if (head.y < 0) {

        head.y = GRID_SIZE - 1;

    }

    else if (head.y >= GRID_SIZE) {

        head.y = 0;

    }


    /* SELF COLLISION */

    if (snake.some(segment =>

        segment.x === head.x &&
        segment.y === head.y

    )) {

        gameOver();

        return;

    }


    snake.unshift(head);


    /* FOOD */

    if (

        head.x === food.x &&
        head.y === food.y

    ) {

        score++;

        updateLevel();

        createFood();

        updateStats();

    } else {

        snake.pop();

    }


    draw();

}


/* =========================================================
   CREATE FOOD
   ========================================================= */

function createFood() {

    let position;


    do {

        position = {

            x:
                Math.floor(
                    Math.random() * GRID_SIZE
                ),

            y:
                Math.floor(
                    Math.random() * GRID_SIZE
                )

        };

    } while (

        snake.some(segment =>

            segment.x === position.x &&
            segment.y === position.y

        )

    );


    food = position;

}


/* =========================================================
   LEVEL
   ========================================================= */

function updateLevel() {

    level =
        Math.floor(score / 5) + 1;


    speed =
        Math.max(
            55,
            140 - ((level - 1) * 10)
        );


    startLoop();

}


/* =========================================================
   STATS
   ========================================================= */

function updateStats() {

    scoreElement.textContent =
        score;

    levelElement.textContent =
        level;

    bestScoreElement.textContent =
        bestScore;

}


/* =========================================================
   DRAW
   ========================================================= */

function draw() {

    drawBackground();

    drawFood();

    drawSnake();

}


/* =========================================================
   BACKGROUND
   ========================================================= */

function drawBackground() {

    ctx.fillStyle = "#07110b";

    ctx.fillRect(

        0,
        0,
        canvas.width,
        canvas.height

    );


    /* GRID */

    ctx.strokeStyle =
        "rgba(255,255,255,0.035)";

    ctx.lineWidth = 1;


    for (let i = 0; i <= GRID_SIZE; i++) {

        const position =
            i * CELL_SIZE;


        ctx.beginPath();

        ctx.moveTo(
            position,
            0
        );

        ctx.lineTo(
            position,
            canvas.height
        );

        ctx.stroke();


        ctx.beginPath();

        ctx.moveTo(
            0,
            position
        );

        ctx.lineTo(
            canvas.width,
            position
        );

        ctx.stroke();

    }

}


/* =========================================================
   DRAW SNAKE
   ========================================================= */

function drawSnake() {

    snake.forEach((segment, index) => {

        const padding = 2;

        const x =
            segment.x * CELL_SIZE +
            padding;

        const y =
            segment.y * CELL_SIZE +
            padding;

        const size =
            CELL_SIZE -
            padding * 2;


        ctx.fillStyle =
            index === 0
                ? "#66ff88"
                : "#35d968";


        roundRect(

            ctx,
            x,
            y,
            size,
            size,
            6

        );


        ctx.fill();


        /* EYES */

        if (index === 0) {

            drawEyes(
                x,
                y,
                size
            );

        }

    });

}


/* =========================================================
   DRAW EYES
   ========================================================= */

function drawEyes(x, y, size) {

    ctx.fillStyle = "#07110b";


    let eye1;

    let eye2;


    if (direction.x !== 0) {

        eye1 = {

            x:
                x +
                (direction.x > 0
                    ? size * 0.68
                    : size * 0.32),

            y:
                y +
                size * 0.30

        };


        eye2 = {

            x:
                x +
                (direction.x > 0
                    ? size * 0.68
                    : size * 0.32),

            y:
                y +
                size * 0.70

        };

    } else {

        eye1 = {

            x:
                x +
                size * 0.30,

            y:
                y +
                (direction.y > 0
                    ? size * 0.68
                    : size * 0.32)

        };


        eye2 = {

            x:
                x +
                size * 0.70,

            y:
                y +
                (direction.y > 0
                    ? size * 0.68
                    : size * 0.32)

        };

    }


    ctx.beginPath();

    ctx.arc(
        eye1.x,
        eye1.y,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        eye2.x,
        eye2.y,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


/* =========================================================
   DRAW FOOD
   ========================================================= */

function drawFood() {

    const centerX =
        food.x * CELL_SIZE +
        CELL_SIZE / 2;

    const centerY =
        food.y * CELL_SIZE +
        CELL_SIZE / 2;


    ctx.fillStyle = "#ff4d67";


    ctx.shadowColor =
        "#ff4d67";

    ctx.shadowBlur = 18;


    ctx.beginPath();

    ctx.arc(

        centerX,

        centerY,

        CELL_SIZE * 0.30,

        0,

        Math.PI * 2

    );

    ctx.fill();


    ctx.shadowBlur = 0;

}


/* =========================================================
   ROUNDED RECT
   ========================================================= */

function roundRect(

    context,
    x,
    y,
    width,
    height,
    radius

) {

    context.beginPath();

    context.roundRect(

        x,
        y,
        width,
        height,
        radius

    );

}


/* =========================================================
   CHANGE DIRECTION
   ========================================================= */

function changeDirection(newDirection) {

    if (!gameRunning || paused) {

        return;

    }


    const opposite =

        direction.x === -newDirection.x &&
        direction.y === -newDirection.y;


    if (opposite) {

        return;

    }


    nextDirection =
        newDirection;

}


/* =========================================================
   KEYBOARD
   ========================================================= */

document.addEventListener(

    "keydown",

    event => {

        const key =
            event.key.toLowerCase();


        if (

            [
                "arrowup",
                "arrowdown",
                "arrowleft",
                "arrowright",
                "w",
                "a",
                "s",
                "d",
                " "
            ].includes(key)

        ) {

            event.preventDefault();

        }


        if (

            key === "arrowup" ||
            key === "w"

        ) {

            changeDirection({

                x: 0,
                y: -1

            });

        }


        else if (

            key === "arrowdown" ||
            key === "s"

        ) {

            changeDirection({

                x: 0,
                y: 1

            });

        }


        else if (

            key === "arrowleft" ||
            key === "a"

        ) {

            changeDirection({

                x: -1,
                y: 0

            });

        }


        else if (

            key === "arrowright" ||
            key === "d"

        ) {

            changeDirection({

                x: 1,
                y: 0

            });

        }


        else if (key === " ") {

            togglePause();

        }

    }

);


/* =========================================================
   MOBILE CONTROLS
   ========================================================= */

document
    .querySelectorAll(".control-button")
    .forEach(button => {

        const handleControl = event => {

            event.preventDefault();


            const directionName =
                button.dataset.direction;


            const directions = {

                up: {
                    x: 0,
                    y: -1
                },

                down: {
                    x: 0,
                    y: 1
                },

                left: {
                    x: -1,
                    y: 0
                },

                right: {
                    x: 1,
                    y: 0
                }

            };


            changeDirection(

                directions[
                    directionName
                ]

            );

        };


        button.addEventListener(
            "pointerdown",
            handleControl
        );

    });


/* =========================================================
   PAUSE
   ========================================================= */

function togglePause() {

    if (!gameRunning) {

        return;

    }


    paused = !paused;


    pauseButton.textContent =

        paused
            ? "▶ Resume"
            : "⏸ Pause";

}


pauseButton.addEventListener(

    "click",

    togglePause

);


/* =========================================================
   RESTART
   ========================================================= */

restartButton.addEventListener(

    "click",

    () => {

        gameRunning = false;

        clearInterval(gameLoop);

        startGame();

    }

);


/* =========================================================
   GAME OVER
   ========================================================= */

function gameOver() {

    gameRunning = false;

    clearInterval(gameLoop);


    if (score > bestScore) {

        bestScore = score;

        localStorage.setItem(

            "snakeBestScore",

            bestScore

        );

    }


    updateStats();


    overlayIcon.textContent = "💥";

    overlayTitle.textContent = "Game Over";

    overlayMessage.textContent =

        `Your score: ${score} • Best: ${bestScore}`;


    startButton.textContent =
        "Play Again";


    overlay.classList.remove("hidden");

}


/* =========================================================
   START BUTTON
   ========================================================= */

startButton.addEventListener(

    "click",

    startGame

);


/* =========================================================
   THEME
   ========================================================= */

const savedTheme =
    localStorage.getItem("snakeTheme");


if (savedTheme === "light") {

    document.body.classList.add("light");

    themeButton.textContent = "☀️";

}


themeButton.addEventListener(

    "click",

    () => {

        document.body.classList.toggle("light");


        const light =
            document.body.classList.contains("light");


        localStorage.setItem(

            "snakeTheme",

            light
                ? "light"
                : "dark"

        );


        themeButton.textContent =

            light
                ? "☀️"
                : "🌙";

    }

);


/* =========================================================
   INITIAL DRAW
   ========================================================= */

initializeGame();