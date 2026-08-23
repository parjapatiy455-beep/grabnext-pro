import firebase from "firebase/compat/app"
import "firebase/compat/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Validate config
const isConfigValid = Object.values(firebaseConfig).every(value => value !== undefined && value !== "")

let app: any;
let auth: any;
let db: any;
let storage: any;

if (typeof window !== "undefined") {
  if (isConfigValid) {
    app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app()
    auth = firebase.auth()
    // Use modular Firestore and Storage with the compat app
    db = getFirestore(app as any)
    storage = getStorage(app as any)
  } else {
    console.warn("Firebase configuration is missing or incomplete. Authentication and DB features will not work.")
  }
}

export { app, auth, db, storage }