/* =========================================================
   MOSAYAD GAMES
   8-BALL POOL
   PLAYER VS COMPUTER
   ========================================================= */


/* =========================================================
   CANVAS
   ========================================================= */

const canvas =
    document.getElementById("poolCanvas");

const ctx =
    canvas.getContext("2d");


/* =========================================================
   UI
   ========================================================= */

const scoreElement =
    document.getElementById("score");

const bestScoreElement =
    document.getElementById("best-score");

const powerSlider =
    document.getElementById("power-slider");

const powerValue =
    document.getElementById("power-value");

const shootButton =
    document.getElementById("shoot-button");

const newGameButton =
    document.getElementById("new-game-button");

const startScreen =
    document.getElementById("start-screen");

const startButton =
    document.getElementById("start-button");

const gameOverScreen =
    document.getElementById("game-over-screen");

const playAgainButton =
    document.getElementById(
        "play-again-button"
    );

const resultIcon =
    document.getElementById(
        "result-icon"
    );

const resultTitle =
    document.getElementById(
        "result-title"
    );

const resultMessage =
    document.getElementById(
        "result-message"
    );

const finalScoreElement =
    document.getElementById(
        "final-score"
    );

const turnText =
    document.getElementById(
        "turn-text"
    );

const playerCard =
    document.getElementById(
        "player-card"
    );

const computerCard =
    document.getElementById(
        "computer-card"
    );

const playerType =
    document.getElementById(
        "player-type"
    );

const computerType =
    document.getElementById(
        "computer-type"
    );


/* =========================================================
   GAME CONSTANTS
   ========================================================= */

const TABLE_RATIO = 2;

const BALL_RADIUS = 10;

const POCKET_RADIUS = 18;

const FRICTION = 0.985;

const MIN_SPEED = 0.035;

const MAX_POWER = 13;

const BALL_RESTITUTION = 0.92;

const RAIL_RESTITUTION = 0.88;


/* =========================================================
   GAME STATE
   ========================================================= */

let balls = [];

let currentPlayer =
    "player";

let gameStarted =
    false;

let ballsMoving =
    false;

let shotInProgress =
    false;

let playerGroup =
    null;

let computerGroup =
    null;

let score =
    0;

let bestScore =
    Number(
        localStorage.getItem(
            "mosayad_pool_best"
        )
    ) || 0;

let aiming =
    false;

let mouseX = 0;

let mouseY = 0;

let animationFrame =
    null;

let shotPocketed = [];

let cueBallPocketed =
    false;

let scratch =
    false;


/* =========================================================
   TABLE
   ========================================================= */

let table = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
};


/* =========================================================
   POCKETS
   ========================================================= */

let pockets = [];


/* =========================================================
   BALL COLORS
   ========================================================= */

const ballColors = {

    1: "#facc15",
    2: "#2563eb",
    3: "#dc2626",
    4: "#7c3aed",
    5: "#f97316",
    6: "#16a34a",
    7: "#7f1d1d",

    8: "#050505",

    9: "#facc15",
    10: "#2563eb",
    11: "#dc2626",
    12: "#7c3aed",
    13: "#f97316",
    14: "#16a34a",
    15: "#7f1d1d"
};


/* =========================================================
   INITIALIZE
   ========================================================= */

bestScoreElement.textContent =
    bestScore;

powerValue.textContent =
    `${powerSlider.value}%`;

resizeCanvas();

window.addEventListener(
    "resize",
    resizeCanvas
);


/* =========================================================
   RESIZE CANVAS
   ========================================================= */

function resizeCanvas() {

    const rect =
        canvas.getBoundingClientRect();

    const dpr =
        window.devicePixelRatio || 1;

    canvas.width =
        Math.floor(
            rect.width * dpr
        );

    canvas.height =
        Math.floor(
            rect.height * dpr
        );

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    table.x = 0;
    table.y = 0;

    table.width =
        rect.width;

    table.height =
        rect.height;


    createPockets();


    if (
        balls.length &&
        !ballsMoving
    ) {

        /*
         * Keep balls inside
         * after resize.
         */

        balls.forEach(
            ball => {

                ball.x =
                    Math.max(
                        BALL_RADIUS,
                        Math.min(
                            table.width -
                            BALL_RADIUS,
                            ball.x
                        )
                    );

                ball.y =
                    Math.max(
                        BALL_RADIUS,
                        Math.min(
                            table.height -
                            BALL_RADIUS,
                            ball.y
                        )
                    );
            }
        );
    }


    draw();
}


