// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
    getFirestore,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAKQ9PPvoBngzDGdRj-lT_RKkiwPreUuNI",
    authDomain: "mosayad-games.firebaseapp.com",
    projectId: "mosayad-games",
    storageBucket: "mosayad-games.firebasestorage.app",
    messagingSenderId: "152931164146",
    appId: "1:152931164146:web:1f879cd59171bd2e34556b"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);