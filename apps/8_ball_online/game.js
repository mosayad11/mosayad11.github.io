/* =========================================================
   MOSAYAD 8 BALL POOL - ONLINE LOBBY
   Phase 1:
   Firestore Rooms
   LocalStorage User System

   Login system:
   localStorage.userId
   localStorage.userName
   ========================================================= */


/* =========================================================
   FIREBASE
   ========================================================= */

import { db } from "../../js/firebase.js";

import {
    collection,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    query,
    where,
    limit,
    onSnapshot,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


console.log("🎱 GAME.JS LOADED");


/* =========================================================
   DOM
   ========================================================= */

const playerNameElement =
    document.getElementById("playerName");

const avatarElement =
    document.getElementById("avatar");

const connectionStatusElement =
    document.getElementById("connectionStatus");

const createRoomButton =
    document.getElementById("createRoomButton");

const openRoomsButton =
    document.getElementById("openRoomsButton");

const refreshRoomsButton =
    document.getElementById("refreshRoomsButton");

const roomsSection =
    document.getElementById("roomsSection");

const roomsList =
    document.getElementById("roomsList");

const noRooms =
    document.getElementById("noRooms");

const currentRoom =
    document.getElementById("currentRoom");

const currentRoomIdElement =
    document.getElementById("currentRoomId");

const roomStatusText =
    document.getElementById("roomStatusText");

const cancelRoomButton =
    document.getElementById("cancelRoomButton");

const connectingScreen =
    document.getElementById("connectingScreen");

const connectingText =
    document.getElementById("connectingText");

const gameReadyScreen =
    document.getElementById("gameReadyScreen");

const opponentNameElement =
    document.getElementById("opponentName");

const readyYourName =
    document.getElementById("readyYourName");

const readyOpponentName =
    document.getElementById("readyOpponentName");

const readyYourAvatar =
    document.getElementById("readyYourAvatar");

const readyOpponentAvatar =
    document.getElementById("readyOpponentAvatar");

const backToLobbyButton =
    document.getElementById("backToLobbyButton");

const themeButton =
    document.getElementById("themeButton");

const toast =
    document.getElementById("toast");


/* =========================================================
   STATE
   ========================================================= */

let currentUserId =
    localStorage.getItem("userId");

let currentUserName =
    localStorage.getItem("userName") || "";

let currentRoomId = null;

let currentRoomUnsubscribe = null;

let roomsUnsubscribe = null;

let toastTimer = null;


/* =========================================================
   THEME
   ========================================================= */

const savedTheme =
    localStorage.getItem("mosayad8ballTheme");

if (savedTheme === "dark") {

    document.body.classList.add("dark");

    themeButton.textContent = "☀️";

} else {

    themeButton.textContent = "🌙";
}


themeButton.addEventListener(
    "click",
    () => {

        document.body.classList.toggle("dark");

        const isDark =
            document.body.classList.contains("dark");

        localStorage.setItem(
            "mosayad8ballTheme",
            isDark ? "dark" : "light"
        );

        themeButton.textContent =
            isDark ? "☀️" : "🌙";
    }
);


/* =========================================================
   HELPERS
   ========================================================= */

function showToast(text) {

    toast.textContent = text;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove("show");

            },
            2800
        );
}


function getInitial(name) {

    if (!name) {

        return "?";

    }

    return name
        .trim()
        .charAt(0)
        .toUpperCase();
}


function generateRoomId() {

    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let result = "";

    for (
        let i = 0;
        i < 6;
        i++
    ) {

        result +=
            chars.charAt(
                Math.floor(
                    Math.random() *
                    chars.length
                )
            );
    }

    return result;
}


/* =========================================================
   LOAD PLAYER
   ========================================================= */

