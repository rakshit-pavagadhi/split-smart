import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { groupsAPI, expensesAPI } from '../services/api';
import Navbar from '../components/layout/Navbar';
import { formatCurrency, groupTypeConfig, timeAgo } from '../utils/helpers';
import { HiOutlinePlus, HiOutlineUserGroup, HiOutlineCash, HiOutlineTrendingUp, HiOutlineArrowRight } from 'react-icons/hi';

const Dashboard = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalGroups: 0, totalExpenses: 0, totalSpent: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await groupsAPI.getAll();
      const groupsList = res.data.groups || [];
      setGroups(groupsList);

      let totalExpenses = 0;
      let totalSpent = 0;

      for (const group of groupsList.slice(0, 5)) {
        try {
          const expRes = await expensesAPI.getAll(group._id);
          const exps = expRes.data.expenses || [];
          totalExpenses += exps.length;
          totalSpent += exps.reduce((sum, e) => sum + e.amount, 0);
        } catch {}
      }

      setStats({ totalGroups: groupsList.length, totalExpenses, totalSpent });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Active Groups',
      value: stats.totalGroups,
      icon: <HiOutlineUserGroup size={24} />,
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.1)',
    },
    {
      label: 'Total Expenses',
      value: stats.totalExpenses,
      icon: <HiOutlineCash size={24} />,
      color: '#10b981',
      bg: 'rgba(16,185,129,0.1)',
    },
    {
      label: 'Total Spent',
      value: formatCurrency(stats.totalSpent),
      icon: <HiOutlineTrendingUp size={24} />,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
    },
  ];

  return (
    <div className="bg-gradient-dark bg-pattern" style={{ minHeight: '100vh' }}>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Welcome section */}
        <div className="animate-fadeIn" style={{ marginBottom: '36px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '6px' }}>
            Here's what's happening with your shared expenses
          </p>
        </div>

        {/* Stats cards */}
        <div className="stagger-children" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '36px',
        }}>
          {statCards.map((stat, i) => (
            <div key={i} className="card" style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              cursor: 'default',
            }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: stat.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: stat.color,
              }}>
                {stat.icon}
              </div>
              <div>
                <p style={{ color: '#64748b', fontSize: '13px', fontWeight: 500 }}>{stat.label}</p>
                <p style={{
                  fontSize: '24px', fontWeight: 800, color: '#f1f5f9',
                  letterSpacing: '-0.5px', marginTop: '2px',
                }}>
                  {loading ? '—' : stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions + Recent groups */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
          gap: '24px',
        }}>
          {/* Quick Actions */}
          <div className="card-static animate-slideUp" style={{ animationDelay: '100ms' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0', marginBottom: '20px' }}>
              Quick Actions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link to="/groups?create=true" style={{ textDecoration: 'none' }}>
                <div className="card" style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '16px', cursor: 'pointer',
                }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <HiOutlinePlus size={22} color="white" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '14px' }}>Create New Group</p>
                    <p style={{ color: '#64748b', fontSize: '12px' }}>Start splitting expenses</p>
                  </div>
                  <HiOutlineArrowRight size={18} color="#64748b" style={{ marginLeft: 'auto' }} />
                </div>
              </Link>
              <Link to="/groups?join=true" style={{ textDecoration: 'none' }}>
                <div className="card" style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '16px', cursor: 'pointer',
                }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <HiOutlineUserGroup size={22} color="white" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '14px' }}>Join a Group</p>
                    <p style={{ color: '#64748b', fontSize: '12px' }}>Enter an invite code</p>
                  </div>
                  <HiOutlineArrowRight size={18} color="#64748b" style={{ marginLeft: 'auto' }} />
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Groups */}
          <div className="card-static animate-slideUp" style={{ animationDelay: '200ms' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>
                Recent Groups
              </h2>
              <Link to="/groups" style={{ color: '#6366f1', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
                View all →
              </Link>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton" style={{ height: '60px', borderRadius: '12px' }} />
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#475569' }}>
                <p style={{ fontSize: '36px', marginBottom: '8px' }}>📭</p>
                <p style={{ fontSize: '14px' }}>No groups yet. Create or join one!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {groups.slice(0, 4).map(group => {
                  const typeConf = groupTypeConfig[group.type] || groupTypeConfig.Custom;
                  return (
                    <Link to={`/groups/${group._id}`} key={group._id} style={{ textDecoration: 'none' }}>
                      <div className="card" style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        padding: '14px 16px', cursor: 'pointer',
                      }}>
                        <span style={{ fontSize: '24px' }}>{typeConf.icon}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '14px' }}>{group.name}</p>
                          <p style={{ color: '#64748b', fontSize: '12px' }}>
                            {group.members?.length || 0} members · {timeAgo(group.createdAt)}
                          </p>
                        </div>
                        <span className="badge badge-primary" style={{ fontSize: '11px' }}>
                          {group.type}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
