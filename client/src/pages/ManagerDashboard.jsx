import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';
import { playChime } from '../utils/audio';
import Header from '../components/Header';
import KpiGrid from '../components/KpiGrid';
import RoomCard from '../components/RoomCard';
import AddRoomModal from '../components/AddRoomModal';
import AssignModal from '../components/AssignModal';
import InspectModal from '../components/InspectModal';
import ActivityFeed from '../components/ActivityFeed';
import Footer from '../components/Footer';
import ToastContainer, { useToast } from '../components/Toast';

export default function ManagerDashboard() {
  const [rooms, setRooms] = useState([]);
  const [staff, setStaff] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [assignRoom, setAssignRoom] = useState(null);
  const [inspectRoom, setInspectRoom] = useState(null);

  // Today's dismissed rooms (removes room from today's operations without deleting from DB)
  const [dismissedRoomIds, setDismissedRoomIds] = useState(() => {
    try {
      const saved = sessionStorage.getItem('cnykra_dismissed_today');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const { toasts, showToast } = useToast();

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      const [roomsRes, staffRes, logsRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/users'),
        api.get('/users/activity')
      ]);
      setRooms(roomsRes.data);
      setStaff(staffRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error('Failed to fetch manager data:', err);
      if (isInitial) {
        showToast('Error loading rooms and staff', 'warning');
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData(true);
    // Polling every 4 seconds to catch housekeeper updates in real time
    const interval = setInterval(() => {
      fetchData(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Add Room
  const handleAddRoom = async (roomData) => {
    const res = await api.post('/rooms', roomData);
    setDismissedRoomIds(prev => {
      if (prev.has(res.data._id)) {
        const next = new Set(prev);
        next.delete(res.data._id);
        try {
          sessionStorage.setItem('cnykra_dismissed_today', JSON.stringify([...next]));
        } catch (e) {}
        return next;
      }
      return prev;
    });
    setRooms(prev => [res.data, ...prev]);
    showToast(`Room ${res.data.number} added to schedule`, 'success');
    playChime('assign');
    fetchData(false);
  };

  // Assign Housekeeper
  const handleAssign = async (roomId, housekeeperId) => {
    const res = await api.put(`/rooms/${roomId}/assign`, { housekeeperId });
    setRooms(prev => prev.map(r => r._id === roomId ? res.data : r));
    const assignedUser = staff.find(s => s.id === housekeeperId);
    showToast(`Room ${res.data.number} assigned to ${assignedUser ? assignedUser.name : 'staff'}`, 'success');
    playChime('assign');
    fetchData(false);
  };

  // Inspect & Approve / Reject
  const handleInspect = async (roomId, approved, feedbackNotes) => {
    const res = await api.put(`/rooms/${roomId}/inspect`, { approved, feedbackNotes });
    setRooms(prev => prev.map(r => r._id === roomId ? res.data : r));
    if (approved) {
      showToast(`Room ${res.data.number} approved & marked clean!`, 'success');
      playChime('ready');
    } else {
      showToast(`Room ${res.data.number} sent back for touch-up`, 'warning');
    }
    fetchData(false);
  };

  // Remove room from today's housekeeping list (preserves room in database)
  const handleRemoveFromToday = (roomId) => {
    const roomToRemove = rooms.find(r => r._id === roomId);
    if (!window.confirm(`Remove Room ${roomToRemove?.number || ''} from today's housekeeping list?`)) {
      return;
    }
    setDismissedRoomIds(prev => {
      const next = new Set(prev);
      next.add(roomId);
      try {
        sessionStorage.setItem('cnykra_dismissed_today', JSON.stringify([...next]));
      } catch (e) {}
      return next;
    });
    showToast(`Room ${roomToRemove?.number || ''} removed from today's list`, 'info');
  };

  // Active rooms monitored in today's housekeeping operations
  const activeRooms = useMemo(() => {
    return rooms.filter(r => !dismissedRoomIds.has(r._id));
  }, [rooms, dismissedRoomIds]);

  // Filtered rooms calculation
  const filteredRooms = useMemo(() => {
    return activeRooms.filter(room => {
      // Status filter
      if (statusFilter === 'dirty' && !(room.status === 'dirty' || room.status === 'assigned')) {
        return false;
      }
      if (statusFilter === 'cleaning' && room.status !== 'cleaning') {
        return false;
      }
      if (statusFilter === 'ready' && room.status !== 'ready') {
        return false;
      }
      if (statusFilter === 'inspected' && room.status !== 'inspected') {
        return false;
      }

      // Floor filter
      if (floorFilter !== 'all' && String(room.floor) !== String(floorFilter)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const numMatch = room.number.toLowerCase().includes(query);
        const typeMatch = room.type.toLowerCase().includes(query);
        const assignedStaff = staff.find(s => s.id === room.assignedTo);
        const staffMatch = assignedStaff ? assignedStaff.name.toLowerCase().includes(query) : false;
        if (!numMatch && !typeMatch && !staffMatch) return false;
      }

      return true;
    });
  }, [activeRooms, staff, statusFilter, floorFilter, searchQuery]);

  // Counts for tabs based on today's active rooms
  const counts = useMemo(() => {
    return {
      all: activeRooms.length,
      dirty: activeRooms.filter(r => r.status === 'dirty' || r.status === 'assigned').length,
      cleaning: activeRooms.filter(r => r.status === 'cleaning').length,
      ready: activeRooms.filter(r => r.status === 'ready').length,
      inspected: activeRooms.filter(r => r.status === 'inspected').length
    };
  }, [activeRooms]);

  return (
    <div className="app-layout">
      <Header onAddRoom={() => setIsAddModalOpen(true)} />

      <main className="main-content">
        <KpiGrid rooms={activeRooms} activeFilter={statusFilter} onFilterChange={setStatusFilter} />

        {/* Toolbar & Filters */}
        <div className="controls-toolbar">
          <div className="filter-tabs" role="tablist">
            <button
              className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All Rooms <span className="tab-count">{counts.all}</span>
            </button>
            <button
              className={`filter-tab ${statusFilter === 'dirty' ? 'active' : ''}`}
              onClick={() => setStatusFilter('dirty')}
            >
              Needs Cleaning <span className="tab-count">{counts.dirty}</span>
            </button>
            <button
              className={`filter-tab ${statusFilter === 'cleaning' ? 'active' : ''}`}
              onClick={() => setStatusFilter('cleaning')}
            >
              In Progress <span className="tab-count">{counts.cleaning}</span>
            </button>
            <button
              className={`filter-tab ${statusFilter === 'ready' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ready')}
            >
              Ready for Review <span className="tab-count">{counts.ready}</span>
            </button>
            <button
              className={`filter-tab ${statusFilter === 'inspected' ? 'active' : ''}`}
              onClick={() => setStatusFilter('inspected')}
            >
              Inspected & Clean <span className="tab-count">{counts.inspected}</span>
            </button>
          </div>

          <div className="toolbar-actions">
            <div className="search-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search room #, guest, staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>

            <select
              className="floor-select"
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
            >
              <option value="all">All Floors</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(f => (
                <option key={f} value={f}>Floor {f}</option>
              ))}
            </select>

            <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Add Room</span>
            </button>
          </div>
        </div>

        {/* Dashboard Grid & Live Stream */}
        <div className="dashboard-content-layout">
          <div className="rooms-section">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading hotel rooms...</p>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="empty-rooms-state">
                <div className="empty-icon">🛏️</div>
                <h3>No Rooms Match Your Criteria</h3>
                <p>Try switching status filters, clearing your search, or add a new room to today's schedule.</p>
                <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
                  + Add Room to Board
                </button>
              </div>
            ) : (
              <div className="rooms-grid">
                {filteredRooms.map(room => (
                  <RoomCard
                    key={room._id}
                    room={room}
                    staff={staff}
                    onAssign={(r) => setAssignRoom(r)}
                    onInspect={(r) => setInspectRoom(r)}
                    onDelete={handleRemoveFromToday}
                    onRemoveFromToday={handleRemoveFromToday}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="dashboard-sidebar">
            <ActivityFeed logs={logs} />
          </aside>
        </div>
      </main>

      <Footer />

      {/* Modals */}
      <AddRoomModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        staff={staff}
        rooms={activeRooms}
        onAddRoom={handleAddRoom}
      />

      <AssignModal
        isOpen={!!assignRoom}
        onClose={() => setAssignRoom(null)}
        room={assignRoom}
        staff={staff}
        rooms={activeRooms}
        onAssign={handleAssign}
      />

      <InspectModal
        isOpen={!!inspectRoom}
        onClose={() => setInspectRoom(null)}
        room={inspectRoom}
        staff={staff}
        onInspect={handleInspect}
      />

      <ToastContainer toasts={toasts} />
    </div>
  );
}
