/* =========================================================
   MOSAYAD GAMES
   CAR RACING
   GAME ENGINE
   ========================================================= */


/* =========================================================
   ELEMENTS
   ========================================================= */

const gameArea =
    document.getElementById("game-area");

const road =
    document.getElementById("road");

const player =
    document.getElementById("player");

const scoreElement =
    document.getElementById("score");

const bestScoreElement =
    document.getElementById("best-score");

const startScreen =
    document.getElementById("start-screen");

const gameOverScreen =
    document.getElementById("game-over-screen");

const startButton =
    document.getElementById("start-button");

const restartButton =
    document.getElementById("restart-button");

const finalScoreElement =
    document.getElementById("final-score");

const leftButton =
    document.getElementById("left-button");

const rightButton =
    document.getElementById("right-button");


/* =========================================================
   GAME SETTINGS
   ========================================================= */

const LANES = 4;

const PLAYER_BOTTOM = 20;

const INITIAL_SPEED = 3;

const MAX_SPEED = 12;

const SPEED_INCREASE = 0.0012;

const SPAWN_START = 900;

const MIN_SPAWN_TIME = 380;


/* =========================================================
   GAME STATE
   ========================================================= */

let gameRunning = false;

let animationId = null;

let lastTime = 0;

let score = 0;

let speed = INITIAL_SPEED;

let spawnTimer = 0;

let spawnInterval = SPAWN_START;

let roadOffset = 0;

let playerLane = 1;

let enemies = [];

let roadLines = [];


/* =========================================================
   BEST SCORE
   ========================================================= */

let bestScore =
    Number(
        localStorage.getItem(
            "mosayad_car_best"
        )
    ) || 0;

bestScoreElement.textContent =
    bestScore;


/* =========================================================
   CAR COLORS
   ========================================================= */

const enemyColors = [
    "#ef4444",
    "#f97316",
    "#a855f7",
    "#22c55e",
    "#eab308",
    "#ec4899",
    "#06b6d4",
    "#f43f5e"
];


/* =========================================================
   CREATE ROAD LINES
   ========================================================= */

function createRoadLines() {

    roadLines.forEach(
        line => line.remove()
    );

    roadLines = [];

    const lineCount = 14;

    for (
        let i = 0;
        i < lineCount;
        i++
    ) {

        const line =
            document.createElement("div");

        line.className =
            "road-line";

        /*
         * 3 lines separate 4 lanes
         */

        const lanePosition =
            25 +
            (i % 3) * 25;

        line.style.left =
            `${lanePosition}%`;

        line.style.top =
            `${i * 130 - 130}px`;

        road.appendChild(line);

        roadLines.push(line);
    }

    /*
     * Extra visual glow
     */

    if (
        !road.querySelector(
            ".road-glow"
        )
    ) {

        const glow =
            document.createElement("div");

        glow.className =
            "road-glow";

        road.appendChild(glow);
    }
}


/* =========================================================
   LANE POSITION
   ========================================================= */

function getLaneX(lane) {

    const roadWidth =
        gameArea.clientWidth;


    /*
     * Leave a small safe margin
     * but use almost the entire road.
     */

    const start =
        roadWidth * 0.08;

    const usableWidth =
        roadWidth * 0.84;

    const laneWidth =
        usableWidth / LANES;

    return (
        start +
        lane * laneWidth +
        laneWidth / 2
    );
}


/* =========================================================
   POSITION PLAYER
   ========================================================= */

function positionPlayer() {

    const x =
        getLaneX(playerLane);

    player.style.left =
        `${x}px`;
}


/* =========================================================
   RESET PLAYER
   ========================================================= */

function resetPlayer() {

    playerLane = 1;

    player.style.bottom =
        `${PLAYER_BOTTOM}px`;

    player.classList.remove(
        "crash"
    );

    positionPlayer();
}


/* =========================================================
   CREATE ENEMY
   ========================================================= */

