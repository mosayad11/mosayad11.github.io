if (!localStorage.getItem("userId")) {

    window.location.href = "login.html";

}

import { db } from "./firebase.js";
import {
    getFirestore,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// ==========================
// Elements
// ==========================

const gamesContainer = document.getElementById("games-container");
const searchInput = document.getElementById("search");

const clickSound = document.getElementById("click-sound");
const hoverSound = document.getElementById("hover-sound");
const soundBtn = document.getElementById("sound-btn");

let soundEnabled = true;

clickSound.volume = 0.3;
hoverSound.volume = 0.15;


let games = [];

// ==========================
// User Greeting
// ==========================

async function loadUserGreeting() {

    const userNameElement = document.getElementById("user-name");

    if (!userNameElement) return;

    // Default while loading / if something goes wrong
    userNameElement.textContent = "...";

    const userId = localStorage.getItem("userId");

    if (!userId) {
        return;
    }

    try {

        const userRef = doc(
            db,
            "users",
            userId
        );

        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {

            const userData = userSnapshot.data();

            const name = userData.name;

            if (name && name.trim()) {

                userNameElement.textContent =
                    name.charAt(0).toUpperCase() +
                    name.slice(1);

            }

        }

    } catch (error) {

        console.error(
            "Failed to load user name:",
            error
        );

        userNameElement.textContent = "...";
    }
}

function playClick() {

    if (!soundEnabled) return;

    clickSound.currentTime = 0;
    clickSound.play();

}


function setupSounds() {

    document.querySelectorAll("button, a").forEach(element => {

        element.removeEventListener("mouseenter", playHover);
        element.removeEventListener("click", playClick);

        element.addEventListener("mouseenter", playHover);
        element.addEventListener("click", playClick);

    });

}

function playHover() {

    if (!soundEnabled) return;

    hoverSound.currentTime = 0;
    hoverSound.play().catch(() => {});

}


// ==========================
// Load Games
// ==========================

async function loadGames() {

    try {

        const response = await fetch("js/games.json");

        games = await response.json();


        displayGames(games);

    }

    catch (error) {

        gamesContainer.innerHTML = `
            <h2 style="text-align:center;">
                Failed to load games.
            </h2>
        `;

        console.error(error);

    }

}


// ==========================
// Display Games
// ==========================

function displayGames(list) {

    gamesContainer.innerHTML = "";

    if (list.length === 0) {

        gamesContainer.innerHTML = `
            <h2 style="text-align:center;">
                No games found.
            </h2>
        `;

        return;

    }

    list.forEach(game => {

        gamesContainer.innerHTML += `

        <a href="game.html?id=${game.id}" class="game-card">

            <img src="${game.image}" alt="${game.name}">

            <h2>${game.name}</h2>

            <p>${game.description}</p>

            <div class="game-info">

                <span>Version ${game.version}</span>

                <span>${game.size}</span>

            </div>

            <p class="platform">

                <span>💻 ${game.platform}</span>

            </p>

        </a>

        `;

    });
    setupSounds();

}


// ==========================
// Search
// ==========================

searchInput.addEventListener("input", () => {

    const value = searchInput.value.toLowerCase();

    const filteredGames = games.filter(game =>

        game.name.toLowerCase().includes(value) ||

        game.description.toLowerCase().includes(value)

    );

    displayGames(filteredGames);

});

// ==========================
// Theme
// ==========================

const themeBtn = document.getElementById("theme-btn");

const savedTheme = localStorage.getItem("theme");

if(savedTheme==="light"){

    document.body.classList.add("light-theme");

    themeBtn.textContent="🌙";

}

else{

    themeBtn.textContent="☀️";

}

themeBtn.addEventListener("click",()=>{

    document.body.classList.toggle("light-theme");

    if(document.body.classList.contains("light-theme")){

        localStorage.setItem("theme","light");

        themeBtn.textContent="🌙";

    }

    else{

        localStorage.setItem("theme","dark");

        themeBtn.textContent="☀️";

    }

});
window.addEventListener("load", () => {

    const loader = document.getElementById("loader");

    loader.classList.add("hide");

});


soundBtn.addEventListener("click", () => {

    if (soundEnabled) {
        clickSound.currentTime = 0;
        clickSound.play().catch(() => {});
    }

    soundEnabled = !soundEnabled;

    soundBtn.textContent = soundEnabled ? "🔊" : "🔇";

});
// ==========================
// Start
// ==========================

loadGames();
loadUserGreeting();