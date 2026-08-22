/* =========================================================
   MOSAYAD PENALTY
   Simple Penalty Challenge
   HTML + CSS + JavaScript
========================================================= */


/* =========================================================
   DOM
========================================================= */

const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas.getContext("2d");

const scoreElement =
    document.getElementById("score");

const bestElement =
    document.getElementById("best");

const finalScoreElement =
    document.getElementById("finalScore");

const finalBestElement =
    document.getElementById("finalBest");

const startScreen =
    document.getElementById("startScreen");

const gameOverScreen =
    document.getElementById("gameOverScreen");

const startBtn =
    document.getElementById("startBtn");

const restartBtn =
    document.getElementById("restartBtn");

const themeBtn =
    document.getElementById("themeBtn");

const gameHint =
    document.getElementById("gameHint");

const levelDisplay =
    document.getElementById("levelDisplay");

const message =
    document.getElementById("message");

const newBestElement =
    document.getElementById("newBest");


/* =========================================================
   STORAGE
========================================================= */

let bestScore =
    Number(localStorage.getItem(
        "mosayadPenaltyBest"
    )) || 0;

bestElement.textContent =
    bestScore;


/* =========================================================
   THEME
========================================================= */

const savedTheme =
    localStorage.getItem(
        "mosayadPenaltyTheme"
    );

if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeBtn.textContent = "☀️";
} else {
    themeBtn.textContent = "🌙";
}

themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    const dark =
        document.body.classList.contains("dark");

    localStorage.setItem(
        "mosayadPenaltyTheme",
        dark ? "dark" : "light"
    );

    themeBtn.textContent =
        dark ? "☀️" : "🌙";
});


/* =========================================================
   CANVAS
========================================================= */

let W = 0;
let H = 0;
let DPR = 1;

function resizeCanvas() {

    const rect =
        canvas.getBoundingClientRect();

    DPR =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );

    W = rect.width;
    H = rect.height;

    canvas.width =
        Math.floor(W * DPR);

    canvas.height =
        Math.floor(H * DPR);

    ctx.setTransform(
        DPR,
        0,
        0,
        DPR,
        0,
        0
    );
}

window.addEventListener(
    "resize",
    resizeCanvas
);

resizeCanvas();


/* =========================================================
   GAME STATE
========================================================= */

let gameRunning = false;

let score = 0;

let level = 1;

let goalkeeperX = 0;

let goalkeeperVelocity = 0;

let goalkeeperSpeed = 2.2;

let goalkeeperDirection = 1;

let goalkeeperHasBall = false;

let shotActive = false;

let shotProgress = 0;

let shotTargetX = 0;

let shotTargetY = 0;

let shotStartX = 0;

let shotStartY = 0;

let shotResult = null;

let resultTimer = 0;

let animationId = 0;


/* =========================================================
   FIELD
========================================================= */

let goal = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
};

let ball = {
    x: 0,
    y: 0,
    radius: 15
};


function updateDimensions() {

    /*
        Goal is near the upper half
        of the screen.
    */

    goal.width =
        Math.min(
            W * 0.72,
            620
        );

    goal.height =
        Math.min(
            H * 0.31,
            250
        );

    goal.x =
        (W - goal.width) / 2;

    goal.y =
        Math.max(
            60,
            H * 0.12
        );

    /*
        Ball starts near the bottom.
    */

    ball.radius =
        Math.max(
            11,
            Math.min(W * 0.025, 17)
        );

    ball.x =
        W / 2;

    ball.y =
        H * 0.86;
}


/* =========================================================
   GAME START
========================================================= */

function startGame() {

    score = 0;

    level = 1;

    goalkeeperSpeed = 4;

    goalkeeperDirection = 1;

    goalkeeperHasBall = false;

    shotActive = false;

    shotResult = null;

    resultTimer = 0;

    gameRunning = true;

    scoreElement.textContent =
        score;

    levelDisplay.textContent =
        "LEVEL 1";

    startScreen.classList.add(
        "hidden"
    );

    gameOverScreen.classList.add(
        "hidden"
    );

    gameHint.classList.remove(
        "hidden"
    );

    levelDisplay.classList.remove(
        "hidden"
    );

    updateDimensions();

    goalkeeperX =
        goal.x +
        goal.width / 2;

    animationId =
        requestAnimationFrame(gameLoop);
}


