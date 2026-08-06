import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyDG2h2OKxn0b7Irom9cTo12iAR3dSjSD88",
  authDomain: "smoothshift-a734f.firebaseapp.com",
  databaseURL: "https://smoothshift-a734f-default-rtdb.firebaseio.com",
  projectId: "smoothshift-a734f",
  storageBucket: "smoothshift-a734f.firebasestorage.app",
  messagingSenderId: "1029565299118",
  appId: "1:1029565299118:web:a1c9c085ffac270764703f",
  measurementId: "G-EDJMBX2TRC"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getDatabase(app)
export const firestore = getFirestore(app)
export const storage = getStorage(app)
export default app
