// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyDmSt4MTlri2WQqPc44mB2fBqnu98INCKs",
    authDomain: "pro-door.firebaseapp.com",
    databaseURL: "https://pro-door-default-rtdb.firebaseio.com",
    projectId: "pro-door",
    storageBucket: "pro-door.firebasestorage.app",
    messagingSenderId: "989692003775",
    appId: "1:989692003775:web:c3eabd499ed03733040d0a",
    measurementId: "G-E04XD42747"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, googleProvider, analytics, db, storage };
