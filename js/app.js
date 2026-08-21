/* =========================================================
   MOSAYAD APPS
   Main Application JavaScript
   ========================================================= */


/* =========================================================
   FIREBASE
   ========================================================= */

import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* =========================================================
   SETTINGS
   ========================================================= */

const APPS_FILE = "data/apps.json";

const DEFAULT_USER_NAME = "Player";


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const loader = document.getElementById("loader");

const userNameElement =
    document.getElementById("user-name");

const usersCountElement =
    document.getElementById("users-count");

const searchInput =
    document.getElementById("search");

const clearSearchButton =
    document.getElementById("clear-search");

const resetSearchButton =
    document.getElementById("reset-search");

const filtersContainer =
    document.getElementById("filters");

const appsContainer =
    document.getElementById("games-container");

const emptyState =
    document.getElementById("empty-state");

const resultsCount =
    document.getElementById("results-count");

const soundButton =
    document.getElementById("sound-btn");

const themeButton =
    document.getElementById("theme-btn");

const menuButton =
    document.getElementById("menu-btn");

const mobileMenu =
    document.getElementById("mobile-menu");

const topButton =
    document.getElementById("top-btn");

const clickSound =
    document.getElementById("click-sound");

const hoverSound =
    document.getElementById("hover-sound");


/* =========================================================
   APPLICATION STATE
   ========================================================= */

let apps = [];

let currentFilter = "all";

let currentSearch = "";

let soundEnabled =
    localStorage.getItem("mosayadSound") !== "off";

let currentTheme =
    localStorage.getItem("mosayadTheme") || "dark";


/* =========================================================
   LOGIN CHECK
   ========================================================= */

function checkLogin() {

    const userId =
        localStorage.getItem("userId");

    if (!userId) {

        window.location.href = "login.html";

        return false;
    }

    return true;
}


/* =========================================================
   GET CURRENT USER
   ========================================================= */

async function loadCurrentUser() {

    const userId =
        localStorage.getItem("userId");

    const savedName =
        localStorage.getItem("userName");


    if (savedName) {

        userNameElement.textContent =
            savedName;

    }


    if (!userId) {
        return;
    }


    try {

        const userRef =
            doc(db, "users", userId);

        const userSnapshot =
            await getDoc(userRef);


        if (userSnapshot.exists()) {

            const userData =
                userSnapshot.data();

            const name =
                userData.name || savedName || DEFAULT_USER_NAME;ئئ


            userNameElement.textContent =
                name;


            localStorage.setItem(
                "userName",
                name
            );

        }

    }

    catch (error) {

        console.error(
            "Failed to load user:",
            error
        );

    }

}


/* =========================================================
   LOAD USERS COUNT
   ========================================================= */

async function loadUsersCount() {

    if (!usersCountElement) {
        return;
    }


    try {

        const usersSnapshot =
            await getDocs(
                collection(db, "users")
            );


        usersCountElement.textContent =
            usersSnapshot.size;

    }

    catch (error) {

        console.error(
            "Failed to load users count:",
            error
        );

        usersCountElement.textContent =
            "—";

    }

}


/* =========================================================
   LOAD APPS
   ========================================================= */

async function loadApps() {

    try {

        const response =
            await fetch(APPS_FILE, {
                cache: "no-cache"
            });


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        if (Array.isArray(data)) {

            apps = data;

        }

        else if (
            data &&
            Array.isArray(data.apps)
        ) {

            apps = data.apps;

        }

        else {

            throw new Error(
                "Invalid apps.json format"
            );

        }


        renderApps();

    }

    catch (error) {

        console.error(
            "Failed to load apps:",
            error
        );


        apps = [];


        if (appsContainer) {

            appsContainer.innerHTML = `

                <div class="load-error">

                    <div class="load-error-icon">
                        ⚠️
                    </div>

                    <h3>
                        Failed to load apps
                    </h3>

                    <p>
                        Please try again later.
                    </p>

                    <button
                        id="retry-apps"
                        type="button"
                    >
                        Try Again
                    </button>

                </div>

            `;


            const retryButton =
                document.getElementById(
                    "retry-apps"
                );


            retryButton?.addEventListener(
                "click",
                loadApps
            );

        }

    }

}


