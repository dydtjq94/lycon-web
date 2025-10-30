#!/usr/bin/env node

/**
 * 버전/날짜 업데이트 스크립트
 * 사용법:
 *  - node update-version.cjs patch|minor|major  → 버전 올리고 today=오늘 갱신
 *  - node update-version.cjs touch              → 버전은 유지하고 today=오늘만 갱신
 */

const fs = require("fs");
const path = require("path");

// 버전 파일 경로
const versionFile = path.join(__dirname, "version.json");
const rulesFile = path.join(__dirname, ".cursor/rules/my-rule.mdc");

// 현재 버전 읽기
const versionData = JSON.parse(fs.readFileSync(versionFile, "utf8"));
const versionParts = versionData.version.split(".");
const currentVersion = [
  parseInt(versionParts[0]) || 0,
  parseInt(versionParts[1]) || 0,
  parseInt(versionParts[2]) || 0,
];

// 업데이트 타입
const updateType = process.argv[2] || "patch";
let newVersion;

if (updateType === "touch") {
  newVersion = currentVersion; // 버전 유지
} else {
  switch (updateType) {
    case "major":
      newVersion = [currentVersion[0] + 1, 0, 0];
      break;
    case "minor":
      newVersion = [currentVersion[0], currentVersion[1] + 1, 0];
      break;
    case "patch":
    default:
      newVersion = [
        currentVersion[0],
        currentVersion[1],
        currentVersion[2] + 1,
      ];
      break;
  }
}

const newVersionString = newVersion.join(".");

// version.json 업데이트 (스키마: today 사용)
const todayStr = new Date().toISOString().split("T")[0];
const updatedVersionData = {
  ...versionData,
  version: newVersionString,
  // 스키마 호환: today 우선, lastUpdated는 제거
  today: todayStr,
};
delete updatedVersionData.lastUpdated;

fs.writeFileSync(versionFile, JSON.stringify(updatedVersionData, null, 2));

// .cursor/rules/my-rule.mdc 업데이트
try {
  const rulesContent = fs.readFileSync(rulesFile, "utf8");
  const updatedRulesContent = rulesContent.replace(
    /현재 버전 : \d+\.\d+(\.\d+)?/,
    `현재 버전 : ${newVersionString}`
  );
  fs.writeFileSync(rulesFile, updatedRulesContent);
} catch (e) {
  // 선택 파일이 없을 수 있음 → 무시
}

if (updateType === "touch") {
  console.log(`📅 today만 갱신: ${todayStr}`);
  console.log(`ℹ️ 현재 버전 유지: ${newVersionString}`);
} else {
  console.log(
    `✅ 버전이 ${versionData.version}에서 ${newVersionString}으로 업데이트되었습니다.`
  );
  console.log(`📝 업데이트 타입: ${updateType}`);
  console.log(`📅 오늘 날짜(today): ${todayStr}`);
}
