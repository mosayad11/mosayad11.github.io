/* =========================================================
   MOSAYAD APPS
   PROFILE SYSTEM
   ========================================================= */


/* =========================================================
   FIREBASE IMPORTS
   ========================================================= */


import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

const userId =
    localStorage.getItem("userId");


const savedUserName =
    localStorage.getItem("userName");


const AVATAR_COLOR_KEY =
    "mosayadProfileAvatarColor";


/* =========================================================
   ELEMENTS
   ========================================================= */

const avatar =
    document.getElementById("avatar");


const avatarColor =
    document.getElementById("avatar-color");


const colorButton =
    document.getElementById("color-button");


const nameInput =
    document.getElementById("name-input");


const joinedValue =
    document.getElementById("joined-value");


const userIdValue =
    document.getElementById("user-id-value");


const saveButton =
    document.getElementById("save-button");


const profileStatus =
    document.getElementById("profile-status");


const feedbackInput =
    document.getElementById("feedback-input");


const characterCount =
    document.getElementById("character-count");


const sendButton =
    document.getElementById("send-button");


const feedbackSuccess =
    document.getElementById("feedback-success");


const feedbackStatus =
    document.getElementById("feedback-status");


const backButton =
    document.getElementById("back-button");


/* =========================================================
   CHECK USER
   ========================================================= */

if (!userId) {

    alert(
        "You must login first."
    );

    window.location.href =
        "login.html";

}


/* =========================================================
   AVATAR COLOR
   ========================================================= */

function getAvatarColor() {

    return (
        localStorage.getItem(
            AVATAR_COLOR_KEY
        ) ||
        "#1677ff"
    );

}


function setAvatarColor(color) {

    localStorage.setItem(
        AVATAR_COLOR_KEY,
        color
    );

}


function updateAvatar() {

    const name =
        nameInput.value.trim();


    const firstLetter =
        name.length > 0
            ? name.charAt(0).toUpperCase()
            : "M";


    avatar.textContent =
        firstLetter;


    const color =
        getAvatarColor();


    avatar.style.background =
        color;


    avatar.style.boxShadow =
        `
        0 0 0 8px ${hexToRgba(color, 0.10)},
        0 15px 50px ${hexToRgba(color, 0.25)}
        `;

}


/* =========================================================
   HEX TO RGBA
   ========================================================= */

function hexToRgba(
    hex,
    alpha
) {

    let cleanHex =
        hex.replace("#", "");


    if (cleanHex.length === 3) {

        cleanHex =
            cleanHex
                .split("")
                .map(
                    char =>
                        char + char
                )
                .join("");

    }


    const number =
        parseInt(
            cleanHex,
            16
        );


    const r =
        (number >> 16) & 255;


    const g =
        (number >> 8) & 255;


    const b =
        number & 255;


    return `
        rgba(
            ${r},
            ${g},
            ${b},
            ${alpha}
        )
    `;

}


/* =========================================================
   COLOR PICKER
   ========================================================= */

colorButton.addEventListener(
    "click",
    () => {

        avatarColor.click();

    }
);


avatarColor.addEventListener(
    "input",
    () => {

        const color =
            avatarColor.value;


        setAvatarColor(color);

        updateAvatar();

    }
);


/* =========================================================
   LOAD USER
   ========================================================= */

async function loadUser() {

    try {

        profileStatus.textContent =
            "";


        nameInput.disabled =
            true;


        saveButton.disabled =
            true;


        const userRef =
            doc(
                db,
                "users",
                userId
            );


        const userSnapshot =
            await getDoc(
                userRef
            );


        if (!userSnapshot.exists()) {

            throw new Error(
                "User account was not found."
            );

        }


        const userData =
            userSnapshot.data();


        /* -----------------------------------------
           NAME
           ----------------------------------------- */

        const name =
            userData.name ||
            savedUserName ||
            "User";


        nameInput.value =
            name;


        localStorage.setItem(
            "userName",
            name
        );


        /* -----------------------------------------
           JOINED
           ----------------------------------------- */

        joinedValue.textContent =
            formatJoinedDate(
                userData.joined
            );


        /* -----------------------------------------
           USER ID
           ----------------------------------------- */

        userIdValue.textContent =
            userId;


        /* -----------------------------------------
           AVATAR
           ----------------------------------------- */

        const savedColor =
            getAvatarColor();


        avatarColor.value =
            savedColor;


        updateAvatar();


        nameInput.disabled =
            false;


        saveButton.disabled =
            false;


    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );


        profileStatus.textContent =
            error.message ||
            "Could not load your profile.";


        profileStatus.className =
            "status-message status-error";

    }

}


/* =========================================================
   FORMAT JOINED DATE
   ========================================================= */