/* =========================================================
   CREATE POCKETS
   ========================================================= */

function createPockets() {

    const w =
        table.width;

    const h =
        table.height;

    pockets = [

        {
            x: 0,
            y: 0
        },

        {
            x: w / 2,
            y: 0
        },

        {
            x: w,
            y: 0
        },

        {
            x: 0,
            y: h
        },

        {
            x: w / 2,
            y: h
        },

        {
            x: w,
            y: h
        }

    ];
}


/* =========================================================
   CREATE BALL
   ========================================================= */

function createBall(
    number,
    x,
    y
) {

    const ball = {

        number,

        x,
        y,

        vx: 0,
        vy: 0,

        radius:
            BALL_RADIUS,

        pocketed:
            false,

        group:
            number === 0
                ? "cue"
                : number === 8
                    ? "eight"
                    : number <= 7
                        ? "solid"
                        : "stripe"

    };

    balls.push(ball);

    return ball;
}


/* =========================================================
   NEW GAME
   ========================================================= */

function newGame() {

    cancelAnimationFrame(
        animationFrame
    );

    balls = [];

    currentPlayer =
        "player";

    gameStarted =
        true;

    ballsMoving =
        false;

    shotInProgress =
        false;

    playerGroup =
        null;

    computerGroup =
        null;

    score =
        0;

    shotPocketed = [];

    cueBallPocketed =
        false;

    scratch =
        false;

    scoreElement.textContent =
        "0";

    updateTurnUI();


    const w =
        table.width;

    const h =
        table.height;


    /*
     * Cue ball
     */

    createBall(
        0,
        w * 0.25,
        h / 2
    );


    /*
     * Rack position
     */

    const rackX =
        w * 0.70;

    const rackY =
        h / 2;


    const spacing =
        BALL_RADIUS * 2.02;


    /*
     * Standard triangular rack.
     */

    const rack = [

        [1],

        [2, 3],

        [4, 8, 5],

        [6, 7, 9, 10],

        [11, 12, 13, 14, 15]

    ];


    for (
        let row = 0;
        row < rack.length;
        row++
    ) {

        for (
            let col = 0;
            col < rack[row].length;
            col++
        ) {

            const number =
                rack[row][col];

            const x =
                rackX +
                row * spacing * 0.86;

            const y =
                rackY +
                (
                    col -
                    (row / 2)
                ) *
                spacing;

            createBall(
                number,
                x,
                y
            );
        }
    }


    startScreen.classList.add(
        "hidden"
    );

    gameOverScreen.classList.add(
        "hidden"
    );

    shootButton.disabled =
        false;

    draw();
}


/* =========================================================
   START BUTTON
   ========================================================= */

startButton.addEventListener(
    "click",
    () => {

        initAudio();

        newGame();

    }
);


playAgainButton.addEventListener(
    "click",
    () => {

        newGame();

    }
);


newGameButton.addEventListener(
    "click",
    () => {

        initAudio();

        newGame();

    }
);


/* =========================================================
   POWER
   ========================================================= */

powerSlider.addEventListener(
    "input",
    () => {

        powerValue.textContent =
            `${powerSlider.value}%`;

    }
);


/* =========================================================
   GET CANVAS POSITION
   ========================================================= */

function getPointerPosition(
    event
) {

    const rect =
        canvas.getBoundingClientRect();

    let clientX;
    let clientY;


    if (
        event.touches &&
        event.touches.length
    ) {

        clientX =
            event.touches[0].clientX;

        clientY =
            event.touches[0].clientY;

    } else {

        clientX =
            event.clientX;

        clientY =
            event.clientY;
    }


    return {

        x:
            clientX -
            rect.left,

        y:
            clientY -
            rect.top
    };
}


/* =========================================================
   POINTER DOWN
   ========================================================= */

