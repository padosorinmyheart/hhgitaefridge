// 저장소 연결: Firebase(가족 공유) 또는 체험 모드(이 기기에만 저장)
import { firebaseConfig, FAMILY } from "./firebase-config.js";

const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
export const demo = !firebaseConfig.apiKey;
const BASE = ["families", "home"];

let fs = null, au = null, auth = null, db = null;

/* ---------- 체험 모드 저장소 ---------- */
const LKEY = "fridge-demo-v5";
let local = {};
const lsubs = new Set();
function loadLocal() {
  try { local = JSON.parse(localStorage.getItem(LKEY) || "{}"); } catch (e) { local = {}; }
}
function saveLocal() {
  try { localStorage.setItem(LKEY, JSON.stringify(local)); } catch (e) {}
  lsubs.forEach(f => f());
}
const coll = n => (local[n] = local[n] || {});

/* ---------- 시작 / 로그인 ---------- */
export async function init(onUser) {
  if (demo) {
    loadLocal();
    await new Promise(r => setTimeout(r));
    onUser({ demo: true, email: "", name: localStorage.getItem("fridge-me") || "해리" });
    return;
  }
  const appMod = await import(FB + "firebase-app.js");
  au = await import(FB + "firebase-auth.js");
  fs = await import(FB + "firebase-firestore.js");
  const app = appMod.initializeApp(firebaseConfig);
  auth = au.getAuth(app);
  try {
    db = fs.initializeFirestore(app, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) });
  } catch (e) { db = fs.getFirestore(app); }
  au.getRedirectResult(auth).catch(() => {});
  au.onAuthStateChanged(auth, u => {
    if (!u) return onUser(null);
    const email = (u.email || "").toLowerCase();
    const map = Object.fromEntries(Object.entries(FAMILY).map(([k, v]) => [k.toLowerCase(), v]));
    onUser({ demo: false, email, name: map[email] || u.displayName || "가족", photo: u.photoURL });
  });
}
export async function signIn() {
  const p = new au.GoogleAuthProvider();
  p.setCustomParameters({ prompt: "select_account" });
  try { await au.signInWithPopup(auth, p); }
  catch (e) {
    if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment", "auth/cancelled-popup-request"].includes(e.code))
      await au.signInWithRedirect(auth, p);
    else if (e.code !== "auth/popup-closed-by-user") throw e;
  }
}
export function signOut() { return demo ? Promise.resolve() : au.signOut(auth); }

/* ---------- 읽기 (실시간) ---------- */
export function watch(name, cb, onErr) {
  if (demo) {
    const f = () => cb(Object.entries(coll(name)).map(([id, d]) => ({ id, ...d })));
    lsubs.add(f); setTimeout(f); return () => lsubs.delete(f);
  }
  return fs.onSnapshot(fs.collection(db, ...BASE, name),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), onErr);
}

/* ---------- 쓰기 ---------- */
// Firestore는 값이 비어 있는(undefined) 칸이 있으면 저장을 거부해서, 미리 걸러 내요
const clean = d => JSON.parse(JSON.stringify(d));
export async function put(name, id, data) {
  if (demo) { coll(name)[id] = JSON.parse(JSON.stringify(data)); return saveLocal(); }
  return fs.setDoc(fs.doc(db, ...BASE, name, id), clean(data));
}
export async function patch(name, id, data) {
  if (demo) { coll(name)[id] = { ...(coll(name)[id] || {}), ...data }; return saveLocal(); }
  return fs.updateDoc(fs.doc(db, ...BASE, name, id), clean(data));
}
export async function remove(name, id) {
  if (demo) { delete coll(name)[id]; return saveLocal(); }
  return fs.deleteDoc(fs.doc(db, ...BASE, name, id));
}
export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
