/* =========================================================
   MOSAYAD GAMES
   8 BALL POOL - ONLINE MATCH

   Firebase:
   - WebRTC signaling only

   WebRTC:
   - Shots
   - Authoritative state
   - Chat
   - Game rules

   HOST:
   - Authoritative physics
   - Authoritative rules
   - Authoritative timer

   GUEST:
   - Immediate local prediction
   - Smooth interpolation
   - Automatic correction from Host
========================================================= */

import { db } from "../../js/firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* =========================================================
   USER
========================================================= */

const userId =
    localStorage.getItem("userId");

const userName =
    localStorage.getItem("userName") ||
    "Player";


if (!userId) {

    window.location.href =
        "index.html";

}


/* =========================================================
   ROOM
========================================================= */

const params =
    new URLSearchParams(
        window.location.search
    );

const roomId =
    params.get("room");


if (!roomId) {

    alert(
        "Room ID is missing."
    );

    window.location.href =
        "index.html";

}


/* =========================================================
   DOM
========================================================= */

const canvas =
    document.getElementById(
        "poolCanvas"
    );

const ctx =
    canvas.getContext("2d");


const connectionDot =
    document.getElementById(
        "connectionDot"
    );

const connectionText =
    document.getElementById(
        "connectionText"
    );

const timerElement =
    document.getElementById(
        "timer"
    );

const turnText =
    document.getElementById(
        "turnText"
    );

const messageElement =
    document.getElementById(
        "message"
    );

const powerFill =
    document.getElementById(
        "powerFill"
    );

const opponentNameElement =
    document.getElementById(
        "opponentName"
    );

const myNameElement =
    document.getElementById(
        "myName"
    );

const gameOverElement =
    document.getElementById(
        "gameOver"
    );

const winnerTitle =
    document.getElementById(
        "winnerTitle"
    );

const winnerText =
    document.getElementById(
        "winnerText"
    );

const leaveButton =
    document.getElementById(
        "leaveButton"
    );

const themeButton =
    document.getElementById(
        "themeButton"
    );

const chatMessages =
    document.getElementById(
        "chatMessages"
    );

const chatInput =
    document.getElementById(
        "chatInput"
    );

const sendChatButton =
    document.getElementById(
        "sendChatButton"
    );


if (myNameElement) {

    myNameElement.textContent =
        userName;

}


/* =========================================================
   PAGE SCROLL
========================================================= */

document.documentElement.style.overflowY =
    "auto";

document.body.style.overflowY =
    "auto";

canvas.style.touchAction =
    "none";


/* =========================================================
   THEME
========================================================= */

const savedTheme =
    localStorage.getItem(
        "mosayad8ballTheme"
    );


if (savedTheme === "light") {

    document.body.classList.add(
        "light"
    );

    if (themeButton) {

        themeButton.textContent =
            "🌙";

    }

}
else {

    if (themeButton) {

        themeButton.textContent =
            "☀️";

    }

}


if (themeButton) {

    themeButton.onclick =
        () => {

            document.body.classList.toggle(
                "light"
            );

            const light =
                document.body.classList.contains(
                    "light"
                );

            localStorage.setItem(
                "mosayad8ballTheme",
                light
                    ? "light"
                    : "dark"
            );

            themeButton.textContent =
                light
                    ? "🌙"
                    : "☀️";

        };

}


/* =========================================================
   ROOM STATE
========================================================= */

let roomData = null;

let isHost = false;

let opponentId = null;

let opponentName =
    "Opponent";


/* =========================================================
   FIREBASE SIGNALING
========================================================= */

const roomRef =
    doc(
        db,
        "rooms",
        roomId
    );


const signalRef =
    doc(
        db,
        "rooms",
        roomId,
        "webrtc",
        "signal"
    );


/* =========================================================
   WEBRTC
========================================================= */

let peer = null;

let dataChannel = null;

let signalingUnsubscribe = null;


const RTC_CONFIG = {

    iceServers: [

        {
            urls:
                "stun:stun.l.google.com:19302"
        },

        {
            urls:
                "stun:stun1.l.google.com:19302"
        }

    ]

};


/* =========================================================
   TABLE CONSTANTS
========================================================= */

const TABLE_WIDTH =
    1000;

const TABLE_HEIGHT =
    500;

const BALL_RADIUS =
    16;

const POCKET_RADIUS =
    31;


/* =========================================================
   PHYSICS CONSTANTS
========================================================= */

/*
   Velocity is measured in table pixels
   per physics tick.

   One physics tick ~= 1/60 second.
*/

const PHYSICS_STEP =
    1 / 60;

const FIXED_STEP_MS =
    1000 / 60;


/*
   Friction per 60 FPS tick.
*/

const FRICTION =
    0.986;


/*
   Cushion bounce.
*/

const WALL_BOUNCE =
    0.90;


/*
   Ball collision restitution.
*/

const BALL_BOUNCE =
    0.96;


/*
   Small velocity threshold.
*/

const MIN_SPEED =
    0.025;


/*
   Maximum shot velocity.
*/

const MAX_POWER =
    18;


/*
   Timer.
*/

const TURN_TIME =
    60;


/*
   Network state frequency.
*/

const NETWORK_UPDATE_RATE =
    40;


/*
   Guest correction speed.

   Larger = stronger correction.
*/

const REMOTE_CORRECTION =
    0.20;


/*
   If prediction differs more than
   this distance, snap closer.
*/

const HARD_CORRECTION_DISTANCE =
    80;


/*
   Maximum physics substeps per frame.
*/

const MAX_SUBSTEPS =
    5;


/* =========================================================
   POCKETS
========================================================= */

const pockets = [

    {
        x: 0,
        y: 0
    },

    {
        x: TABLE_WIDTH / 2,
        y: 0
    },

    {
        x: TABLE_WIDTH,
        y: 0
    },

    {
        x: 0,
        y: TABLE_HEIGHT
    },

    {
        x: TABLE_WIDTH / 2,
        y: TABLE_HEIGHT
    },

    {
        x: TABLE_WIDTH,
        y: TABLE_HEIGHT
    }

];


/* =========================================================
   BALL COLORS
========================================================= */

const BALL_COLORS = {

    1: "#facc15",
    2: "#2563eb",
    3: "#dc2626",
    4: "#7c3aed",
    5: "#f97316",
    6: "#16a34a",
    7: "#7f1d1d",

    8: "#080808",

    9: "#facc15",
    10: "#2563eb",
    11: "#dc2626",
    12: "#7c3aed",
    13: "#f97316",
    14: "#16a34a",
    15: "#7f1d1d"

};


/* =========================================================
   GAME STATE
========================================================= */

let balls = [];

let targetBalls = null;

let turn = "host";

let turnStartedAt =
    Date.now();

let gameFinished = false;

