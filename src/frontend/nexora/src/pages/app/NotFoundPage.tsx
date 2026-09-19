import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#F8FAFC", fontFamily: "Inter, system-ui, sans-serif",
      padding: 24,
    }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: 80, fontWeight: 800, color: "#E2E8F0", lineHeight: 1, marginBottom: 8 }}>404</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1E293B", margin: "0 0 10px" }}>Page Not Found</h1>
        <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, margin: "0 0 28px" }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              height: 42, padding: "0 20px", background: "#FFFFFF", color: "#1E293B",
              border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            ← Go Back
          </button>
          <button
            onClick={() => navigate("/dashboard", { replace: true })}
            style={{
              height: 42, padding: "0 20px", background: "#3B82F6", color: "#fff",
              border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
