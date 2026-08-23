/* =========================================================
   MOSAYAD 8 BALL POOL
   ONLINE MATCH

   Firebase:
   - ONLY signaling

   WebRTC:
   - REAL GAME DATA

   Host:
   - authoritative physics

   Guest:
   - sends shot commands

   Turn:
   - 60 seconds
========================================================= */

import { db } from "../../js/firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    onSnapshot,
    collection,
    addDoc,
    getDocs,
    deleteDoc
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
    canvas.getContext(
        "2d"
    );


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


myNameElement.textContent =
    userName;


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

    themeButton.textContent =
        "🌙";

} else {

    themeButton.textContent =
        "☀️";
}


themeButton.onclick = () => {

    document.body.classList.toggle(
        "light"
    );

    const light =
        document.body.classList.contains(
            "light"
        );

    localStorage.setItem(
        "mosayad8ballTheme",
        light ?
            "light" :
            "dark"
    );

    themeButton.textContent =
        light ?
            "🌙" :
            "☀️";
};


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
   WEBRTC
========================================================= */

let peer =
    null;

let dataChannel =
    null;

let signalingUnsubscribe =
    null;

let candidateUnsubscribe =
    null;


/*
   We use Firestore only for
   the initial WebRTC handshake.
*/

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
   POOL CONSTANTS
========================================================= */

const TABLE_WIDTH =
    1000;

const TABLE_HEIGHT =
    500;

const BALL_RADIUS =
    13;

const POCKET_RADIUS =
    28;

const FRICTION =
    0.985;

const WALL_BOUNCE =
    0.92;

const BALL_BOUNCE =
    0.98;

const MAX_POWER =
    24;

const TURN_TIME =
    60;


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
   GAME STATE
========================================================= */

let balls = [];

let turn =
    "host";

let turnStartedAt =
    Date.now();

let gameFinished =
    false;

let shotInProgress =
    false;

let playerGroups = {

    host:
        null,

    guest:
        null

};


let winner =
    null;


/* =========================================================
   INPUT
========================================================= */

let aiming =
    false;

let aimStart = {

    x: 0,

    y: 0

};

let aimCurrent = {

    x: 0,

    y: 0

};

let power =
    0;


/* =========================================================
   CREATE BALLS
========================================================= */

function createInitialBalls() {

    balls = [];


    /*
       Cue ball
    */

    balls.push({

        id:
            0,

        number:
            0,

        x:
            250,

        y:
            TABLE_HEIGHT / 2,

        vx:
            0,

        vy:
            0,

        type:
            "cue",

        pocketed:
            false

    });


    /*
       Rack
    */

    const startX =
        730;

    const startY =
        TABLE_HEIGHT / 2;


    let number =
        1;


    for (
        let row = 0;
        row < 5;
        row++
    ) {

        for (
            let col = 0;
            col <= row;
            col++
        ) {

            const x =
                startX +
                row *
                BALL_RADIUS *
                1.75;

            const y =
                startY -
                row *
                BALL_RADIUS +
                col *
                BALL_RADIUS *
                2;


            balls.push({

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

                type:
                    number === 8
                        ? "eight"
                        : number <= 7
                            ? "solid"
                            : "stripe",

                pocketed:
                    false

            });


            number++;

        }

    }

}


/* =========================================================
   RESET
========================================================= */

createInitialBalls();


/* =========================================================
   SERIALIZE
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

            type:
                ball.type,

            pocketed:
                ball.pocketed

        })
    );
}


function applyBalls(data) {

    if (!Array.isArray(data)) {

        return;
    }


    balls =
        data.map(
            ball => ({

                ...ball

            })
        );

}


/* =========================================================
   NETWORK MESSAGE
========================================================= */

function sendMessage(message) {

    if (
        dataChannel &&
        dataChannel.readyState ===
        "open"
    ) {

        dataChannel.send(
            JSON.stringify(
                message
            )
        );

    }

}


/* =========================================================
   CONNECTION UI
========================================================= */

function setConnected() {

    connectionDot.className =
        "dot online";

    connectionText.textContent =
        "Connected";

}


function setDisconnected() {

    connectionDot.className =
        "dot offline";

    connectionText.textContent =
        "Disconnected";

}


/* =========================================================
   CREATE PEER
========================================================= */