canvas.addEventListener(
    "pointerdown",
    event => {

        if (
            !gameStarted ||
            currentPlayer !== "player" ||
            ballsMoving ||
            shotInProgress
        ) {

            return;
        }


        const cue =
            getCueBall();

        if (
            !cue ||
            cue.pocketed
        ) {

            return;
        }


        const point =
            getPointerPosition(event);


        mouseX =
            point.x;

        mouseY =
            point.y;

        aiming =
            true;

        canvas.setPointerCapture(
            event.pointerId
        );

        draw();

    }
);


/* =========================================================
   POINTER MOVE
   ========================================================= */

canvas.addEventListener(
    "pointermove",
    event => {

        const point =
            getPointerPosition(event);

        mouseX =
            point.x;

        mouseY =
            point.y;


        if (aiming) {

            draw();
        }
    }
);


/* =========================================================
   POINTER UP
   ========================================================= */

canvas.addEventListener(
    "pointerup",
    event => {

        if (!aiming) {
            return;
        }

        aiming =
            false;

        shoot();

    }
);


/* =========================================================
   SHOOT BUTTON
   ========================================================= */

shootButton.addEventListener(
    "click",
    () => {

        if (
            currentPlayer === "player" &&
            !ballsMoving &&
            !shotInProgress
        ) {

            shoot();
        }

    }
);


/* =========================================================
   GET CUE BALL
   ========================================================= */

function getCueBall() {

    return balls.find(
        ball =>
            ball.number === 0
    );
}


/* =========================================================
   SHOOT
   ========================================================= */

function shoot() {

    if (
        !gameStarted ||
        currentPlayer !== "player" ||
        ballsMoving ||
        shotInProgress
    ) {

        return;
    }


    const cue =
        getCueBall();


    if (!cue) {
        return;
    }


    let dx =
        mouseX -
        cue.x;

    let dy =
        mouseY -
        cue.y;


    const distance =
        Math.hypot(
            dx,
            dy
        );


    if (
        distance <
        5
    ) {

        /*
         * Default direction.
         */

        dx = 1;
        dy = 0;

    }


    dx /=
        distance;

    dy /=
        distance;


    const power =
        Number(
            powerSlider.value
        ) / 100;


    const velocity =
        MAX_POWER *
        power;


    cue.vx =
        dx *
        velocity;

    cue.vy =
        dy *
        velocity;


    shotInProgress =
        true;

    ballsMoving =
        true;

    shotPocketed = [];

    cueBallPocketed =
        false;

    scratch =
        false;

    shootButton.disabled =
        true;


    playHitSound();

    animate();

}


/* =========================================================
   ANIMATION
   ========================================================= */

function animate() {

    updatePhysics();

    draw();


    if (ballsMoving) {

        animationFrame =
            requestAnimationFrame(
                animate
            );

    } else {

        finishShot();
    }
}


/* =========================================================
   PHYSICS
   ========================================================= */

function updatePhysics() {

    let moving =
        false;


    /*
     * Move balls
     */

    for (
        const ball of balls
    ) {

        if (
            ball.pocketed
        ) {

            continue;
        }


        ball.x +=
            ball.vx;

        ball.y +=
            ball.vy;


        /*
         * Friction
         */

        ball.vx *=
            FRICTION;

        ball.vy *=
            FRICTION;


        if (
            Math.abs(ball.vx) <
            MIN_SPEED
        ) {

            ball.vx = 0;
        }


        if (
            Math.abs(ball.vy) <
            MIN_SPEED
        ) {

            ball.vy = 0;
        }


        /*
         * Rail collision
         */

        handleRailCollision(
            ball
        );


        /*
         * Pocket detection
         */

        checkPocket(
            ball
        );


        if (
            Math.abs(ball.vx) >
                0 ||
            Math.abs(ball.vy) >
                0
        ) {

            moving =
                true;
        }
    }


    /*
     * Ball-to-ball collision
     */

    for (
        let i = 0;
        i < balls.length;
        i++
    ) {

        for (
            let j = i + 1;
            j < balls.length;
            j++
        ) {

            resolveBallCollision(
                balls[i],
                balls[j]
            );
        }
    }


    ballsMoving =
        moving;
}


/* =========================================================
   RAIL COLLISION
   ========================================================= */

function handleRailCollision(
    ball
) {

    const r =
        ball.radius;


    if (
        ball.x - r < 0
    ) {

        ball.x = r;

        ball.vx =
            Math.abs(ball.vx) *
            RAIL_RESTITUTION;

        playRailSound();

    }


    if (
        ball.x + r >
        table.width
    ) {

        ball.x =
            table.width - r;

        ball.vx =
            -Math.abs(ball.vx) *
            RAIL_RESTITUTION;

        playRailSound();

    }


    if (
        ball.y - r < 0
    ) {

        ball.y = r;

        ball.vy =
            Math.abs(ball.vy) *
            RAIL_RESTITUTION;

        playRailSound();

    }


    if (
        ball.y + r >
        table.height
    ) {

        ball.y =
            table.height - r;

        ball.vy =
            -Math.abs(ball.vy) *
            RAIL_RESTITUTION;

        playRailSound();

    }
}


/* =========================================================
   BALL COLLISION
   ========================================================= */

function resolveBallCollision(
    a,
    b
) {

    if (
        a.pocketed ||
        b.pocketed
    ) {

        return;
    }


    const dx =
        b.x - a.x;

    const dy =
        b.y - a.y;


    const distance =
        Math.hypot(
            dx,
            dy
        );


    const minimum =
        a.radius +
        b.radius;


    if (
        distance <= 0 ||
        distance >= minimum
    ) {

        return;
    }


    /*
     * Collision normal
     */

    const nx =
        dx / distance;

    const ny =
        dy / distance;


    /*
     * Relative velocity
     */

    const relativeVelocityX =
        a.vx - b.vx;

    const relativeVelocityY =
        a.vy - b.vy;


    const velocityAlongNormal =
        relativeVelocityX * nx +
        relativeVelocityY * ny;


    /*
     * Balls moving away.
     */

    if (
        velocityAlongNormal < 0
    ) {

        return;
    }


    const impulse =
        (
            -(1 + BALL_RESTITUTION) *
            velocityAlongNormal
        ) / 2;


    a.vx +=
        impulse * nx;

    a.vy +=
        impulse * ny;


    b.vx -=
        impulse * nx;

    b.vy -=
        impulse * ny;


    /*
     * Separate overlapping balls.
     */

    const overlap =
        minimum -
        distance;


    const correction =
        overlap / 2;


    a.x -=
        correction * nx;

    a.y -=
        correction * ny;

    b.x +=
        correction * nx;

    b.y +=
        correction * ny;


    playBallSound();
}


/* =========================================================
   POCKET DETECTION
   ========================================================= */

function checkPocket(
    ball
) {

    for (
        const pocket of pockets
    ) {

        const dx =
            ball.x -
            pocket.x;

        const dy =
            ball.y -
            pocket.y;


        const distance =
            Math.hypot(
                dx,
                dy
            );


        if (
            distance <
            POCKET_RADIUS
        ) {

            pocketBall(
                ball
            );

            return;
        }
    }
}


/* =========================================================
   POCKET BALL
   ========================================================= */

function pocketBall(
    ball
) {

    ball.pocketed =
        true;

    ball.vx =
        0;

    ball.vy =
        0;


    shotPocketed.push(
        ball
    );


    playPocketSound();


    /*
     * Cue ball scratch
     */

    if (
        ball.number === 0
    ) {

        cueBallPocketed =
            true;

        scratch =
            true;

        return;
    }


    /*
     * Eight ball
     */

    if (
        ball.number === 8
    ) {

        handleEightBall();

        return;
    }


    /*
     * Assign group on first
     * successful pocket.
     */

    if (
        currentPlayer === "player" &&
        playerGroup === null
    ) {

        playerGroup =
            ball.group;

        computerGroup =
            ball.group === "solid"
                ? "stripe"
                : "solid";

        return;
    }


    if (
        currentPlayer === "computer" &&
        computerGroup === null
    ) {

        computerGroup =
            ball.group;

        playerGroup =
            ball.group === "solid"
                ? "stripe"
                : "solid";
    }
}


