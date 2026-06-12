import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#10b981",
          borderRadius: 8,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2c-2 6.5-5 8.5-5 11.5a5 5 0 1 0 10 0c0-3-3-5-5-11.5z" />
        </svg>
      </div>
    ),
    size
  );
}
