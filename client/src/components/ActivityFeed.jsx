function formatLogTime(timestamp) {
  if (!timestamp) return 'Just now';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp; // fallback if already string like "10:24 AM"
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ActivityFeed({ logs = [] }) {
  return (
    <div className="activity-panel">
      <div className="activity-panel-header">
        <h4 className="activity-title">Live Housekeeping Stream</h4>
        <span className="live-indicator">
          <span className="live-dot"></span> LIVE
        </span>
      </div>

      <div className="activity-feed-list">
        {logs.length === 0 ? (
          <div className="activity-empty">No recent activity</div>
        ) : (
          logs.map((log, idx) => (
            <div key={log._id || idx} className={`activity-item ${log.type || 'act-info'}`}>
              <div className="activity-dot"></div>
              <div className="activity-content">
                <span className="activity-text">{log.text}</span>
                <span className="activity-time">{formatLogTime(log.createdAt || log.time)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
