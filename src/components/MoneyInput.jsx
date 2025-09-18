import React from "react";
import { formatKRWComma, onlyDigitsToNumber } from "../libs/format.js";

/**
 * 숫자(만원) 내부값은 number, 화면은 콤마 문자열.
 * props:
 * - value (number|null) - 만원 단위
 * - onChange(number|null)
 * - id, placeholder
 * - rightUnit (예: "만원")
 */
export default function MoneyInput({
  value,
  onChange,
  id,
  placeholder,
  rightUnit,
}) {
  const [display, setDisplay] = React.useState(
    value == null ? "" : value ? value.toLocaleString("ko-KR") : ""
  );

  React.useEffect(() => {
    if (value == null) {
      setDisplay("");
    } else {
      // 값이 설정될 때는 숫자만 표시 (입력 편의성)
      setDisplay(value ? value.toLocaleString("ko-KR") : "");
    }
  }, [value]);

  function handleChange(e) {
    const v = e.target.value;
    // 입력 그대로 보여주되, 숫자만 추출해 내부 숫자 갱신
    const num = onlyDigitsToNumber(v);
    // 입력 중에는 숫자만 표시 (사용자가 편하게 입력할 수 있도록)
    setDisplay(num ? num.toLocaleString("ko-KR") : "");
    onChange(num);
  }

  return (
    <div
      className="money-input"
      style={{ display: "flex", alignItems: "center", gap: 8 }}
    >
      <input
        id={id}
        inputMode="numeric"
        pattern="[0-9]*"
        value={display}
        onChange={handleChange}
        placeholder={placeholder || "금액"}
        aria-describedby={rightUnit ? `${id}-unit` : undefined}
        style={{
          flex: 1,
          border: "none",
          borderBottom: "2px solid #0f172a",
          padding: "12px 4px",
          fontSize: "18px",
          outline: "none",
          background: "transparent",
        }}
      />
      {rightUnit && (
        <span id={`${id}-unit`} style={{ color: "#0f172a", fontWeight: 700 }}>
          {rightUnit}
        </span>
      )}
    </div>
  );
}