function createEnemy() {

    /*
     * Prevent too many cars
     */

    if (enemies.length >= 7) {
        return;
    }

    /*
     * Find possible lanes.
     */

    const possibleLanes = [];

    for (
        let lane = 0;
        lane < LANES;
        lane++
    ) {

        const occupied =
            enemies.some(
                enemy =>
                    enemy.lane === lane &&
                    enemy.y < 170
            );

        if (!occupied) {
            possibleLanes.push(lane);
        }
    }

    if (
        possibleLanes.length === 0
    ) {
        return;
    }

    const lane =
        possibleLanes[
            Math.floor(
                Math.random() *
                possibleLanes.length
            )
        ];

    const enemy =
        document.createElement("div");

    enemy.className =
        "car enemy-car";

    /*
     * Random color
     */

    const color =
        enemyColors[
            Math.floor(
                Math.random() *
                enemyColors.length
            )
        ];

    enemy.style.background =
        `linear-gradient(
            160deg,
            ${color},
            ${darkenColor(color)}
        )`;

        /*
     * Lights
     */

    const leftLight =
        document.createElement("span");

    leftLight.className =
        "light left";

    const rightLight =
        document.createElement("span");

    rightLight.className =
        "light right";

    leftLight.style.color =
        "#fff";

    rightLight.style.color =
        "#fff";

    enemy.appendChild(leftLight);
    enemy.appendChild(rightLight);

    road.appendChild(enemy);

    const x =
        getLaneX(lane);

    const enemyObject = {

        element: enemy,

        lane: lane,

        x: x,

        y: -180,

        speed:
            speed *
            (
                0.85 +
                Math.random() *
                0.35
            )
    };

    enemy.style.left =
        `${x}px`;

    enemy.style.top =
        `${enemyObject.y}px`;

    enemies.push(
        enemyObject
    );
}


/* =========================================================
   DARKEN COLOR
   ========================================================= */

function darkenColor(hex) {

    let color =
        hex.replace("#", "");

    let r =
        parseInt(
            color.substring(0, 2),
            16
        );

    let g =
        parseInt(
            color.substring(2, 4),
            16
        );

    let b =
        parseInt(
            color.substring(4, 6),
            16
        );

    r =
        Math.max(
            0,
            Math.floor(r * 0.65)
        );

    g =
        Math.max(
            0,
            Math.floor(g * 0.65)
        );

    b =
        Math.max(
            0,
            Math.floor(b * 0.65)
        );

    return (
        "#" +
        r.toString(16).padStart(2, "0") +
        g.toString(16).padStart(2, "0") +
        b.toString(16).padStart(2, "0")
    );
}


/* =========================================================
   MOVE ROAD
   ========================================================= */

function updateRoad(delta) {

    roadOffset +=
        speed *
        delta /
        16;

    const spacing = 130;

    roadLines.forEach(
        (line, index) => {

            let y =
                index * spacing -
                130 +
                roadOffset;

            const totalHeight =
                gameArea.clientHeight +
                200;

            y =
                (
                    y %
                    totalHeight
                );

            if (y < -150) {
                y += totalHeight;
            }

            line.style.top =
                `${y}px`;
        }
    );
}


/* =========================================================
   MOVE ENEMIES
   ========================================================= */

function updateEnemies(delta) { for ( let i = enemies.length - 1; i >= 0; i-- ) { const enemy = enemies[i]; /* * Move enemy */ enemy.y += enemy.speed * delta / 16; /* * ===================================== * PERSPECTIVE * ===================================== * * Far away = small * Near player = normal size */ const screenHeight = gameArea.clientHeight; const progress = Math.max( 0, Math.min( 1, enemy.y / screenHeight ) ); /* * Position */ enemy.element.style.left = `${enemy.x}px`; enemy.element.style.top = `${enemy.y}px`; /* * Remove cars after leaving screen */ if ( enemy.y > screenHeight + 150 ) { enemy.element.remove(); enemies.splice(i, 1); score++; updateScore(); continue; } /* * Collision */ if ( checkCollision( player, enemy.element ) ) { gameOver(); return; } } }


/* =========================================================
   COLLISION
   ========================================================= */

