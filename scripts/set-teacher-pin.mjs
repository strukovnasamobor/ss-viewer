#!/usr/bin/env node
/**
 * Sets the 4-digit PIN that unlocks teacher view on raspored.strukovnasamobor.hr
 * (and in the Android/iOS apps). Changing the PIN revokes every saved key, so
 * all teachers drop back to student view and have to enter the new PIN.
 *
 *   npm run teacher:pin -- 1234
 *   npm run teacher:pin            (asks for the PIN)
 *
 * Firestore layout read by src/utils/TeacherAccess.jsx:
 *   teacherAccess/<sha256 of PIN>  = { key }
 *   teacherKeys/<key>              = { createdAt }
 *
 * Credentials, checked in this order:
 *   1. FIREBASE_SERVICE_ACCOUNT        - the service account JSON itself (as on the notifications server)
 *   2. GOOGLE_APPLICATION_CREDENTIALS  - path to the service account JSON file
 *      Firebase console > Project settings > Service accounts > Generate new private key
 *
 * Firestore rules (Firebase console) must let the app read single documents only:
 *   match /teacherAccess/{id} { allow get: if true; allow list, write: if false; }
 *   match /teacherKeys/{id}   { allow get: if true; allow list, write: if false; }
 */
import { createHash, randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";
import admin from "firebase-admin";

const PROJECT_ID = "ss-viewer-notifs";
const ACCESS_COLLECTION = "teacherAccess";
const KEYS_COLLECTION = "teacherKeys";

const fail = (msg) => {
  console.error(`\nset-teacher-pin: ${msg}\n`);
  process.exit(1);
};

let pin = process.argv[2];
if (!pin) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  pin = await rl.question("New teacher PIN (4 digits): ");
  rl.close();
}
pin = pin.trim();
if (!/^\d{4}$/.test(pin)) fail("the PIN must be exactly 4 digits.");

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccount && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  fail("set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS (see the comment at the top of this script).");
}
admin.initializeApp({
  credential: serviceAccount ? admin.credential.cert(JSON.parse(serviceAccount)) : admin.credential.applicationDefault(),
  projectId: PROJECT_ID,
});
const db = admin.firestore();

const key = randomBytes(32).toString("hex");
const pinHash = createHash("sha256").update(pin).digest("hex");

// Deleting the old documents is what revokes the old PIN and every key saved by the apps
const batch = db.batch();
let revoked = 0;
for (const collection of [ACCESS_COLLECTION, KEYS_COLLECTION]) {
  const snapshot = await db.collection(collection).get();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  if (collection === KEYS_COLLECTION) revoked = snapshot.size;
}
batch.set(db.collection(ACCESS_COLLECTION).doc(pinHash), { key });
batch.set(db.collection(KEYS_COLLECTION).doc(key), { createdAt: admin.firestore.FieldValue.serverTimestamp() });
await batch.commit();

console.log(`set-teacher-pin: new PIN saved in "${PROJECT_ID}", ${revoked} old key(s) revoked.`);
