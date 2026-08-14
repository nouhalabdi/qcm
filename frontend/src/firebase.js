// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD2dIgztgjBSlM4VCdfw1WrqIOPMO9wOvc",
  authDomain: "reussite-qcms.firebaseapp.com",
  projectId: "reussite-qcms",
  storageBucket: "reussite-qcms.firebasestorage.app",
  messagingSenderId: "234190265739",
  appId: "1:234190265739:web:c476484a4326d96df5638e",
  measurementId: "G-S6B6GYZX2Z"
};

// تهيئة التطبيق
const app = initializeApp(firebaseConfig);

// تهيئة خدمة المصادقة (Auth)
export const auth = getAuth(app);

// ✅ إجبار Firebase على استخدام localStorage بدلاً من IndexedDB لإزالة الخطأ
setPersistence(auth, browserLocalPersistence);

// تهيئة مزود خدمة Google
export const googleProvider = new GoogleAuthProvider();

// دالة لتسجيل الدخول باستخدام Google (تظهر نافذة منبثقة)
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // الحصول على بيانات المستخدم من Google
    const user = result.user;
    return {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL
    };
  } catch (error) {
    console.error("Erreur lors de la connexion Google:", error);
    throw error;
  }
};