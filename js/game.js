import { db } from "./firebase.js";

import {
    doc,
    updateDoc,
    increment
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// ==========================
// Elements
// ==========================

const image = document.getElementById("game-image");

const nameText = document.getElementById("game-name");

const description = document.getElementById("game-description");

const version = document.getElementById("game-version");

const size = document.getElementById("game-size");

const platform = document.getElementById("game-platform");

const release = document.getElementById("game-release");

const downloads = document.getElementById("game-downloads");

const likes = document.getElementById("game-likes");

const steps = document.getElementById("game-steps");

const likeBtn = document.getElementById("like-btn");

const userId = localStorage.getItem("userId");

const downloadBtn = document.getElementById("download-btn");

const clickSound = document.getElementById("click-sound");

const hoverSound = document.getElementById("hover-sound");

clickSound.volume = 0.3;

hoverSound.volume = 0.15;

// ==========================
// Current Game
// ==========================

let currentGame = null;

// ==========================
// Read id from URL
// ==========================

const params = new URLSearchParams(window.location.search);

const gameId = params.get("id");

// ==========================
// Load Game
// ==========================

async function loadGame() {

    try {

        const response = await fetch("js/games.json");

        const games = await response.json();

        currentGame = games.find(game => game.id === gameId);

        if (!currentGame) {

            document.body.innerHTML = "<h1 style='text-align:center;margin-top:100px;'>Game Not Found</h1>";

            return;

        }

        showGame();

    }

    catch (error) {

        console.error(error);

    }

}

// ==========================
// Display Game
// ==========================

function showGame() {

    image.src = currentGame.image;

    image.alt = currentGame.name;

    nameText.textContent = currentGame.name;

    description.textContent = currentGame.description;

    version.textContent = currentGame.version;

    size.textContent = currentGame.size;

    platform.textContent = currentGame.platform;

    release.textContent = currentGame.releaseDate;

    downloads.textContent = "??"; //currentGame.downloads;

    likes.textContent = "??"; //currentGame.likes;

    steps.textContent = "Open { "+ currentGame.download +" } to install the game...";

    downloadBtn.href = currentGame.download;

}
// ==========================
// Firebase
// ==========================
async function increaseUserDownloads() {

    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
        downloads: increment(1)
    });

}

async function increaseDownloads() {

    try {

        const gameRef = doc(db, "games", currentGame.id);

        await updateDoc(gameRef, {

            downloads: increment(1)

        });

    }

    catch (error) {

        console.error(error);

    }

}
async function increaseUserLikes() {

    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
        likes: increment(1)
    });

}

async function increaseLikes() {

    try {

        const gameRef = doc(db, "games", currentGame.id);

        await updateDoc(gameRef, {

            likes: increment(1)

        });

    }

    catch (error) {

        console.error(error);

    }

}

// ==========================
// Sounds
// ==========================

function playClick() {

    clickSound.currentTime = 0;

    clickSound.play().catch(() => {});

}

function playHover() {

    hoverSound.currentTime = 0;

    hoverSound.play().catch(() => {});

}

downloadBtn.addEventListener("mouseenter", playHover);

likeBtn.addEventListener("mouseenter", playHover);

downloadBtn.addEventListener("click", playClick);

likeBtn.addEventListener("click", playClick);

// ==========================
// Mobile Check
// ==========================

function isMobile() {

    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(
        navigator.userAgent
    );

}

// ==========================
// Download
// ==========================

downloadBtn.addEventListener("click", async (e) => {

    if (

        isMobile() &&

        currentGame.platform === "Windows"

    ) {

        const ok = confirm(

            "⚠️ This game is for PC.\n\nIt may not run on your device.\n\nContinue?"

        );

        if (!ok) {

            e.preventDefault();

            return;

        }

    }

    downloadBtn.disabled = true;

    try {

        await increaseDownloads();
        await increaseUserDownloads();

    }

    catch (error) {

        console.error(error);

    }

    downloads.textContent = Number(downloads.textContent) + 1;

    downloadBtn.disabled = false;

});

// ==========================
// Like
// ==========================

likeBtn.addEventListener("click", async () => {

    likeBtn.disabled = true;

    try {

        await increaseLikes();
        await increaseUserLikes();

    }

    catch (error) {

        console.error(error);

    }

    likes.textContent = Number(likes.textContent) + 1;

    likeBtn.disabled = false;

});

// ==========================
// Start
// ==========================

loadGame();