function createPeer() {

    peer =
        new RTCPeerConnection({

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

        });


    peer.onconnectionstatechange =
        () => {

            console.log(
                "WebRTC:",
                peer.connectionState
            );


            if (
                peer.connectionState ===
                "connected"
            ) {

                setConnected();

                messageElement.textContent =
                    "Match connected.";

            }


            if (
                peer.connectionState ===
                "disconnected" ||

                peer.connectionState ===
                "failed"
            ) {

                setDisconnected();

                messageElement.textContent =
                    "Connection lost.";

            }

        };


    peer.ondatachannel =
        event => {

            setupDataChannel(
                event.channel
            );

        };

}


/* =========================================================
   DATA CHANNEL
========================================================= */

function setupDataChannel(channel) {

    dataChannel =
        channel;


    dataChannel.onopen =
        () => {

            console.log(
                "🎱 DATA CHANNEL OPEN"
            );

            setConnected();

            messageElement.textContent =
                "Ready to play.";

            sendInitialState();

        };


    dataChannel.onclose =
        () => {

            setDisconnected();

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

            } catch (error) {

                console.error(
                    "Invalid network message:",
                    error
                );

            }

        };

}


/* =========================================================
   INITIAL GAME STATE
========================================================= */

function sendInitialState() {

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
            winner

    });

}


/* =========================================================
   NETWORK MESSAGE HANDLER
========================================================= */

function handleNetworkMessage(message) {

    switch (message.type) {

        case "shot":

            // Only the host executes physics.
            if (!isHost) {
                return;
            }

            // Guest is allowed to shoot only
            // when it is actually the guest's turn.
            if (turn !== "guest") {
                return;
            }

            if (shotInProgress) {
                return;
            }

            executeShot(
                message.angle,
                message.power
            );

            break;


        case "state":

            if (!isHost) {

                applyBalls(
                    message.balls
                );

                turn =
                    message.turn;

                turnStartedAt =
                    message.turnStartedAt;

                playerGroups =
                    message.groups ||
                    playerGroups;

                gameFinished =
                    message.gameFinished;

                winner =
                    message.winner;


                shotInProgress =
                    Boolean(
                        message.shotInProgress
                    );


                /*
                If it is now our turn and
                there is no active shot,
                unlock controls.
                */

                if (
                    turn === "guest" &&
                    !message.shotInProgress
                ) {

                    shotInProgress =
                        false;

                }


                updateTurnUI();

            }

            break;

        case "gameOver":

            gameFinished = true;

            winner =
                message.winner;

            shotInProgress =
                false;

            showGameOver(
                winner
            );

            break;

    }

}

/* =========================================================
   HOST CREATE CONNECTION
========================================================= */

async function startHostWebRTC() {

    createPeer();


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


    const localDescription =
        peer.localDescription;


    await setDoc(

        signalRef,

        {

            offer: {

                type:
                    localDescription.type,

                sdp:
                    localDescription.sdp

            }

        },

        {
            merge:
                true
        }

    );


    console.log(
        "📡 Host offer sent"
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

                    await peer.setRemoteDescription(

                        new RTCSessionDescription(
                            data.answer
                        )

                    );


                    console.log(
                        "📡 Host received answer"
                    );

                }

            }

        );

}


/* =========================================================
   GUEST CREATE CONNECTION
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


                    const localDescription =
                        peer.localDescription;


                    await setDoc(

                        signalRef,

                        {

                            answer: {

                                type:
                                    localDescription.type,

                                sdp:
                                    localDescription.sdp

                            }

                        },

                        {
                            merge:
                                true
                        }

                    );


                    console.log(
                        "📡 Guest answer sent"
                    );

                }

            }

        );

}


/* =========================================================
   ICE WAIT
========================================================= */

function waitForIceGathering(pc) {

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

            messageElement.textContent =
                "Room not found.";

            return;
        }


        roomData =
            snapshot.data();


        isHost =
            roomData.hostId ===
            userId;


        if (
            isHost
        ) {

            opponentId =
                roomData.guestId;

            opponentName =
                roomData.guestName ||
                "Opponent";

        } else {

            opponentId =
                roomData.hostId;

            opponentName =
                roomData.hostName ||
                "Opponent";

        }


        opponentNameElement.textContent =
            opponentName;


        console.log(
            "ROOM:",
            roomId
        );

        console.log(
            "ROLE:",
            isHost
                ? "HOST"
                : "GUEST"
        );


        if (
            isHost
        ) {

            /*
               Host starts first.
            */

            turn =
                "host";

            turnStartedAt =
                Date.now();


            await startHostWebRTC();


        } else {

            /*
               Guest waits for host.
            */

            await startGuestWebRTC();

        }


        updateTurnUI();

    } catch (error) {

        console.error(
            "Room loading error:",
            error
        );

        messageElement.textContent =
            "Could not load match.";

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
        rect.width *
        dpr;


    canvas.height =
        rect.height *
        dpr;


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
   COORDINATES
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
            ) /
            rect.width *
            TABLE_WIDTH,

        y:
            (
                clientY -
                rect.top
            ) /
            rect.height *
            TABLE_HEIGHT

    };

}


