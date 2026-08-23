/* =========================================================
   MOSAYAD GAMES
   8 BALL POOL - ONLINE MATCH

   NETWORK MODEL
   ---------------------------------------------------------
   Host:
   - Authoritative rules
   - Authoritative turn
   - Authoritative timer
   - Authoritative final result

   BOTH PLAYERS:
   - Run the same physics locally
   - Receive shot commands immediately
   - Render shots immediately
   - Receive periodic authoritative corrections

   IMPORTANT:
   - WebRTC carries game commands/state/chat
   - Firebase is signaling only
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

let roomData =
    null;

let isHost =
    false;

let opponentId =
    null;

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

let peer =
    null;

let dataChannel =
    null;

let signalingUnsubscribe =
    null;


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


/* =========================================================
   PHYSICS CONSTANTS
========================================================= */

const BALL_RADIUS =
    16;

const BALL_DIAMETER =
    BALL_RADIUS * 2;

const POCKET_RADIUS =
    31;


/*
   Friction per physics frame.
*/
const FRICTION =
    0.986;


/*
   Cushion bounce.
*/
const WALL_BOUNCE =
    0.90;


/*
   Ball collision elasticity.
*/
const BALL_BOUNCE =
    0.97;


/*
   Maximum cue velocity.
*/
const MAX_POWER =
    28;


/*
   Minimum velocity.
*/
const MIN_SPEED =
    0.025;


/*
   Turn timer.
*/
const TURN_TIME =
    60;


/*
   Network state rate.
*/
const NETWORK_UPDATE_RATE =
    40;


/*
   Guest reconciliation.
*/
const INTERPOLATION =
    0.30;


/*
   Fixed physics timestep.

   The game does not depend directly
   on FPS anymore.
*/
const FIXED_DT =
    1;


/*
   Maximum physics iterations per frame.
*/
const MAX_PHYSICS_STEPS =
    8;


/*
   Maximum frame time.
*/
const MAX_FRAME_DELTA =
    50;


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

let balls =
    [];


let targetBalls =
    null;


let turn =
    "host";


let turnStartedAt =
    Date.now();


let gameFinished =
    false;


let shotInProgress =
    false;


let winner =
    null;


/*
   Player groups.
*/
let playerGroups = {

    host: null,

    guest: null

};


/*
   Current shot information.
*/
let shotPocketed =
    [];

let cueBallPocketed =
    false;

let firstBallHit =
    null;


/*
   Current shot ID.

   Prevents duplicate commands.
*/
let currentShotId =
    null;


/*
   Last shot ID received.
*/
let lastReceivedShotId =
    null;


/*
   Prediction state.

   Guest can simulate locally,
   but only Host can finish the shot.
*/
let localPrediction =
    false;


/* =========================================================
   NETWORK TIMING
========================================================= */

let lastNetworkUpdate =
    0;

let lastStateReceived =
    0;


/* =========================================================
   ANIMATION TIMING
========================================================= */

let lastTime =
    performance.now();

let physicsAccumulator =
    0;


/* =========================================================
   INPUT
========================================================= */

let aiming =
    false;


let aimCurrent = {

    x: 0,
    y: 0

};


let power =
    0;


/* =========================================================
   UTILITY
========================================================= */

function oppositeSide(side) {

    return side === "host"
        ? "guest"
        : "host";

}


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

    balls =
        [];


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
   COPY BALL STATE
========================================================= */

function cloneBalls(data) {

    if (!Array.isArray(data)) {

        return [];

    }


    return data.map(
        ball => ({

            ...ball

        })
    );

}


/* =========================================================
   APPLY AUTHORITATIVE STATE
========================================================= */

function applyBalls(data) {

    if (!Array.isArray(data)) {

        return;

    }


    targetBalls =
        cloneBalls(data);


    lastStateReceived =
        performance.now();


    /*
       First state.
    */

    if (
        !balls.length ||
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
       Add missing balls.
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

            balls.push({

                ...remoteBall

            });

        }

    }

}


/* =========================================================
   GUEST RECONCILIATION
========================================================= */