let shotInProgress = false;

let winner = null;


/* =========================================================
   PLAYER GROUPS
========================================================= */

let playerGroups = {

    host: null,

    guest: null

};


/* =========================================================
   SHOT STATE
========================================================= */

let shotPocketed = [];

let cueBallPocketed = false;

let firstBallHit = null;


/*
   Increment every shot.

   Helps Guest identify
   newer states.
*/

let shotId = 0;

let localPredictionShotId = 0;


/*
   Guest prediction state.
*/

let guestPredicting = false;


/* =========================================================
   NETWORK
========================================================= */

let lastNetworkUpdate = 0;

let lastStateReceived = 0;


/* =========================================================
   GAME LOOP
========================================================= */

let lastFrameTime =
    performance.now();

let physicsAccumulator = 0;


/* =========================================================
   INPUT
========================================================= */

let aiming = false;

let aimCurrent = {

    x: 0,
    y: 0

};

let power = 0;


/* =========================================================
   CREATE BALL
========================================================= */

function createBall(
    number,
    x,
    y
) {

    return {

        id:
            number,

        number:
            number,

        x:
            x,

        y:
            y,

        vx:
            0,

        vy:
            0,

        radius:
            BALL_RADIUS,

        pocketed:
            false,

        type:

            number === 0
                ? "cue"

                : number === 8
                    ? "eight"

                    : number <= 7
                        ? "solid"
                        : "stripe"

    };

}


/* =========================================================
   INITIAL RACK
========================================================= */

function createInitialBalls() {

    balls = [];


    /*
       Cue ball.
    */

    balls.push(

        createBall(
            0,
            250,
            TABLE_HEIGHT / 2
        )

    );


    const rackX =
        700;

    const rackY =
        TABLE_HEIGHT / 2;

    const spacing =
        BALL_RADIUS * 2.03;


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
                row *
                spacing *
                0.87;


            const y =
                rackY +

                (
                    col -
                    row / 2
                ) *

                spacing;


            balls.push(

                createBall(
                    number,
                    x,
                    y
                )

            );

        }

    }

}


/* =========================================================
   CLONE BALLS
========================================================= */

function cloneBalls(source) {

    if (!Array.isArray(source)) {

        return [];

    }


    return source.map(
        ball => ({
            id: ball.id,
            number: ball.number,
            x: ball.x,
            y: ball.y,
            vx: ball.vx,
            vy: ball.vy,
            radius:
                ball.radius ||
                BALL_RADIUS,
            pocketed:
                Boolean(ball.pocketed),
            type:
                ball.type
        })
    );

}


/* =========================================================
   SERIALIZE BALLS
========================================================= */

function serializeBalls() {

    return balls.map(
        ball => ({

            id:
                ball.id,

            number:
                ball.number,

            x:
                ball.x,

            y:
                ball.y,

            vx:
                ball.vx,

            vy:
                ball.vy,

            radius:
                ball.radius,

            pocketed:
                ball.pocketed,

            type:
                ball.type

        })
    );

}


/* =========================================================
   APPLY REMOTE BALLS
========================================================= */

function applyBalls(data) {

    if (!Array.isArray(data)) {

        return;

    }


    targetBalls =
        cloneBalls(data);


    /*
       First state.
    */

    if (
        balls.length === 0 ||
        balls.length !==
        targetBalls.length
    ) {

        balls =
            cloneBalls(
                targetBalls
            );

        return;

    }


    /*
       Update existing balls.
    */

    for (
        const remoteBall
        of targetBalls
    ) {

        const localBall =
            balls.find(
                ball =>
                    ball.id ===
                    remoteBall.id
            );


        if (!localBall) {

            balls.push(
                {
                    ...remoteBall
                }
            );

            continue;

        }


        /*
           Pocket state must be
           immediately synchronized.
        */

        if (
            remoteBall.pocketed !==
            localBall.pocketed
        ) {

            localBall.pocketed =
                remoteBall.pocketed;

        }

    }

}


/* =========================================================
   RECONCILE GUEST
========================================================= */

function reconcileGuestBalls() {

    if (
        isHost ||
        !targetBalls
    ) {

        return;

    }


    for (
        const target
        of targetBalls
    ) {

        const local =
            balls.find(
                ball =>
                    ball.id ===
                    target.id
            );


        if (!local) {

            balls.push({
                ...target
            });

            continue;

        }


        /*
           Pocketed balls are authoritative.
        */

        if (target.pocketed) {

            local.pocketed =
                true;

            local.x =
                target.x;

            local.y =
                target.y;

            local.vx =
                0;

            local.vy =
                0;

            continue;

        }


        local.pocketed =
            false;


        const dx =
            target.x -
            local.x;

        const dy =
            target.y -
            local.y;

        const distance =
            Math.hypot(
                dx,
                dy
            );


        /*
           Large error:
           hard correction.
        */

        if (
            distance >
            HARD_CORRECTION_DISTANCE
        ) {

            local.x =
                target.x;

            local.y =
                target.y;

        }

        else {

            /*
               Smooth correction.

               While prediction is active,
               don't completely overwrite
               local movement.
            */

            const correction =
                guestPredicting
                    ? REMOTE_CORRECTION
                    : 0.45;


            local.x +=
                dx *
                correction;

            local.y +=
                dy *
                correction;

        }


        /*
           Velocity correction.
        */

        local.vx =
            target.vx;

        local.vy =
            target.vy;

    }

}


/* =========================================================
   GET CUE BALL
========================================================= */

function getCueBall() {

    return balls.find(
        ball =>
            ball.number === 0 &&
            !ball.pocketed
    );

}


/* =========================================================
   PLAYER SIDE
========================================================= */

function getMySide() {

    return isHost
        ? "host"
        : "guest";

}


/* =========================================================
   CAN SHOOT
========================================================= */

function canCurrentPlayerShoot() {

    if (
        gameFinished ||
        shotInProgress
    ) {

        return false;

    }


    if (
        !dataChannel ||
        dataChannel.readyState !==
        "open"
    ) {

        return false;

    }


    return (
        turn ===
        getMySide()
    );

}


/* =========================================================
   START LOCAL SHOT
========================================================= */

function startLocalShot(
    angle,
    shotPower,
    shooter
) {

    const cue =
        getCueBall();


    if (!cue) {

        return false;

    }


    shotPocketed = [];

    cueBallPocketed = false;

    firstBallHit = null;


    cue.vx =
        Math.cos(angle) *
        MAX_POWER *
        shotPower;

    cue.vy =
        Math.sin(angle) *
        MAX_POWER *
        shotPower;


    shotInProgress = true;


    if (!isHost) {

        guestPredicting = true;

        localPredictionShotId =
            shotId + 1;

    }


    return true;

}


/* =========================================================
   EXECUTE HOST SHOT
========================================================= */

