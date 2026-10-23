import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from '../../firebase';
import { isRasHost, getTeacherKey, TEACHER_KEY_STORAGE } from './TeacherHost';

// Firestore: teacherAccess/<sha256 of PIN> = { key }, teacherKeys/<key> exists while the key is valid.
// Both are written by scripts/set-teacher-pin.mjs; changing the PIN deletes the old keys
const ACCESS_COLLECTION = "teacherAccess";
const KEYS_COLLECTION = "teacherKeys";

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Reload to "/" so the app starts again in the other view with its default route
function reloadApp() {
  window.location.replace("/");
}

// Returns false for a wrong PIN, reloads into teacher view for a correct one.
// Always asks the server, never the offline cache. Throws if Firestore can't be reached
export async function unlockTeacherView(pin) {
  if (!/^\d{4}$/.test(pin)) return false;

  const snapshot = await getDocFromServer(doc(db, ACCESS_COLLECTION, await sha256Hex(pin)));
  const key = snapshot.exists() ? snapshot.data().key : null;
  if (!key) return false;

  try {
    localStorage.setItem(TEACHER_KEY_STORAGE, key);
  } catch {
    return false;
  }
  reloadApp();
  return true;
}

export function lockTeacherView() {
  try {
    localStorage.removeItem(TEACHER_KEY_STORAGE);
  } catch {
    // Storage unavailable, so no key was saved either
  }
  reloadApp();
}

// Drops back to student view if the server says the saved key was revoked. Offline the view stays
export async function validateTeacherKey() {
  const key = getTeacherKey();
  if (isRasHost || !key) return;

  try {
    const snapshot = await getDocFromServer(doc(db, KEYS_COLLECTION, key));
    if (!snapshot.exists()) {
      console.log("TeacherAccess > Saved teacher key is no longer valid.");
      lockTeacherView();
    }
  } catch (error) {
    console.log("TeacherAccess > Could not check the teacher key:", error);
  }
}