function checkCollision(
    playerElement,
    enemyElement
) {

    const p =
        playerElement.getBoundingClientRect();

    const e =
        enemyElement.getBoundingClientRect();

    /*
     * ==========================================
     * EXTRA HITBOX
     * ==========================================
     *
     * The visual cars can stay small,
     * but their collision area is slightly
     * larger so small phones don't miss
     * collisions near the edges.
     */

    const playerPaddingX = 3;
    const playerPaddingY = 3;

    const enemyPaddingX = 3;
    const enemyPaddingY = 3;


    const playerLeft =
        p.left - playerPaddingX;

    const playerRight =
        p.right + playerPaddingX;

    const playerTop =
        p.top - playerPaddingY;

    const playerBottom =
        p.bottom + playerPaddingY;


    const enemyLeft =
        e.left - enemyPaddingX;

    const enemyRight =
        e.right + enemyPaddingX;

    const enemyTop =
        e.top - enemyPaddingY;

    const enemyBottom =
        e.bottom + enemyPaddingY;


    return !(
        playerRight < enemyLeft ||
        playerLeft > enemyRight ||
        playerBottom < enemyTop ||
        playerTop > enemyBottom
    );
}


/* =========================================================
   SCORE
   ========================================================= */

function updateScore() {

    scoreElement.textContent =
        score;

    if (score > bestScore) {

        bestScore =
            score;

        bestScoreElement.textContent =
            bestScore;

        localStorage.setItem(
            "mosayad_car_best",
            bestScore
        );
    }
}


/* =========================================================
   SPEED
   ========================================================= */

function updateSpeed(delta) {

    speed +=
        SPEED_INCREASE *
        delta;

    speed =
        Math.min(
            speed,
            MAX_SPEED
        );

    /*
     * Spawn faster as game gets harder.
     */

    spawnInterval =
        Math.max(
            MIN_SPAWN_TIME,
            SPAWN_START -
            score * 12
        );
}


/* =========================================================
   PLAYER MOVEMENT
   ========================================================= */

function moveLeft() {

    if (!gameRunning) {
        return;
    }

    if (playerLane > 0) {

        playerLane--;

        positionPlayer();

        playMoveSound();
    }
}


function moveRight() {

    if (!gameRunning) {
        return;
    }

    if (
        playerLane <
        LANES - 1
    ) {

        playerLane++;

        positionPlayer();

        playMoveSound();
    }
}


/* =========================================================
   KEYBOARD
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "ArrowLeft" ||
            event.key.toLowerCase() === "a"
        ) {

            event.preventDefault();

            moveLeft();
        }

        if (
            event.key ===
            "ArrowRight" ||
            event.key.toLowerCase() === "d"
        ) {

            event.preventDefault();

            moveRight();
        }

        /*
         * Space / Enter starts game.
         */

        if (
            (
                event.key === " " ||
                event.key === "Enter"
            ) &&
            !gameRunning
        ) {

            if (
                !startScreen.classList.contains(
                    "hidden"
                )
            ) {

                startGame();

            } else if (
                !gameOverScreen.classList.contains(
                    "hidden"
                )
            ) {

                startGame();
            }
        }
    }
);


/* =========================================================
   MOBILE CONTROLS
   ========================================================= */

leftButton.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();

        moveLeft();
    }
);


rightButton.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();

        moveRight();
    }
);


/* =========================================================
   BUTTONS
   ========================================================= */

startButton.addEventListener(
    "click",
    startGame
);

restartButton.addEventListener(
    "click",
    startGame
);


/* =========================================================
   START GAME
   ========================================================= */

function startGame() {

    /*
     * Remove old enemies.
     */

    enemies.forEach(
        enemy =>
            enemy.element.remove()
    );

    enemies = [];

    /*
     * Reset values.
     */

    score = 0;

    speed =
        INITIAL_SPEED;

    spawnTimer = 0;

    spawnInterval =
        SPAWN_START;

    roadOffset = 0;

    updateScore();

    resetPlayer();

    /*
     * Hide screens.
     */

    startScreen.classList.add(
        "hidden"
    );

    gameOverScreen.classList.add(
        "hidden"
    );

    gameArea.classList.remove(
        "hit"
    );

    /*
     * Start.
     */

    gameRunning = true;

    lastTime =
        performance.now();

    playStartSound();

    cancelAnimationFrame(
        animationId
    );

    animationId =
        requestAnimationFrame(
            gameLoop
        );
}