function executeShot(
    angle,
    shotPower,
    shooter
) {

    if (
        !isHost ||
        shotInProgress ||
        gameFinished
    ) {

        return;

    }


    if (
        shooter !== turn
    ) {

        return;

    }


    const started =
        startLocalShot(
            angle,
            shotPower,
            shooter
        );


    if (!started) {

        return;

    }


    shotId++;


    broadcastState();

}


/* =========================================================
   SEND SHOT
========================================================= */

function shoot(
    angle,
    shotPower
) {

    if (!canCurrentPlayerShoot()) {

        return;

    }


    const mySide =
        getMySide();


    /*
       HOST:
       execute immediately.
    */

    if (isHost) {

        executeShot(
            angle,
            shotPower,
            "host"
        );

        return;

    }


    /*
       GUEST:

       IMPORTANT:

       First run the shot locally.

       The player sees the shot
       immediately.

       Then send the command
       to Host.
    */

    const started =
        startLocalShot(
            angle,
            shotPower,
            "guest"
        );


    if (!started) {

        return;

    }


    localPredictionShotId =
        shotId + 1;


    sendMessage({

        type:
            "shot",

        shooter:
            "guest",

        angle:
            angle,

        power:
            shotPower,

        clientShotId:
            localPredictionShotId

    });


    updateTurnUI();

}


/* =========================================================
   POINTER DOWN
========================================================= */

canvas.addEventListener(
    "pointerdown",
    event => {

        if (!canCurrentPlayerShoot()) {

            return;

        }


        const cue =
            getCueBall();


        if (!cue) {

            return;

        }


        const point =
            screenToTable(
                event.clientX,
                event.clientY
            );


        const distance =
            Math.hypot(
                point.x - cue.x,
                point.y - cue.y
            );


        if (
            distance >
            BALL_RADIUS * 7
        ) {

            return;

        }


        aiming = true;

        aimCurrent =
            point;

        power = 0;


        canvas.setPointerCapture(
            event.pointerId
        );


        event.preventDefault();

    }
);


/* =========================================================
   POINTER MOVE
========================================================= */

canvas.addEventListener(
    "pointermove",
    event => {

        if (!aiming) {

            return;

        }


        aimCurrent =
            screenToTable(
                event.clientX,
                event.clientY
            );


        const cue =
            getCueBall();


        if (!cue) {

            return;

        }


        const distance =
            Math.hypot(

                aimCurrent.x -
                cue.x,

                aimCurrent.y -
                cue.y

            );


        power =
            Math.min(
                1,
                distance / 220
            );


        if (powerFill) {

            powerFill.style.width =
                `${power * 100}%`;

        }


        event.preventDefault();

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


        aiming = false;


        if (
            canvas.hasPointerCapture(
                event.pointerId
            )
        ) {

            canvas.releasePointerCapture(
                event.pointerId
            );

        }


        const cue =
            getCueBall();


        if (!cue) {

            power = 0;

            return;

        }


        let dx =
            cue.x -
            aimCurrent.x;

        let dy =
            cue.y -
            aimCurrent.y;


        const distance =
            Math.hypot(
                dx,
                dy
            );


        if (
            distance < 3 ||
            power < 0.03
        ) {

            power = 0;

            if (powerFill) {

                powerFill.style.width =
                    "0%";

            }

            return;

        }


        /*
           Shot direction.
        */

        dx =
            -dx /
            distance;

        dy =
            -dy /
            distance;


        const angle =
            Math.atan2(
                dy,
                dx
            );


        shoot(
            angle,
            power
        );


        power = 0;


        if (powerFill) {

            powerFill.style.width =
                "0%";

        }


        event.preventDefault();

    }
);


/* =========================================================
   POINTER CANCEL
========================================================= */

canvas.addEventListener(
    "pointercancel",
    () => {

        aiming = false;

        power = 0;

        if (powerFill) {

            powerFill.style.width =
                "0%";

        }

    }
);


/* =========================================================
   PHYSICS STEP
========================================================= */

