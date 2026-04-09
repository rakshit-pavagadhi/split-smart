import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials, getAvatarColor } from '../../utils/helpers';
import { HiOutlineMenu, HiOutlineX, HiOutlineBell, HiOutlineLogout, HiOutlineUser } from 'react-icons/hi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/groups', label: 'Groups' },
  ];

  return (
    <nav className="glass" style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      borderBottom: '1px solid rgba(99,102,241,0.08)',
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      borderRadius: 0,
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
      }}>
        {/* Logo */}
        <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>💸</span>
          <span className="gradient-text" style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            SplitSmart
          </span>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="hidden-mobile">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 500,
                color: location.pathname.startsWith(link.to) ? '#a5b4fc' : '#94a3b8',
                background: location.pathname.startsWith(link.to) ? 'rgba(99,102,241,0.1)' : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Notifications Removed */}
          {/* Profile dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '4px',
              }}
            >
              <div 
                className="avatar avatar-sm" 
                style={{ background: getAvatarColor(user?.name) }}
              >
                {getInitials(user?.name)}
              </div>
              <span style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 500 }}
                className="hidden-mobile">
                {user?.name}
              </span>
            </button>

            {profileOpen && (
              <div className="animate-slideDown" style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                background: '#1e293b', border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: '14px', padding: '8px', minWidth: '180px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              }}>
                <button
                  onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                  className="btn-ghost"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    width: '100%', justifyContent: 'flex-start',
                    padding: '10px 14px',
                  }}
                >
                  <HiOutlineUser size={16} /> Profile
                </button>
                <div style={{ height: '1px', background: 'rgba(99,102,241,0.1)', margin: '4px 0' }} />
                <button
                  onClick={handleLogout}
                  className="btn-ghost"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    width: '100%', justifyContent: 'flex-start',
                    padding: '10px 14px', color: '#f43f5e',
                  }}
                >
                  <HiOutlineLogout size={16} /> Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="btn-ghost visible-mobile"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ padding: '8px' }}
          >
            {menuOpen ? <HiOutlineX size={22} /> : <HiOutlineMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="animate-slideDown visible-mobile" style={{
          padding: '12px 24px 20px',
          borderTop: '1px solid rgba(99,102,241,0.08)',
        }}>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block',
                textDecoration: 'none',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 500,
                color: location.pathname.startsWith(link.to) ? '#a5b4fc' : '#94a3b8',
                background: location.pathname.startsWith(link.to) ? 'rgba(99,102,241,0.1)' : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (min-width: 769px) {
          .visible-mobile { display: none !important; }
        }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