/* =========================================================
   FILTER APPS
   ========================================================= */

function getFilteredApps() {

    const search =
        currentSearch
            .trim()
            .toLowerCase();


    return apps.filter(app => {

        if (!app) {
            return false;
        }


        /* -----------------------------------------
           TYPE FILTER
           ----------------------------------------- */

        if (
            currentFilter !== "all" &&
            String(app.type || "").toLowerCase()
                !== currentFilter
        ) {

            return false;

        }


        /* -----------------------------------------
           SEARCH
           ----------------------------------------- */

        if (!search) {
            return true;
        }


        const searchableText = [

            app.name,

            app.title,

            app.description,

            app.category,

            app.type,

            ...(Array.isArray(app.tags)
                ? app.tags
                : [])

        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


        return searchableText.includes(search);

    });

}


/* =========================================================
   RENDER APPS
   ========================================================= */

function renderApps() {

    if (!appsContainer) {
        return;
    }


    const filteredApps =
        getFilteredApps();


    appsContainer.innerHTML = "";


    /* -----------------------------------------
       RESULTS COUNT
       ----------------------------------------- */

    if (resultsCount) {

        const count =
            filteredApps.length;

        resultsCount.textContent =
            `${count} ${count === 1 ? "result" : "results"}`;

    }


    /* -----------------------------------------
       EMPTY STATE
       ----------------------------------------- */

    if (filteredApps.length === 0) {

        appsContainer.classList.add(
            "hidden"
        );


        emptyState?.classList.remove(
            "hidden"
        );


        return;

    }


    emptyState?.classList.add(
        "hidden"
    );


    appsContainer.classList.remove(
        "hidden"
    );


    /* -----------------------------------------
       CREATE CARDS
       ----------------------------------------- */

    filteredApps.forEach(
        (app, index) => {

            const card =
                createAppCard(
                    app,
                    index
                );


            appsContainer.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   CREATE APP CARD
   ========================================================= */

function createAppCard(app, index) {

    const card =
        document.createElement("article");


    card.className =
        "app-card";


    card.dataset.type =
        String(
            app.type || "app"
        ).toLowerCase();


    /* -----------------------------------------
       DATA
       ----------------------------------------- */

    const name =
        app.name ||
        app.title ||
        "Unnamed App";


    const description =
        app.description ||
        "No description available.";


    const type =
        String(
            app.type || "app"
        ).toLowerCase();


    const category =
        app.category ||
        getTypeName(type);


    const icon =
        app.icon ||
        app.image ||
        app.thumbnail ||
        "images/logo.png";


    const link =
        app.url ||
        app.link ||
        app.path ||
        "#";


    /* -----------------------------------------
       TAG
       ----------------------------------------- */

    const typeIcon =
        getTypeIcon(type);


    /* -----------------------------------------
       CARD HTML
       ----------------------------------------- */

    card.innerHTML = `

        <div class="app-card-image">

            <img
                src="${escapeAttribute(icon)}"
                alt="${escapeAttribute(name)}"
                loading="lazy"
                onerror="this.src='images/logo.png'"
            >

            <span class="app-type-badge">

                ${typeIcon}

                ${escapeHTML(category)}

            </span>

        </div>


        <div class="app-card-content">

            <h3 class="app-card-title">

                ${escapeHTML(name)}

            </h3>


            <p class="app-card-description">

                ${escapeHTML(description)}

            </p>


            <div class="app-card-footer">

                <span class="app-card-type">
                    ${getTypeName(type)}
                </span>

                <span class="app-card-arrow">
                    →
                </span>

            </div>

        </div>

    `;


    /* -----------------------------------------
       ANIMATION DELAY
       ----------------------------------------- */

    card.style.setProperty(
        "--card-index",
        index
    );

    card.addEventListener("click", () => {

        playClickSound();

        if (link && link !== "#") {
            window.location.href = link;
        }

    });

    /* -----------------------------------------
       HOVER SOUND
       ----------------------------------------- */

    card.addEventListener(
        "mouseenter",
        () => {

            playHoverSound();

        }
    );


    return card;

}


/* =========================================================
   TYPE NAME
   ========================================================= */

function getTypeName(type) {

    const names = {

        game: "Game",

        app: "App",

        tool: "Tool",

        education: "Education"

    };


    return names[type] || "App";

}


/* =========================================================
   TYPE ICON
   ========================================================= */

function getTypeIcon(type) {

    const icons = {

        game: "🎮",

        app: "📱",

        tool: "🛠️",

        education: "📚"

    };


    return icons[type] || "📱";

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


/* =========================================================
   ESCAPE ATTRIBUTE
   ========================================================= */

function escapeAttribute(value) {

    return escapeHTML(value);

}


/* =========================================================
   SEARCH
   ========================================================= */

function handleSearch() {

    currentSearch =
        searchInput?.value || "";


    renderApps();


    updateClearSearchButton();

}


/* =========================================================
   CLEAR SEARCH
   ========================================================= */

function clearSearch() {

    if (searchInput) {

        searchInput.value = "";

    }


    currentSearch = "";


    renderApps();


    updateClearSearchButton();


    searchInput?.focus();

}


/* =========================================================
   CLEAR BUTTON VISIBILITY
   ========================================================= */

function updateClearSearchButton() {

    if (!clearSearchButton) {
        return;
    }


    const hasSearch =
        Boolean(
            searchInput?.value.trim()
        );


    clearSearchButton.classList.toggle(
        "visible",
        hasSearch
    );

}


/* =========================================================
   FILTER BUTTONS
   ========================================================= */

function setupFilters() {

    if (!filtersContainer) {
        return;
    }


    const buttons =
        filtersContainer.querySelectorAll(
            ".filter-btn"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                buttons.forEach(
                    item => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                currentFilter =
                    String(
                        button.dataset.type ||
                        "all"
                    ).toLowerCase();


                renderApps();


                playClickSound();

            }
        );

    });

}


/* =========================================================
   RESET SEARCH
   ========================================================= */

function resetSearch() {

    currentSearch = "";

    currentFilter = "all";


    if (searchInput) {

        searchInput.value = "";

    }


    const buttons =
        filtersContainer?.querySelectorAll(
            ".filter-btn"
        );


    buttons?.forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.type === "all"
        );

    });


    renderApps();

    updateClearSearchButton();

}


