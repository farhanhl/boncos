import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "Boncos — Catat Pengeluaran Otomatis via Scan Struk & E-Wallet";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#010736",
          padding: "60px 80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#FCF1D0",
          position: "relative",
        }}
      >
        {/* Subtle decorative glow */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255, 210, 63, 0.18) 0%, rgba(1, 7, 54, 0) 70%)",
          }}
        />

        {/* Top Bar: Brand Logo & Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                backgroundColor: "#FFD23F",
                border: "3px solid #00031A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                fontWeight: "900",
                color: "#010736",
                boxShadow: "4px 4px 0px 0px #00031A",
              }}
            >
              B
            </div>
            <div
              style={{
                fontSize: "40px",
                fontWeight: "900",
                letterSpacing: "-0.03em",
                color: "#FCF1D0",
              }}
            >
              BONCOS
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <div
              style={{
                backgroundColor: "rgba(252, 241, 208, 0.12)",
                border: "2px solid rgba(252, 241, 208, 0.3)",
                borderRadius: "999px",
                padding: "8px 20px",
                fontSize: "18px",
                fontWeight: "700",
                color: "#FCF1D0",
              }}
            >
              100% Privacy-First OCR
            </div>
            <div
              style={{
                backgroundColor: "#FFD23F",
                border: "2px solid #00031A",
                borderRadius: "999px",
                padding: "8px 20px",
                fontSize: "18px",
                fontWeight: "800",
                color: "#010736",
                boxShadow: "2px 2px 0px 0px #00031A",
              }}
            >
              Tanpa AI Cloud
            </div>
          </div>
        </div>

        {/* Middle Main Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "960px",
          }}
        >
          <h1
            style={{
              fontSize: "62px",
              fontWeight: "900",
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "#FCF1D0",
              margin: 0,
            }}
          >
            Catat Pengeluaran Tanpa Ribet
          </h1>
          <p
            style={{
              fontSize: "26px",
              fontWeight: "500",
              lineHeight: 1.4,
              color: "#A2B4E2",
              margin: 0,
            }}
          >
            Ekstraksi struk fisik & screenshot m-banking/e-wallet otomatis langsung di browser Anda. Gambar tidak pernah dikirim ke server.
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "24px",
            borderTop: "2px solid rgba(252, 241, 208, 0.2)",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", gap: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "20px", fontWeight: "600", color: "#FCF1D0" }}>
              <span>⚡</span> Struk Kasir & Nota
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "20px", fontWeight: "600", color: "#FCF1D0" }}>
              <span>📱</span> BCA • Mandiri • ShopeePay • GoPay
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "20px", fontWeight: "600", color: "#FCF1D0" }}>
              <span>✈️</span> Bot Telegram Notifikasi
            </div>
          </div>

          <div
            style={{
              fontSize: "22px",
              fontWeight: "800",
              color: "#FFD23F",
            }}
          >
            boncos.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
