import { useState } from 'react';

function formatTimeDifference(startStr, endStr) {
  if (!startStr || !endStr) return '25 mins';
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  const diffMins = Math.max(1, Math.round((end - start) / (1000 * 60)));
  return `${diffMins} mins`;
}

export default function InspectModal({ isOpen, onClose, room, staff, onInspect }) {
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !room) return null;

  const assignedStaff = staff?.find(s => s.id === room.assignedTo);
  const durationStr = formatTimeDifference(room.cleaningStartedAt, room.cleaningCompletedAt);

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      await onInspect(room._id, true);
      onClose();
    } catch (err) {
      console.error('Failed to approve room:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setSubmitting(true);
      await onInspect(room._id, false, feedbackNotes);
      onClose();
    } catch (err) {
      console.error('Failed to reject room:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Room Inspection & Quality Control</h3>
            <p className="modal-subtitle">
              Room {room.number} • {room.type} (Floor {room.floor})
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="inspect-modal-body">
          <div className="inspect-summary-grid">
            <div className="inspect-info-box">
              <div className="inspect-info-lbl">Cleaned By</div>
              <div className="inspect-info-val">{assignedStaff ? assignedStaff.name : 'Housekeeper'}</div>
            </div>
            <div className="inspect-info-box">
              <div className="inspect-info-lbl">Cleaning Duration</div>
              <div className="inspect-info-val">{durationStr}</div>
            </div>
            <div className="inspect-info-box">
              <div className="inspect-info-lbl">Guest Priority</div>
              <div className="inspect-info-val" style={{ textTransform: 'capitalize' }}>{room.priority}</div>
            </div>
            <div className="inspect-info-box">
              <div className="inspect-info-lbl">Current Status</div>
              <div className="inspect-info-val" style={{ color: '#059669' }}>Ready for Guest</div>
            </div>
          </div>

          <div className="inspect-checklist-box">
            <div className="inspect-checklist-title">
              Sanitization & Quality Checklist Verified by Attendant
            </div>
            <div className="inspect-checklist-items">
              {room.checklist?.map((item, idx) => (
                <div key={idx} className="inspect-checklist-item">
                  <span className="check-icon">✓</span>
                  <span>{item.task}</span>
                </div>
              ))}
            </div>
          </div>

          {room.notes && (
            <div className="inspect-notes-box">
              <strong>Notes / Guest Requests:</strong> {room.notes}
            </div>
          )}

          {showRejectInput && (
            <div className="form-group" style={{ marginTop: '14px' }}>
              <label htmlFor="inspectFeedbackNotes">Touch-up Instructions for Housekeeper</label>
              <textarea
                id="inspectFeedbackNotes"
                className="form-textarea"
                rows={2}
                placeholder="Specify what needs further cleaning or attention..."
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="modal-actions space-between">
          {!showRejectInput ? (
            <button
              type="button"
              className="btn-danger-outline"
              onClick={() => setShowRejectInput(true)}
              disabled={submitting}
            >
              Request Touch-up
            </button>
          ) : (
            <button
              type="button"
              className="btn-danger"
              onClick={handleReject}
              disabled={submitting}
            >
              Send Back for Touch-up
            </button>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-success"
              onClick={handleApprove}
              disabled={submitting}
            >
              {submitting ? 'Approving...' : '✓ Approve & Mark Clean'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