function formatJoinedDate(
    joined
) {

    if (!joined) {

        return "Unknown";

    }


    try {

        let date;


        /*
         * Firestore Timestamp
         */

        if (
            joined &&
            typeof joined.toDate ===
            "function"
        ) {

            date =
                joined.toDate();

        }


        /*
         * JavaScript Date
         */

        else if (
            joined instanceof Date
        ) {

            date =
                joined;

        }


        /*
         * Number
         */

        else if (
            typeof joined ===
            "number"
        ) {

            date =
                new Date(joined);

        }


        /*
         * String
         */

        else {

            date =
                new Date(joined);

        }


        if (
            !date ||
            Number.isNaN(
                date.getTime()
            )
        ) {

            return String(
                joined
            );

        }


        return date.toLocaleDateString(
            "en-US",
            {
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );

    } catch {

        return String(
            joined
        );

    }

}


/* =========================================================
   SAVE NAME
   ========================================================= */

saveButton.addEventListener(
    "click",
    async () => {

        const newName =
            nameInput.value.trim();


        if (!newName) {

            showProfileStatus(
                "Please enter a name.",
                false
            );

            return;

        }


        if (
            newName.length <
            2
        ) {

            showProfileStatus(
                "Name must contain at least 2 characters.",
                false
            );

            return;

        }


        try {

            saveButton.disabled =
                true;


            saveButton.textContent =
                "Saving...";


            const userRef =
                doc(
                    db,
                    "users",
                    userId
                );


            await updateDoc(
                userRef,
                {
                    name: newName
                }
            );


            localStorage.setItem(
                "userName",
                newName
            );


            updateAvatar();


            showProfileStatus(
                "Profile updated successfully.",
                true
            );


        } catch (error) {

            console.error(
                "Profile update error:",
                error
            );


            showProfileStatus(
                "Could not save your changes.",
                false
            );

        } finally {

            saveButton.disabled =
                false;


            saveButton.textContent =
                "Save Changes";

        }

    }
);


/* =========================================================
   PROFILE STATUS
   ========================================================= */

function showProfileStatus(
    message,
    success
) {

    profileStatus.textContent =
        message;


    profileStatus.className =
        success
            ? "status-message status-success"
            : "status-message status-error";


    setTimeout(
        () => {

            profileStatus.textContent =
                "";

        },
        3500
    );

}


/* =========================================================
   NAME LIVE AVATAR
   ========================================================= */

nameInput.addEventListener(
    "input",
    () => {

        updateAvatar();

    }
);


/* =========================================================
   FEEDBACK CHARACTER COUNT
   ========================================================= */

feedbackInput.addEventListener(
    "input",
    () => {

        const length =
            feedbackInput.value.length;


        characterCount.textContent =
            `${length} / 1000`;

    }
);


/* =========================================================
   FIND NEXT MESSAGE NUMBER
   ========================================================= */

function getNextMessageNumber(
    userData
) {

    let maxNumber =
        0;


    Object.keys(userData)
        .forEach(
            key => {

                const match =
                    key.match(
                        /^massage(\d+)$/
                    );


                if (!match) {

                    return;

                }


                const number =
                    Number(
                        match[1]
                    );


                if (
                    number >
                    maxNumber
                ) {

                    maxNumber =
                        number;

                }

            }
        );


    return maxNumber + 1;

}


/* =========================================================
   SEND FEEDBACK
   ========================================================= */

sendButton.addEventListener(
    "click",
    async () => {

        const message =
            feedbackInput.value.trim();


        if (!message) {

            showFeedbackStatus(
                "Please write your feedback first.",
                false
            );

            return;

        }


        if (
            message.length <
            2
        ) {

            showFeedbackStatus(
                "Your message is too short.",
                false
            );

            return;

        }


        try {

            sendButton.disabled =
                true;


            sendButton.textContent =
                "Sending...";


            const userRef =
                doc(
                    db,
                    "users",
                    userId
                );


            const userSnapshot =
                await getDoc(
                    userRef
                );


            if (
                !userSnapshot.exists()
            ) {

                throw new Error(
                    "User account was not found."
                );

            }


            const userData =
                userSnapshot.data();


            const nextNumber =
                getNextMessageNumber(
                    userData
                );


            const fieldName =
                `massage${nextNumber}`;


            /*
             * Save the message directly
             * inside the user's document.
             */

            await updateDoc(
                userRef,
                {
                    [fieldName]:
                        message
                }
            );


            /*
             * Clear input
             */

            feedbackInput.value =
                "";


            characterCount.textContent =
                "0 / 1000";


            /*
             * Show success message
             */

            feedbackSuccess.classList.add(
                "show"
            );


            showFeedbackStatus(
                "",
                true
            );


            /*
             * Hide success message after a while.
             */

            setTimeout(
                () => {

                    feedbackSuccess.classList.remove(
                        "show"
                    );

                },
                6000
            );


        } catch (error) {

            console.error(
                "Feedback error:",
                error
            );


            showFeedbackStatus(
                "Could not send your feedback. Please try again.",
                false
            );

        } finally {

            sendButton.disabled =
                false;


            sendButton.textContent =
                "Send";

        }

    }
);


/* =========================================================
   FEEDBACK STATUS
   ========================================================= */

function showFeedbackStatus(
    message,
    success
) {

    feedbackStatus.textContent =
        message;


    feedbackStatus.className =
        success
            ? "feedback-status status-success"
            : "feedback-status status-error";

}


/* =========================================================
   BACK BUTTON
   ========================================================= */

backButton.addEventListener(
    "click",
    () => {

        if (
            window.history.length >
            1
        ) {

            window.history.back();

        } else {

            window.location.href =
                "index.html";

        }

    }
);


/* =========================================================
   START
   ========================================================= */

loadUser();
