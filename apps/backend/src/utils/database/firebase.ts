// Initialize Firebase:
import admin from "firebase-admin";

// Get Service Account Data:
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
// Get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Read JSON
const serviceAccountPath = path.join(__dirname, '../../../private/serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

// Init App
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
let db = admin.firestore();

console.warn('[📂] Loading "V2-Structuring" Database...')
let devDb = db.collection('V2-Structuring').doc('DATABASE')

// Export Utils:
export { admin, auth, devDb as db }