function interpolateRemoteBalls() {

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

        const ball =
            balls.find(
                item =>
                    item.id ===
                    target.id
            );


        if (!ball) {

            continue;

        }


        /*
           Pocketed balls must be
           immediately synchronized.
        */

        if (target.pocketed) {

            ball.pocketed =
                true;

            ball.x =
                target.x;

            ball.y =
                target.y;

            ball.vx =
                0;

            ball.vy =
                0;

            continue;

        }


        /*
           If ball was previously
           pocketed, restore it.
        */

        if (ball.pocketed) {

            ball.pocketed =
                false;

            ball.x =
                target.x;

            ball.y =
                target.y;

            ball.vx =
                target.vx;

            ball.vy =
                target.vy;

            continue;

        }


        const dx =
            target.x -
            ball.x;

        const dy =
            target.y -
            ball.y;


        const distance =
            Math.hypot(
                dx,
                dy
            );


        /*
           Large correction:
           teleport to authoritative state.
        */

        if (distance > 80) {

            ball.x =
                target.x;

            ball.y =
                target.y;

        }
        else {

            /*
               During prediction we don't
               want to completely overwrite
               local movement every snapshot.
            */

            const correction =
                INTERPOLATION;

            ball.x +=
                dx *
                correction;

            ball.y +=
                dy *
                correction;

        }


        /*
           Velocity follows Host.
        */

        ball.vx +=
            (
                target.vx -
                ball.vx
            ) *
            0.45;

        ball.vy +=
            (
                target.vy -
                ball.vy
            ) *
            0.45;

    }

}


/* =========================================================
   HARD SYNC BALLS
========================================================= */

function hardSyncBalls(data) {

    if (!Array.isArray(data)) {

        return;

    }


    balls =
        cloneBalls(data);


    targetBalls =
        cloneBalls(data);

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
   GET MY SIDE
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
   GENERATE SHOT ID
========================================================= */

function generateShotId() {

    return (

        Date.now().toString(36) +

        "-" +

        Math.random()
            .toString(36)
            .slice(2, 10)

    );

}


/* =========================================================
   START LOCAL SHOT PHYSICS
========================================================= */

function startLocalShot(
    angle,
    shotPower,
    shooter,
    shotId
) {

    if (gameFinished) {

        return false;

    }


    const cue =
        getCueBall();


    if (!cue) {

        return false;

    }


    /*
       Reset shot tracking.
    */

    shotPocketed =
        [];

    cueBallPocketed =
        false;

    firstBallHit =
        null;


    currentShotId =
        shotId;


    shotInProgress =
        true;


    localPrediction =
        !isHost;


    /*
       Set cue velocity.

       IMPORTANT:
       Both players perform the exact
       same calculation.
    */

    cue.vx =
        Math.cos(angle) *
        MAX_POWER *
        shotPower;


    cue.vy =
        Math.sin(angle) *
        MAX_POWER *
        shotPower;


    aiming =
        false;


    return true;

}


/* =========================================================
   EXECUTE SHOT - HOST
========================================================= */

function executeShot(
    angle,
    shotPower,
    shooter,
    shotId = null
) {

    if (
        !isHost ||
        shotInProgress ||
        gameFinished
    ) {

        return;

    }


    if (
        shooter !==
        turn
    ) {

        return;

    }


    const cue =
        getCueBall();


    if (!cue) {

        return;

    }


    const id =
        shotId ||
        generateShotId();


    /*
       Start Host physics immediately.
    */

    const started =
        startLocalShot(
            angle,
            shotPower,
            shooter,
            id
        );


    if (!started) {

        return;

    }


    /*
       Tell Guest to start the same
       shot immediately.

       This is the main improvement.
    */

    sendMessage({

        type:
            "shot",

        shotId:
            id,

        shooter:
            shooter,

        angle:
            angle,

        power:
            shotPower

    });


    /*
       Send state immediately too.
    */

    broadcastState();

}


/* =========================================================
   GUEST SEND SHOT
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


    const shotId =
        generateShotId();


    /*
       HOST

       Execute immediately.
    */

    if (isHost) {

        executeShot(
            angle,
            shotPower,
            "host",
            shotId
        );

        return;

    }


    /*
       GUEST

       IMPORTANT:
       Start the physics locally BEFORE
       waiting for the Host.

       So the player sees the shot
       immediately.
    */

    const started =
        startLocalShot(
            angle,
            shotPower,
            "guest",
            shotId
        );


    if (!started) {

        return;

    }


    /*
       Tell Host.
    */

    sendMessage({

        type:
            "shot",

        shotId:
            shotId,

        shooter:
            mySide,

        angle:
            angle,

        power:
            shotPower

    });


    /*
       The Host will later send the
       authoritative state.
    */

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

                point.x -
                cue.x,

                point.y -
                cue.y

            );


        /*
           Allow aiming near cue.
        */

        if (
            distance >
            BALL_RADIUS * 7
        ) {

            return;

        }


        aiming =
            true;


        aimCurrent =
            point;


        power =
            0;


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


        aiming =
            false;


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

            power =
                0;

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

            power =
                0;

            if (powerFill) {

                powerFill.style.width =
                    "0%";

            }

            return;

        }


        /*
           Pull-back aiming.

           The shot direction is
           opposite the pointer.
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


        const shotPower =
            power;


        shoot(
            angle,
            shotPower
        );


        power =
            0;


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

        aiming =
            false;

        power =
            0;


        if (powerFill) {

            powerFill.style.width =
                "0%";

        }

    }
);


/* =========================================================
   PHYSICS UPDATE
========================================================= */

