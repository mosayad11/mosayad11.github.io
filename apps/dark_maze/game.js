/* =========================================================
   MOSAYAD GAMES
   MODERN 3D MAZE
   ========================================================= */


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const container =
    document.getElementById("game-container");

const levelText =
    document.getElementById("level");

const timerText =
    document.getElementById("timer");

const bestText =
    document.getElementById("best");

const message =
    document.getElementById("message");

const startScreen =
    document.getElementById("start-screen");

const completeScreen =
    document.getElementById("complete-screen");

const startButton =
    document.getElementById("start-button");

const nextButton =
    document.getElementById("next-button");

const completeText =
    document.getElementById("complete-text");

const joystick =
    document.getElementById("joystick");

const joystickKnob =
    document.getElementById("joystick-knob");


/* =========================================================
   THREE.JS SCENE
   ========================================================= */

const scene =
    new THREE.Scene();


scene.background =
    new THREE.Color(
        0x07111f
    );


scene.fog =
    new THREE.Fog(
        0x07111f,
        7,
        30
    );


/* =========================================================
   CAMERA
   ========================================================= */

const camera =
    new THREE.PerspectiveCamera(
        75,
        window.innerWidth /
        window.innerHeight,
        0.1,
        100
    );


camera.position.set(
    1,
    1.1,
    1
);


camera.rotation.order =
    "YXZ";


/* =========================================================
   RENDERER
   ========================================================= */

const renderer =
    new THREE.WebGLRenderer({

        antialias:
            true

    });


renderer.setSize(
    window.innerWidth,
    window.innerHeight
);


renderer.setPixelRatio(
    Math.min(
        window.devicePixelRatio,
        1.7
    )
);


renderer.shadowMap.enabled =
    true;


renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


container.appendChild(
    renderer.domElement
);


/* =========================================================
   LIGHTING
   ========================================================= */

/*
    General modern environment light
*/

const ambientLight =
    new THREE.HemisphereLight(

        0x9edcff,

        0x08111f,

        1.25

    );


scene.add(
    ambientLight
);


/*
    Main directional light
*/

const mainLight =
    new THREE.DirectionalLight(

        0xffffff,

        1.15

    );


mainLight.position.set(
    5,
    10,
    5
);


mainLight.castShadow =
    true;


mainLight.shadow.mapSize.width =
    1024;

mainLight.shadow.mapSize.height =
    1024;


scene.add(
    mainLight
);


/* =========================================================
   PLAYER FLASHLIGHT
   ========================================================= */

const playerLight =
    new THREE.SpotLight(

        0xffffff,

        3.8,

        15,

        Math.PI / 5,

        0.45,

        1

    );


playerLight.castShadow =
    true;


playerLight.shadow.mapSize.width =
    512;

playerLight.shadow.mapSize.height =
    512;


scene.add(
    playerLight
);


/*
    The flashlight needs a target.
*/

const lightTarget =
    new THREE.Object3D();


scene.add(
    lightTarget
);


playerLight.target =
    lightTarget;


/* =========================================================
   GAME STATE
   ========================================================= */

let level = 1;


let best =
    Number(
        localStorage.getItem(
            "mosayad_modern_maze_best"
        )
    ) || 1;


bestText.textContent =
    best;


let maze = [];

let mazeSize = 11;

let walls = [];

let floor = null;

let exitDoor = null;

let exitLight = null;

let playing = false;

let timer = 0;

let timerInterval = null;


/* =========================================================
   PLAYER
   ========================================================= */

const PLAYER_HEIGHT =
    1.1;


const PLAYER_RADIUS =
    0.22;


/*
    Camera rotation
*/

let yaw = 0;

let pitch = 0;


/* =========================================================
   KEYBOARD STATE
   ========================================================= */

const keyboard = {

    forward:
        false,

    backward:
        false,

    left:
        false,

    right:
        false

};


/* =========================================================
   MOBILE JOYSTICK STATE
   ========================================================= */

let joystickX =
    0;

let joystickY =
    0;

let joystickActive =
    false;

let joystickPointer =
    null;


const JOYSTICK_RADIUS =
    45;


/* =========================================================
   MOBILE LOOK STATE
   ========================================================= */

let lookActive =
    false;

let lookPointer =
    null;

let lastLookX =
    0;

let lastLookY =
    0;


/* =========================================================
   MAZE GENERATOR
   ========================================================= */