function loadPlayer() {

    currentUserId =
        localStorage.getItem("userId");

    currentUserName =
        localStorage.getItem("userName");


    if (
        !currentUserId ||
        !currentUserName
    ) {

        console.log("❌ NO PLAYER FOUND");

        playerNameElement.textContent =
            "Not logged in";

        connectionStatusElement.textContent =
            "Please login first";

        connectionStatusElement.style.color =
            "#ef4444";

        createRoomButton.disabled =
            true;

        openRoomsButton.disabled =
            true;

        refreshRoomsButton.disabled =
            true;

        return false;
    }


    console.log(
        "✅ PLAYER FOUND:",
        currentUserId,
        currentUserName
    );


    playerNameElement.textContent =
        currentUserName;

    avatarElement.textContent =
        getInitial(currentUserName);


    readyYourName.textContent =
        currentUserName;

    readyYourAvatar.textContent =
        getInitial(currentUserName);


    connectionStatusElement.textContent =
        "Online";

    connectionStatusElement.style.color =
        "var(--green)";


    createRoomButton.disabled =
        false;

    openRoomsButton.disabled =
        false;

    refreshRoomsButton.disabled =
        false;


    return true;
}


/* =========================================================
   CREATE ROOM
   ========================================================= */

createRoomButton.addEventListener(
    "click",
    async () => {

        if (!currentUserId) {

            showToast(
                "Please login first."
            );

            return;
        }


        if (currentRoomId) {

            showToast(
                "You already have a room open."
            );

            return;
        }


        createRoomButton.disabled =
            true;


        try {

            let roomId =
                generateRoomId();

            let roomRef =
                doc(
                    db,
                    "rooms",
                    roomId
                );

            let existing =
                await getDoc(roomRef);


            while (
                existing.exists()
            ) {

                roomId =
                    generateRoomId();

                roomRef =
                    doc(
                        db,
                        "rooms",
                        roomId
                    );

                existing =
                    await getDoc(roomRef);
            }


            await setDoc(
                roomRef,
                {
                    hostId:
                        currentUserId,

                    hostName:
                        currentUserName,

                    guestId:
                        null,

                    guestName:
                        null,

                    status:
                        "waiting",

                    createdAt:
                        serverTimestamp()
                }
            );


            currentRoomId =
                roomId;


            currentRoomIdElement.textContent =
                roomId;

            roomStatusText.textContent =
                "Waiting for opponent";


            currentRoom.classList.remove(
                "hidden"
            );


            listenToCurrentRoom(
                roomId
            );


            showToast(
                "Room created successfully!"
            );


            showOpenRooms();

        } catch (error) {

            console.error(
                "Create room error:",
                error
            );

            showToast(
                "Could not create the room."
            );

        } finally {

            createRoomButton.disabled =
                false;
        }
    }
);


/* =========================================================
   OPEN ROOMS
   ========================================================= */

openRoomsButton.addEventListener(
    "click",
    () => {

        showOpenRooms();

    }
);


refreshRoomsButton.addEventListener(
    "click",
    () => {

        showOpenRooms();

    }
);


function showOpenRooms() {

    roomsSection.classList.remove(
        "hidden"
    );


    if (
        roomsUnsubscribe
    ) {

        roomsUnsubscribe();

        roomsUnsubscribe =
            null;
    }


    const roomsQuery =
        query(
            collection(
                db,
                "rooms"
            ),

            where(
                "status",
                "==",
                "waiting"
            ),

            limit(30)
        );


    roomsUnsubscribe =
        onSnapshot(

            roomsQuery,

            (snapshot) => {

                const rooms = [];


                snapshot.forEach(
                    (roomDocument) => {

                        const data =
                            roomDocument.data();


                        /*
                           Do not show
                           your own room.
                        */

                        if (
                            currentUserId &&
                            data.hostId ===
                            currentUserId
                        ) {

                            return;
                        }


                        rooms.push({
                            id:
                                roomDocument.id,

                            ...data
                        });

                    }
                );


                renderRooms(
                    rooms
                );

            },

            (error) => {

                console.error(
                    "Rooms listener error:",
                    error
                );

                showToast(
                    "Could not load open rooms."
                );
            }
        );
}


/* =========================================================
   RENDER ROOMS
   ========================================================= */

