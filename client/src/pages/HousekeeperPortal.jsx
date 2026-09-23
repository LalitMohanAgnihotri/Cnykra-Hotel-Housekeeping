import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';
import { playChime } from '../utils/audio';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HkRoomCard from '../components/HkRoomCard';
import ToastContainer, { useToast } from '../components/Toast';

export default function HousekeeperPortal() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'cleaning' | 'done' | 'all'

  const { toasts, showToast } = useToast();

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.data);
    } catch (err) {
      console.error('Failed to load housekeeper rooms:', err);
      if (isInitial) {
        showToast('Error loading schedule', 'warning');
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => {
      fetchData(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Start Cleaning
  const handleStartCleaning = async (roomId) => {
    try {
      const res = await api.put(`/rooms/${roomId}/start`);
      setRooms(prev => prev.map(r => r._id === roomId ? res.data : r));
      playChime('start');
      showToast(`Started cleaning Room ${res.data.number}. Timer running!`, 'info');
      fetchData(false);
    } catch (err) {
      showToast('Failed to start cleaning', 'warning');
    }
  };

  // Toggle Checklist
  const handleToggleChecklist = async (roomId, index) => {
    try {
      const res = await api.put(`/rooms/${roomId}/checklist/${index}`);
      setRooms(prev => prev.map(r => r._id === roomId ? res.data : r));
    } catch (err) {
      showToast('Failed to update task', 'warning');
    }
  };

  // Mark Ready
  const handleMarkReady = async (roomId) => {
    try {
      const res = await api.put(`/rooms/${roomId}/ready`);
      setRooms(prev => prev.map(r => r._id === roomId ? res.data : r));
      playChime('ready');
      showToast(`Room ${res.data.number} marked Ready! Manager notified for inspection.`, 'success');
      fetchData(false);
    } catch (err) {
      showToast('Failed to mark room ready', 'warning');
    }
  };

  // Strictly filter for the logged in housekeeper's assigned rooms
  const myRooms = useMemo(() => {
    return rooms.filter(r => r.assignedTo === user?.userId);
  }, [rooms, user?.userId]);

  // Tab filtering
  const displayedRooms = useMemo(() => {
    if (activeTab === 'active') {
      return myRooms.filter(r => r.status === 'assigned' || r.status === 'dirty' || r.status === 'cleaning');
    }
    if (activeTab === 'cleaning') {
      return myRooms.filter(r => r.status === 'cleaning');
    }
    if (activeTab === 'done') {
      return myRooms.filter(r => r.status === 'ready' || r.status === 'inspected');
    }
    return myRooms; // 'all'
  }, [myRooms, activeTab]);

  // Statistics
  const stats = useMemo(() => {
    const total = myRooms.length;
    const cleaning = myRooms.filter(r => r.status === 'cleaning').length;
    const pending = myRooms.filter(r => r.status === 'assigned' || r.status === 'dirty').length;
    const completed = myRooms.filter(r => r.status === 'ready' || r.status === 'inspected').length;
    return { total, cleaning, pending, completed };
  }, [myRooms]);

  return (
    <div className="app-layout">
      <Header />

      <main className="main-content housekeeper-view-page">
        {/* Attendant Hero Banner - Role Bound to Logged In Housekeeper */}
        <div className="hk-hero-card">
          <div className="hk-hero-profile">
            <div className="staff-avatar-badge xl" style={{ background: user?.color || '#4f46e5' }}>
              {user?.initials || 'HK'}
            </div>
            <div className="hk-hero-details">
              <div className="hk-hero-title-row">
                <h2 className="hk-hero-name">{user?.name}</h2>
                <span className="hk-badge-duty">On Duty</span>
              </div>
              <p className="hk-hero-sub">
                {user?.title || 'Floor Attendant'} • Shift: Morning (07:00 – 15:30)
              </p>
            </div>
          </div>

          <div className="hk-status-indicator">
            <span className="status-indicator-tag">
              <span className="live-dot"></span> Housekeeper Console
            </span>
          </div>
        </div>

        {/* Housekeeper Workload KPI Strip */}
        <div className="hk-stats-strip">
          <div className="hk-stat-card">
            <div className="stat-num">{stats.total}</div>
            <div className="stat-label">My Assigned Rooms</div>
          </div>
          <div className="hk-stat-card highlight">
            <div className="stat-num">{stats.cleaning}</div>
            <div className="stat-label">Currently Cleaning</div>
          </div>
          <div className="hk-stat-card">
            <div className="stat-num">{stats.pending}</div>
            <div className="stat-label">Waiting to Start</div>
          </div>
          <div className="hk-stat-card success">
            <div className="stat-num">{stats.completed}</div>
            <div className="stat-label">Ready / Inspected</div>
          </div>
        </div>

        {/* Tabs for Housekeeper */}
        <div className="controls-toolbar">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              Active Tasks ({stats.cleaning + stats.pending})
            </button>
            <button
              className={`filter-tab ${activeTab === 'cleaning' ? 'active' : ''}`}
              onClick={() => setActiveTab('cleaning')}
            >
              In Progress ({stats.cleaning})
            </button>
            <button
              className={`filter-tab ${activeTab === 'done' ? 'active' : ''}`}
              onClick={() => setActiveTab('done')}
            >
              Completed / Ready ({stats.completed})
            </button>
            <button
              className={`filter-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All My Rooms ({stats.total})
            </button>
          </div>
        </div>

        {/* Room Cards List */}
        <div className="hk-rooms-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading assigned rooms...</p>
            </div>
          ) : displayedRooms.length === 0 ? (
            <div className="empty-rooms-state">
              <div className="empty-icon">✨</div>
              <h3>No Rooms in This Filter</h3>
              <p>All cleaning tasks for this section are completed or none are currently assigned.</p>
            </div>
          ) : (
            <div className="rooms-grid">
              {displayedRooms.map(room => (
                <HkRoomCard
                  key={room._id}
                  room={room}
                  onStartCleaning={handleStartCleaning}
                  onToggleChecklist={handleToggleChecklist}
                  onMarkReady={handleMarkReady}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <ToastContainer toasts={toasts} />
    </div>
  );
}
