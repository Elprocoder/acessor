import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyC1y5Ap4weyqFXgwBjCfRuI21016eiwK8k",
  authDomain: "acessor-5f712.firebaseapp.com",
  projectId: "acessor-5f712",
  storageBucket: "acessor-5f712.appspot.com",
  messagingSenderId: "860544279142",
  appId: "1:860544279142:web:c4b831d9a6b825730203a7",
  measurementId: "G-1RF437PFSQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