function renderRooms(rooms) {

    roomsList.innerHTML = "";


    if (
        rooms.length === 0
    ) {

        noRooms.classList.remove(
            "hidden"
        );

        return;
    }


    noRooms.classList.add(
        "hidden"
    );


    rooms.forEach(
        (room) => {

            const item =
                document.createElement("div");

            item.className =
                "room-item";


            const player =
                document.createElement("div");

            player.className =
                "room-player";


            const avatar =
                document.createElement("div");

            avatar.className =
                "room-avatar";

            avatar.textContent =
                getInitial(
                    room.hostName
                );


            const info =
                document.createElement("div");

            info.className =
                "room-player-info";


            const name =
                document.createElement("strong");

            name.textContent =
                room.hostName ||
                "Player";


            const roomId =
                document.createElement("span");

            roomId.className =
                "room-id";

            roomId.textContent =
                "ROOM " +
                room.id;


            info.appendChild(name);

            info.appendChild(roomId);


            player.appendChild(avatar);

            player.appendChild(info);


            const joinButton =
                document.createElement("button");

            joinButton.className =
                "join-button";

            joinButton.textContent =
                "JOIN";


            joinButton.addEventListener(
                "click",
                () => {

                    joinRoom(
                        room.id
                    );

                }
            );


            item.appendChild(player);

            item.appendChild(joinButton);


            roomsList.appendChild(item);
        }
    );
}


/* =========================================================
   JOIN ROOM
   ========================================================= */

async function joinRoom(roomId) {

    if (!currentUserId) {

        showToast(
            "Please login first."
        );

        return;
    }


    if (currentRoomId) {

        showToast(
            "You are already in a room."
        );

        return;
    }


    connectingText.textContent =
        "Joining room " +
        roomId;


    connectingScreen.classList.remove(
        "hidden"
    );


    try {

        const roomRef =
            doc(
                db,
                "rooms",
                roomId
            );


        const roomData =
            await runTransaction(

                db,

                async (transaction) => {

                    const roomSnapshot =
                        await transaction.get(
                            roomRef
                        );


                    if (
                        !roomSnapshot.exists()
                    ) {

                        throw new Error(
                            "ROOM_NOT_FOUND"
                        );
                    }


                    const data =
                        roomSnapshot.data();


                    if (
                        data.status !==
                        "waiting"
                    ) {

                        throw new Error(
                            "ROOM_NOT_AVAILABLE"
                        );
                    }


                    if (
                        data.hostId ===
                        currentUserId
                    ) {

                        throw new Error(
                            "OWN_ROOM"
                        );
                    }


                    transaction.update(
                        roomRef,
                        {
                            guestId:
                                currentUserId,

                            guestName:
                                currentUserName,

                            status:
                                "playing",

                            joinedAt:
                                serverTimestamp()
                        }
                    );


                    return {
                        ...data
                    };
                }
            );


        currentRoomId =
            roomId;


        listenToCurrentRoom(
            roomId
        );


        showGameReady(
            roomData.hostName ||
            "Player"
        );


    } catch (error) {

        console.error(
            "Join room error:",
            error
        );


        connectingScreen.classList.add(
            "hidden"
        );


        if (
            error.message ===
            "ROOM_NOT_FOUND"
        ) {

            showToast(
                "This room no longer exists."
            );

        } else if (
            error.message ===
            "ROOM_NOT_AVAILABLE"
        ) {

            showToast(
                "This room was already taken."
            );

        } else if (
            error.message ===
            "OWN_ROOM"
        ) {

            showToast(
                "You cannot join your own room."
            );

        } else {

            showToast(
                "Could not join this room."
            );
        }
    }
}


/* =========================================================
   CURRENT ROOM LISTENER
   ========================================================= */

