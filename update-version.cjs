#!/usr/bin/env node

/**
 * 버전 업데이트 스크립트
 * 사용법: node update-version.js [patch|minor|major]
 */

const fs = require("fs");
const path = require("path");

// 버전 파일 경로
const versionFile = path.join(__dirname, "version.json");
const rulesFile = path.join(__dirname, ".cursor/rules/my-rule.mdc");

// 현재 버전 읽기
const versionData = JSON.parse(fs.readFileSync(versionFile, "utf8"));
const currentVersion = versionData.version.split(".").map(Number);

// 버전 업데이트
const updateType = process.argv[2] || "patch";
let newVersion;

switch (updateType) {
  case "major":
    newVersion = [currentVersion[0] + 1, 0, 0];
    break;
  case "minor":
    newVersion = [currentVersion[0], currentVersion[1] + 1, 0];
    break;
  case "patch":
  default:
    newVersion = [currentVersion[0], currentVersion[1], currentVersion[2] + 1];
    break;
}

const newVersionString = newVersion.join(".");

// version.json 업데이트
const updatedVersionData = {
  ...versionData,
  version: newVersionString,
  lastUpdated: new Date().toISOString().split("T")[0],
};

fs.writeFileSync(versionFile, JSON.stringify(updatedVersionData, null, 2));

// .cursor/rules/my-rule.mdc 업데이트
const rulesContent = fs.readFileSync(rulesFile, "utf8");
const updatedRulesContent = rulesContent.replace(
  /현재 버전 : \d+\.\d+/,
  `현재 버전 : ${newVersionString}`
);
fs.writeFileSync(rulesFile, updatedRulesContent);

console.log(
  `✅ 버전이 ${versionData.version}에서 ${newVersionString}으로 업데이트되었습니다.`
);
console.log(`📝 업데이트 타입: ${updateType}`);
console.log(`📅 업데이트 날짜: ${updatedVersionData.lastUpdated}`);