function physicsStep(
    localAuthoritative
) {

    if (
        !shotInProgress ||
        gameFinished
    ) {

        return;

    }


    /*
       Move balls.
    */

    for (
        const ball of balls
    ) {

        if (ball.pocketed) {

            continue;

        }


        ball.x +=
            ball.vx;

        ball.y +=
            ball.vy;


        /*
           Friction.

           Do not apply huge friction
           to very slow balls.
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


        handleRailCollision(
            ball
        );

    }


    /*
       Multiple collision passes.

       This greatly improves
       dense rack collisions.
    */

    for (
        let pass = 0;
        pass < 3;
        pass++
    ) {

        resolveBallCollisions();

    }


    checkPockets();


    /*
       Stop only when every ball
       has practically stopped.
    */

    if (
        areAllBallsStopped()
    ) {

        if (localAuthoritative) {

            finishShot();

        }
        else {

            /*
               Guest prediction can stop locally.

               Host will still send the
               authoritative final state.
            */

            shotInProgress =
                false;

            guestPredicting =
                false;

            updateTurnUI();

        }

    }

}


/* =========================================================
   UPDATE PHYSICS
========================================================= */

function updatePhysics(
    realDelta
) {

    if (
        !shotInProgress ||
        gameFinished
    ) {

        return;

    }


    physicsAccumulator +=
        realDelta;


    /*
       Avoid a giant catch-up after
       browser tab switching.
    */

    if (
        physicsAccumulator >
        0.15
    ) {

        physicsAccumulator =
            0.15;

    }


    let steps = 0;


    while (
        physicsAccumulator >=
        PHYSICS_STEP &&
        steps < MAX_SUBSTEPS
    ) {

        physicsStep(
            isHost
        );


        physicsAccumulator -=
            PHYSICS_STEP;


        steps++;

    }


    /*
       Host sends state.
    */

    if (isHost) {

        const now =
            performance.now();


        if (
            now -
            lastNetworkUpdate >=
            NETWORK_UPDATE_RATE
        ) {

            lastNetworkUpdate =
                now;

            broadcastState();

        }

    }

}


/* =========================================================
   ALL BALLS STOPPED
========================================================= */

function areAllBallsStopped() {

    for (
        const ball of balls
    ) {

        if (ball.pocketed) {

            continue;

        }


        if (
            Math.abs(ball.vx) >
                MIN_SPEED ||

            Math.abs(ball.vy) >
                MIN_SPEED
        ) {

            return false;

        }

    }


    return true;

}


/* =========================================================
   RAIL COLLISION
========================================================= */

function handleRailCollision(
    ball
) {

    const edge =
        BALL_RADIUS + 8;


    /*
       Left.
    */

    if (
        ball.x <
        edge
    ) {

        if (
            !isNearCornerOrPocket(
                ball
            )
        ) {

            ball.x =
                edge;

            if (
                ball.vx < 0
            ) {

                ball.vx =
                    -ball.vx *
                    WALL_BOUNCE;

            }

        }

    }


    /*
       Right.
    */

    if (
        ball.x >
        TABLE_WIDTH - edge
    ) {

        if (
            !isNearCornerOrPocket(
                ball
            )
        ) {

            ball.x =
                TABLE_WIDTH -
                edge;

            if (
                ball.vx > 0
            ) {

                ball.vx =
                    -ball.vx *
                    WALL_BOUNCE;

            }

        }

    }


    /*
       Top.
    */

    if (
        ball.y <
        edge
    ) {

        if (
            !isNearCornerOrPocket(
                ball
            )
        ) {

            ball.y =
                edge;

            if (
                ball.vy < 0
            ) {

                ball.vy =
                    -ball.vy *
                    WALL_BOUNCE;

            }

        }

    }


    /*
       Bottom.
    */

    if (
        ball.y >
        TABLE_HEIGHT - edge
    ) {

        if (
            !isNearCornerOrPocket(
                ball
            )
        ) {

            ball.y =
                TABLE_HEIGHT -
                edge;

            if (
                ball.vy > 0
            ) {

                ball.vy =
                    -ball.vy *
                    WALL_BOUNCE;

            }

        }

    }

}


/* =========================================================
   POCKET / CORNER CHECK
========================================================= */

function isNearCornerOrPocket(
    ball
) {

    for (
        const pocket of pockets
    ) {

        const distance =
            Math.hypot(

                ball.x -
                pocket.x,

                ball.y -
                pocket.y

            );


        if (
            distance <
            POCKET_RADIUS * 1.7
        ) {

            return true;

        }

    }


    return false;

}


/* =========================================================
   BALL COLLISION
========================================================= */

function resolveBallCollisions() {

    const minimumDistance =
        BALL_RADIUS * 2;


    for (
        let i = 0;
        i < balls.length;
        i++
    ) {

        const a =
            balls[i];


        if (a.pocketed) {

            continue;

        }


        for (
            let j = i + 1;
            j < balls.length;
            j++
        ) {

            const b =
                balls[j];


            if (b.pocketed) {

                continue;

            }


            let dx =
                b.x -
                a.x;

            let dy =
                b.y -
                a.y;


            let distance =
                Math.hypot(
                    dx,
                    dy
                );


            /*
               Prevent zero-distance NaN.
            */

            if (
                distance <
                0.0001
            ) {

                dx = 0.001;

                dy = 0;

                distance = 0.001;

            }


            if (
                distance >=
                minimumDistance
            ) {

                continue;

            }


            /*
               Normal points from A to B.
            */

            const nx =
                dx /
                distance;

            const ny =
                dy /
                distance;


            /*
               Positional correction.

               This is extremely important.

               It prevents balls from
               remaining inside each other.
            */

            const overlap =
                minimumDistance -
                distance;


            const correction =
                overlap *
                0.52;


            a.x -=
                nx *
                correction;

            a.y -=
                ny *
                correction;


            b.x +=
                nx *
                correction;

            b.y +=
                ny *
                correction;


            /*
               Relative velocity.

               va - vb.

               If positive along normal,
               balls are moving toward each other.
            */

            const relativeVx =
                a.vx -
                b.vx;

            const relativeVy =
                a.vy -
                b.vy;


            const velocityAlongNormal =
                relativeVx * nx +
                relativeVy * ny;


            /*
               IMPORTANT:

               The old code had this
               condition backwards.

               If <= 0, the balls are
               separating already.
            */

            if (
                velocityAlongNormal <=
                0
            ) {

                continue;

            }


            /*
               Equal mass impulse.
            */

            const impulse =
                (
                    1 +
                    BALL_BOUNCE
                ) *
                velocityAlongNormal /
                2;


            a.vx -=
                impulse *
                nx;

            a.vy -=
                impulse *
                ny;


            b.vx +=
                impulse *
                nx;

            b.vy +=
                impulse *
                ny;


            /*
               Tiny tangent damping.

               Makes the collision
               look more natural.
            */

            const tangentX =
                -ny;

            const tangentY =
                nx;


            const tangentRelative =
                relativeVx *
                tangentX +

                relativeVy *
                tangentY;


            const tangentFriction =
                0.015;


            const tangentImpulse =
                tangentRelative *
                tangentFriction;


            a.vx -=
                tangentImpulse *
                tangentX;

            a.vy -=
                tangentImpulse *
                tangentY;


            b.vx +=
                tangentImpulse *
                tangentX;

            b.vy +=
                tangentImpulse *
                tangentY;


            /*
               Register first cue hit.
            */

            if (
                firstBallHit === null
            ) {

                if (
                    a.number === 0 &&
                    b.number !== 0
                ) {

                    firstBallHit =
                        b.number;

                }

                else if (
                    b.number === 0 &&
                    a.number !== 0
                ) {

                    firstBallHit =
                        a.number;

                }

            }

        }

    }

}


/* =========================================================
   POCKET DETECTION
========================================================= */

function checkPockets() {

    for (
        const ball of balls
    ) {

        if (ball.pocketed) {

            continue;

        }


        for (
            const pocket of pockets
        ) {

            const distance =
                Math.hypot(

                    ball.x -
                    pocket.x,

                    ball.y -
                    pocket.y

                );


            if (
                distance <
                POCKET_RADIUS
            ) {

                pocketBall(
                    ball,
                    pocket
                );

                break;

            }

        }

    }

}


/* =========================================================
   POCKET BALL
========================================================= */

function pocketBall(
    ball,
    pocket
) {

    if (ball.pocketed) {

        return;

    }


    ball.pocketed =
        true;


    ball.vx = 0;

    ball.vy = 0;


    /*
       Put the ball visually
       inside the pocket.
    */

    ball.x =
        pocket.x;

    ball.y =
        pocket.y;


    if (
        ball.number === 0
    ) {

        cueBallPocketed =
            true;

        return;

    }


    shotPocketed.push(
        ball.number
    );

}


/* =========================================================
   GROUP BALLS LEFT
========================================================= */

function groupBallsLeft(
    group
) {

    return balls.some(
        ball =>

            !ball.pocketed &&

            (
                ball.type ===
                group
            )
    );

}


/* =========================================================
   FINISH SHOT
========================================================= */

function finishShot() {

    if (
        !isHost ||
        !shotInProgress
    ) {

        return;

    }


    shotInProgress =
        false;


    const shooter =
        turn;


    let keepTurn =
        false;


    /*
       Scratch.
    */

    if (cueBallPocketed) {

        const cue =
            balls.find(
                ball =>
                    ball.number === 0
            );


        if (cue) {

            cue.pocketed =
                false;

            cue.x =
                250;

            cue.y =
                TABLE_HEIGHT / 2;

            cue.vx =
                0;

            cue.vy =
                0;

        }

    }


    /*
       8 BALL.
    */

    if (
        shotPocketed.includes(8)
    ) {

        const group =
            playerGroups[
                shooter
            ];


        const canWin =

            group !== null &&

            !groupBallsLeft(
                group
            );


        if (canWin) {

            finishGame(
                shooter
            );

        }

        else {

            finishGame(

                shooter === "host"
                    ? "guest"
                    : "host"

            );

        }


        broadcastState();

        return;

    }


    /*
       Assign groups on first
       legal object ball pocket.
    */

    if (
        !playerGroups.host &&
        !playerGroups.guest
    ) {

        const firstObject =
            shotPocketed.find(
                number =>
                    number !== 8
            );


        if (
            firstObject
        ) {

            const selectedGroup =
                firstObject <= 7
                    ? "solid"
                    : "stripe";


            playerGroups[
                shooter
            ] =
                selectedGroup;


            playerGroups[
                shooter === "host"
                    ? "guest"
                    : "host"
            ] =

                selectedGroup ===
                "solid"

                    ? "stripe"

                    : "solid";

        }

    }


    /*
       Check if player pocketed
       at least one of their balls.
    */

    const playerGroup =
        playerGroups[
            shooter
        ];


    if (
        playerGroup &&

        shotPocketed.some(
            number =>

                (
                    number <= 7
                        ? "solid"
                        : "stripe"
                ) ===
                playerGroup
        ) &&

        !cueBallPocketed
    ) {

        keepTurn =
            true;

    }


    /*
       Scratch loses turn.
    */

    if (
        cueBallPocketed
    ) {

        keepTurn =
            false;

    }


    /*
       No pocketed ball =
       change turn.

       Opponent's ball =
       change turn.
    */

    if (!keepTurn) {

        turn =
            shooter === "host"
                ? "guest"
                : "host";

    }


    turnStartedAt =
        Date.now();


    shotId++;


    updateTurnUI();

    broadcastState();

}


/* =========================================================
   TIMER
========================================================= */

function updateTimer() {

    if (gameFinished) {

        return;

    }


    const elapsed =
        Math.floor(

            (
                Date.now() -
                turnStartedAt
            ) /
            1000

        );


    const remaining =
        Math.max(
            0,
            TURN_TIME -
            elapsed
        );


    if (timerElement) {

        timerElement.textContent =
            remaining;

    }


    /*
       Only Host controls timeout.
    */

    if (

        isHost &&

        remaining <= 0 &&

        !shotInProgress

    ) {

        turn =
            turn === "host"
                ? "guest"
                : "host";


        turnStartedAt =
            Date.now();


        if (messageElement) {

            messageElement.textContent =
                "Time is up! Turn changed.";

        }


        updateTurnUI();

        broadcastState();

    }

}


/* =========================================================
   TURN UI
========================================================= */

function updateTurnUI() {

    if (gameFinished) {

        return;

    }


    const mySide =
        getMySide();


    const myTurn =
        turn ===
        mySide;


    if (turnText) {

        turnText.textContent =
            myTurn
                ? "YOUR TURN"
                : "OPPONENT'S TURN";


        turnText.style.color =
            myTurn
                ? "#4dff92"
                : "#9eafb5";

    }


    if (messageElement) {

        if (shotInProgress) {

            messageElement.textContent =
                "Balls are moving...";

        }

        else if (myTurn) {

            const group =
                playerGroups[
                    mySide
                ];


            messageElement.textContent =
                group

                    ? `Your turn • ${group.toUpperCase()}`

                    : "Your turn! Choose your shot.";

        }

        else {

            messageElement.textContent =
                "Waiting for opponent...";

        }

    }

}


/* =========================================================
   GAME OVER
========================================================= */

function finishGame(
    winnerSide
) {

    if (gameFinished) {

        return;

    }


    gameFinished =
        true;


    winner =
        winnerSide;


    shotInProgress =
        false;


    guestPredicting =
        false;


    showGameOver(
        winnerSide
    );


    sendMessage({

        type:
            "gameOver",

        winner:
            winnerSide

    });


    broadcastState();

}


/* =========================================================
   SHOW GAME OVER
========================================================= */

function showGameOver(
    winnerSide
) {

    if (!winnerSide) {

        return;

    }


    const won =
        winnerSide ===
        getMySide();


    if (winnerTitle) {

        winnerTitle.textContent =
            won
                ? "You Win!"
                : "You Lose";

    }


    if (winnerText) {

        winnerText.textContent =
            won
                ? "🏆 Amazing game!"
                : "Better luck next time!";

    }


    const winnerIcon =
        document.getElementById(
            "winnerIcon"
        );


    if (winnerIcon) {

        winnerIcon.textContent =
            won
                ? "🏆"
                : "😢";

    }


    if (gameOverElement) {

        gameOverElement.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   BROADCAST STATE
========================================================= */

function broadcastState() {

    if (!isHost) {

        return;

    }


    sendMessage({

        type:
            "state",

        balls:
            serializeBalls(),

        turn:
            turn,

        turnStartedAt:
            turnStartedAt,

        groups:
            playerGroups,

        gameFinished:
            gameFinished,

        winner:
            winner,

        shotInProgress:
            shotInProgress,

        shotId:
            shotId,

        serverTime:
            Date.now()

    });

}


/* =========================================================
   SEND NETWORK MESSAGE
========================================================= */

function sendMessage(data) {

    if (

        !dataChannel ||

        dataChannel.readyState !==
        "open"

    ) {

        return;

    }


    try {

        dataChannel.send(
            JSON.stringify(
                data
            )
        );

    }

    catch (error) {

        console.error(
            "WebRTC send error:",
            error
        );

    }

}


/* =========================================================
   NETWORK MESSAGE HANDLER
========================================================= */

function handleNetworkMessage(
    message
) {

    if (!message) {

        return;

    }


    switch (
        message.type
    ) {


        /* ================================================
           GUEST SHOT
        ================================================ */

        case "shot": {

            if (!isHost) {

                return;

            }


            if (
                turn !== "guest" ||
                shotInProgress ||
                gameFinished
            ) {

                return;

            }


            /*
               Validate values.
            */

            const angle =
                Number(
                    message.angle
                );

            const shotPower =
                Number(
                    message.power
                );


            if (
                !Number.isFinite(angle) ||
                !Number.isFinite(shotPower)
            ) {

                return;

            }


            const safePower =
                Math.max(
                    0.03,
                    Math.min(
                        1,
                        shotPower
                    )
                );


            executeShot(

                angle,

                safePower,

                "guest"

            );


            break;

        }


        /* ================================================
           HOST STATE
        ================================================ */

        case "state": {

            if (isHost) {

                return;

            }


            /*
               Ignore very old states.
            */

            if (
                typeof message.shotId ===
                "number" &&

                message.shotId <
                lastStateReceived
            ) {

                return;

            }


            if (
                typeof message.shotId ===
                "number"
            ) {

                lastStateReceived =
                    message.shotId;

            }


            applyBalls(
                message.balls
            );


            turn =
                message.turn ||
                turn;


            turnStartedAt =
                message.turnStartedAt ||
                turnStartedAt;


            playerGroups =
                message.groups ||
                playerGroups;


            gameFinished =
                Boolean(
                    message.gameFinished
                );


            winner =
                message.winner ||
                null;


            shotInProgress =
                Boolean(
                    message.shotInProgress
                );


            /*
               If Host has confirmed the
               shot has finished, prediction
               is no longer needed.
            */

            if (
                !shotInProgress
            ) {

                guestPredicting =
                    false;

            }


            /*
               If Host started a new shot,
               Guest should predict it too.

               This covers the case where
               the opponent shoots.
            */

            if (
                shotInProgress &&
                !guestPredicting
            ) {

                /*
                   We already received the
                   authoritative velocities.

                   Continue local simulation.
                */

                guestPredicting =
                    true;

            }


            aiming =
                false;


            reconcileGuestBalls();


            updateTurnUI();


            if (gameFinished) {

                showGameOver(
                    winner
                );

            }


            break;

        }


        /* ================================================
           CHAT
        ================================================ */

        case "chat": {

            addChatMessage(

                message.name ||
                opponentName,

                message.text,

                false

            );


            break;

        }


        /* ================================================
           GAME OVER
        ================================================ */

        case "gameOver": {

            gameFinished =
                true;


            winner =
                message.winner;


            shotInProgress =
                false;


            guestPredicting =
                false;


            showGameOver(
                winner
            );


            break;

        }

    }

}


/* =========================================================
   CHAT
========================================================= */

function addChatMessage(
    name,
    text,
    mine = false
) {

    if (
        !chatMessages ||
        !text
    ) {

        return;

    }


    const message =
        document.createElement(
            "div"
        );


    message.className =
        mine
            ? "chat-message mine"
            : "chat-message";


    const nameElement =
        document.createElement(
            "div"
        );


    nameElement.className =
        "chat-name";


    nameElement.textContent =
        name;


    const textElement =
        document.createElement(
            "div"
        );


    textElement.className =
        "chat-text";


    textElement.textContent =
        text;


    message.appendChild(
        nameElement
    );


    message.appendChild(
        textElement
    );


    chatMessages.appendChild(
        message
    );


    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}


/* =========================================================
   SEND CHAT
========================================================= */

function sendChatMessage() {

    if (!chatInput) {

        return;

    }


    const text =
        chatInput.value.trim();


    if (!text) {

        return;

    }


    if (

        !dataChannel ||

        dataChannel.readyState !==
        "open"

    ) {

        return;

    }


    sendMessage({

        type:
            "chat",

        name:
            userName,

        text:
            text

    });


    addChatMessage(

        userName,

        text,

        true

    );


    chatInput.value =
        "";

}


if (sendChatButton) {

    sendChatButton.addEventListener(
        "click",
        sendChatMessage
    );

}


if (chatInput) {

    chatInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                sendChatMessage();

            }

        }
    );

}


