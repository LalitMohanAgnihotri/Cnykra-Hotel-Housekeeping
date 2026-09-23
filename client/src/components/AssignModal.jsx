import { useState, useEffect } from 'react';

export default function AssignModal({ isOpen, onClose, room, staff, rooms, onAssign }) {
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (room) {
      setSelectedStaffId(room.assignedTo || '');
    }
  }, [room]);

  if (!isOpen || !room) return null;

  const handleSave = async (staffId) => {
    const idToAssign = staffId || selectedStaffId;
    if (!idToAssign) return;

    try {
      setSubmitting(true);
      await onAssign(room._id, idToAssign);
      onClose();
    } catch (err) {
      console.error('Failed to assign staff:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Assign Housekeeper</h3>
            <p className="modal-subtitle">
              Room {room.number} • {room.type} (Floor {room.floor})
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="staff-assign-list">
          {staff?.map(hk => {
            const isCurrent = (room.assignedTo === hk.id);
            const isSelected = (selectedStaffId === hk.id);
            const activeCount = rooms?.filter(r => r.assignedTo === hk.id && (r.status === 'assigned' || r.status === 'cleaning')).length || 0;
            const completedCount = rooms?.filter(r => r.assignedTo === hk.id && (r.status === 'ready' || r.status === 'inspected')).length || 0;

            return (
              <div
                key={hk.id}
                className={`staff-assign-card ${isSelected ? 'is-selected' : ''}`}
                onClick={() => setSelectedStaffId(hk.id)}
              >
                <div className="staff-info-block">
                  <div className="staff-avatar-badge lg" style={{ background: hk.color || '#4f46e5' }}>
                    {hk.initials || 'HK'}
                  </div>
                  <div>
                    <div className="staff-text-name">
                      {hk.name}
                      {isCurrent && <span className="staff-current-tag"> (Current)</span>}
                    </div>
                    <div className="staff-text-shift">{hk.role} • Shift: {hk.shift}</div>
                  </div>
                </div>
                <div className="staff-workload-badge">
                  {activeCount} Active / {completedCount} Done
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!selectedStaffId || submitting}
            onClick={() => handleSave(selectedStaffId)}
          >
            {submitting ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
}
