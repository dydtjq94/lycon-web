import React from "react";

export default function Logo({ size = "16px" }) {
  return (
    <div
      style={{
        fontWeight: 800,
        fontSize: size,
        letterSpacing: ".5px",
      }}
    >
      <span style={{ color: "#111" }}>Ly</span>
      <span style={{ color: "#0e8bff" }}>con</span>
    </div>
  );
}