/* =========================================================
   CREATE PEER
========================================================= */

function createPeer() {

    peer =
        new RTCPeerConnection(
            RTC_CONFIG
        );


    peer.onconnectionstatechange =
        () => {

            if (!peer) {

                return;

            }


            const state =
                peer.connectionState;


            console.log(
                "WebRTC:",
                state
            );


            if (
                state ===
                "connected"
            ) {

                setConnectionStatus(
                    true,
                    "Connected"
                );

            }

            else if (

                state ===
                "failed" ||

                state ===
                "disconnected"

            ) {

                setConnectionStatus(
                    false,
                    "Connection lost"
                );

            }

            else if (
                state ===
                "connecting"
            ) {

                setConnectionStatus(
                    false,
                    "Connecting..."
                );

            }

        };


    peer.oniceconnectionstatechange =
        () => {

            if (!peer) {

                return;

            }


            console.log(
                "ICE:",
                peer.iceConnectionState
            );

        };

}


/* =========================================================
   SETUP DATA CHANNEL
========================================================= */

function setupDataChannel(
    channel
) {

    dataChannel =
        channel;


    dataChannel.onopen =
        () => {

            console.log(
                "🎱 DataChannel connected"
            );


            setConnectionStatus(
                true,
                "Connected"
            );


            /*
               Host creates the game.
            */

            if (isHost) {

                if (
                    balls.length === 0
                ) {

                    createInitialBalls();

                }


                turn =
                    "host";


                turnStartedAt =
                    Date.now();


                shotId =
                    0;


                broadcastState();

            }

        };


    dataChannel.onclose =
        () => {

            setConnectionStatus(
                false,
                "Disconnected"
            );

        };


    dataChannel.onerror =
        error => {

            console.error(
                "DataChannel error:",
                error
            );

        };


    dataChannel.onmessage =
        event => {

            try {

                const message =
                    JSON.parse(
                        event.data
                    );


                handleNetworkMessage(
                    message
                );

            }

            catch (error) {

                console.error(
                    "Bad network message:",
                    error
                );

            }

        };

}


