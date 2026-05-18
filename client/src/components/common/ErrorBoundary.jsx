import React from "react";

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "#09090b", color: "#a1a1aa", gap: "12px",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: "#1c0a0a",
            border: "1px solid #450a0a", display: "flex", alignItems: "center",
            justifyContent: "center", marginBottom: 4,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div style={{ fontSize: 15, color: "#fafafa", fontWeight: 600 }}>
            Something went wrong
          </div>
          <div style={{ fontSize: 12, maxWidth: 400, textAlign: "center", lineHeight: 1.5 }}>
            {this.state.error?.message || "An unexpected error occurred"}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#18181b", border: "1px solid #27272a",
              color: "#fafafa", padding: "8px 20px", borderRadius: 6,
              cursor: "pointer", fontSize: 13, fontWeight: 500,
              fontFamily: "Inter, system-ui, sans-serif", marginTop: 8,
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3f3f46")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#27272a")}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
