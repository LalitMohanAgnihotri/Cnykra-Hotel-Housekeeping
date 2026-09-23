import { useState, useEffect } from 'react';

function formatDuration(startTime) {
  if (!startTime) return '--:--';
  const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

const STATUS_LABELS = {
  dirty: 'Needs Cleaning',
  assigned: 'Assigned',
  cleaning: 'Cleaning In Progress',
  ready: 'Ready for Inspection',
  inspected: 'Inspected & Clean'
};

export default function RoomCard({ room, staff, onAssign, onInspect, onDelete, onRemoveFromToday }) {
  const [timer, setTimer] = useState('--:--');

  useEffect(() => {
    if (room.status === 'cleaning' && room.cleaningStartedAt) {
      const interval = setInterval(() => {
        setTimer(formatDuration(room.cleaningStartedAt));
      }, 1000);
      setTimer(formatDuration(room.cleaningStartedAt));
      return () => clearInterval(interval);
    } else if (room.cleaningStartedAt && room.cleaningCompletedAt) {
      const elapsed = Math.floor((new Date(room.cleaningCompletedAt).getTime() - new Date(room.cleaningStartedAt).getTime()) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      setTimer(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    }
  }, [room.status, room.cleaningStartedAt, room.cleaningCompletedAt]);

  const assignedStaff = staff?.find(s => s.id === room.assignedTo);
  const checklistDone = room.checklist?.filter(c => c.completed).length || 0;
  const checklistTotal = room.checklist?.length || 0;

  const handleRemove = () => {
    if (typeof onRemoveFromToday === 'function') {
      onRemoveFromToday(room._id);
    } else if (typeof onDelete === 'function') {
      onDelete(room._id);
    }
  };

  return (
    <div className={`room-card status-${room.status} priority-${room.priority}`}>
      <div className="room-card-header">
        <div className="room-number-badge">
          <span className="room-num">{room.number}</span>
          <span className="room-floor">Floor {room.floor}</span>
        </div>
        <div className="room-header-right">
          {room.priority === 'vip' && <span className="priority-pill vip">⭐ VIP</span>}
          {room.priority === 'high' && <span className="priority-pill high">HIGH</span>}
          <span className={`status-pill status-${room.status}`}>{STATUS_LABELS[room.status]}</span>
        </div>
      </div>

      <div className="room-card-body">
        <div className="room-type">{room.type}</div>

        {room.notes && <div className="room-notes">{room.notes}</div>}

        {assignedStaff && (
          <div className="room-assigned-badge">
            <div className="staff-avatar-badge xs" style={{ background: assignedStaff.color }}>{assignedStaff.initials}</div>
            <span>{assignedStaff.name}</span>
          </div>
        )}

        {room.status === 'cleaning' && (
          <div className="room-timer-display">
            <span className="timer-icon">⏱</span>
            <span className="timer-value">{timer}</span>
            <span className="checklist-progress">{checklistDone}/{checklistTotal} tasks</span>
          </div>
        )}

        {(room.status === 'ready' || room.status === 'inspected') && room.cleaningStartedAt && (
          <div className="room-timer-display completed">
            <span className="timer-icon">✓</span>
            <span className="timer-value">{timer}</span>
            <span className="checklist-progress">Completed</span>
          </div>
        )}
      </div>

      <div className="room-card-actions">
        {(room.status === 'dirty' || room.status === 'assigned') && (
          <button className="btn-secondary btn-sm" onClick={() => onAssign(room)}>
            {room.assignedTo ? 'Reassign' : 'Assign Staff'}
          </button>
        )}
        {room.status === 'ready' && (
          <button className="btn-success btn-sm" onClick={() => onInspect(room)}>
            Inspect & Approve
          </button>
        )}
        <button
          className="btn-ghost btn-sm btn-danger-text"
          onClick={handleRemove}
          title="Remove room from today's list"
          aria-label="Remove room from today's list"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