/* =========================================================
   CUE BALL
========================================================= */

function getCueBall() {

    return balls.find(
        ball =>
            ball.type === "cue" &&
            !ball.pocketed
    );

}


/* =========================================================
   CAN SHOOT
========================================================= */

function canCurrentPlayerShoot() {

    if (
        gameFinished
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


    if (
        shotInProgress
    ) {

        return false;
    }


    const mySide =
        isHost
            ? "host"
            : "guest";


    return turn ===
        mySide;

}


/* =========================================================
   POINTER DOWN
========================================================= */

canvas.addEventListener(
    "pointerdown",
    event => {

        if (
            !canCurrentPlayerShoot()
        ) {

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
            BALL_RADIUS * 5
        ) {

            return;
        }


        aiming =
            true;


        aimStart = {

            x:
                cue.x,

            y:
                cue.y

        };


        aimCurrent =
            point;


        canvas.setPointerCapture(
            event.pointerId
        );

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


        const distance =
            Math.hypot(
                aimCurrent.x -
                aimStart.x,

                aimCurrent.y -
                aimStart.y
            );


        power =
            Math.min(
                1,
                distance /
                180
            );


        powerFill.style.width =
            (
                power *
                100
            ) + "%";

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


        const dx =
            aimCurrent.x -
            aimStart.x;


        const dy =
            aimCurrent.y -
            aimStart.y;


        const distance =
            Math.hypot(
                dx,
                dy
            );


        if (
            distance < 15
        ) {

            powerFill.style.width =
                "0%";

            return;
        }


        const angle =
            Math.atan2(
                dy,
                dx
            );


        /*
           Pulling backwards
           means shooting forwards.
        */

        const shotPower =
            Math.min(
                1,
                distance / 180
            );


        power =
            shotPower;


        powerFill.style.width =
            "0%";


        shoot(
            angle,
            shotPower
        );

    }
);


/* =========================================================
   SHOOT
========================================================= */

function shoot(
    angle,
    powerAmount
) {

    if (
        !canCurrentPlayerShoot()
    ) {

        return;
    }


    /*
       HOST
    */

    if (isHost) {

        executeShot(
            angle,
            powerAmount
        );

        return;
    }


    /*
       GUEST
    */

    sendMessage({

        type:
            "shot",

        angle:
            angle,

        power:
            powerAmount

    });


    shotInProgress =
        true;

}


/* =========================================================
   EXECUTE SHOT
========================================================= */

function executeShot(
    angle,
    powerAmount
) {

    if (shotInProgress) {
        return;
    }


    const cue =
        getCueBall();


    if (!cue) {
        return;
    }


    shotInProgress = true;


    cue.vx =
        Math.cos(angle) *
        MAX_POWER *
        powerAmount;


    cue.vy =
        Math.sin(angle) *
        MAX_POWER *
        powerAmount;


    messageElement.textContent =
        "Shot taken!";


    /*
       Send immediately that the shot
       has started.
    */

    if (isHost) {

        broadcastState();

    }

}


/* =========================================================
   PHYSICS LOOP
========================================================= */

let lastTime =
    performance.now();


function gameLoop(now) {

    const dt =
        Math.min(
            2,
            (
                now -
                lastTime
            ) / 16.67
        );


    lastTime =
        now;


    updatePhysics(
        dt
    );


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
   UPDATE PHYSICS
========================================================= */

function updatePhysics(dt) {

    if (
        !isHost ||
        !shotInProgress
    ) {

        return;
    }


    let moving =
        false;


    for (
        const ball of balls
    ) {

        if (
            ball.pocketed
        ) {

            continue;
        }


        ball.x +=
            ball.vx *
            dt;


        ball.y +=
            ball.vy *
            dt;


        ball.vx *=
            Math.pow(
                FRICTION,
                dt
            );


        ball.vy *=
            Math.pow(
                FRICTION,
                dt
            );


        /*
           Side walls
        */

        if (
            ball.x <
            BALL_RADIUS
        ) {

            ball.x =
                BALL_RADIUS;

            ball.vx =
                Math.abs(
                    ball.vx
                ) *
                WALL_BOUNCE;

        }


        if (
            ball.x >
            TABLE_WIDTH -
            BALL_RADIUS
        ) {

            ball.x =
                TABLE_WIDTH -
                BALL_RADIUS;

            ball.vx =
                -Math.abs(
                    ball.vx
                ) *
                WALL_BOUNCE;

        }


        /*
           Top / bottom
        */

        if (
            ball.y <
            BALL_RADIUS
        ) {

            ball.y =
                BALL_RADIUS;

            ball.vy =
                Math.abs(
                    ball.vy
                ) *
                WALL_BOUNCE;

        }


        if (
            ball.y >
            TABLE_HEIGHT -
            BALL_RADIUS
        ) {

            ball.y =
                TABLE_HEIGHT -
                BALL_RADIUS;

            ball.vy =
                -Math.abs(
                    ball.vy
                ) *
                WALL_BOUNCE;

        }


        if (
            Math.abs(ball.vx) >
                0.08 ||

            Math.abs(ball.vy) >
                0.08
        ) {

            moving =
                true;

        }

    }


    resolveBallCollisions();


    checkPockets();


    /*
       Send snapshots while balls
       are moving.

       This is WebRTC, NOT Firebase.
    */

    if (
        dataChannel &&
        dataChannel.readyState ===
        "open"
    ) {

        if (
            Math.random() <
            0.22
        ) {

            broadcastState();

        }

    }


    if (
        !moving
    ) {

        finishShot();

    }

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


        if (
            a.pocketed
        ) {

            continue;
        }


        for (
            let j = i + 1;
            j < balls.length;
            j++
        ) {

            const b =
                balls[j];


            if (
                b.pocketed
            ) {

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


            const minimum =
                BALL_RADIUS * 2;


            if (
                distance === 0
            ) {

                distance =
                    0.01;

            }


            if (
                distance <
                minimum
            ) {

                const nx =
                    dx /
                    distance;


                const ny =
                    dy /
                    distance;


                const overlap =
                    minimum -
                    distance;


                a.x -=
                    nx *
                    overlap /
                    2;


                a.y -=
                    ny *
                    overlap /
                    2;


                b.x +=
                    nx *
                    overlap /
                    2;


                b.y +=
                    ny *
                    overlap /
                    2;


                const relativeVx =
                    a.vx -
                    b.vx;


                const relativeVy =
                    a.vy -
                    b.vy;


                const velocityAlongNormal =
                    relativeVx *
                    nx +
                    relativeVy *
                    ny;


                if (
                    velocityAlongNormal >
                    0
                ) {

                    continue;

                }


                const impulse =
                    -(
                        1 +
                        BALL_BOUNCE
                    ) *
                    velocityAlongNormal /
                    2;


                a.vx +=
                    impulse *
                    nx;


                a.vy +=
                    impulse *
                    ny;


                b.vx -=
                    impulse *
                    nx;


                b.vy -=
                    impulse *
                    ny;

            }

        }

    }

}


/* =========================================================
   POCKETS
========================================================= */

function checkPockets() {

    for (
        const ball of balls
    ) {

        if (
            ball.pocketed
        ) {

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
                    ball
                );

                break;

            }

        }

    }

}


