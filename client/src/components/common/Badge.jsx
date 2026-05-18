import { Lock } from "lucide-react";

const styles = {
  draft:     { background: "var(--surface-3)", color: "var(--text-2)", border: "1px solid var(--border-2)" },
  submitted: { background: "var(--blue-bg)",   color: "var(--blue)",   border: "1px solid var(--blue-border)" },
  approved:  { background: "var(--green-bg)",  color: "var(--green)",  border: "1px solid var(--green-border)" },
  rejected:  { background: "var(--red-bg)",    color: "var(--red)",    border: "1px solid var(--red-border)" },
};

export function StatusBadge({ status }) {
  const s = styles[status] || styles.draft;
  return (
    <span style={{ ...s, fontSize: 10, borderRadius: 3, padding: "2px 7px", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
      {status}
    </span>
  );
}

export function LockedBadge() {
  return (
    <span style={{ ...styles.approved, fontSize: 10, borderRadius: 3, padding: "2px 7px", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
      <Lock size={11} /> locked
    </span>
  );
}

const uomStyles = {
  min:      { bg: "var(--blue-bg)",   color: "var(--blue)",  border: "var(--blue-border)",  label: "Min" },
  max:      { bg: "var(--amber-bg)",  color: "var(--amber)", border: "var(--amber-border)", label: "Max" },
  zero:     { bg: "var(--surface-3)", color: "var(--text-2)", border: "var(--border-2)",    label: "Zero" },
  timeline: { bg: "var(--green-bg)",  color: "var(--green)", border: "var(--green-border)", label: "Timeline" },
};

export function UomBadge({ uomType }) {
  const s = uomStyles[uomType] || uomStyles.min;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 10, borderRadius: 3, padding: "2px 7px", fontWeight: 500 }}>
      {s.label}
    </span>
  );
}

const achieveStyles = {
  completed:   { bg: "var(--green-bg)",  color: "var(--green)", border: "var(--green-border)" },
  on_track:    { bg: "var(--blue-bg)",   color: "var(--blue)",  border: "var(--blue-border)" },
  not_started: { bg: "var(--surface-3)", color: "var(--text-2)", border: "var(--border-2)" },
};

export function AchievementBadge({ status }) {
  const s = achieveStyles[status] || achieveStyles.not_started;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 10, borderRadius: 3, padding: "2px 7px", fontWeight: 500 }}>
      {(status || "not_started").replace(/_/g, " ")}
    </span>
  );
}

export function QuarterBadge({ quarter }) {
  return (
    <span style={{ background: "var(--surface-3)", color: "var(--text-2)", border: "1px solid var(--border-2)", fontSize: 10, borderRadius: 3, padding: "2px 7px", fontWeight: 500 }}>
      {quarter}
    </span>
  );
}

export default StatusBadge;
