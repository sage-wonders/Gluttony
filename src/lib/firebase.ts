import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAzi1CCbju3VzR6SwrJ_CwgRHf1ajMh5Do",
  authDomain: "new-family-tree.firebaseapp.com",
  projectId: "new-family-tree",
  storageBucket: "new-family-tree.firebasestorage.app",
  messagingSenderId: "873940353286",
  appId: "1:873940353286:web:33d4e4f8ecc7f2f7e0de87",
  measurementId: "G-7E6YZX4JCT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth };
