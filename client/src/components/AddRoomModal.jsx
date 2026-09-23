import { useState } from 'react';

const ROOM_TYPES = [
  'Deluxe King Room',
  'Superior Twin Suite',
  'Executive Penthouse',
  'Presidential Suite',
  'Grand Ocean Suite',
  'Standard Queen Room'
];

export default function AddRoomModal({ isOpen, onClose, staff, rooms, onAddRoom }) {
  const [number, setNumber] = useState('');
  const [type, setType] = useState('Deluxe King Room');
  const [floor, setFloor] = useState('3');
  const [priority, setPriority] = useState('normal');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!number.trim()) {
      setError('Please provide a room number');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onAddRoom({
        number: number.trim(),
        type,
        floor: parseInt(floor, 10) || 1,
        priority,
        assignedTo: assignedTo || null,
        notes: notes.trim()
      });
      // reset
      setNumber('');
      setNotes('');
      setAssignedTo('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add room');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Add Room to Schedule</h3>
            <p className="modal-subtitle">Dispatch new room for today's housekeeping turnover</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="modalRoomNum">Room Number *</label>
              <input
                id="modalRoomNum"
                type="text"
                className="form-input"
                placeholder="e.g. 402, 508"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="modalRoomFloor">Floor Level</label>
              <select
                id="modalRoomFloor"
                className="form-select"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(f => (
                  <option key={f} value={f}>Floor {f}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="modalRoomType">Room Category</label>
              <select
                id="modalRoomType"
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {ROOM_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="modalRoomPriority">Priority Level</label>
              <select
                id="modalRoomPriority"
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="normal">Normal Turnaround</option>
                <option value="high">High Priority</option>
                <option value="vip">⭐ VIP Guest Arrival</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="modalRoomAssignee">Assign Housekeeper</label>
            <select
              id="modalRoomAssignee"
              className="form-select"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">-- Leave Unassigned for now --</option>
              {staff?.map(hk => {
                const activeCount = rooms?.filter(r => r.assignedTo === hk.id && r.status !== 'inspected').length || 0;
                return (
                  <option key={hk.id} value={hk.id}>
                    {hk.name} ({activeCount} active tasks)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="modalRoomNotes">Housekeeping Notes & Guest Requests</label>
            <textarea
              id="modalRoomNotes"
              className="form-textarea"
              rows={3}
              placeholder="e.g. Hypoallergenic pillows, extra towels, Champagne bucket on arrival..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Room to Board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
