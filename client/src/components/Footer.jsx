export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-brand-section">
          <div className="footer-logo">
            <span className="footer-logo-icon">✦</span>
            <span className="footer-brand-title">CNYKRA</span>
          </div>
          <p className="footer-tagline">
            Grand Resort & Suites • Housekeeping Operations & Turnover System
          </p>
        </div>

        <div className="footer-meta-grid">
          <div className="footer-meta-item">
            <span className="footer-meta-lbl">Operational Shift</span>
            <span className="footer-meta-val">Morning (07:00 – 15:30)</span>
          </div>
          <div className="footer-meta-item">
            <span className="footer-meta-lbl">System Standard</span>
            <span className="footer-meta-val">Forbes 5-Star Certified</span>
          </div>
          <div className="footer-meta-item">
            <span className="footer-meta-lbl">Internal Extension</span>
            <span className="footer-meta-val">Desk Ext: 4001 • HK: 4005</span>
          </div>
          <div className="footer-meta-item">
            <span className="footer-meta-lbl">Database Status</span>
            <span className="footer-meta-val status-online">
              <span className="online-dot"></span> Online & Synchronized
            </span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copy">
          © {new Date().getFullYear()} CNYKRA Hospitality Group. Confidential & Proprietary Internal OS.
          <span className="footer-credit"> • Developed by Lalit Mohan Agnihotri</span>
        </p>
        <span className="footer-badge">Role-Based Access Control v1.2</span>
      </div>
    </footer>
  );
}