/* =========================================================
   CONNECTION STATUS
========================================================= */

function setConnectionStatus(
    connected,
    text
) {

    if (connectionText) {

        connectionText.textContent =
            text;

    }


    if (connectionDot) {

        connectionDot.classList.toggle(
            "connected",
            connected
        );

    }

}


/* =========================================================
   HOST WEBRTC
========================================================= */

async function startHostWebRTC() {

    createPeer();


    dataChannel =
        peer.createDataChannel(
            "pool",
            {
                ordered: true
            }
        );


    setupDataChannel(
        dataChannel
    );


    const offer =
        await peer.createOffer();


    await peer.setLocalDescription(
        offer
    );


    await waitForIceGathering(
        peer
    );


    const description =
        peer.localDescription;


    await setDoc(

        signalRef,

        {

            offer: {

                type:
                    description.type,

                sdp:
                    description.sdp

            }

        },

        {

            merge:
                true

        }

    );


    signalingUnsubscribe =
        onSnapshot(

            signalRef,

            async snapshot => {

                if (
                    !snapshot.exists()
                ) {

                    return;

                }


                const data =
                    snapshot.data();


                if (

                    data.answer &&

                    !peer.currentRemoteDescription

                ) {

                    try {

                        await peer.setRemoteDescription(

                            new RTCSessionDescription(
                                data.answer
                            )

                        );

                    }

                    catch (error) {

                        console.error(
                            "Remote answer error:",
                            error
                        );

                    }

                }

            }

        );

}


