// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBXWkcVF1bBpD9l3l3_5BHjQnxwgI7hfg0",
  authDomain: "to-do-app-d3d93.firebaseapp.com",
  projectId: "to-do-app-d3d93",
  storageBucket: "to-do-app-d3d93.firebasestorage.app",
  messagingSenderId: "1036713930739",
  appId: "1:1036713930739:web:fb3daa13faee0f6bd0ec86",
  measurementId: "G-P4FJTLTKNE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app); 
export const auth = getAuth(app);