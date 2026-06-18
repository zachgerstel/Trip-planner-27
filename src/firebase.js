import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBFUq7l5LAMeEyGbri1MBMciOcENvQnoNw",
  authDomain: "bachlor-party-2027.firebaseapp.com",
  databaseURL: "https://bachlor-party-2027-default-rtdb.firebaseio.com",
  projectId: "bachlor-party-2027",
  storageBucket: "bachlor-party-2027.firebasestorage.app",
  messagingSenderId: "548933506907",
  appId: "1:548933506907:web:222d1bc01b7cebdb37ac7e"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