/* =========================================================
   EIGHT BALL
   ========================================================= */

function handleEightBall() {

    const playerHasBalls =
        getRemainingGroupBalls(
            playerGroup
        ) > 0;


    const computerHasBalls =
        getRemainingGroupBalls(
            computerGroup
        ) > 0;


    /*
     * Player wins only if
     * their group is cleared.
     */

    if (
        currentPlayer === "player"
    ) {

        if (
            playerGroup &&
            !playerHasBalls
        ) {

            endGame(
                true,
                "You sank the 8-ball perfectly!"
            );

        } else {

            endGame(
                false,
                "You sank the 8-ball too early!"
            );
        }


    } else {

        if (
            computerGroup &&
            !computerHasBalls
        ) {

            endGame(
                false,
                "The computer cleared the table!"
            );

        } else {

            endGame(
                true,
                "The computer sank the 8-ball too early!"
            );
        }
    }
}


/* =========================================================
   REMAINING GROUP BALLS
   ========================================================= */

function getRemainingGroupBalls(
    group
) {

    if (!group) {
        return 0;
    }


    return balls.filter(
        ball =>
            !ball.pocketed &&
            ball.group === group
    ).length;
}


/* =========================================================
   FINISH SHOT
   ========================================================= */

function finishShot() {

    if (!shotInProgress) {
        return;
    }


    shotInProgress =
        false;


    /*
     * Scratch
     */

    if (scratch) {

        respawnCueBall();

        changeTurn();

        return;
    }


    /*
     * Check if a ball was pocketed.
     */

    const usefulPocket =
        shotPocketed.some(
            ball =>
                ball.number !== 0 &&
                ball.number !== 8
        );


    /*
     * If player pocketed
     * their own ball, continue.
     */

    if (
        usefulPocket
    ) {

        const last =
            shotPocketed[
                shotPocketed.length - 1
            ];


        if (
            last &&
            last.number !== 8
        ) {

            const correct =
                !playerGroup ||
                last.group ===
                playerGroup;


            if (
                currentPlayer === "player" &&
                correct
            ) {

                score += 10;

                updateScore();

                return;

            }


            if (
                currentPlayer === "computer" &&
                correct
            ) {

                return;
            }
        }
    }


    /*
     * Otherwise change turn.
     */

    changeTurn();
}


/* =========================================================
   CHANGE TURN
   ========================================================= */

function changeTurn() {

    currentPlayer =
        currentPlayer === "player"
            ? "computer"
            : "player";


    updateTurnUI();


    if (
        currentPlayer ===
        "computer"
    ) {

        setTimeout(
            computerTurn,
            700
        );
    }
}


/* =========================================================
   TURN UI
   ========================================================= */

function updateTurnUI() {

    if (
        currentPlayer === "player"
    ) {

        turnText.textContent =
            "YOUR TURN";

        playerCard.classList.add(
            "active"
        );

        computerCard.classList.remove(
            "active"
        );

        playerType.textContent =
            playerGroup
                ? capitalize(
                    playerGroup
                )
                : "Choose your group";

        computerType.textContent =
            computerGroup
                ? capitalize(
                    computerGroup
                )
                : "Waiting";

        shootButton.disabled =
            false;

    } else {

        turnText.textContent =
            "COMPUTER TURN";

        playerCard.classList.remove(
            "active"
        );

        computerCard.classList.add(
            "active"
        );

        playerType.textContent =
            playerGroup
                ? capitalize(
                    playerGroup
                )
                : "Waiting";

        computerType.textContent =
            computerGroup
                ? capitalize(
                    computerGroup
                )
                : "Thinking...";

        shootButton.disabled =
            true;
    }
}


/* =========================================================
   CAPITALIZE
   ========================================================= */

function capitalize(
    text
) {

    if (!text) {
        return "";
    }

    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );
}


/* =========================================================
   CUE BALL RESPAWN
   ========================================================= */

function respawnCueBall() {

    const cue =
        getCueBall();


    if (!cue) {

        createBall(
            0,
            table.width * 0.25,
            table.height / 2
        );

        return;
    }


    cue.pocketed =
        false;

    cue.x =
        table.width * 0.25;

    cue.y =
        table.height / 2;

    cue.vx =
        0;

    cue.vy =
        0;
}


