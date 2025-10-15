import React from "react";
import versionData from "../../version.json";

/**
 * 버전 표시 컴포넌트 (개발자용)
 */
function VersionDisplay() {
  return (
    <div style={{
      position: "fixed",
      bottom: "10px",
      right: "10px",
      background: "rgba(0, 0, 0, 0.7)",
      color: "white",
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontFamily: "monospace",
      zIndex: 9999,
      opacity: 0.6
    }}>
      v{versionData.version}
    </div>
  );
}

export default VersionDisplay;
