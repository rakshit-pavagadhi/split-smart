import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { groupsAPI } from '../services/api';
import Navbar from '../components/layout/Navbar';
import { groupTypeConfig, timeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineSearch, HiOutlineKey, HiOutlineX, HiOutlineClipboardCopy } from 'react-icons/hi';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(searchParams.get('create') === 'true');
  const [showJoin, setShowJoin] = useState(searchParams.get('join') === 'true');
  const [search, setSearch] = useState('');

  // Create form
  const [newGroup, setNewGroup] = useState({ name: '', type: 'Custom', description: '' });
  const [creating, setCreating] = useState(false);

  // Join form
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await groupsAPI.getAll();
      setGroups(res.data.groups || []);
    } catch (err) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await groupsAPI.create(newGroup);
      toast.success('Group created! 🎉');
      setShowCreate(false);
      setNewGroup({ name: '', type: 'Custom', description: '' });
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoining(true);
    try {
      await groupsAPI.join({ inviteCode });
      toast.success('Joined group! 🎉');
      setShowJoin(false);
      setInviteCode('');
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const groupTypes = ['Travel', 'Hostel', 'Event', 'Custom'];

  return (
    <div className="bg-gradient-dark bg-pattern" style={{ minHeight: '100vh' }}>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div className="animate-fadeIn" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '16px', marginBottom: '28px',
        }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>
              Your Groups
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
              Manage and track shared expenses
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" onClick={() => setShowJoin(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HiOutlineKey size={16} /> Join
            </button>
            <button className="btn-primary" onClick={() => setShowCreate(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HiOutlinePlus size={16} /> Create Group
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '24px' }} className="animate-fadeIn">
          <HiOutlineSearch size={18} style={{
            position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
            color: '#64748b',
          }} />
          <input
            className="input-field"
            style={{ paddingLeft: '42px', maxWidth: '400px' }}
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Group grid */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
          }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton" style={{ height: '160px', borderRadius: '16px' }} />
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="card-static animate-fadeIn" style={{
            textAlign: 'center', padding: '60px 24px',
          }}>
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>📭</p>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
              {search ? 'No groups found' : 'No groups yet'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
              {search ? 'Try a different search term' : 'Create a group or join one with an invite code'}
            </p>
            {!search && (
              <button className="btn-primary" onClick={() => setShowCreate(true)}>
                Create Your First Group
              </button>
            )}
          </div>
        ) : (
          <div className="stagger-children" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
          }}>
            {filteredGroups.map(group => {
              const typeConf = groupTypeConfig[group.type] || groupTypeConfig.Custom;
              return (
                <Link to={`/groups/${group._id}`} key={group._id} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ cursor: 'pointer', height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '14px',
                        background: `${typeConf.color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '24px',
                      }}>
                        {typeConf.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0' }}>{group.name}</h3>
                        <span className="badge badge-primary" style={{ fontSize: '11px', marginTop: '4px' }}>
                          {group.type}
                        </span>
                      </div>
                    </div>

                    {group.description && (
                      <p style={{
                        color: '#64748b', fontSize: '13px', marginBottom: '16px',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {group.description}
                      </p>
                    )}

                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      paddingTop: '12px', borderTop: '1px solid rgba(99,102,241,0.06)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Member avatars stacked */}
                        <div style={{ display: 'flex' }}>
                          {(group.members || []).slice(0, 3).map((m, i) => (
                            <div key={i} style={{
                              width: '28px', height: '28px', borderRadius: '8px',
                              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                              border: '2px solid #1e293b',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '10px', fontWeight: 700, color: 'white',
                              marginLeft: i > 0 ? '-8px' : '0',
                              zIndex: 3 - i,
                            }}>
                              {m.user?.name?.[0] || '?'}
                            </div>
                          ))}
                          {(group.members?.length || 0) > 3 && (
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '8px',
                              background: '#334155',
                              border: '2px solid #1e293b',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '9px', fontWeight: 700, color: '#94a3b8',
                              marginLeft: '-8px',
                            }}>
                              +{group.members.length - 3}
                            </div>
                          )}
                        </div>
                        <span style={{ color: '#64748b', fontSize: '12px' }}>
                          {group.members?.length || 0} members
                        </span>
                      </div>
                      <span style={{ color: '#475569', fontSize: '11px' }}>
                        {timeAgo(group.createdAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Group Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#e2e8f0' }}>
                Create New Group
              </h2>
              <button className="btn-ghost" onClick={() => setShowCreate(false)} style={{ padding: '6px' }}>
                <HiOutlineX size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '6px' }}>
                  Group Name
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. Goa Trip 2024"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '10px' }}>
                  Group Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {groupTypes.map(type => {
                    const conf = groupTypeConfig[type];
                    const selected = newGroup.type === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewGroup({ ...newGroup, type })}
                        style={{
                          padding: '14px 10px', borderRadius: '12px',
                          background: selected ? `${conf.color}20` : 'rgba(15,23,42,0.6)',
                          border: `1px solid ${selected ? conf.color + '60' : 'rgba(99,102,241,0.08)'}`,
                          cursor: 'pointer', textAlign: 'center',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>{conf.icon}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: selected ? conf.color : '#94a3b8' }}>
                          {type}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '6px' }}>
                  Description (optional)
                </label>
                <textarea
                  className="input-field"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="What's this group for?"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-primary" disabled={creating}
                style={{ width: '100%', padding: '14px' }}>
                {creating ? 'Creating...' : '✨ Create Group'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoin && (
        <div className="modal-overlay" onClick={() => setShowJoin(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#e2e8f0' }}>
                Join a Group
              </h2>
              <button className="btn-ghost" onClick={() => setShowJoin(false)} style={{ padding: '6px' }}>
                <HiOutlineX size={20} />
              </button>
            </div>

            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '6px' }}>
                  Invite Code
                </label>
                <div style={{ position: 'relative' }}>
                  <HiOutlineKey size={18} style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    color: '#64748b',
                  }} />
                  <input
                    className="input-field"
                    style={{ paddingLeft: '42px', fontSize: '18px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}
                    placeholder="ABC123"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>
                <p style={{ color: '#475569', fontSize: '12px', marginTop: '8px' }}>
                  Ask the group admin for the invite code
                </p>
              </div>

              <button type="submit" className="btn-accent" disabled={joining}
                style={{ width: '100%', padding: '14px' }}>
                {joining ? 'Joining...' : '🤝 Join Group'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