function generateMaze(size) {

    const grid =
        Array.from(

            {
                length:
                    size
            },

            () =>
                Array(
                    size
                ).fill(1)

        );


    /*
        Shuffle helper
    */

    function shuffle(array) {

        for (
            let i =
                array.length - 1;

            i > 0;

            i--
        ) {

            const j =
                Math.floor(
                    Math.random() *
                    (i + 1)
                );


            [
                array[i],
                array[j]
            ] =
            [
                array[j],
                array[i]
            ];

        }

    }


    /*
        Recursive maze carving
    */

    function carve(
        x,
        z
    ) {

        grid[z][x] =
            0;


        const directions = [

            [2, 0],

            [-2, 0],

            [0, 2],

            [0, -2]

        ];


        shuffle(
            directions
        );


        for (
            const [
                dx,
                dz
            ] of directions
        ) {

            const nx =
                x + dx;


            const nz =
                z + dz;


            if (

                nx > 0 &&

                nx < size - 1 &&

                nz > 0 &&

                nz < size - 1 &&

                grid[nz][nx] === 1

            ) {

                /*
                    Open the wall
                    between the cells.
                */

                grid[
                    z + dz / 2
                ][
                    x + dx / 2
                ] = 0;


                carve(
                    nx,
                    nz
                );

            }

        }

    }


    carve(
        1,
        1
    );


    return grid;

}


/* =========================================================
   CLEAR OLD LEVEL
   ========================================================= */

function clearMaze() {

    /*
        Remove walls
    */

    walls.forEach(
        wall => {

            scene.remove(
                wall
            );


            if (
                wall.geometry
            ) {

                wall.geometry.dispose();

            }


            if (
                wall.material
            ) {

                wall.material.dispose();

            }

        }
    );


    walls =
        [];


    /*
        Remove floor
    */

    if (
        floor
    ) {

        scene.remove(
            floor
        );


        floor.geometry.dispose();

        floor.material.dispose();


        floor =
            null;

    }


    /*
        Remove exit
    */

    if (
        exitDoor
    ) {

        scene.remove(
            exitDoor
        );


        exitDoor.traverse(
            object => {

                if (
                    object.geometry
                ) {

                    object.geometry.dispose();

                }


                if (
                    object.material
                ) {

                    object.material.dispose();

                }

            }
        );


        exitDoor =
            null;

    }


    /*
        Remove exit light
    */

    if (
        exitLight
    ) {

        scene.remove(
            exitLight
        );


        exitLight =
            null;

    }

}


/* =========================================================
   CREATE FLOOR
   ========================================================= */

function createFloor() {

    const geometry =
        new THREE.PlaneGeometry(

            mazeSize,

            mazeSize

        );


    const material =
        new THREE.MeshStandardMaterial({

            color:
                0x102238,

            roughness:
                0.65,

            metalness:
                0.15

        });


    floor =
        new THREE.Mesh(

            geometry,

            material

        );


    floor.rotation.x =
        -Math.PI / 2;


    floor.position.set(

        (mazeSize - 1) / 2,

        0,

        (mazeSize - 1) / 2

    );


    floor.receiveShadow =
        true;


    scene.add(
        floor
    );

}


/* =========================================================
   CREATE MAZE WALLS
   ========================================================= */

function createWalls() {

    const geometry =
        new THREE.BoxGeometry(

            1,

            2.2,

            1

        );


    const material =
        new THREE.MeshStandardMaterial({

            color:
                0x17304a,

            roughness:
                0.55,

            metalness:
                0.18

        });


    for (
        let z = 0;

        z < mazeSize;

        z++
    ) {

        for (
            let x = 0;

            x < mazeSize;

            x++
        ) {

            if (
                maze[z][x] !== 1
            ) {

                continue;

            }


            const wall =
                new THREE.Mesh(

                    geometry,

                    material

                );


            wall.position.set(

                x,

                1.1,

                z

            );


            wall.castShadow =
                true;


            wall.receiveShadow =
                true;


            scene.add(
                wall
            );


            walls.push(
                wall
            );

        }

    }

}


/* =========================================================
   FIND FARTHEST CELL
   ========================================================= */

