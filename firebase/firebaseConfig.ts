import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCXq03BeuvdClsX7Zv6mpUXl3pv8qbYpUc",

  authDomain: "jobconnect-fec5c.firebaseapp.com",

  projectId: "jobconnect-fec5c",

  storageBucket: "jobconnect-fec5c.firebasestorage.app",

  messagingSenderId: "630814932836",

  appId: "1:630814932836:web:e9811c0422a3c084ad8471",

  measurementId: "G-DRBL51EQFW"
};

const app = initializeApp(firebaseConfig);



export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);