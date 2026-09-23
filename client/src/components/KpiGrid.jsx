export default function KpiGrid({ rooms = [], activeFilter = 'all', onFilterChange, onFilter }) {
  const total = rooms.length;
  const dirty = rooms.filter(r => r.status === 'dirty' || r.status === 'assigned').length;
  const unassigned = rooms.filter(r => r.status === 'dirty' && !r.assignedTo).length;
  const cleaning = rooms.filter(r => r.status === 'cleaning').length;
  const ready = rooms.filter(r => r.status === 'ready').length;
  const inspected = rooms.filter(r => r.status === 'inspected').length;

  const handleFilter = (status) => {
    if (typeof onFilterChange === 'function') {
      onFilterChange(status);
    } else if (typeof onFilter === 'function') {
      onFilter(status);
    }
  };

  return (
    <div className="kpi-grid">
      <div
        className={`kpi-card kpi-total ${activeFilter === 'all' ? 'active' : ''}`}
        onClick={() => handleFilter('all')}
      >
        <div className="kpi-header">
          <span className="kpi-title">Total Rooms</span>
          <span className="kpi-icon-pill">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
          </span>
        </div>
        <div className="kpi-value">{total}</div>
        <div className="kpi-subtext">All monitored units</div>
      </div>

      <div
        className={`kpi-card kpi-dirty ${activeFilter === 'dirty' ? 'active' : ''}`}
        onClick={() => handleFilter('dirty')}
      >
        <div className="kpi-header">
          <span className="kpi-title">Needs Cleaning</span>
          <span className="kpi-icon-pill">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </span>
        </div>
        <div className="kpi-value text-dirty">{dirty}</div>
        <div className="kpi-subtext">{unassigned} unassigned</div>
      </div>

      <div
        className={`kpi-card kpi-cleaning ${activeFilter === 'cleaning' ? 'active' : ''}`}
        onClick={() => handleFilter('cleaning')}
      >
        <div className="kpi-header">
          <span className="kpi-title">In Progress</span>
          <span className="kpi-icon-pill">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
            </svg>
          </span>
        </div>
        <div className="kpi-value text-cleaning">{cleaning}</div>
        <div className="kpi-subtext">Active room cleanings</div>
      </div>

      <div
        className={`kpi-card kpi-ready ${activeFilter === 'ready' ? 'active' : ''}`}
        onClick={() => handleFilter('ready')}
      >
        <div className="kpi-header">
          <span className="kpi-title">Ready for Review</span>
          <span className="kpi-icon-pill">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>
        </div>
        <div className="kpi-value text-ready">{ready}</div>
        <div className="kpi-subtext">Marked ready by staff</div>
      </div>

      <div
        className={`kpi-card kpi-inspected ${activeFilter === 'inspected' ? 'active' : ''}`}
        onClick={() => handleFilter('inspected')}
      >
        <div className="kpi-header">
          <span className="kpi-title">Inspected & Clean</span>
          <span className="kpi-icon-pill">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </span>
        </div>
        <div className="kpi-value text-inspected">{inspected}</div>
        <div className="kpi-subtext">Approved for check-in</div>
      </div>
    </div>
  );
}
