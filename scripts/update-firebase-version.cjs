#!/usr/bin/env node
/**
 * Firebase 버전 업데이트 스크립트
 * 사용법: node scripts/update-firebase-version.cjs
 *
 * version.json의 현재 버전을 Firebase에 동기화합니다.
 */

const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");
const path = require("path");

// .env 파일 로드
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const versionData = require("../version.json");

// Firebase 설정 (환경변수에서 가져오기)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

async function updateVersion() {
  try {
    // Firebase 초기화
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const version = versionData.version;

    // Firebase에 버전 업데이트
    const docRef = doc(db, "settings", "appVersion");
    await setDoc(docRef, {
      version: version,
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Firebase 버전이 ${version}으로 업데이트되었습니다.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ 버전 업데이트 실패:", error.message);
    process.exit(1);
  }
}

updateVersion();