/* =========================================================
   POCKET BALL
========================================================= */

function pocketBall(ball) {

    ball.pocketed =
        true;

    ball.vx =
        0;

    ball.vy =
        0;


    /*
       Cue ball returns to
       starting position.
    */

    if (
        ball.type ===
        "cue"
    ) {

        setTimeout(
            () => {

                ball.pocketed =
                    false;

                ball.x =
                    250;

                ball.y =
                    TABLE_HEIGHT / 2;

            },
            300
        );


        messageElement.textContent =
            "Scratch! Cue ball returns.";

        return;

    }


    /*
       Eight ball
    */

    if (
        ball.type ===
        "eight"
    ) {

        /*
           For this first version,
           pocketing the 8 wins.
        */

        finishGame(
            isHost
                ? "host"
                : "guest"
        );

    }

}


/* =========================================================
   FINISH SHOT
========================================================= */

function finishShot() {

    if (!shotInProgress) {
        return;
    }

    shotInProgress = false;


    /*
       Change turn
    */

    if (turn === "host") {

        turn = "guest";

    } else {

        turn = "host";

    }


    turnStartedAt =
        Date.now();


    updateTurnUI();


    /*
       Host sends the final state
       after the balls completely stop.
    */

    if (isHost) {

        broadcastState();

    }

}