/* =========================================================
   GAME OVER
========================================================= */

function gameOver() {

    gameRunning = false;

    shotActive = false;

    cancelAnimationFrame(
        animationId
    );

    finalScoreElement.textContent =
        score;

    let wasNewBest = false;

    if (score > bestScore) {

        bestScore = score;

        localStorage.setItem(
            "mosayadPenaltyBest",
            bestScore
        );

        bestElement.textContent =
            bestScore;

        wasNewBest = true;
    }

    finalBestElement.textContent =
        bestScore;

    if (wasNewBest) {

        newBestElement.classList.remove(
            "hidden"
        );

    } else {

        newBestElement.classList.add(
            "hidden"
        );
    }

    gameHint.classList.add(
        "hidden"
    );

    levelDisplay.classList.add(
        "hidden"
    );

    gameOverScreen.classList.remove(
        "hidden"
    );
}


/* =========================================================
   SHOOT
========================================================= */

function shoot(targetX, targetY) {

    if (!gameRunning) {
        return;
    }

    if (shotActive) {
        return;
    }

    /*
        Only allow shots
        toward the goal.
    */

    const insideGoal =
        targetX >= goal.x - 20 &&
        targetX <= goal.x + goal.width + 20 &&
        targetY >= goal.y - 30 &&
        targetY <= goal.y + goal.height + 30;

    /*
        If player clicks outside,
        shoot toward the nearest
        point inside the goal.
    */

    shotTargetX =
        Math.max(
            goal.x + 10,
            Math.min(
                goal.x + goal.width - 10,
                targetX
            )
        );

    shotTargetY =
        Math.max(
            goal.y + 15,
            Math.min(
                goal.y + goal.height - 10,
                targetY
            )
        );

    shotStartX = ball.x;
    shotStartY = ball.y;

    shotProgress = 0;

    shotActive = true;

    shotResult = null;

    /*
        Hide hint after first shot.
    */

    gameHint.classList.add(
        "hidden"
    );
}


/* =========================================================
   SHOT UPDATE
========================================================= */

function updateShot() {

    if (!shotActive) {
        return;
    }

    shotProgress +=
        0.035;

    if (shotProgress > 1) {
        shotProgress = 1;
    }

    const t =
        easeOutCubic(
            shotProgress
        );

    ball.x =
        lerp(
            shotStartX,
            shotTargetX,
            t
        );

    ball.y =
        lerp(
            shotStartY,
            shotTargetY,
            t
        );

    /*
        When ball reaches goal.
    */

    if (shotProgress >= 1) {

        const goalkeeperWidth =
            Math.max(
                65,
                goal.width * 0.18
            );

        const goalkeeperLeft =
            goalkeeperX -
            goalkeeperWidth / 2;

        const goalkeeperRight =
            goalkeeperX +
            goalkeeperWidth / 2;

        /*
            The goalkeeper covers
            more area than his body.
        */

        const savePadding =
            20;

        const saved =
            shotTargetX >
                goalkeeperLeft -
                savePadding
            &&
            shotTargetX <
                goalkeeperRight +
                savePadding;

        if (saved) {

            shotResult = "SAVE";

            // الحارس يمسك الكرة ويقف مكانه
            goalkeeperHasBall = true;

            shotActive = false;

            /*
                ضع الكرة في مكان يد الحارس
            */

            ball.x =
                goalkeeperX -
                42;

            ball.y =
                goal.y +
                goal.height -
                42;

            showMessage(
                "🧤 SAVED!"
            );

            resultTimer = 55;

            setTimeout(
                () => {
                    gameOver();
                },
                900
            );
        } else {

            shotResult =
                "GOAL";

            score++;

            scoreElement.textContent =
                score;

            /*
                Increase difficulty.
            */

            level =
                score + 1;

            goalkeeperSpeed =
                2.2 +
                (score * 0.32);

            levelDisplay.textContent =
                "LEVEL " + level;

            showMessage(
                "⚽ GOAL!"
            );

            resultTimer = 55;

            shotActive = false;

            /*
                Reset ball.
            */

            setTimeout(
                resetBall,
                450
            );
        }
    }
}