function findExitCell() {

    let result = {

        x:
            1,

        z:
            1,

        distance:
            0

    };


    for (
        let z = 1;

        z < mazeSize - 1;

        z++
    ) {

        for (
            let x = 1;

            x < mazeSize - 1;

            x++
        ) {

            if (
                maze[z][x] !== 0
            ) {

                continue;

            }


            const distance =

                Math.abs(
                    x - 1
                )

                +

                Math.abs(
                    z - 1
                );


            if (
                distance >
                result.distance
            ) {

                result = {

                    x,

                    z,

                    distance

                };

            }

        }

    }


    return result;

}


/* =========================================================
   CREATE GREEN EXIT
   ========================================================= */

function createExit() {

    const cell =
        findExitCell();


    exitDoor =
        new THREE.Group();


    /*
        Door
    */

    const doorGeometry =
        new THREE.BoxGeometry(

            0.85,

            1.8,

            0.12

        );


    const doorMaterial =
        new THREE.MeshStandardMaterial({

            color:
                0x20ff8a,

            emissive:
                0x00ff66,

            emissiveIntensity:
                2.4,

            roughness:
                0.25,

            metalness:
                0.15

        });


    const door =
        new THREE.Mesh(

            doorGeometry,

            doorMaterial

        );


    door.position.y =
        0.9;


    door.castShadow =
        true;


    exitDoor.add(
        door
    );


    /*
        Green light
    */

    exitLight =
        new THREE.PointLight(

            0x22ff88,

            4,

            7

        );


    exitLight.position.set(

        0,

        1,

        0

    );


    exitDoor.add(
        exitLight
    );


    /*
        Position
    */

    exitDoor.position.set(

        cell.x,

        0,

        cell.z

    );


    scene.add(
        exitDoor
    );

}


/* =========================================================
   CREATE LEVEL
   ========================================================= */

function createLevel() {

    /*
        Remove previous level.
    */

    clearMaze();


    /*
        Increase maze size.
    */

    mazeSize =
        11 +
        (
            (level - 1) *
            2
        );


    /*
        Keep performance reasonable.
    */

    mazeSize =
        Math.min(

            mazeSize,

            25

        );


    /*
        Maze must be odd-sized.
    */

    if (
        mazeSize % 2 === 0
    ) {

        mazeSize++;

    }


    /*
        Generate.
    */

    maze =
        generateMaze(
            mazeSize
        );


    /*
        Build world.
    */

    createFloor();

    createWalls();

    createExit();


    /*
        Reset player.
    */

    camera.position.set(

        1,

        PLAYER_HEIGHT,

        1

    );


    yaw =
        0;

    pitch =
        0;


    camera.rotation.order =
        "YXZ";


    camera.rotation.set(

        0,

        0,

        0

    );


    /*
        UI.
    */

    levelText.textContent =
        level;


    timer =
        0;


    updateTimer();


    message.textContent =
        "🟢 Find the green door";


    /*
        Start timer.
    */

    startTimer();


    /*
        Start gameplay.
    */

    playing =
        true;

}


/* =========================================================
   START GAME
   ========================================================= */

startButton.addEventListener(

    "click",

    () => {

        level =
            1;


        startScreen.classList.add(
            "hidden"
        );


        createLevel();


        enableMouseLook();

    }

);


/* =========================================================
   NEXT LEVEL
   ========================================================= */

nextButton.addEventListener(

    "click",

    () => {

        completeScreen.classList.add(
            "hidden"
        );


        createLevel();


        enableMouseLook();

    }

);


/* =========================================================
   POINTER LOCK
   ========================================================= */

function enableMouseLook() {

    /*
        Pointer lock is only
        needed on desktop.
    */

    if (
        window.innerWidth <= 800
    ) {

        return;

    }


    if (
        renderer.domElement
            .requestPointerLock
    ) {

        renderer.domElement
            .requestPointerLock();

    }

}


/* =========================================================
   DESKTOP MOUSE LOOK
   ========================================================= */

document.addEventListener(

    "mousemove",

    event => {

        if (
            !playing
        ) {

            return;

        }


        if (
            document.pointerLockElement !==
            renderer.domElement
        ) {

            return;

        }


        yaw -=

            event.movementX *
            0.0025;


        pitch -=

            event.movementY *
            0.0025;


        pitch =
            Math.max(

                -1.25,

                Math.min(

                    1.25,

                    pitch

                )

            );


        camera.rotation.y =
            yaw;


        camera.rotation.x =
            pitch;

    }

);


/* =========================================================
   KEYBOARD DOWN
   ========================================================= */

