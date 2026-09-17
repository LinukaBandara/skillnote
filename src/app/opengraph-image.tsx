import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Skill Note — Smart learning for Sri Lankan A/L students";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "#ffffff",
        color: "#111111",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 28, fontWeight: 600, marginBottom: 24 }}>
        SKILL NOTE
      </div>
      <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.05, maxWidth: 1000 }}>
        Smart learning for Sri Lankan A/L students
      </div>
      <div style={{ display: "flex", fontSize: 30, marginTop: 28, color: "#555555" }}>
        Learn · Practice · Improve
      </div>
    </div>
  );
}
