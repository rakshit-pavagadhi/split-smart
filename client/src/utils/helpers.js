// Avatar color generator based on name
export const getAvatarColor = (name) => {
  const colors = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #f43f5e, #e11d48)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #06b6d4, #0891b2)',
    'linear-gradient(135deg, #ec4899, #db2777)',
    'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    'linear-gradient(135deg, #14b8a6, #0d9488)',
  ];
  
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format date
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Format relative time
export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date);
};

// Category icons and colors
export const categoryConfig = {
  Food: { icon: '🍔', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  Transport: { icon: '🚗', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
  Accommodation: { icon: '🏨', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  Entertainment: { icon: '🎬', color: '#ec4899', bg: 'rgba(236,72,153,0.15)' },
  Shopping: { icon: '🛍️', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  Utilities: { icon: '💡', color: '#64748b', bg: 'rgba(100,116,139,0.15)' },
  Medical: { icon: '🏥', color: '#f43f5e', bg: 'rgba(244,63,94,0.15)' },
  Education: { icon: '📚', color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  Other: { icon: '📦', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
};

// Group type config
export const groupTypeConfig = {
  Travel: { icon: '✈️', color: '#06b6d4' },
  Hostel: { icon: '🏠', color: '#10b981' },
  Event: { icon: '🎉', color: '#f59e0b' },
  Custom: { icon: '⚡', color: '#8b5cf6' },
};