function listenToCurrentRoom(roomId) {

    if (
        currentRoomUnsubscribe
    ) {

        currentRoomUnsubscribe();

        currentRoomUnsubscribe =
            null;
    }


    const roomRef =
        doc(
            db,
            "rooms",
            roomId
        );


    currentRoomUnsubscribe =
        onSnapshot(

            roomRef,

            (snapshot) => {

                if (
                    !snapshot.exists()
                ) {

                    currentRoomId =
                        null;

                    currentRoom.classList.add(
                        "hidden"
                    );

                    connectingScreen.classList.add(
                        "hidden"
                    );

                    gameReadyScreen.classList.add(
                        "hidden"
                    );

                    showToast(
                        "The room was closed."
                    );

                    return;
                }


                const data =
                    snapshot.data();


                /* =========================
                   WAITING
                ========================= */

                if (
                    data.status ===
                    "waiting"
                ) {

                    currentRoom.classList.remove(
                        "hidden"
                    );

                    currentRoomIdElement.textContent =
                        roomId;

                    roomStatusText.textContent =
                        "Waiting for opponent";


                    connectingScreen.classList.add(
                        "hidden"
                    );

                    return;
                }


                /* =========================
                   PLAYING
                ========================= */

                if (
                    data.status ===
                    "playing"
                ) {

                    currentRoom.classList.add(
                        "hidden"
                    );


                    let opponentName;


                    if (
                        data.hostId ===
                        currentUserId
                    ) {

                        opponentName =
                            data.guestName;

                    } else {

                        opponentName =
                            data.hostName;
                    }


                    if (
                        opponentName
                    ) {

                        showGameReady(
                            opponentName
                        );
                    }


                    connectingScreen.classList.add(
                        "hidden"
                    );
                }

            },

            (error) => {

                console.error(
                    "Current room listener error:",
                    error
                );

                showToast(
                    "Connection to room lost."
                );
            }
        );
}


/* =========================================================
   GAME READY
   ========================================================= */

function showGameReady(opponentName) {

    opponentName =
        opponentName ||
        "Player";


    opponentNameElement.textContent =
        opponentName;


    readyOpponentName.textContent =
        opponentName;


    readyOpponentAvatar.textContent =
        getInitial(
            opponentName
        );


    readyYourName.textContent =
        currentUserName;


    readyYourAvatar.textContent =
        getInitial(
            currentUserName
        );


    connectingScreen.classList.add(
        "hidden"
    );


    gameReadyScreen.classList.remove(
        "hidden"
    );
}


/* =========================================================
   CANCEL ROOM
   ========================================================= */

cancelRoomButton.addEventListener(
    "click",
    async () => {

        if (
            !currentRoomId ||
            !currentUserId
        ) {

            return;
        }


        try {

            const roomRef =
                doc(
                    db,
                    "rooms",
                    currentRoomId
                );


            const roomSnapshot =
                await getDoc(
                    roomRef
                );


            if (
                !roomSnapshot.exists()
            ) {

                currentRoomId =
                    null;

                currentRoom.classList.add(
                    "hidden"
                );

                return;
            }


            const data =
                roomSnapshot.data();


            if (
                data.hostId ===
                currentUserId &&

                data.status ===
                "waiting"
            ) {

                await deleteDoc(
                    roomRef
                );


                currentRoomId =
                    null;


                currentRoom.classList.add(
                    "hidden"
                );


                showToast(
                    "Room cancelled."
                );
            }

        } catch (error) {

            console.error(
                "Cancel room error:",
                error
            );

            showToast(
                "Could not cancel the room."
            );
        }
    }
);


/* =========================================================
   BACK TO LOBBY
   ========================================================= */

backToLobbyButton.addEventListener(
    "click",
    () => {

        gameReadyScreen.classList.add(
            "hidden"
        );

        connectingScreen.classList.add(
            "hidden"
        );


        /*
           IMPORTANT:

           We keep currentRoomId here.

           The room is still active and
           later WebRTC will start from
           this room.

           For now this only closes
           the "MATCH FOUND" screen.
        */

        showToast(
            "Back to lobby."
        );
    }
);


/* =========================================================
   PAGE CLEANUP
   ========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (
            roomsUnsubscribe
        ) {

            roomsUnsubscribe();

            roomsUnsubscribe =
                null;
        }


        if (
            currentRoomUnsubscribe
        ) {

            currentRoomUnsubscribe();

            currentRoomUnsubscribe =
                null;
        }
    }
);


/* =========================================================
   INITIAL UI
   ========================================================= */

roomsSection.classList.add(
    "hidden"
);

currentRoom.classList.add(
    "hidden"
);

connectingScreen.classList.add(
    "hidden"
);

gameReadyScreen.classList.add(
    "hidden"
);


/* =========================================================
   START
   ========================================================= */

loadPlayer();