/* =========================================================
   COMPUTER TURN
   ========================================================= */

function computerTurn() {

    if (
        !gameStarted ||
        currentPlayer !== "computer"
    ) {

        return;
    }


    const cue =
        getCueBall();


    if (!cue) {
        return;
    }


    /*
     * Find legal target.
     */

    let targets =
        balls.filter(
            ball =>
                !ball.pocketed &&
                ball.number !== 0 &&
                ball.number !== 8 &&
                (
                    computerGroup === null ||
                    ball.group ===
                    computerGroup
                )
        );


    /*
     * If group isn't assigned,
     * choose any normal ball.
     */

    if (
        targets.length === 0
    ) {

        targets =
            balls.filter(
                ball =>
                    !ball.pocketed &&
                    ball.number !== 0 &&
                    ball.number !== 8
            );
    }


    /*
     * If nothing remains,
     * target 8-ball.
     */

    if (
        targets.length === 0
    ) {

        const eight =
            balls.find(
                ball =>
                    ball.number === 8 &&
                    !ball.pocketed
            );

        if (eight) {
            targets = [eight];
        }
    }


    if (
        targets.length === 0
    ) {

        return;
    }


    /*
     * Choose nearest ball.
     */

    targets.sort(
        (a, b) =>
            distanceBetween(
                cue,
                a
            ) -
            distanceBetween(
                cue,
                b
            )
    );


    const target =
        targets[0];


    /*
     * Add some AI imperfection.
     */

    const error =
        0.09;


    const dx =
        target.x -
        cue.x;

    const dy =
        target.y -
        cue.y;


    const length =
        Math.hypot(
            dx,
            dy
        );


    let dirX =
        dx / length;

    let dirY =
        dy / length;


    /*
     * Random aiming error.
     */

    dirX +=
        (Math.random() - 0.5) *
        error;

    dirY +=
        (Math.random() - 0.5) *
        error;


    const dirLength =
        Math.hypot(
            dirX,
            dirY
        );


    dirX /=
        dirLength;

    dirY /=
        dirLength;


    /*
     * Computer power.
     */

    const power =
        0.62 +
        Math.random() *
        0.25;


    const velocity =
        MAX_POWER *
        power;


    cue.vx =
        dirX *
        velocity;

    cue.vy =
        dirY *
        velocity;


    shotInProgress =
        true;

    ballsMoving =
        true;

    shotPocketed = [];

    cueBallPocketed =
        false;

    scratch =
        false;


    playHitSound();

    animate();
}


/* =========================================================
   DISTANCE
   ========================================================= */

function distanceBetween(
    a,
    b
) {

    return Math.hypot(
        b.x - a.x,
        b.y - a.y
    );
}


/* =========================================================
   DRAW
   ========================================================= */

function draw() {

    ctx.clearRect(
        0,
        0,
        table.width,
        table.height
    );


    drawTableDetails();

    drawPockets();

    drawBalls();


    if (
        aiming &&
        currentPlayer === "player" &&
        !ballsMoving
    ) {

        drawAim();
    }
}


/* =========================================================
   TABLE DETAILS
   ========================================================= */