function updatePhysics(dt) {

    if (
        !shotInProgress ||
        gameFinished
    ) {

        return;

    }


    /*
       Move every ball.
    */

    for (
        const ball of balls
    ) {

        if (ball.pocketed) {

            continue;

        }


        /*
           Position.
        */

        ball.x +=
            ball.vx *
            dt;


        ball.y +=
            ball.vy *
            dt;


        /*
           Friction.

           Fixed-step physics makes this
           deterministic.
        */

        ball.vx *=
            FRICTION;

        ball.vy *=
            FRICTION;


        /*
           Stop tiny velocities.
        */

        if (
            Math.abs(ball.vx) <
            MIN_SPEED
        ) {

            ball.vx =
                0;

        }


        if (
            Math.abs(ball.vy) <
            MIN_SPEED
        ) {

            ball.vy =
                0;

        }


        /*
           Rails.
        */

        handleRailCollision(
            ball
        );

    }


    /*
       Multiple collision passes.

       This helps when 3+ balls collide
       at the same time.
    */

    for (
        let pass = 0;
        pass < 3;
        pass++
    ) {

        resolveBallCollisions();

    }


    /*
       Pocket detection.
    */

    checkPockets();

}


/* =========================================================
   HAS MOVING BALLS
========================================================= */

function hasMovingBalls() {

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

            return true;

        }

    }


    return false;

}


/* =========================================================
   RAIL COLLISION
========================================================= */

function handleRailCollision(ball) {

    if (ball.pocketed) {

        return;

    }


    /*
       Pocket openings.

       If a ball is close enough to
       a pocket, don't force it against
       the cushion.
    */

    const nearPocket =
        isNearPocketOpening(
            ball
        );


    const edge =
        BALL_RADIUS + 9;


    /*
       LEFT.
    */

    if (ball.x < edge) {

        if (!nearPocket) {

            ball.x =
                edge;

            if (ball.vx < 0) {

                ball.vx =
                    -ball.vx *
                    WALL_BOUNCE;

            }

        }

    }


    /*
       RIGHT.
    */

    if (
        ball.x >
        TABLE_WIDTH - edge
    ) {

        if (!nearPocket) {

            ball.x =
                TABLE_WIDTH -
                edge;

            if (ball.vx > 0) {

                ball.vx =
                    -ball.vx *
                    WALL_BOUNCE;

            }

        }

    }


    /*
       TOP.
    */

    if (ball.y < edge) {

        if (!nearPocket) {

            ball.y =
                edge;

            if (ball.vy < 0) {

                ball.vy =
                    -ball.vy *
                    WALL_BOUNCE;

            }

        }

    }


    /*
       BOTTOM.
    */

    if (
        ball.y >
        TABLE_HEIGHT - edge
    ) {

        if (!nearPocket) {

            ball.y =
                TABLE_HEIGHT -
                edge;

            if (ball.vy > 0) {

                ball.vy =
                    -ball.vy *
                    WALL_BOUNCE;

            }

        }

    }

}


/* =========================================================
   POCKET OPENING CHECK
========================================================= */

function isNearPocketOpening(ball) {

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
            POCKET_RADIUS * 1.75
        ) {

            return true;

        }

    }


    return false;

}


