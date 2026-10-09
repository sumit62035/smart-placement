/**
 * ConfirmModal — reusable inline confirm dialog replacing window.confirm().
 *
 * Props:
 *   show      bool
 *   title     string
 *   message   string
 *   onConfirm fn
 *   onCancel  fn
 *   danger    bool   (true → red confirm button)
 */
export default function ConfirmModal({ show, title = "Confirm", message, onConfirm, onCancel, danger = true }) {
  if (!show) return null;
  return (
    <div className="modal show d-block" style={{ background: "rgba(0,0,0,.45)" }}>
      <div className="modal-dialog modal-sm modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-0 pb-0">
            <h6 className="modal-title fw-bold">{title}</h6>
            <button className="btn-close" onClick={onCancel} />
          </div>
          <div className="modal-body pt-2">
            <p className="text-muted small mb-0">{message}</p>
          </div>
          <div className="modal-footer border-0 pt-0 gap-2">
            <button className="btn btn-sm btn-outline-secondary" onClick={onCancel}>Cancel</button>
            <button className={`btn btn-sm ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