function drawTableDetails() {

    /*
     * Center line
     */

    ctx.save();

    ctx.globalAlpha =
        0.08;

    ctx.strokeStyle =
        "#ffffff";

    ctx.lineWidth =
        1;

    ctx.beginPath();

    ctx.moveTo(
        table.width / 2,
        0
    );

    ctx.lineTo(
        table.width / 2,
        table.height
    );

    ctx.stroke();

    ctx.restore();


    /*
     * Small table marks
     */

    ctx.save();

    ctx.globalAlpha =
        0.25;

    ctx.fillStyle =
        "#d1fae5";


    for (
        let i = 1;
        i < 7;
        i++
    ) {

        const x =
            table.width *
            i /
            7;

        ctx.beginPath();

        ctx.arc(
            x,
            3,
            1.5,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.beginPath();

        ctx.arc(
            x,
            table.height - 3,
            1.5,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }


    ctx.restore();
}


/* =====================================================
   DRAW POCKETS
   ===================================================== */

function drawPockets() {

    for (
        const pocket of pockets
    ) {

        const gradient =
            ctx.createRadialGradient(
                pocket.x,
                pocket.y,
                2,
                pocket.x,
                pocket.y,
                POCKET_RADIUS
            );


        gradient.addColorStop(
            0,
            "#000000"
        );

        gradient.addColorStop(
            0.75,
            "#020202"
        );

        gradient.addColorStop(
            1,
            "#151515"
        );


        ctx.fillStyle =
            gradient;


        ctx.beginPath();

        ctx.arc(
            pocket.x,
            pocket.y,
            POCKET_RADIUS,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}


/* =====================================================
   DRAW BALLS
   ===================================================== */

function drawBalls() {

    for (
        const ball of balls
    ) {

        if (
            ball.pocketed
        ) {

            continue;
        }


        drawBall(
            ball
        );
    }
}


/* =====================================================
   DRAW BALL
   ===================================================== */

function drawBall(
    ball
) {

    const r =
        ball.radius;


    /*
     * Shadow
     */

    ctx.save();

    ctx.globalAlpha =
        0.35;

    ctx.fillStyle =
        "#000";

    ctx.beginPath();

    ctx.arc(
        ball.x + 2,
        ball.y + 3,
        r + 1,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();


    /*
     * Ball base
     */

    ctx.save();


    const gradient =
        ctx.createRadialGradient(
            ball.x - r * 0.35,
            ball.y - r * 0.4,
            r * 0.1,
            ball.x,
            ball.y,
            r
        );


    let color =
        ball.number === 0
            ? "#ffffff"
            : ballColors[
                ball.number
            ];


    gradient.addColorStop(
        0,
        "#ffffff"
    );


    gradient.addColorStop(
        0.18,
        color
    );


    gradient.addColorStop(
        1,
        "#111111"
    );


    ctx.fillStyle =
        gradient;


    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        r,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
     * Stripe
     */

    if (
        ball.group === "stripe"
    ) {

        ctx.save();

        ctx.beginPath();

        ctx.arc(
            ball.x,
            ball.y,
            r,
            0,
            Math.PI * 2
        );

        ctx.clip();


        ctx.fillStyle =
            "#ffffff";


        ctx.fillRect(
            ball.x - r,
            ball.y - r * 0.3,
            r * 2,
            r * 0.6
        );


        /*
         * Repaint colored stripe center.
         */

        ctx.fillStyle =
            color;


        ctx.globalAlpha =
            0.95;


        ctx.fillRect(
            ball.x - r,
            ball.y - r * 0.17,
            r * 2,
            r * 0.34
        );


        ctx.restore();
    }


    /*
     * Number circle
     */

    if (
        ball.number !== 0
    ) {

        ctx.fillStyle =
            "#ffffff";


        ctx.beginPath();

        ctx.arc(
            ball.x,
            ball.y,
            r * 0.34,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.fillStyle =
            "#111827";


        ctx.font =
            `bold ${Math.max(
                7,
                r * 0.55
            )}px Arial`;

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";


        ctx.fillText(
            ball.number,
            ball.x,
            ball.y + 0.5
        );
    }


    ctx.restore();
}


/* =====================================================
   DRAW AIM
   ===================================================== */

function drawAim() {

    const cue =
        getCueBall();


    if (
        !cue ||
        cue.pocketed
    ) {

        return;
    }


    const dx =
        mouseX -
        cue.x;

    const dy =
        mouseY -
        cue.y;


    const distance =
        Math.hypot(
            dx,
            dy
        );


    if (
        distance < 2
    ) {

        return;
    }


    const nx =
        dx / distance;

    const ny =
        dy / distance;


    /*
     * Aim line
     */

    ctx.save();

    ctx.setLineDash(
        [7, 7]
    );

    ctx.lineWidth =
        2;

    ctx.strokeStyle =
        "rgba(255,255,255,0.75)";


    ctx.beginPath();

    ctx.moveTo(
        cue.x +
        nx * 12,
        cue.y +
        ny * 12
    );

    ctx.lineTo(
        cue.x +
        nx * Math.min(
            distance,
            250
        ),
        cue.y +
        ny * Math.min(
            distance,
            250
        )
    );

    ctx.stroke();

    ctx.restore();


    /*
     * Cue stick
     */

    const stickLength =
        95;

    const stickStart =
        cue.x -
        nx * stickLength;

    const stickStartY =
        cue.y -
        ny * stickLength;


    ctx.save();

    ctx.lineWidth =
        5;

    ctx.strokeStyle =
        "#c99b62";

    ctx.beginPath();

    ctx.moveTo(
        stickStart,
        stickStartY
    );

    ctx.lineTo(
        cue.x -
        nx * 13,
        cue.y -
        ny * 13
    );

    ctx.stroke();


    ctx.lineWidth =
        2;

    ctx.strokeStyle =
        "#f1f5f9";

    ctx.beginPath();

    ctx.moveTo(
        stickStart,
        stickStartY
    );

    ctx.lineTo(
        stickStart +
        nx * 15,
        stickStartY +
        ny * 15
    );

    ctx.stroke();

    ctx.restore();


    /*
     * Power indicator near cue
     */

    const power =
        Number(
            powerSlider.value
        ) / 100;


    ctx.save();

    ctx.globalAlpha =
        0.35 +
        power * 0.45;

    ctx.strokeStyle =
        "#22c55e";

    ctx.lineWidth =
        2;

    ctx.beginPath();

    ctx.arc(
        cue.x,
        cue.y,
        cue.radius + 4,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.restore();
}


/* =====================================================
   SCORE
   ===================================================== */

function updateScore() {

    scoreElement.textContent =
        score;


    if (
        score > bestScore
    ) {

        bestScore =
            score;

        bestScoreElement.textContent =
            bestScore;

        localStorage.setItem(
            "mosayad_pool_best",
            bestScore
        );
    }
}


/* =====================================================
   END GAME
   ===================================================== */

function endGame(
    playerWon,
    message
) {

    gameStarted =
        false;

    ballsMoving =
        false;

    shotInProgress =
        false;

    cancelAnimationFrame(
        animationFrame
    );


    if (
        playerWon
    ) {

        resultIcon.textContent =
            "🏆";

        resultTitle.textContent =
            "You Win!";

        resultMessage.textContent =
            message;

        score += 100;

        updateScore();

    } else {

        resultIcon.textContent =
            "💥";

        resultTitle.textContent =
            "Game Over";

        resultMessage.textContent =
            message;
    }


    finalScoreElement.textContent =
        score;


    setTimeout(
        () => {

            gameOverScreen.classList.remove(
                "hidden"
            );

        },
        300
    );
}


/* =====================================================
   AUDIO
   ===================================================== */

let audioContext =
    null;


function initAudio() {

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
}


function sound(
    frequency,
    duration,
    type = "sine",
    volume = 0.03
) {

    try {

        initAudio();


        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();


        oscillator.type =
            type;

        oscillator.frequency.value =
            frequency;


        gain.gain.setValueAtTime(
            volume,
            audioContext.currentTime
        );


        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime +
            duration
        );


        oscillator.connect(
            gain
        );

        gain.connect(
            audioContext.destination
        );


        oscillator.start();

        oscillator.stop(
            audioContext.currentTime +
            duration
        );

    } catch (
        error
    ) {

        /*
         * Audio is optional.
         */
    }
}


function playHitSound() {

    sound(
        120,
        0.08,
        "triangle",
        0.04
    );
}


function playBallSound() {

    sound(
        180,
        0.035,
        "sine",
        0.018
    );
}


function playRailSound() {

    sound(
        90,
        0.025,
        "square",
        0.012
    );
}


function playPocketSound() {

    sound(
        65,
        0.16,
        "sine",
        0.045
    );
}


/* =====================================================
   HELPER
   ===================================================== */

function capitalizeWord(
    word
) {

    return (
        word.charAt(0).toUpperCase() +
        word.slice(1)
    );
}


/* =====================================================
   INITIAL DRAW
   ===================================================== */

draw();