/* =========================================================
   RESET BALL
========================================================= */

function resetBall() {

    if (!gameRunning) {
        return;
    }

    ball.x =
        W / 2;

    ball.y =
        H * 0.86;

    shotResult = null;
}


/* =========================================================
   GOALKEEPER
========================================================= */

function updateGoalkeeper() {

    if (!gameRunning) {
        return;
    }

    // الحارس يقف تمامًا بعد صد الكرة
    if (goalkeeperHasBall) {
        return;
    }

    goalkeeperX +=
        goalkeeperSpeed *
        goalkeeperDirection;

    const margin =
        goal.width * 0.12;

    const minX =
        goal.x + margin;

    const maxX =
        goal.x +
        goal.width -
        margin;

    if (goalkeeperX >= maxX) {

        goalkeeperX = maxX;

        goalkeeperDirection = -1;
    }

    if (goalkeeperX <= minX) {

        goalkeeperX = minX;

        goalkeeperDirection = 1;
    }
}

/* =========================================================
   DRAW FIELD
========================================================= */

function drawField() {

    /*
        Sky
    */

    const skyHeight =
        Math.max(
            100,
            H * 0.32
        );

    const sky =
        ctx.createLinearGradient(
            0,
            0,
            0,
            skyHeight
        );

    sky.addColorStop(
        0,
        "#8fd3ff"
    );

    sky.addColorStop(
        1,
        "#d7f1ff"
    );

    ctx.fillStyle =
        sky;

    ctx.fillRect(
        0,
        0,
        W,
        skyHeight
    );


    /*
        Crowd
    */

    drawCrowd(
        0,
        skyHeight - 20,
        W,
        70
    );


    /*
        Grass
    */

    const grassStart =
        skyHeight + 35;

    ctx.fillStyle =
        "#5cae42";

    ctx.fillRect(
        0,
        grassStart,
        W,
        H - grassStart
    );


    /*
        Grass stripes
    */

    const stripeHeight =
        55;

    for (
        let y = grassStart;
        y < H;
        y += stripeHeight
    ) {

        if (
            Math.floor(
                (y - grassStart) /
                stripeHeight
            ) % 2 === 0
        ) {

            ctx.fillStyle =
                "rgba(255,255,255,0.035)";

            ctx.fillRect(
                0,
                y,
                W,
                stripeHeight
            );
        }
    }


    /*
        Penalty area
    */

    const penaltyWidth =
        Math.min(
            W * 0.78,
            690
        );

    const penaltyHeight =
        Math.min(
            H * 0.48,
            350
        );

    const penaltyX =
        (W - penaltyWidth) / 2;

    const penaltyY =
        goal.y +
        goal.height -
        5;

    ctx.strokeStyle =
        "rgba(255,255,255,0.72)";

    ctx.lineWidth = 3;

    ctx.strokeRect(
        penaltyX,
        penaltyY,
        penaltyWidth,
        penaltyHeight
    );


    /*
        Penalty spot
    */

    ctx.beginPath();

    ctx.arc(
        W / 2,
        H * 0.82,
        4,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(255,255,255,0.8)";

    ctx.fill();
}


/* =========================================================
   CROWD
========================================================= */

function drawCrowd(
    x,
    y,
    width,
    height
) {

    ctx.fillStyle =
        "#555b66";

    ctx.fillRect(
        x,
        y,
        width,
        height
    );

    const people =
        Math.floor(
            width / 18
        );

    for (
        let i = 0;
        i < people;
        i++
    ) {

        const px =
            i * 18 +
            5;

        const py =
            y +
            10 +
            Math.sin(i * 3.1) * 4;

        /*
            Head
        */

        ctx.beginPath();

        ctx.arc(
            px,
            py,
            4,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            i % 3 === 0
                ? "#f2c6a0"
                : "#d99d79";

        ctx.fill();


        /*
            Body
        */

        ctx.fillStyle =
            i % 2 === 0
                ? "#1976ff"
                : "#ef4444";

        ctx.fillRect(
            px - 5,
            py + 4,
            10,
            13
        );
    }
}


/* =========================================================
   DRAW GOAL
========================================================= */

function drawGoal() {

    /*
        Shadow behind goal.
    */

    ctx.fillStyle =
        "rgba(0,0,0,0.18)";

    ctx.fillRect(
        goal.x + 10,
        goal.y + 14,
        goal.width,
        goal.height
    );


    /*
        Net.
    */

    ctx.save();

    ctx.beginPath();

    ctx.rect(
        goal.x,
        goal.y,
        goal.width,
        goal.height
    );

    ctx.clip();

    ctx.strokeStyle =
        "rgba(255,255,255,0.58)";

    ctx.lineWidth = 1;

    const spacing = 13;

    for (
        let x = goal.x;
        x <= goal.x + goal.width;
        x += spacing
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            goal.y
        );

        ctx.lineTo(
            x,
            goal.y + goal.height
        );

        ctx.stroke();
    }

    for (
        let y = goal.y;
        y <= goal.y + goal.height;
        y += spacing
    ) {

        ctx.beginPath();

        ctx.moveTo(
            goal.x,
            y
        );

        ctx.lineTo(
            goal.x + goal.width,
            y
        );

        ctx.stroke();
    }

    ctx.restore();


    /*
        Goal frame.
    */

    ctx.strokeStyle =
        "#ffffff";

    ctx.lineWidth =
        Math.max(
            5,
            W * 0.008
        );

    ctx.lineCap =
        "round";

    ctx.beginPath();

    ctx.moveTo(
        goal.x,
        goal.y + goal.height
    );

    ctx.lineTo(
        goal.x,
        goal.y
    );

    ctx.lineTo(
        goal.x + goal.width,
        goal.y
    );

    ctx.lineTo(
        goal.x + goal.width,
        goal.y + goal.height
    );

    ctx.stroke();

    /*
        Bottom line.
    */

    ctx.beginPath();

    ctx.moveTo(
        goal.x,
        goal.y + goal.height
    );

    ctx.lineTo(
        goal.x + goal.width,
        goal.y + goal.height
    );

    ctx.stroke();
}


/* =========================================================
   DRAW GOALKEEPER
========================================================= */

function drawGoalkeeper() {

    const centerX =
        goalkeeperX;

    const baseY =
        goal.y +
        goal.height -
        7;

    const scale =
        Math.min(
            W / 900,
            1
        );

    /*
        Body dimensions.
    */

    const bodyWidth =
        52 * scale;

    const bodyHeight =
        78 * scale;

    const headRadius =
        18 * scale;


    /*
        Animation while moving.
    */

    const movement =
        Math.sin(
            performance.now() * 0.012
        );

    const armSwing =
        movement * 3 * scale;


    /*
        Shadow
    */

    ctx.beginPath();

    ctx.ellipse(
        centerX,
        baseY + 4,
        38 * scale,
        7 * scale,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(0,0,0,0.25)";

    ctx.fill();


    /*
        Legs
    */

    ctx.strokeStyle =
        "#18202a";

    ctx.lineWidth =
        10 * scale;

    ctx.lineCap =
        "round";

    ctx.beginPath();

    ctx.moveTo(
        centerX - 12 * scale,
        baseY - 5
    );

    ctx.lineTo(
        centerX - 17 * scale,
        baseY + 29 * scale
    );

    ctx.moveTo(
        centerX + 12 * scale,
        baseY - 5
    );

    ctx.lineTo(
        centerX + 17 * scale,
        baseY + 29 * scale
    );

    ctx.stroke();


    /*
        Body
    */

    ctx.fillStyle =
        "#ff9f1c";

    roundRect(
        ctx,
        centerX -
            bodyWidth / 2,
        baseY -
            bodyHeight,
        bodyWidth,
        bodyHeight,
        12 * scale
    );

    ctx.fill();


    /*
        Shirt details
    */

    ctx.fillStyle =
        "#ffffff";

    ctx.fillRect(
        centerX - 4 * scale,
        baseY - bodyHeight,
        8 * scale,
        bodyHeight
    );


    /*
        Left arm
    */

    ctx.strokeStyle =
        "#ffb27d";

    ctx.lineWidth =
        13 * scale;

    ctx.beginPath();

    ctx.moveTo(
        centerX -
            bodyWidth / 2,
        baseY -
            bodyHeight +
            16 * scale
    );

    ctx.lineTo(
        centerX -
            42 * scale,
        baseY -
            42 * scale +
            armSwing
    );

    ctx.stroke();


    /*
        Right arm
    */

    ctx.beginPath();

    ctx.moveTo(
        centerX +
            bodyWidth / 2,
        baseY -
            bodyHeight +
            16 * scale
    );

    ctx.lineTo(
        centerX +
            42 * scale,
        baseY -
            42 * scale -
            armSwing
    );

    ctx.stroke();


    /*
        Gloves
    */

    ctx.fillStyle =
        "#ffffff";

    ctx.beginPath();

    ctx.arc(
        centerX -
            42 * scale,
        baseY -
            42 * scale +
            armSwing,
        9 * scale,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
        centerX +
            42 * scale,
        baseY -
            42 * scale -
            armSwing,
        9 * scale,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
    Ball held by goalkeeper
*/

if (goalkeeperHasBall) {

    const handX =
        centerX - 42 * scale;

    const handY =
        baseY -
        42 * scale;

    ctx.save();

    ctx.translate(
        handX,
        handY
    );

    /*
        Ball shadow
    */

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        11 * scale,
        0,
        Math.PI * 2
    );

    const ballGradient =
        ctx.createRadialGradient(
            -3 * scale,
            -4 * scale,
            1,
            0,
            0,
            12 * scale
        );

    ballGradient.addColorStop(
        0,
        "#ffffff"
    );

    ballGradient.addColorStop(
        1,
        "#d7dce2"
    );

    ctx.fillStyle =
        ballGradient;

    ctx.fill();

    /*
        Black football patch
    */

    ctx.fillStyle =
        "#252a30";

        drawPentagon(
            ctx,
            0,
            0,
            4 * scale
        );

        ctx.restore();
    }

    /*
        Neck
    */

    ctx.fillStyle =
        "#ffb27d";

    ctx.fillRect(
        centerX - 7 * scale,
        baseY -
            bodyHeight -
            2 * scale,
        14 * scale,
        13 * scale
    );


    /*
        Head
    */

    ctx.beginPath();

    ctx.arc(
        centerX,
        baseY -
            bodyHeight -
            16 * scale,
        headRadius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#ffb27d";

    ctx.fill();


    /*
        Hair
    */

    ctx.beginPath();

    ctx.arc(
        centerX,
        baseY -
            bodyHeight -
            22 * scale,
        headRadius * 0.9,
        Math.PI,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#252525";

    ctx.fill();


    /*
        Eyes
    */

    ctx.fillStyle =
        "#222";

    ctx.beginPath();

    ctx.arc(
        centerX -
            6 * scale,
        baseY -
            bodyHeight -
            16 * scale,
        2.2 * scale,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
        centerX +
            6 * scale,
        baseY -
            bodyHeight -
            16 * scale,
        2.2 * scale,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
        Shoes
    */

    ctx.fillStyle =
        "#20252c";

    ctx.beginPath();

    ctx.ellipse(
        centerX - 19 * scale,
        baseY + 29 * scale,
        14 * scale,
        6 * scale,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.ellipse(
        centerX + 19 * scale,
        baseY + 29 * scale,
        14 * scale,
        6 * scale,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


/* =========================================================
   DRAW BALL
========================================================= */

function drawBall() {

    /*
        Shadow
    */

    const shadowSize =
        ball.radius *
        (1.5 - shotProgress * 0.7);

    ctx.beginPath();

    ctx.ellipse(
        ball.x,
        ball.y + ball.radius * 0.8,
        shadowSize,
        shadowSize * 0.35,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(0,0,0,0.25)";

    ctx.fill();


    /*
        Ball.
    */

    ctx.save();

    ctx.translate(
        ball.x,
        ball.y
    );

    const rotation =
        shotActive
            ? shotProgress * 12
            : 0;

    ctx.rotate(rotation);

    /*
        Ball gradient.
    */

    const gradient =
        ctx.createRadialGradient(
            -ball.radius * 0.3,
            -ball.radius * 0.35,
            2,
            0,
            0,
            ball.radius
        );

    gradient.addColorStop(
        0,
        "#ffffff"
    );

    gradient.addColorStop(
        1,
        "#d9dde2"
    );

    ctx.fillStyle =
        gradient;

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        ball.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
        Classic black patches.
    */

    ctx.fillStyle =
        "#242a31";

    drawPentagon(
        ctx,
        0,
        0,
        ball.radius * 0.34
    );

    ctx.restore();
}


/* =========================================================
   PENTAGON
========================================================= */

function drawPentagon(
    context,
    x,
    y,
    radius
) {

    context.beginPath();

    for (
        let i = 0;
        i < 5;
        i++
    ) {

        const angle =
            -Math.PI / 2 +
            i *
            (Math.PI * 2 / 5);

        const px =
            x +
            Math.cos(angle) *
            radius;

        const py =
            y +
            Math.sin(angle) *
            radius;

        if (i === 0) {
            context.moveTo(
                px,
                py
            );
        } else {
            context.lineTo(
                px,
                py
            );
        }
    }

    context.closePath();

    context.fill();
}


/* =========================================================
   ROUND RECT
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

    context.moveTo(
        x + radius,
        y
    );

    context.lineTo(
        x + width - radius,
        y
    );

    context.quadraticCurveTo(
        x + width,
        y,
        x + width,
        y + radius
    );

    context.lineTo(
        x + width,
        y + height - radius
    );

    context.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
    );

    context.lineTo(
        x + radius,
        y + height
    );

    context.quadraticCurveTo(
        x,
        y + height,
        x,
        y + height - radius
    );

    context.lineTo(
        x,
        y + radius
    );

    context.quadraticCurveTo(
        x,
        y,
        x + radius,
        y
    );

    context.closePath();
}


/* =========================================================
   HELPERS
========================================================= */

function lerp(
    a,
    b,
    t
) {
    return a +
        (b - a) * t;
}


function easeOutCubic(t) {

    return 1 -
        Math.pow(
            1 - t,
            3
        );
}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(text) {

    message.textContent =
        text;

    message.classList.remove(
        "show"
    );

    /*
        Force animation restart.
    */

    void message.offsetWidth;

    message.classList.add(
        "show"
    );
}


/* =========================================================
   INPUT
========================================================= */

function getCanvasPosition(
    event
) {

    const rect =
        canvas.getBoundingClientRect();

    return {
        x:
            event.clientX -
            rect.left,

        y:
            event.clientY -
            rect.top
    };
}


canvas.addEventListener(
    "pointerdown",
    event => {

        if (!gameRunning) {
            return;
        }

        event.preventDefault();

        const position =
            getCanvasPosition(event);

        shoot(
            position.x,
            position.y
        );
    }
);


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (!gameRunning) {
            return;
        }

        if (shotActive) {
            return;
        }

        /*
            Keyboard controls:
            Arrow keys choose shot position.
        */

        if (
            event.key === "ArrowLeft"
        ) {

            shoot(
                goal.x +
                goal.width * 0.2,

                goal.y +
                goal.height * 0.35
            );
        }

        if (
            event.key === "ArrowRight"
        ) {

            shoot(
                goal.x +
                goal.width * 0.8,

                goal.y +
                goal.height * 0.35
            );
        }

        if (
            event.key === "ArrowUp"
        ) {

            shoot(
                goal.x +
                goal.width * 0.5,

                goal.y +
                goal.height * 0.15
            );
        }
    }
);


/* =========================================================
   BUTTONS
========================================================= */

startBtn.addEventListener(
    "click",
    startGame
);

restartBtn.addEventListener(
    "click",
    startGame
);


/* =========================================================
   MAIN LOOP
========================================================= */

function gameLoop() {

    updateDimensions();

    updateGoalkeeper();

    updateShot();

    draw();

    if (gameRunning) {

        animationId =
            requestAnimationFrame(
                gameLoop
            );
    }
}


/* =========================================================
   DRAW
========================================================= */

function draw() {

    ctx.clearRect(
        0,
        0,
        W,
        H
    );

    drawField();

    drawGoal();

    drawGoalkeeper();

    drawBall();
}


/* =========================================================
   INITIAL DRAW
========================================================= */

updateDimensions();

goalkeeperX =
    goal.x +
    goal.width / 2;

draw();