document.addEventListener(

    "keydown",

    event => {

        const key =
            event.key.toLowerCase();


        if (

            key === "w" ||

            key === "arrowup"

        ) {

            keyboard.forward =
                true;

        }


        if (

            key === "s" ||

            key === "arrowdown"

        ) {

            keyboard.backward =
                true;

        }


        if (

            key === "a" ||

            key === "arrowleft"

        ) {

            keyboard.left =
                true;

        }


        if (

            key === "d" ||

            key === "arrowright"

        ) {

            keyboard.right =
                true;

        }

    }

);


/* =========================================================
   KEYBOARD UP
   ========================================================= */

document.addEventListener(

    "keyup",

    event => {

        const key =
            event.key.toLowerCase();


        if (

            key === "w" ||

            key === "arrowup"

        ) {

            keyboard.forward =
                false;

        }


        if (

            key === "s" ||

            key === "arrowdown"

        ) {

            keyboard.backward =
                false;

        }


        if (

            key === "a" ||

            key === "arrowleft"

        ) {

            keyboard.left =
                false;

        }


        if (

            key === "d" ||

            key === "arrowright"

        ) {

            keyboard.right =
                false;

        }

    }

);


/* =========================================================
   COLLISION DETECTION
   ========================================================= */

function canMoveTo(

    x,

    z

) {

    const radius =
        PLAYER_RADIUS;


    const points = [

        [
            x - radius,
            z - radius
        ],

        [
            x + radius,
            z - radius
        ],

        [
            x - radius,
            z + radius
        ],

        [
            x + radius,
            z + radius
        ]

    ];


    for (
        const [
            px,
            pz
        ] of points
    ) {

        const cellX =
            Math.floor(
                px
            );


        const cellZ =
            Math.floor(
                pz
            );


        /*
            Outside maze.
        */

        if (

            cellX < 0 ||

            cellX >= mazeSize ||

            cellZ < 0 ||

            cellZ >= mazeSize

        ) {

            return false;

        }


        /*
            Wall.
        */

        if (
            maze[cellZ][cellX] === 1
        ) {

            return false;

        }

    }


    return true;

}


/* =========================================================
   PLAYER MOVEMENT
   ========================================================= */

function updateMovement(
    delta
) {

    if (
        !playing
    ) {

        return;

    }


    let inputX =
        0;


    let inputY =
        0;


    /*
        Keyboard.
    */

    if (
        keyboard.left
    ) {

        inputX -=
            1;

    }


    if (
        keyboard.right
    ) {

        inputX +=
            1;

    }


    if (
        keyboard.forward
    ) {

        inputY +=
            1;

    }


    if (
        keyboard.backward
    ) {

        inputY -=
            1;

    }


    /*
        Mobile joystick.
    */

    inputX +=
        joystickX;


    inputY +=
        joystickY;


    /*
        Prevent diagonal
        movement from being
        too fast.
    */

    const inputLength =
        Math.hypot(

            inputX,

            inputY

        );


    if (
        inputLength === 0
    ) {

        checkExit();

        return;

    }


    if (
        inputLength > 1
    ) {

        inputX /=
            inputLength;


        inputY /=
            inputLength;

    }


    /*
        Camera direction.
    */

    const forwardX =
        -Math.sin(
            yaw
        );


    const forwardZ =
        -Math.cos(
            yaw
        );


    const rightX =
        Math.cos(
            yaw
        );


    const rightZ =
        -Math.sin(
            yaw
        );


    /*
        Convert local movement
        into world movement.
    */

    const worldX =

        (
            rightX *
            inputX
        )

        +

        (
            forwardX *
            inputY
        );


    const worldZ =

        (
            rightZ *
            inputX
        )

        +

        (
            forwardZ *
            inputY
        );


    /*
        Speed.
    */

    const speed =
        3.2;


    /*
        New position.
    */

    const nextX =

        camera.position.x +

        worldX *

        speed *

        delta;


    const nextZ =

        camera.position.z +

        worldZ *

        speed *

        delta;


    /*
        X collision.
    */

    if (
        canMoveTo(

            nextX,

            camera.position.z

        )
    ) {

        camera.position.x =
            nextX;

    }


    /*
        Z collision.
    */

    if (
        canMoveTo(

            camera.position.x,

            nextZ

        )
    ) {

        camera.position.z =
            nextZ;

    }


    checkExit();

}


