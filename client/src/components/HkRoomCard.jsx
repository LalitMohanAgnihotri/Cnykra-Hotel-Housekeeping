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
  assigned: 'Pending Start',
  cleaning: 'Cleaning In Progress',
  ready: 'Ready for Inspection',
  inspected: 'Inspected & Clean'
};

export default function HkRoomCard({ room, onStartCleaning, onToggleChecklist, onMarkReady }) {
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

  const checklistDone = room.checklist?.filter(c => c.completed).length || 0;
  const checklistTotal = room.checklist?.length || 0;

  return (
    <div className={`room-card hk-room-card status-${room.status} priority-${room.priority}`}>
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

        {/* Timer for cleaning rooms */}
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

        {/* Checklist — only visible when cleaning */}
        {room.status === 'cleaning' && room.checklist && (
          <div className="hk-checklist">
            {room.checklist.map((item, idx) => (
              <label key={idx} className={`checklist-item ${item.completed ? 'done' : ''}`}>
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => onToggleChecklist(room._id, idx)}
                />
                <span>{item.task}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="room-card-actions">
        {(room.status === 'assigned' || room.status === 'dirty') && (
          <button className="btn-primary" onClick={() => onStartCleaning(room._id)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            <span>Start Cleaning</span>
          </button>
        )}
        {room.status === 'cleaning' && (
          <button className="btn-success" onClick={() => onMarkReady(room._id)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Mark Ready</span>
          </button>
        )}
        {room.status === 'ready' && (
          <div className="hk-status-note">Waiting for manager inspection...</div>
        )}
        {room.status === 'inspected' && (
          <div className="hk-status-note success">✓ Approved by manager</div>
        )}
      </div>
    </div>
  );
}