/* =========================================================
   BALL COLLISIONS
========================================================= */

function resolveBallCollisions() {

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


            const minimumDistance =
                BALL_DIAMETER;


            /*
               Prevent division by zero.
            */

            if (
                distance <
                0.0001
            ) {

                dx =
                    0.001;

                dy =
                    0;

                distance =
                    0.001;

            }


            if (
                distance >=
                minimumDistance
            ) {

                continue;

            }


            /*
               Normal from A -> B.
            */

            const nx =
                dx /
                distance;


            const ny =
                dy /
                distance;


            /*
               First object ball hit
               by cue ball.
            */

            if (!firstBallHit) {

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


            /*
               Separate overlapping balls.
            */

            const overlap =
                minimumDistance -
                distance;


            const correction =
                overlap / 2;


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
               ------------------------------------------------
               IMPORTANT FIX
               ------------------------------------------------

               Relative velocity is B - A.

               If velocityAlongNormal < 0,
               balls are moving toward each other.

               The old code used A - B and then
               reversed the condition, causing many
               collisions to be ignored.
            */

            const relativeVx =
                b.vx -
                a.vx;


            const relativeVy =
                b.vy -
                a.vy;


            const velocityAlongNormal =
                relativeVx * nx +
                relativeVy * ny;


            /*
               Already moving apart.
            */

            if (
                velocityAlongNormal >=
                0
            ) {

                continue;

            }


            /*
               Equal mass elastic collision.
            */

            const impulse =
                -(
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
               Tangential friction.

               This prevents completely unrealistic
               sliding behavior.
            */

            const tx =
                -ny;


            const ty =
                nx;


            const tangentVelocity =
                relativeVx * tx +
                relativeVy * ty;


            const tangentImpulse =
                tangentVelocity *
                0.015;


            a.vx +=
                tangentImpulse *
                tx;


            a.vy +=
                tangentImpulse *
                ty;


            b.vx -=
                tangentImpulse *
                tx;


            b.vy -=
                tangentImpulse *
                ty;

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
            const pocket
            of pockets
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


            /*
               Pocket entry.
            */

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


    /*
       Put it visually in pocket.
    */

    ball.x =
        pocket.x;


    ball.y =
        pocket.y;


    ball.vx =
        0;


    ball.vy =
        0;


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

            ball.type ===
            group

    );

}


/* =========================================================
   FINISH SHOT
========================================================= */

function finishShot() {

    /*
       Only Host can decide
       the result of a shot.
    */

    if (
        !isHost ||
        !shotInProgress
    ) {

        return;

    }


    /*
       Make sure every tiny velocity
       is zero.
    */

    for (
        const ball of balls
    ) {

        if (!ball.pocketed) {

            if (
                Math.abs(ball.vx) <
                MIN_SPEED
            ) {

                ball.vx =
                    0;

            }

            if (
                Math.abs(ball.vy) <
                MIN_SPEED
            ) {

                ball.vy =
                    0;

            }

        }

    }


    shotInProgress =
        false;


    localPrediction =
        false;


    const shooter =
        turn;


    let keepTurn =
        false;


    /*
       ------------------------------------------------------
       SCRATCH
       ------------------------------------------------------
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
       ------------------------------------------------------
       8 BALL
       ------------------------------------------------------
    */

    if (
        shotPocketed.includes(8)
    ) {

        const group =
            playerGroups[
                shooter
            ];


        const canWin =

            group &&

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
                oppositeSide(
                    shooter
                )
            );

        }


        broadcastState();


        /*
           Reset shot data.
        */

        shotPocketed =
            [];

        cueBallPocketed =
            false;

        firstBallHit =
            null;


        return;

    }


    /*
       ------------------------------------------------------
       ASSIGN GROUPS
       ------------------------------------------------------
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


        if (firstObject) {

            const selectedGroup =
                firstObject <= 7
                    ? "solid"
                    : "stripe";


            playerGroups[
                shooter
            ] =
                selectedGroup;


            playerGroups[
                oppositeSide(
                    shooter
                )
            ] =

                selectedGroup ===
                "solid"

                    ? "stripe"

                    : "solid";

        }

    }


    /*
       ------------------------------------------------------
       CHECK WHETHER PLAYER POCKETED
       HIS OWN GROUP
       ------------------------------------------------------
    */

    const playerGroup =
        playerGroups[
            shooter
        ];


    if (

        playerGroup &&

        shotPocketed.some(
            number => {

                const type =
                    number <= 7
                        ? "solid"
                        : "stripe";


                return (
                    type ===
                    playerGroup
                );

            }
        ) &&

        !cueBallPocketed

    ) {

        keepTurn =
            true;

    }


    /*
       Scratch always changes turn.
    */

    if (cueBallPocketed) {

        keepTurn =
            false;

    }


    /*
       If player did not pocket his own
       ball, turn changes.
    */

    if (!keepTurn) {

        turn =
            oppositeSide(
                shooter
            );

    }


    /*
       New turn timer.
    */

    turnStartedAt =
        Date.now();


    /*
       Reset shot data.
    */

    shotPocketed =
        [];

    cueBallPocketed =
        false;

    firstBallHit =
        null;


    currentShotId =
        null;


    updateTurnUI();


    /*
       Send final authoritative state.
    */

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
       Only Host can timeout.
    */

    if (

        isHost &&

        remaining <= 0 &&

        !shotInProgress

    ) {

        turn =
            oppositeSide(
                turn
            );


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
   UPDATE TURN UI
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


    localPrediction =
        false;


    showGameOver(
        winnerSide
    );


    /*
       Send game-over command.
    */

    sendMessage({

        type:
            "gameOver",

        winner:
            winnerSide

    });


    /*
       Send final state.
    */

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
            currentShotId

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

        return false;

    }


    try {

        dataChannel.send(
            JSON.stringify(
                data
            )
        );


        return true;

    }
    catch (error) {

        console.error(
            "WebRTC send error:",
            error
        );


        return false;

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


        /* =================================================
           SHOT COMMAND
        ================================================= */

        case "shot": {

            const shotId =
                message.shotId;


            /*
               Ignore duplicate shot.
            */

            if (
                shotId &&
                shotId ===
                lastReceivedShotId
            ) {

                return;

            }


            if (shotId) {

                lastReceivedShotId =
                    shotId;

            }


            /*
               GUEST receives Host shot.
            */

            if (!isHost) {

                if (
                    gameFinished ||
                    shotInProgress
                ) {

                    return;

                }


                /*
                   Verify expected shooter.
                */

                if (
                    message.shooter !==
                    turn
                ) {

                    return;

                }


                /*
                   Start local physics immediately.
                */

                startLocalShot(

                    Number(
                        message.angle
                    ),

                    Number(
                        message.power
                    ),

                    message.shooter,

                    shotId

                );


                updateTurnUI();

            }


            /*
               HOST receives Guest shot.
            */

            else {

                if (
                    message.shooter !==
                    "guest"
                ) {

                    return;

                }


                if (
                    turn !==
                    "guest"
                ) {

                    return;

                }


                if (
                    shotInProgress ||
                    gameFinished
                ) {

                    return;

                }


                executeShot(

                    Number(
                        message.angle
                    ),

                    Number(
                        message.power
                    ),

                    "guest",

                    shotId

                );

            }


            break;

        }


        /* =================================================
           HOST STATE
        ================================================= */

        case "state": {

            /*
               Host ignores its own states.
            */

            if (isHost) {

                return;

            }


            /*
               Save authoritative state.
            */

            applyBalls(
                message.balls
            );


            /*
               IMPORTANT:
               If Host says the shot is over,
               hard-sync immediately.

               This removes prediction drift.
            */

            if (
                message.shotInProgress ===
                false
            ) {

                hardSyncBalls(
                    message.balls
                );

            }


            turn =
                message.turn;


            turnStartedAt =
                message.turnStartedAt;


            playerGroups =
                message.groups || {
                    host: null,
                    guest: null
                };


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


            currentShotId =
                message.shotId ||
                currentShotId;


            aiming =
                false;


            updateTurnUI();


            if (gameFinished) {

                showGameOver(
                    winner
                );

            }


            break;

        }


        /* =================================================
           CHAT
        ================================================= */

        case "chat": {

            addChatMessage(

                message.name ||
                opponentName,

                message.text,

                false

            );


            break;

        }


        /* =================================================
           GAME OVER
        ================================================= */

        case "gameOver": {

            gameFinished =
                true;


            winner =
                message.winner;


            shotInProgress =
                false;


            localPrediction =
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


    /*
       ICE connection state.
    */

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
               Host creates the game
               only once.
            */

            if (isHost) {

                if (!balls.length) {

                    createInitialBalls();

                }


                turn =
                    "host";


                turnStartedAt =
                    Date.now();


                broadcastState();


                updateTurnUI();

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


    /*
       Host creates DataChannel.
    */

    dataChannel =
        peer.createDataChannel(
            "pool"
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


    /*
       Wait for Guest answer.
    */

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
                            "Host remote description error:",
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


    /*
       Guest waits for Host DataChannel.
    */

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
   WAIT FOR ICE GATHERING
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


            let finished =
                false;


            const finish =
                () => {

                    if (finished) {

                        return;

                    }


                    finished =
                        true;


                    pc.removeEventListener(

                        "icegatheringstatechange",

                        check

                    );


                    resolve();

                };


            const check =
                () => {

                    if (

                        pc.iceGatheringState ===
                        "complete"

                    ) {

                        finish();

                    }

                };


            pc.addEventListener(

                "icegatheringstatechange",

                check

            );


            /*
               Safety timeout.

               Some browsers can get stuck
               waiting for ICE gathering.
            */

            setTimeout(
                finish,
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


        if (!snapshot.exists()) {

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


        /*
           HOST.
        */

        if (isHost) {

            /*
               Initialize locally.
            */

            createInitialBalls();


            turn =
                "host";


            turnStartedAt =
                Date.now();


            updateTurnUI();


            await startHostWebRTC();

        }


        /*
           GUEST.
        */

        else {

            /*
               Guest does NOT create balls.

               It waits for Host's first state.
            */

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
   SCREEN -> TABLE
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

function gameLoop(now) {

    /*
       Real frame delta in milliseconds.
    */

    let frameDelta =
        now -
        lastTime;


    lastTime =
        now;


    /*
       Protect against tab switching,
       lag spikes, etc.
    */

    frameDelta =
        Math.min(
            frameDelta,
            MAX_FRAME_DELTA
        );


    /*
       Convert to physics frame units.

       16.67ms = 1 physics unit.
    */

    physicsAccumulator +=
        frameDelta /
        16.6666667;


    /*
       Fixed physics.

       BOTH HOST AND GUEST RUN THIS.
    */

    let physicsSteps =
        0;


    while (

        physicsAccumulator >=
        FIXED_DT &&

        physicsSteps <
        MAX_PHYSICS_STEPS

    ) {

        updatePhysics(
            FIXED_DT
        );


        physicsAccumulator -=
            FIXED_DT;


        physicsSteps++;

    }


    /*
       Guest receives authoritative
       corrections from Host.
    */

    if (!isHost) {

        interpolateRemoteBalls();

    }


    /*
       Host sends frequent state updates.
    */

    if (isHost) {

        const networkNow =
            performance.now();


        if (

            networkNow -
            lastNetworkUpdate >=
            NETWORK_UPDATE_RATE

        ) {

            lastNetworkUpdate =
                networkNow;


            if (shotInProgress) {

                broadcastState();

            }

        }

    }


    /*
       Host alone decides when the
       shot has completely stopped.
    */

    if (

        isHost &&

        shotInProgress &&

        !hasMovingBalls()

    ) {

        finishShot();

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


    if (
        width <= 0 ||
        height <= 0
    ) {

        return;

    }


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

        if (!ball.pocketed) {

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
        const pocket
        of pockets
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

function drawBall(ball) {

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
       Ball.
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

            ball.x - radius,
            ball.y - radius * 0.48,

            radius * 2,
            radius * 0.96

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
            radius * 0.45,
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
       Highlight.
    */

    const highlight =
        ctx.createRadialGradient(

            ball.x -
                radius * 0.35,

            ball.y -
                radius * 0.35,

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


    if (distance < 1) {

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
        nx * 350,

        cue.y +
        ny * 350

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
        nx * 35,

        cue.y -
        ny * 35

    );


    ctx.lineTo(

        cue.x -
        nx *
        (
            100 +
            power * 120
        ),

        cue.y -
        ny *
        (
            100 +
            power * 120
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

            try {

                peer.close();

            }
            catch (_) {}

        }

    }
);


/* =========================================================
   START
========================================================= */

loadRoom();