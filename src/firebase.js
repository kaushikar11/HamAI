import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || '',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || ''
};

// Validate required Firebase config - FAIL HARD if missing
const missingVars = [];
if (!firebaseConfig.apiKey) missingVars.push('REACT_APP_FIREBASE_API_KEY');
if (!firebaseConfig.authDomain) missingVars.push('REACT_APP_FIREBASE_AUTH_DOMAIN');
if (!firebaseConfig.projectId) missingVars.push('REACT_APP_FIREBASE_PROJECT_ID');
if (!firebaseConfig.storageBucket) missingVars.push('REACT_APP_FIREBASE_STORAGE_BUCKET');
if (!firebaseConfig.messagingSenderId) missingVars.push('REACT_APP_FIREBASE_MESSAGING_SENDER_ID');
if (!firebaseConfig.appId) missingVars.push('REACT_APP_FIREBASE_APP_ID');

if (missingVars.length > 0) {
  const errorMsg = `❌ CRITICAL: Firebase configuration is missing from root .env file!\n` +
    `Missing variables:\n${missingVars.map(v => `  - ${v}`).join('\n')}\n\n` +
    `The frontend requires these variables to be defined in the ROOT .env file.\n` +
    `Run 'npm run sync-env' to sync variables from root .env to frontend/.env.`;
  console.error(errorMsg);
  throw new Error(`Firebase configuration missing: ${missingVars.join(', ')}`);
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Set persistent login - keeps user logged in across browser sessions
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});

export default app;