/* =========================================================
   BROADCAST
========================================================= */

function broadcastState() {

    sendMessage({

        type: "state",

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
            shotInProgress

    });

}


/* =========================================================
   TIMER
========================================================= */

function updateTimer() {

    if (
        gameFinished
    ) {

        return;
    }


    const elapsed =
        (
            Date.now() -
            turnStartedAt
        ) / 1000;


    let remaining =
        Math.ceil(
            TURN_TIME -
            elapsed
        );


    remaining =
        Math.max(
            0,
            remaining
        );


    timerElement.textContent =
        remaining;


    if (
        remaining <= 10
    ) {

        timerElement.classList.add(
            "warning"
        );

    } else {

        timerElement.classList.remove(
            "warning"
        );

    }


    /*
       Only host decides when
       the timer expires.

       This prevents two clients
       from changing the turn
       independently.
    */

    if (
        isHost &&
        remaining <= 0 &&
        !shotInProgress
    ) {

        switchTurnByTimeout();

    }

}


/* =========================================================
   TIMEOUT
========================================================= */

function switchTurnByTimeout() {

    turn =
        turn === "host"
            ? "guest"
            : "host";


    turnStartedAt =
        Date.now();


    messageElement.textContent =
        "Time's up! Turn changed.";


    broadcastState();


    updateTurnUI();

}


/* =========================================================
   TURN UI
========================================================= */

function updateTurnUI() {

    if (
        gameFinished
    ) {

        return;
    }


    const mySide =
        isHost
            ? "host"
            : "guest";


    if (
        turn === mySide
    ) {

        turnText.textContent =
            "YOUR TURN";

        turnText.style.color =
            "#19e68c";

        messageElement.textContent =
            "Drag from the cue ball to shoot.";

    } else {

        turnText.textContent =
            "OPPONENT'S TURN";

        turnText.style.color =
            "#9eafb5";

        messageElement.textContent =
            "Waiting for opponent...";

    }

}


/* =========================================================
   GAME OVER
========================================================= */

function finishGame(winnerSide) {

    if (
        gameFinished
    ) {

        return;
    }


    gameFinished =
        true;


    winner =
        winnerSide;


    if (
        isHost
    ) {

        sendMessage({

            type:
                "gameOver",

            winner:
                winnerSide

        });

    }


    showGameOver(
        winnerSide
    );

}


/* =========================================================
   SHOW GAME OVER
========================================================= */

function showGameOver(
    winnerSide
) {

    const mySide =
        isHost
            ? "host"
            : "guest";


    const won =
        winnerSide ===
        mySide;


    winnerTitle.textContent =
        won
            ? "You Win!"
            : "You Lose";


    winnerText.textContent =
        won
            ? "🏆 Amazing shot!"
            : "Better luck next time!";


    gameOverElement.classList.remove(
        "hidden"
    );

}


/* =========================================================
   LEAVE
========================================================= */

leaveButton.onclick = () => {

    window.location.href =
        "index.html";

};


/* =========================================================
   DRAW TABLE
========================================================= */