/* =========================================================
   SOUND
   ========================================================= */

function playSound(audio) {

    if (
        !soundEnabled ||
        !audio
    ) {

        return;

    }


    try {

        audio.currentTime = 0;

        const promise =
            audio.play();


        if (
            promise &&
            typeof promise.catch === "function"
        ) {

            promise.catch(
                () => {}
            );

        }

    }

    catch {

        // Ignore autoplay/browser audio restrictions.

    }

}


/* =========================================================
   CLICK SOUND
   ========================================================= */

function playClickSound() {

    playSound(
        clickSound
    );

}


/* =========================================================
   HOVER SOUND
   ========================================================= */

function playHoverSound() {

    playSound(
        hoverSound
    );

}


/* =========================================================
   SOUND TOGGLE
   ========================================================= */

function toggleSound() {

    soundEnabled =
        !soundEnabled;


    localStorage.setItem(
        "mosayadSound",
        soundEnabled
            ? "on"
            : "off"
    );


    updateSoundButton();


    if (soundEnabled) {

        playClickSound();

    }

}


/* =========================================================
   SOUND BUTTON
   ========================================================= */

function updateSoundButton() {

    if (!soundButton) {
        return;
    }


    soundButton.textContent =
        soundEnabled
            ? "🔊"
            : "🔇";


    soundButton.title =
        soundEnabled
            ? "Turn sound off"
            : "Turn sound on";

}


/* =========================================================
   THEME
   ========================================================= */

function applyTheme() {

    if (currentTheme === "light") {

        document.body.classList.add(
            "light-theme"
        );

        document.documentElement.setAttribute(
            "data-theme",
            "light"
        );

    }

    else {

        document.body.classList.remove(
            "light-theme"
        );

        document.documentElement.setAttribute(
            "data-theme",
            "dark"
        );

    }


    if (themeButton) {

        themeButton.textContent =
            currentTheme === "dark"
                ? "☀️"
                : "🌙";


        themeButton.title =
            currentTheme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode";

    }

}


/* =========================================================
   THEME TOGGLE
   ========================================================= */

