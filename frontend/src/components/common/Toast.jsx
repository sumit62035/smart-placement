/**
 * Toast — transient success/error notification shown at bottom-right.
 *
 * Props:
 *   toasts   array of { id, type, message }
 *   remove   fn(id)
 */
export default function Toast({ toasts, remove }) {
  if (!toasts.length) return null;
  return (
    <div
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 9999,
        display: "flex", flexDirection: "column", gap: 8, maxWidth: 340,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`alert alert-${t.type === "error" ? "danger" : "success"} d-flex align-items-center gap-2 shadow-sm py-2 mb-0`}
          style={{ fontSize: 13, borderRadius: 8 }}
        >
          <i className={`bi ${t.type === "error" ? "bi-x-circle-fill" : "bi-check-circle-fill"}`} />
          <span className="flex-grow-1">{t.message}</span>
          <button className="btn-close btn-sm" onClick={() => remove(t.id)} />
        </div>
      ))}
    </div>
  );
}

// ── hook ──────────────────────────────────────────────────────────────────────
import { useState, useCallback } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, add, remove };
}
