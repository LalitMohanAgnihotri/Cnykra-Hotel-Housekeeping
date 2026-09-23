/**
 * CNYKRA HOTEL HOUSEKEEPING OS - MAIN APPLICATION COORDINATOR
 * Manages view routing (Manager Dashboard vs Full-Screen Housekeeper Portal),
 * Demo Account switcher & authentication, Web Audio chimes, and system toasts.
 */

(function () {
  'use strict';

  let soundEnabled = true;
  let audioCtx = null;

  // DOM Elements
  const mainViewport = document.getElementById('mainViewport');
  const viewBtnManager = document.getElementById('viewBtnManager');
  const viewBtnHousekeeper = document.getElementById('viewBtnHousekeeper');
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  const themeIconSun = document.getElementById('themeIconSun');
  const themeIconMoon = document.getElementById('themeIconMoon');
  const btnSoundToggle = document.getElementById('btnSoundToggle');
  const soundIconOn = document.getElementById('soundIconOn');
  const soundIconOff = document.getElementById('soundIconOff');
  const btnResetData = document.getElementById('btnResetData');
  const liveClock = document.getElementById('liveClock');
  const toastContainer = document.getElementById('toastContainer');

  // Auth & Demo Elements
  const btnUserAuth = document.getElementById('btnUserAuth');
  const headerUserAvatar = document.getElementById('headerUserAvatar');
  const headerUserName = document.getElementById('headerUserName');
  const headerUserRole = document.getElementById('headerUserRole');
  const modalDemoAuth = document.getElementById('modalDemoAuth');
  const formManualLogin = document.getElementById('formManualLogin');
  const btnGuestExplore = document.getElementById('btnGuestExplore');

  // Theme Management (Light by default)
  function setTheme(theme) {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('cnykra_theme', theme);
    if (theme === 'light') {
      if (themeIconSun) themeIconSun.classList.add('hidden');
      if (themeIconMoon) themeIconMoon.classList.remove('hidden');
    } else {
      if (themeIconSun) themeIconSun.classList.remove('hidden');
      if (themeIconMoon) themeIconMoon.classList.add('hidden');
    }
  }

  // Update Header User Profile
  function updateUserProfileHeader() {
    const user = window.cnykraStore.getCurrentUser();
    if (!user) return;

    if (headerUserAvatar) {
      headerUserAvatar.textContent = user.initials || 'US';
      headerUserAvatar.style.backgroundColor = user.color || '#0f172a';
    }
    if (headerUserName) {
      headerUserName.textContent = user.name;
    }
    if (headerUserRole) {
      headerUserRole.textContent = user.role === 'manager' ? 'Manager' : 'Housekeeper';
    }
  }

  // Web Audio Synthesizer for natural, subtle sound cues
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, type, duration, delay = 0, gainLevel = 0.12) {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
      }, delay);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  function playChime(chimeType) {
    if (!soundEnabled) return;

    if (chimeType === 'ready') {
      // Pleasant 3-tone chime (C5, E5, G5)
      playTone(523.25, 'sine', 0.4, 0, 0.15);
      playTone(659.25, 'sine', 0.4, 110, 0.15);
      playTone(783.99, 'sine', 0.5, 220, 0.16);
    } else if (chimeType === 'start') {
      // Subtle 2-tone notification
      playTone(440, 'sine', 0.2, 0, 0.12);
      playTone(587.33, 'sine', 0.25, 90, 0.14);
    } else if (chimeType === 'assign') {
      playTone(523.25, 'sine', 0.2, 0, 0.12);
    } else if (chimeType === 'tick') {
      playTone(880, 'sine', 0.05, 0, 0.04);
    }
  }

  // Toast Notification System
  function showToast(message, type = 'info', duration = 3000) {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `
      ${iconSvg}
      <div style="flex:1;">${message}</div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // Switch Active View (Manager or Full Screen Housekeeper)
  function setView(viewName) {
    [viewBtnManager, viewBtnHousekeeper].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });

    mainViewport.className = `main-viewport view-${viewName}`;

    if (viewName === 'manager' && viewBtnManager) {
      viewBtnManager.classList.add('active');
    } else if (viewName === 'housekeeper' && viewBtnHousekeeper) {
      viewBtnHousekeeper.classList.add('active');
    }

    // Trigger re-render to make sure layout calculations refresh
    window.cnykraManager.renderRooms();
    window.cnykraHousekeeper.renderHousekeeperView();
  }

  // Live Clock
  function updateClocks() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    if (liveClock) liveClock.textContent = timeStr;
  }

  // Setup Global Events & Demo Auth Handlers
  function initGlobalEvents() {
    // View Switcher Buttons
    if (viewBtnManager) {
      viewBtnManager.addEventListener('click', () => setView('manager'));
    }
    if (viewBtnHousekeeper) {
      viewBtnHousekeeper.addEventListener('click', () => setView('housekeeper'));
    }

    // Demo User Profile Button
    if (btnUserAuth) {
      btnUserAuth.addEventListener('click', () => {
        if (modalDemoAuth) modalDemoAuth.classList.remove('hidden');
      });
    }

    // 1-Click Demo Login Cards
    document.querySelectorAll('[data-login-as]').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.getAttribute('data-login-as');
        const user = window.cnykraStore.loginAsDemo(userId);
        if (user) {
          updateUserProfileHeader();
          if (modalDemoAuth) modalDemoAuth.classList.add('hidden');
          playChime('start');
          showToast(`Logged in as ${user.name} (${user.title})`, 'success');

          // Switch automatically to their relevant view
          if (user.role === 'manager') {
            setView('manager');
          } else {
            setView('housekeeper');
          }
        }
      });
    });

    // Manual Login Form
    if (formManualLogin) {
      formManualLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('inputLoginEmail').value;
        const pass = document.getElementById('inputLoginPassword').value;

        try {
          const user = window.cnykraStore.login(email, pass);
          updateUserProfileHeader();
          if (modalDemoAuth) modalDemoAuth.classList.add('hidden');
          playChime('start');
          showToast(`Welcome back, ${user.name}!`, 'success');

          if (user.role === 'manager') {
            setView('manager');
          } else {
            setView('housekeeper');
          }
        } catch (err) {
          showToast(err.message, 'warning');
        }
      });
    }

    // Guest Mode Exploration
    if (btnGuestExplore) {
      btnGuestExplore.addEventListener('click', () => {
        if (modalDemoAuth) modalDemoAuth.classList.add('hidden');
        showToast('Guest exploration active. You can switch between Manager and Housekeeper views freely.', 'info');
      });
    }

    // Theme toggle
    if (btnThemeToggle) {
      btnThemeToggle.addEventListener('click', () => {
        const isLight = document.body.classList.contains('theme-light');
        const newTheme = isLight ? 'dark' : 'light';
        setTheme(newTheme);
        showToast(`Switched to ${newTheme === 'light' ? 'Light' : 'Dark'} Theme`, 'info', 1500);
      });
    }

    // Sound toggle
    if (btnSoundToggle) {
      btnSoundToggle.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        if (soundEnabled) {
          soundIconOn.classList.remove('hidden');
          soundIconOff.classList.add('hidden');
          showToast('Audio feedback enabled 🔔', 'info', 2000);
          playChime('assign');
        } else {
          soundIconOn.classList.add('hidden');
          soundIconOff.classList.remove('hidden');
          showToast('Audio feedback muted 🔕', 'info', 2000);
        }
      });
    }

    // Reset Demo Data
    if (btnResetData) {
      btnResetData.addEventListener('click', () => {
        if (confirm('Reset application back to original hotel demo data? All rooms will be refreshed.')) {
          window.cnykraStore.resetDemoData();
          updateUserProfileHeader();
          showToast('System reset to default hotel dataset.', 'info');
          playChime('start');
        }
      });
    }
  }

  // App Initialization
  function initApp() {
    // Default to Light Theme
    const savedTheme = localStorage.getItem('cnykra_theme') || 'light';
    setTheme(savedTheme);

    initGlobalEvents();
    updateClocks();
    setInterval(updateClocks, 1000);

    // Initialize module controllers
    window.cnykraManager.init();
    window.cnykraHousekeeper.init();

    // Setup initial user
    updateUserProfileHeader();

    // Default to Manager View
    const user = window.cnykraStore.getCurrentUser();
    if (user && user.role === 'housekeeper') {
      setView('housekeeper');
    } else {
      setView('manager');
    }

    // Welcome greeting
    setTimeout(() => {
      showToast('Welcome to Cnykra Housekeeping OS. Click "Demo" in the top bar to switch test accounts.', 'info', 4000);
    }, 600);
  }

  window.cnykraApp = {
    setView,
    showToast,
    playChime
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