function toggleTheme() {

    currentTheme =
        currentTheme === "dark"
            ? "light"
            : "dark";


    localStorage.setItem(
        "mosayadTheme",
        currentTheme
    );


    applyTheme();


    playClickSound();

}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function toggleMobileMenu() {

    if (!mobileMenu) {
        return;
    }


    mobileMenu.classList.toggle(
        "open"
    );


    const opened =
        mobileMenu.classList.contains(
            "open"
        );


    if (menuButton) {

        menuButton.textContent =
            opened
                ? "✕"
                : "☰";

    }


    playClickSound();

}


/* =========================================================
   CLOSE MOBILE MENU
   ========================================================= */

function closeMobileMenu() {

    mobileMenu?.classList.remove(
        "open"
    );


    if (menuButton) {

        menuButton.textContent =
            "☰";

    }

}


/* =========================================================
   MOBILE NAVIGATION
   ========================================================= */

function setupMobileNavigation() {

    if (!mobileMenu) {
        return;
    }


    const links =
        mobileMenu.querySelectorAll(
            "a"
        );


    links.forEach(link => {

        link.addEventListener(
            "click",
            () => {

                closeMobileMenu();

            }
        );

    });

}


/* =========================================================
   BACK TO TOP
   ========================================================= */

function handleScroll() {

    if (!topButton) {
        return;
    }


    topButton.classList.toggle(
        "visible",
        window.scrollY > 450
    );

}


/* =========================================================
   SCROLL TO TOP
   ========================================================= */

function scrollToTop() {

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });


    playClickSound();

}


/* =========================================================
   NAVIGATION ACTIVE STATE
   ========================================================= */

function setupNavigation() {

    const links =
        document.querySelectorAll(
            ".main-nav .nav-link"
        );


    links.forEach(link => {

        link.addEventListener(
            "click",
            () => {

                links.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );


                link.classList.add(
                    "active"
                );

            }
        );

    });

}


/* =========================================================
   GLOBAL BUTTON SOUNDS
   ========================================================= */

function setupButtonSounds() {

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "button"
                );


            if (!button) {
                return;
            }


            if (
                button === soundButton ||
                button === themeButton
            ) {

                return;

            }


            playClickSound();

        }
    );

}


/* =========================================================
   LOADER
   ========================================================= */

function hideLoader() {

    if (!loader) {
        return;
    }


    loader.classList.add(
        "hidden"
    );


    setTimeout(
        () => {

            loader.remove();

        },
        500
    );

}


/* =========================================================
   INITIALIZE
   ========================================================= */

async function init() {

    /* -----------------------------------------
       LOGIN
       ----------------------------------------- */

    if (!checkLogin()) {

        return;

    }


    /* -----------------------------------------
       THEME
       ----------------------------------------- */

    applyTheme();


    /* -----------------------------------------
       SOUND
       ----------------------------------------- */

    updateSoundButton();


    /* -----------------------------------------
       EVENT LISTENERS
       ----------------------------------------- */

    searchInput?.addEventListener(
        "input",
        handleSearch
    );


    clearSearchButton?.addEventListener(
        "click",
        clearSearch
    );


    resetSearchButton?.addEventListener(
        "click",
        resetSearch
    );


    soundButton?.addEventListener(
        "click",
        toggleSound
    );


    themeButton?.addEventListener(
        "click",
        toggleTheme
    );


    menuButton?.addEventListener(
        "click",
        toggleMobileMenu
    );


    topButton?.addEventListener(
        "click",
        scrollToTop
    );


    window.addEventListener(
        "scroll",
        handleScroll,
        {
            passive: true
        }
    );


    setupFilters();

    setupMobileNavigation();

    setupNavigation();

    setupButtonSounds();


    /* -----------------------------------------
       LOAD FIREBASE DATA
       ----------------------------------------- */

    await Promise.allSettled([

        loadCurrentUser(),

        loadUsersCount(),

        loadApps()

    ]);


    /* -----------------------------------------
       INITIAL UI
       ----------------------------------------- */

    handleScroll();

    updateClearSearchButton();


    /* -----------------------------------------
       LOADER
       ----------------------------------------- */

    hideLoader();

}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    init
);