/* =========================================================
   GAME LOOP
   ========================================================= */

function gameLoop(timestamp) {

    if (!gameRunning) {
        return;
    }

    const delta =
        Math.min(
            timestamp - lastTime,
            50
        );

    lastTime =
        timestamp;

    /*
     * Road.
     */

    updateRoad(delta);

    /*
     * Enemy cars.
     */

    updateEnemies(delta);

    /*
     * Speed.
     */

    updateSpeed(delta);

    /*
     * Spawn.
     */

    spawnTimer += delta;

    if (
        spawnTimer >=
        spawnInterval
    ) {

        createEnemy();

        spawnTimer = 0;
    }

    animationId =
        requestAnimationFrame(
            gameLoop
        );
}


/* =========================================================
   GAME OVER
   ========================================================= */

function gameOver() {

    if (!gameRunning) {
        return;
    }

    gameRunning = false;

    cancelAnimationFrame(
        animationId
    );

    player.classList.add(
        "crash"
    );

    gameArea.classList.add(
        "hit"
    );

    finalScoreElement.textContent =
        score;

    /*
     * Update best score.
     */

    if (score > bestScore) {

        bestScore =
            score;

        bestScoreElement.textContent =
            bestScore;

        localStorage.setItem(
            "mosayad_car_best",
            bestScore
        );
    }

    playCrashSound();

    setTimeout(
        () => {

            gameOverScreen.classList.remove(
                "hidden"
            );

        },
        350
    );
}


/* =========================================================
   WINDOW RESIZE
   ========================================================= */

window.addEventListener(
    "resize",
    () => {

        if (!gameRunning) {
            positionPlayer();
            return;
        }

        positionPlayer();

        enemies.forEach(
            enemy => {

                enemy.x =
                    getLaneX(
                        enemy.lane
                    );

                enemy.element.style.left =
                    `${enemy.x}px`;
            }
        );
    }
);


/* =========================================================
   AUDIO
   ========================================================= */

let audioContext = null;


function getAudioContext() {

    if (!audioContext) {

        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();
    }

    if (
        audioContext.state ===
        "suspended"
    ) {

        audioContext.resume();
    }

    return audioContext;
}


/* =========================================================
   SOUND HELPER
   ========================================================= */

function beep(
    frequency,
    duration,
    type = "sine",
    volume = 0.05
) {

    try {

        const ctx =
            getAudioContext();

        const oscillator =
            ctx.createOscillator();

        const gain =
            ctx.createGain();

        oscillator.type =
            type;

        oscillator.frequency.value =
            frequency;

        gain.gain.setValueAtTime(
            volume,
            ctx.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime +
            duration
        );

        oscillator.connect(
            gain
        );

        gain.connect(
            ctx.destination
        );

        oscillator.start();

        oscillator.stop(
            ctx.currentTime +
            duration
        );

    } catch (error) {

        /*
         * Audio is optional.
         */

    }
}


/* =========================================================
   START SOUND
   ========================================================= */

function playStartSound() {

    beep(
        330,
        0.08,
        "square",
        0.035
    );

    setTimeout(
        () => {

            beep(
                440,
                0.08,
                "square",
                0.035
            );

        },
        90
    );

    setTimeout(
        () => {

            beep(
                660,
                0.14,
                "square",
                0.04
            );

        },
        180
    );
}


/* =========================================================
   MOVE SOUND
   ========================================================= */

function playMoveSound() {

    beep(
        280,
        0.045,
        "sine",
        0.025
    );
}


/* =========================================================
   CRASH SOUND
   ========================================================= */

function playCrashSound() {

    beep(
        90,
        0.3,
        "sawtooth",
        0.08
    );

    setTimeout(
        () => {

            beep(
                55,
                0.4,
                "square",
                0.06
            );

        },
        80
    );
}


/* =========================================================
   INITIALIZE
   ========================================================= */

createRoadLines();

resetPlayer();

updateScore();


/* =========================================================
   PREVENT SCROLLING WITH ARROWS
   ========================================================= */

window.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "ArrowLeft" ||
            event.key === "ArrowRight"
        ) {

            event.preventDefault();
        }
    },
    {
        passive: false
    }
);