/* =========================================================
   UPDATE FLASHLIGHT
   ========================================================= */

function updatePlayerLight() {

    /*
        Put flashlight
        exactly where player is.
    */

    playerLight.position.copy(
        camera.position
    );


    /*
        Get camera direction.
    */

    const direction =
        new THREE.Vector3();


    camera.getWorldDirection(
        direction
    );


    /*
        Move target forward.
    */

    lightTarget.position.copy(
        camera.position
    );


    lightTarget.position.add(

        direction.multiplyScalar(
            8
        )

    );

}


/* =========================================================
   CHECK GREEN DOOR
   ========================================================= */

function checkExit() {

    if (

        !exitDoor ||

        !playing

    ) {

        return;

    }


    const dx =

        camera.position.x -

        exitDoor.position.x;


    const dz =

        camera.position.z -

        exitDoor.position.z;


    const distance =
        Math.hypot(

            dx,

            dz

        );


    /*
        Reached door.
    */

    if (
        distance <
        0.75
    ) {

        finishLevel();

    }

}


/* =========================================================
   LEVEL COMPLETE
   ========================================================= */

function finishLevel() {

    if (
        !playing
    ) {

        return;

    }


    playing =
        false;


    clearInterval(
        timerInterval
    );


    /*
        Release mouse.
    */

    if (
        document.pointerLockElement
    ) {

        document.exitPointerLock();

    }


    /*
        Update best.
    */

    if (
        level >
        best
    ) {

        best =
            level;


        localStorage.setItem(

            "mosayad_modern_maze_best",

            best

        );


        bestText.textContent =
            best;

    }


    /*
        Result.
    */

    completeText.textContent =

        `You reached the green door in ${formatTime(timer)}.`;


    /*
        Prepare next level.
    */

    level++;


    completeScreen.classList.remove(
        "hidden"
    );

}


/* =========================================================
   TIMER
   ========================================================= */

function startTimer() {

    clearInterval(
        timerInterval
    );


    timerInterval =

        setInterval(

            () => {

                if (
                    playing
                ) {

                    timer++;

                    updateTimer();

                }

            },

            1000

        );

}


/* =========================================================
   UPDATE TIMER
   ========================================================= */

function updateTimer() {

    timerText.textContent =
        formatTime(
            timer
        );

}


/* =========================================================
   FORMAT TIME
   ========================================================= */

function formatTime(
    seconds
) {

    const minutes =
        Math.floor(

            seconds /
            60

        );


    const remaining =
        seconds %
        60;


    return

        String(
            minutes
        ).padStart(
            2,
            "0"
        )

        +

        ":"

        +

        String(
            remaining
        ).padStart(
            2,
            "0"
        );

}


/* =========================================================
   MOBILE JOYSTICK
   ========================================================= */

function updateJoystick(
    clientX,
    clientY
) {

    const rect =
        joystick.getBoundingClientRect();


    const centerX =

        rect.left +

        rect.width /
        2;


    const centerY =

        rect.top +

        rect.height /
        2;


    let dx =

        clientX -
        centerX;


    let dy =

        clientY -
        centerY;


    const distance =
        Math.hypot(

            dx,

            dy

        );


    if (
        distance >
        JOYSTICK_RADIUS
    ) {

        dx =

            (
                dx /
                distance
            ) *

            JOYSTICK_RADIUS;


        dy =

            (
                dy /
                distance
            ) *

            JOYSTICK_RADIUS;

    }


    joystickX =

        dx /
        JOYSTICK_RADIUS;


    /*
        Negative because
        screen Y goes down.
    */

    joystickY =

        -dy /
        JOYSTICK_RADIUS;


    joystickKnob.style.transform =

        `translate(
            calc(-50% + ${dx}px),
            calc(-50% + ${dy}px)
        )`;

}


/* =========================================================
   RESET JOYSTICK
   ========================================================= */

function resetJoystick() {

    joystickActive =
        false;


    joystickPointer =
        null;


    joystickX =
        0;


    joystickY =
        0;


    joystickKnob.style.transform =
        "translate(-50%, -50%)";

}


/* =========================================================
   JOYSTICK POINTER DOWN
   ========================================================= */

joystick.addEventListener(

    "pointerdown",

    event => {

        event.preventDefault();


        joystickActive =
            true;


        joystickPointer =
            event.pointerId;


        joystick.setPointerCapture(
            event.pointerId
        );


        updateJoystick(

            event.clientX,

            event.clientY

        );

    }

);