/* =========================================================
   GUEST WEBRTC
========================================================= */

async function startGuestWebRTC() {

    createPeer();


    peer.ondatachannel =
        event => {

            setupDataChannel(
                event.channel
            );

        };


    signalingUnsubscribe =
        onSnapshot(

            signalRef,

            async snapshot => {

                if (
                    !snapshot.exists()
                ) {

                    return;

                }


                const data =
                    snapshot.data();


                if (

                    data.offer &&

                    !peer.currentRemoteDescription

                ) {

                    try {

                        await peer.setRemoteDescription(

                            new RTCSessionDescription(
                                data.offer
                            )

                        );


                        const answer =
                            await peer.createAnswer();


                        await peer.setLocalDescription(
                            answer
                        );


                        await waitForIceGathering(
                            peer
                        );


                        const description =
                            peer.localDescription;


                        await setDoc(

                            signalRef,

                            {

                                answer: {

                                    type:
                                        description.type,

                                    sdp:
                                        description.sdp

                                }

                            },

                            {

                                merge:
                                    true

                            }

                        );

                    }

                    catch (error) {

                        console.error(
                            "Guest WebRTC error:",
                            error
                        );

                    }

                }

            }

        );

}


/* =========================================================
   WAIT FOR ICE
========================================================= */

function waitForIceGathering(
    pc
) {

    return new Promise(
        resolve => {

            if (
                pc.iceGatheringState ===
                "complete"
            ) {

                resolve();

                return;

            }


            const check =
                () => {

                    if (

                        pc.iceGatheringState ===
                        "complete"

                    ) {

                        pc.removeEventListener(

                            "icegatheringstatechange",

                            check

                        );


                        resolve();

                    }

                };


            pc.addEventListener(

                "icegatheringstatechange",

                check

            );


            /*
               Safety timeout.

               Some browsers/networks
               can keep ICE gathering
               open for too long.
            */

            setTimeout(
                resolve,
                5000
            );

        }
    );

}


/* =========================================================
   LOAD ROOM
========================================================= */

async function loadRoom() {

    try {

        const snapshot =
            await getDoc(
                roomRef
            );


        if (
            !snapshot.exists()
        ) {

            if (messageElement) {

                messageElement.textContent =
                    "Room not found.";

            }

            return;

        }


        roomData =
            snapshot.data();


        isHost =
            roomData.hostId ===
            userId;


        if (isHost) {

            opponentId =
                roomData.guestId;


            opponentName =
                roomData.guestName ||
                "Opponent";

        }

        else {

            opponentId =
                roomData.hostId;


            opponentName =
                roomData.hostName ||
                "Opponent";

        }


        if (opponentNameElement) {

            opponentNameElement.textContent =
                opponentName;

        }


        setConnectionStatus(
            false,
            "Connecting..."
        );


        if (isHost) {

            turn =
                "host";


            turnStartedAt =
                Date.now();


            /*
               Host owns initial state.
            */

            createInitialBalls();


            await startHostWebRTC();

        }

        else {

            /*
               Guest waits for Host state.
            */

            balls = [];


            await startGuestWebRTC();

        }


        updateTurnUI();

    }

    catch (error) {

        console.error(
            "Room loading error:",
            error
        );


        if (messageElement) {

            messageElement.textContent =
                "Could not load match.";

        }

    }

}


/* =========================================================
   CANVAS RESIZE
========================================================= */