function drawTable() {

    /*
       Outer table
    */

    ctx.fillStyle =
        "#064d31";

    ctx.fillRect(
        0,
        0,
        TABLE_WIDTH,
        TABLE_HEIGHT
    );


    /*
       Playing surface
    */

    ctx.fillStyle =
        "#087849";

    ctx.fillRect(
        12,
        12,
        TABLE_WIDTH - 24,
        TABLE_HEIGHT - 24
    );


    /*
       Subtle center line
    */

    ctx.strokeStyle =
        "rgba(255,255,255,.08)";

    ctx.lineWidth =
        2;

    ctx.beginPath();

    ctx.moveTo(
        TABLE_WIDTH / 2,
        12
    );

    ctx.lineTo(
        TABLE_WIDTH / 2,
        TABLE_HEIGHT - 12
    );

    ctx.stroke();


    /*
       Pockets
    */

    for (
        const pocket of pockets
    ) {

        ctx.beginPath();

        ctx.arc(
            pocket.x,
            pocket.y,
            POCKET_RADIUS,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#020504";

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            pocket.x,
            pocket.y,
            POCKET_RADIUS + 2,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle =
            "rgba(0,0,0,.35)";

        ctx.stroke();

    }

}


/* =========================================================
   BALL COLORS
========================================================= */

function getBallColor(
    ball
) {

    if (
        ball.type ===
        "cue"
    ) {

        return "#f4f4f4";

    }


    if (
        ball.type ===
        "eight"
    ) {

        return "#050505";

    }


    const colors = {

        1: "#f6d33a",
        2: "#1957d8",
        3: "#d92e35",
        4: "#6d3ab7",
        5: "#f28b22",
        6: "#148b46",
        7: "#831f25",

        9: "#f6d33a",
        10: "#1957d8",
        11: "#d92e35",
        12: "#6d3ab7",
        13: "#f28b22",
        14: "#148b46",
        15: "#831f25"

    };


    return colors[
        ball.number
    ] || "#ffffff";

}


/* =========================================================
   DRAW BALL
========================================================= */

function drawBall(
    ball
) {

    if (
        ball.pocketed
    ) {

        return;
    }


    /*
       Shadow
    */

    ctx.beginPath();

    ctx.arc(
        ball.x + 2,
        ball.y + 3,
        BALL_RADIUS,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(0,0,0,.35)";

    ctx.fill();


    /*
       Ball
    */

    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        BALL_RADIUS,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#ffffff";

    ctx.fill();


    /*
       Stripe
    */

    if (
        ball.type ===
        "stripe"
    ) {

        ctx.save();

        ctx.beginPath();

        ctx.arc(
            ball.x,
            ball.y,
            BALL_RADIUS,
            0,
            Math.PI * 2
        );

        ctx.clip();


        ctx.fillStyle =
            getBallColor(ball);

        ctx.fillRect(
            ball.x -
            BALL_RADIUS,

            ball.y -
            BALL_RADIUS / 2,

            BALL_RADIUS * 2,

            BALL_RADIUS
        );


        ctx.restore();

    }


    if (
        ball.type !==
        "cue"
    ) {

        if (
            ball.type !==
            "stripe"
        ) {

            ctx.beginPath();

            ctx.arc(
                ball.x,
                ball.y,
                BALL_RADIUS - 1,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                getBallColor(ball);

            ctx.fill();

        }


        /*
           Number circle
        */

        ctx.beginPath();

        ctx.arc(
            ball.x,
            ball.y,
            5,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#ffffff";

        ctx.fill();


        ctx.fillStyle =
            "#111";

        ctx.font =
            "bold 6px Arial";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.fillText(
            ball.number,
            ball.x,
            ball.y
        );

    }


    /*
       Cue shine
    */

    ctx.beginPath();

    ctx.arc(
        ball.x - 4,
        ball.y - 4,
        3,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(255,255,255,.65)";

    ctx.fill();

}


/* =========================================================
   AIM LINE
========================================================= */

function drawAim() {

    if (
        !aiming
    ) {

        return;
    }


    const cue =
        getCueBall();


    if (!cue) {

        return;
    }


    const dx =
        aimStart.x -
        aimCurrent.x;


    const dy =
        aimStart.y -
        aimCurrent.y;


    const length =
        Math.hypot(
            dx,
            dy
        );


    if (
        length === 0
    ) {

        return;
    }


    const nx =
        dx /
        length;


    const ny =
        dy /
        length;


    const lineLength =
        300;


    ctx.beginPath();

    ctx.moveTo(
        cue.x,
        cue.y
    );

    ctx.lineTo(
        cue.x +
        nx *
        lineLength,

        cue.y +
        ny *
        lineLength
    );


    ctx.strokeStyle =
        "rgba(255,255,255,.7)";

    ctx.lineWidth =
        2;

    ctx.setLineDash(
        [8, 8]
    );

    ctx.stroke();

    ctx.setLineDash(
        []
    );


    /*
       Cue stick
    */

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
            100
        ),

        cue.y -
        ny *
        (
            100 +
            power *
            100
        )
    );


    ctx.strokeStyle =
        "#d7b37a";

    ctx.lineWidth =
        5;

    ctx.stroke();

}


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


    const scaleX =
        width /
        TABLE_WIDTH;


    const scaleY =
        height /
        TABLE_HEIGHT;


    ctx.save();


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    ctx.scale(
        scaleX,
        scaleY
    );


    drawTable();


    for (
        const ball of balls
    ) {

        drawBall(
            ball
        );

    }


    drawAim();


    ctx.restore();

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

        if (
            candidateUnsubscribe
        ) {

            candidateUnsubscribe();

        }

        if (
            peer
        ) {

            peer.close();

        }

    }
);


/* =========================================================
   START
========================================================= */

loadRoom();