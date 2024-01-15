// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMfSXhe-as2z74luxVGN2Na6IimkGfqUA",
  authDomain: "votingapp-new.firebaseapp.com",
  projectId: "votingapp-new",
  storageBucket: "votingapp-new.appspot.com",
  messagingSenderId: "547122356438",
  appId: "1:547122356438:web:7aa23ebff75a57375fe977"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;