function resizeCanvas() {

    const rect =
        canvas.getBoundingClientRect();


    const dpr =
        window.devicePixelRatio ||
        1;


    canvas.width =
        Math.floor(
            rect.width *
            dpr
        );


    canvas.height =
        Math.floor(
            rect.height *
            dpr
        );


    ctx.setTransform(

        dpr,
        0,
        0,
        dpr,
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
   SCREEN TO TABLE
========================================================= */

function screenToTable(
    clientX,
    clientY
) {

    const rect =
        canvas.getBoundingClientRect();


    return {

        x:

            (
                clientX -
                rect.left
            )

            /

            rect.width

            *

            TABLE_WIDTH,


        y:

            (
                clientY -
                rect.top
            )

            /

            rect.height

            *

            TABLE_HEIGHT

    };

}


/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop(
    now
) {

    let realDelta =
        (
            now -
            lastFrameTime
        ) /
        1000;


    lastFrameTime =
        now;


    /*
       Prevent huge frame jumps.
    */

    realDelta =
        Math.min(
            realDelta,
            0.10
        );


    /*
       HOST:

       authoritative physics.
    */

    if (isHost) {

        updatePhysics(
            realDelta
        );

    }

    else {

        /*
           GUEST:

           run local prediction
           immediately.

           This means when Guest shoots,
           balls start moving on the
           Guest's screen without waiting
           for Host.
        */

        if (
            shotInProgress &&
            guestPredicting
        ) {

            updatePhysics(
                realDelta
            );

        }


        /*
           Smooth correction from Host.
        */

        reconcileGuestBalls();

    }


    draw();

    updateTimer();


    requestAnimationFrame(
        gameLoop
    );

}


requestAnimationFrame(
    gameLoop
);


/* =========================================================
   DRAW
========================================================= */

function draw() {

    const rect =
        canvas.getBoundingClientRect();


    const width =
        rect.width;

    const height =
        rect.height;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    const scaleX =
        width /
        TABLE_WIDTH;


    const scaleY =
        height /
        TABLE_HEIGHT;


    ctx.save();


    ctx.scale(
        scaleX,
        scaleY
    );


    drawTable();


    for (
        const ball of balls
    ) {

        if (
            !ball.pocketed
        ) {

            drawBall(
                ball
            );

        }

    }


    drawAim();


    ctx.restore();

}


/* =========================================================
   DRAW TABLE
========================================================= */

function drawTable() {

    /*
       Wooden border.
    */

    const borderGradient =
        ctx.createLinearGradient(

            0,
            0,

            0,
            TABLE_HEIGHT

        );


    borderGradient.addColorStop(
        0,
        "#4a2411"
    );


    borderGradient.addColorStop(
        0.5,
        "#7a3b1b"
    );


    borderGradient.addColorStop(
        1,
        "#301408"
    );


    ctx.fillStyle =
        borderGradient;


    ctx.fillRect(

        0,
        0,

        TABLE_WIDTH,
        TABLE_HEIGHT

    );


    /*
       Green cloth.
    */

    const clothGradient =
        ctx.createLinearGradient(

            0,
            0,

            TABLE_WIDTH,
            TABLE_HEIGHT

        );


    clothGradient.addColorStop(
        0,
        "#08794c"
    );


    clothGradient.addColorStop(
        0.5,
        "#05683e"
    );


    clothGradient.addColorStop(
        1,
        "#034326"
    );


    ctx.fillStyle =
        clothGradient;


    ctx.fillRect(

        25,
        25,

        TABLE_WIDTH - 50,
        TABLE_HEIGHT - 50

    );


    /*
       Center line.
    */

    ctx.save();


    ctx.globalAlpha =
        0.08;


    ctx.strokeStyle =
        "#ffffff";


    ctx.lineWidth =
        2;


    ctx.beginPath();


    ctx.moveTo(
        TABLE_WIDTH / 2,
        25
    );


    ctx.lineTo(
        TABLE_WIDTH / 2,
        TABLE_HEIGHT - 25
    );


    ctx.stroke();


    ctx.restore();


    /*
       Diamonds.
    */

    ctx.save();


    ctx.fillStyle =
        "rgba(255,255,255,.35)";


    for (
        let i = 1;
        i < 7;
        i++
    ) {

        const x =
            TABLE_WIDTH *
            i /
            7;


        ctx.beginPath();


        ctx.arc(
            x,
            15,
            3,
            0,
            Math.PI * 2
        );


        ctx.fill();


        ctx.beginPath();


        ctx.arc(
            x,
            TABLE_HEIGHT - 15,
            3,
            0,
            Math.PI * 2
        );


        ctx.fill();

    }


    ctx.restore();


    /*
       Pockets.
    */

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
            "#000"
        );


        gradient.addColorStop(
            1,
            "#161616"
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


/* =========================================================
   DRAW BALL
========================================================= */

function drawBall(
    ball
) {

    const radius =
        BALL_RADIUS;


    ctx.save();


    /*
       Shadow.
    */

    ctx.beginPath();


    ctx.arc(

        ball.x + 3,
        ball.y + 4,

        radius,

        0,
        Math.PI * 2

    );


    ctx.fillStyle =
        "rgba(0,0,0,.28)";


    ctx.fill();


    /*
       Main ball.
    */

    if (
        ball.number === 0
    ) {

        ctx.fillStyle =
            "#f5f5f5";


        ctx.beginPath();


        ctx.arc(

            ball.x,
            ball.y,
            radius,

            0,
            Math.PI * 2

        );


        ctx.fill();

    }

    else if (
        ball.number >= 9
    ) {

        /*
           Stripe.
        */

        ctx.fillStyle =
            "#f7f7f7";


        ctx.beginPath();


        ctx.arc(

            ball.x,
            ball.y,
            radius,

            0,
            Math.PI * 2

        );


        ctx.fill();


        ctx.save();


        ctx.beginPath();


        ctx.arc(

            ball.x,
            ball.y,
            radius,

            0,
            Math.PI * 2

        );


        ctx.clip();


        ctx.fillStyle =
            BALL_COLORS[
                ball.number
            ];


        ctx.fillRect(

            ball.x -
            radius,

            ball.y -
            radius *
            0.48,

            radius *
            2,

            radius *
            0.96

        );


        ctx.restore();

    }

    else {

        ctx.fillStyle =
            BALL_COLORS[
                ball.number
            ] ||
            "#ffffff";


        ctx.beginPath();


        ctx.arc(

            ball.x,
            ball.y,
            radius,

            0,
            Math.PI * 2

        );


        ctx.fill();

    }


    /*
       Border.
    */

    ctx.beginPath();


    ctx.arc(

        ball.x,
        ball.y,
        radius,

        0,
        Math.PI * 2

    );


    ctx.strokeStyle =
        "rgba(0,0,0,.4)";


    ctx.lineWidth =
        1.5;


    ctx.stroke();


    /*
       Number circle.
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
            radius *
            0.45,

            0,
            Math.PI * 2

        );


        ctx.fill();


        ctx.fillStyle =
            "#111";


        ctx.font =
            "bold 11px Arial";


        ctx.textAlign =
            "center";


        ctx.textBaseline =
            "middle";


        ctx.fillText(

            ball.number,

            ball.x,
            ball.y + 1

        );

    }


    /*
       Reflection.
    */

    const highlight =
        ctx.createRadialGradient(

            ball.x -
            radius *
            0.35,

            ball.y -
            radius *
            0.35,

            1,

            ball.x,
            ball.y,

            radius

        );


    highlight.addColorStop(
        0,
        "rgba(255,255,255,.55)"
    );


    highlight.addColorStop(
        0.35,
        "rgba(255,255,255,.1)"
    );


    highlight.addColorStop(
        1,
        "rgba(255,255,255,0)"
    );


    ctx.fillStyle =
        highlight;


    ctx.beginPath();


    ctx.arc(

        ball.x,
        ball.y,
        radius,

        0,
        Math.PI * 2

    );


    ctx.fill();


    ctx.restore();

}


/* =========================================================
   DRAW AIM
========================================================= */

function drawAim() {

    if (
        !aiming ||
        !canCurrentPlayerShoot()
    ) {

        return;

    }


    const cue =
        getCueBall();


    if (!cue) {

        return;

    }


    let dx =
        cue.x -
        aimCurrent.x;

    let dy =
        cue.y -
        aimCurrent.y;


    const distance =
        Math.hypot(
            dx,
            dy
        );


    if (
        distance < 1
    ) {

        return;

    }


    const nx =
        -dx /
        distance;

    const ny =
        -dy /
        distance;


    ctx.save();


    /*
       Aim line.
    */

    ctx.strokeStyle =
        "rgba(255,255,255,.7)";


    ctx.lineWidth =
        2;


    ctx.setLineDash(
        [8, 8]
    );


    ctx.beginPath();


    ctx.moveTo(
        cue.x,
        cue.y
    );


    ctx.lineTo(

        cue.x +
        nx *
        350,

        cue.y +
        ny *
        350

    );


    ctx.stroke();


    ctx.setLineDash(
        []
    );


    /*
       Cue stick.
    */

    ctx.strokeStyle =
        "#d7b37a";


    ctx.lineWidth =
        7;


    ctx.lineCap =
        "round";


    ctx.beginPath();


    ctx.moveTo(

        cue.x -
        nx *
        35,

        cue.y -
        ny *
        35

    );


    ctx.lineTo(

        cue.x -
        nx *

        (
            100 +
            power *
            120
        ),

        cue.y -
        ny *

        (
            100 +
            power *
            120
        )

    );


    ctx.stroke();


    ctx.restore();

}


/* =========================================================
   LEAVE
========================================================= */

if (leaveButton) {

    leaveButton.onclick =
        () => {

            window.location.href =
                "index.html";

        };

}


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (
            signalingUnsubscribe
        ) {

            signalingUnsubscribe();

        }


        if (peer) {

            peer.close();

        }

    }
);


/* =========================================================
   START
========================================================= */

loadRoom();