/* =========================================================
   JOYSTICK POINTER MOVE
   ========================================================= */

joystick.addEventListener(

    "pointermove",

    event => {

        if (

            !joystickActive ||

            event.pointerId !==
            joystickPointer

        ) {

            return;

        }


        updateJoystick(

            event.clientX,

            event.clientY

        );

    }

);


/* =========================================================
   JOYSTICK POINTER UP
   ========================================================= */

joystick.addEventListener(

    "pointerup",

    resetJoystick

);


joystick.addEventListener(

    "pointercancel",

    resetJoystick

);


/* =========================================================
   MOBILE CAMERA LOOK
   ========================================================= */

renderer.domElement.addEventListener(

    "pointerdown",

    event => {

        /*
            Desktop doesn't use
            this system.
        */

        if (
            window.innerWidth > 800
        ) {

            return;

        }


        /*
            Ignore joystick.
        */

        if (

            event.target ===
            joystick ||

            joystick.contains(
                event.target
            )

        ) {

            return;

        }


        if (
            !playing
        ) {

            return;

        }


        lookActive =
            true;


        lookPointer =
            event.pointerId;


        lastLookX =
            event.clientX;


        lastLookY =
            event.clientY;


        renderer.domElement.setPointerCapture(
            event.pointerId
        );

    }

);


/* =========================================================
   MOBILE CAMERA MOVE
   ========================================================= */

renderer.domElement.addEventListener(

    "pointermove",

    event => {

        if (

            !lookActive ||

            event.pointerId !==
            lookPointer ||

            !playing

        ) {

            return;

        }


        const dx =

            event.clientX -
            lastLookX;


        const dy =

            event.clientY -
            lastLookY;


        lastLookX =
            event.clientX;


        lastLookY =
            event.clientY;


        yaw -=

            dx *
            0.006;


        pitch -=

            dy *
            0.006;


        pitch =

            Math.max(

                -1.2,

                Math.min(

                    1.2,

                    pitch

                )

            );


        camera.rotation.y =
            yaw;


        camera.rotation.x =
            pitch;

    }

);


/* =========================================================
   MOBILE CAMERA UP
   ========================================================= */

renderer.domElement.addEventListener(

    "pointerup",

    () => {

        lookActive =
            false;


        lookPointer =
            null;

    }

);


renderer.domElement.addEventListener(

    "pointercancel",

    () => {

        lookActive =
            false;


        lookPointer =
            null;

    }

);


/* =========================================================
   GREEN DOOR ANIMATION
   ========================================================= */

function animateExit() {

    if (
        !exitDoor
    ) {

        return;

    }


    /*
        Gentle rotation.
    */

    exitDoor.rotation.y +=
        0.0015;


    /*
        Gentle pulse.
    */

    const pulse =

        1 +

        Math.sin(

            performance.now() *
            0.004

        ) *

        0.035;


    exitDoor.scale.set(

        pulse,

        pulse,

        pulse

    );


    /*
        Green light pulse.
    */

    if (
        exitLight
    ) {

        exitLight.intensity =

            3.5 +

            Math.sin(

                performance.now() *
                0.005

            ) *

            0.8;

    }

}


/* =========================================================
   WINDOW RESIZE
   ========================================================= */

window.addEventListener(

    "resize",

    () => {

        camera.aspect =

            window.innerWidth /
            window.innerHeight;


        camera.updateProjectionMatrix();


        renderer.setSize(

            window.innerWidth,

            window.innerHeight

        );

    }

);


/* =========================================================
   MAIN GAME LOOP
   ========================================================= */

let lastTime =
    performance.now();


function animate() {

    requestAnimationFrame(
        animate
    );


    const now =
        performance.now();


    let delta =

        (
            now -
            lastTime
        ) /

        1000;


    lastTime =
        now;


    /*
        Prevent huge movement
        if the tab freezes.
    */

    delta =
        Math.min(

            delta,

            0.05

        );


    /*
        Player.
    */

    updateMovement(
        delta
    );


    /*
        Flashlight.
    */

    updatePlayerLight();


    /*
        Exit animation.
    */

    animateExit();


    /*
        Render.
    */

    renderer.render(

        scene,

        camera

    );

}


/* =========================================================
   START RENDER LOOP
   ========================================================= */

animate();