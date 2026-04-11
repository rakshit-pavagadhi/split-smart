import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { groupsAPI, expensesAPI, balancesAPI, settlementsAPI, analyticsAPI, paymentsAPI, receiptAPI } from '../services/api';
import Navbar from '../components/layout/Navbar';
import { formatCurrency, formatDate, timeAgo, categoryConfig, groupTypeConfig, getInitials, getAvatarColor } from '../utils/helpers';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineX, HiOutlineClipboardCopy, HiOutlineTrash, HiOutlineCheck, HiOutlineClock, HiOutlineDownload, HiOutlineArrowLeft } from 'react-icons/hi';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6', '#64748b'];

const GroupDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('expenses');
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balanceSummary, setBalanceSummary] = useState([]);
  const [pairwiseDebts, setPairwiseDebts] = useState([]);
  const [suggestions, setSuggestions] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [memberData, setMemberData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Add expense form
  const [expForm, setExpForm] = useState({
    description: '', amount: '', category: 'Other',
    paidBy: '', splitType: 'equal', splits: []
  });

  useEffect(() => {
    fetchGroupData();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'balances') fetchBalances();
    if (activeTab === 'settlements') fetchSettlements();
    if (activeTab === 'analytics') fetchAnalytics();
  }, [activeTab]);

  const fetchGroupData = async () => {
    try {
      const [groupRes, expRes] = await Promise.all([
        groupsAPI.getById(id),
        expensesAPI.getAll(id)
      ]);
      setGroup(groupRes.data.group);
      setExpenses(expRes.data.expenses || []);
      setExpForm(prev => ({
        ...prev,
        paidBy: user._id
      }));
    } catch (err) {
      toast.error('Failed to load group');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalances = async () => {
    try {
      const [summaryRes, pairwiseRes, suggestRes] = await Promise.all([
        balancesAPI.getSummary(id),
        balancesAPI.getPairwise(id),
        settlementsAPI.getSuggestions(id)
      ]);
      setBalanceSummary(summaryRes.data.summary || []);
      setPairwiseDebts(pairwiseRes.data.debts || []);
      setSuggestions(suggestRes.data);
    } catch (err) {
      console.error('Failed to load balances:', err);
    }
  };

  const fetchSettlements = async () => {
    try {
      const [settRes, suggestRes] = await Promise.all([
        settlementsAPI.getAll(id),
        settlementsAPI.getSuggestions(id)
      ]);
      setSettlements(settRes.data.settlements || []);
      setSuggestions(suggestRes.data);
    } catch (err) {
      console.error('Failed to load settlements:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const [catRes, monthRes, memRes] = await Promise.all([
        analyticsAPI.getCategory(id),
        analyticsAPI.getMonthly(id),
        analyticsAPI.getMembers(id)
      ]);
      setCategoryData(catRes.data.data || []);
      setMonthlyData(monthRes.data.data || []);
      setMemberData(memRes.data.data || []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await expensesAPI.add(id, {
        ...expForm,
        amount: parseFloat(expForm.amount)
      });
      toast.success('Expense added! 💰');
      setShowAddExpense(false);
      setExpForm({ description: '', amount: '', category: 'Other', paidBy: user._id, splitType: 'equal', splits: [] });
      fetchGroupData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add expense');
    }
  };

  const handleDeleteExpense = async (eid) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await expensesAPI.delete(id, eid);
      toast.success('Expense deleted');
      fetchGroupData();
    } catch (err) {
      toast.error('Failed to delete expense');
    }
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    const toastId = toast.loading('Scanning receipt... 📸');
    
    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const res = await receiptAPI.scan(formData);
      const { description, amount, category } = res.data.data;
      
      setExpForm(prev => ({
        ...prev,
        description: description || prev.description,
        amount: amount || prev.amount,
        category: category || prev.category
      }));
      toast.success('Receipt data extracted!', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to scan receipt', { id: toastId });
    } finally {
      setIsScanning(false);
      e.target.value = '';
    }
  };

  const openRazorpayCheckout = (orderData, settlementId, isMock) => {
    if (isMock) {
      // Mock mode — simulate success directly
      handlePaymentSuccess({
        razorpay_order_id: orderData.id,
        razorpay_payment_id: `mock_pay_${Date.now()}`,
        razorpay_signature: 'mock_signature',
      }, settlementId, true);
      return;
    }

    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      name: 'SplitSmart',
      description: `Settlement Payment — ${group?.name || 'Group'}`,
      order_id: orderData.id,
      handler: (response) => {
        handlePaymentSuccess(response, settlementId, false);
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
      },
      theme: {
        color: '#6366f1',
      },
      modal: {
        ondismiss: () => {
          toast.error('Payment cancelled');
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      toast.error(`Payment failed: ${response.error.description}`);
    });
    rzp.open();
  };

  const handlePaymentSuccess = async (response, settlementId, isMock) => {
    try {
      await paymentsAPI.verify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        settlementId,
        mock: isMock,
      });
      toast.success('Payment successful! Settlement completed ✅');
      fetchSettlements();
      fetchBalances();
    } catch (err) {
      toast.error('Payment verification failed');
    }
  };

  const handleSettle = async (suggestion) => {
    try {
      // Step 1: Create Razorpay order (also creates the settlement record)
      const res = await paymentsAPI.createOrder({
        amount: suggestion.amount,
        groupId: id,
        from: suggestion.from._id,
        to: suggestion.to._id,
      });

      const { order, key, mock } = res.data;

      // Step 2: Open Razorpay checkout with the exact amount
      openRazorpayCheckout({ ...order, key }, order.settlementId, mock);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
    }
  };

  const handleMarkComplete = async (settlement) => {
    try {
      // Create a Razorpay order for this existing pending settlement
      const res = await paymentsAPI.createOrder({
        amount: settlement.amount,
        settlementId: settlement._id,
      });

      const { order, key, mock } = res.data;

      // Open Razorpay checkout
      openRazorpayCheckout({ ...order, key }, settlement._id, mock);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await analyticsAPI.exportCSV(id);
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `splitsmart_${group?.name || 'ledger'}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported!');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(group?.inviteCode);
    toast.success('Invite code copied!');
  };

  if (loading) {
    return (
      <div className="bg-gradient-dark" style={{ minHeight: '100vh' }}>
        <Navbar />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
          <div className="skeleton" style={{ height: '80px', marginBottom: '24px' }} />
          <div className="skeleton" style={{ height: '48px', marginBottom: '24px' }} />
          <div className="skeleton" style={{ height: '400px' }} />
        </div>
      </div>
    );
  }

  const typeConf = groupTypeConfig[group?.type] || groupTypeConfig.Custom;
  const tabs = ['expenses', 'balances', 'settlements', 'analytics'];

  return (
    <div className="bg-gradient-dark bg-pattern" style={{ minHeight: '100vh' }}>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Back button + header */}
        <div className="animate-fadeIn">
          <button className="btn-ghost" onClick={() => navigate('/groups')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', padding: '6px 12px' }}>
            <HiOutlineArrowLeft size={16} /> Back to Groups
          </button>

          <div className="card-static" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '16px', marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: `${typeConf.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px',
              }}>
                {typeConf.icon}
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>
                  {group?.name}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                  <span className="badge badge-primary">{group?.type}</span>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>
                    {group?.members?.length} members
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button className="btn-secondary" onClick={copyInviteCode}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <HiOutlineClipboardCopy size={16} />
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{group?.inviteCode}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-list" style={{ marginBottom: '24px' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              className={`tab-item ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="page-enter">
          {/* EXPENSES TAB */}
          {activeTab === 'expenses' && (
            <div className="animate-fadeIn">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>
                  Expenses ({expenses.length})
                </h2>
                <button className="btn-primary" onClick={() => setShowAddExpense(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HiOutlinePlus size={16} /> Add Expense
                </button>
              </div>

              {expenses.length === 0 ? (
                <div className="card-static" style={{ textAlign: 'center', padding: '48px' }}>
                  <p style={{ fontSize: '48px', marginBottom: '12px' }}>💰</p>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
                    No expenses yet
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
                    Add your first expense to start tracking
                  </p>
                  <button className="btn-primary" onClick={() => setShowAddExpense(true)}>
                    Add First Expense
                  </button>
                </div>
              ) : (
                <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {expenses.map(exp => {
                    const catConf = categoryConfig[exp.category] || categoryConfig.Other;
                    return (
                      <div key={exp._id} className="card" style={{ cursor: 'default' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            background: catConf.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '20px',
                          }}>
                            {catConf.icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>
                                {exp.description}
                              </h3>
                              <span style={{ fontSize: '18px', fontWeight: 800, color: '#f1f5f9' }}>
                                {formatCurrency(exp.amount)}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                              <span style={{ color: '#64748b', fontSize: '12px' }}>
                                Paid by <strong style={{ color: '#a5b4fc' }}>{exp.paidBy?.name}</strong>
                              </span>
                              <span style={{ color: '#475569' }}>•</span>
                              <span className="badge" style={{ background: catConf.bg, color: catConf.color, fontSize: '11px' }}>
                                {exp.category}
                              </span>
                              <span style={{ color: '#475569' }}>•</span>
                              <span style={{ color: '#475569', fontSize: '12px' }}>{formatDate(exp.date)}</span>
                            </div>
                            {/* Split details */}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                              {exp.splits?.map((s, i) => (
                                <span key={i} style={{
                                  fontSize: '11px', padding: '2px 8px', borderRadius: '6px',
                                  background: 'rgba(99,102,241,0.06)', color: '#94a3b8',
                                }}>
                                  {s.user?.name}: {formatCurrency(s.amount)}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button className="btn-ghost" onClick={() => handleDeleteExpense(exp._id)}
                            style={{ padding: '8px', color: '#f43f5e' }}>
                            <HiOutlineTrash size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* BALANCES TAB */}
          {activeTab === 'balances' && (
            <div className="animate-fadeIn">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                {/* Net balances */}
                <div className="card-static">
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', marginBottom: '16px' }}>
                    Net Balances
                  </h3>
                  {balanceSummary.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '24px' }}>
                      All settled up! ✨
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {balanceSummary.map((item, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px', borderRadius: '12px',
                          background: item.balance > 0 ? 'rgba(16,185,129,0.06)' : 'rgba(244,63,94,0.06)',
                          border: `1px solid ${item.balance > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)'}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="avatar avatar-sm"
                              style={{ background: getAvatarColor(item.user?.name) }}>
                              {getInitials(item.user?.name)}
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '14px', color: '#e2e8f0' }}>
                              {item.user?.name}
                            </span>
                          </div>
                          <span style={{
                            fontWeight: 800, fontSize: '16px',
                            color: item.balance > 0 ? '#10b981' : '#f43f5e'
                          }}>
                            {item.balance > 0 ? '+' : ''}{formatCurrency(item.balance)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pairwise debts */}
                <div className="card-static">
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', marginBottom: '16px' }}>
                    Who Owes Whom
                  </h3>
                  {pairwiseDebts.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '24px' }}>
                      No outstanding debts 🎉
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {pairwiseDebts.map((debt, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '12px', borderRadius: '12px',
                          background: 'rgba(99,102,241,0.04)',
                          border: '1px solid rgba(99,102,241,0.08)',
                        }}>
                          <div className="avatar avatar-sm"
                            style={{ background: getAvatarColor(debt.from?.name) }}>
                            {getInitials(debt.from?.name)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '13px', color: '#e2e8f0' }}>
                              <strong>{debt.from?.name}</strong>
                              <span style={{ color: '#64748b' }}> owes </span>
                              <strong>{debt.to?.name}</strong>
                            </span>
                          </div>
                          <span style={{ fontWeight: 800, color: '#f43f5e', fontSize: '15px' }}>
                            {formatCurrency(debt.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Optimized settlements */}
              {suggestions && suggestions.suggestions?.length > 0 && (
                <div className="card-static" style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0' }}>
                      ⚡ Optimized Settlements
                    </h3>
                    {suggestions.savings > 0 && (
                      <span className="badge badge-success">
                        Saved {suggestions.savings} transactions
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {suggestions.suggestions.map((s, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '14px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(139,92,246,0.04))',
                        border: '1px solid rgba(99,102,241,0.1)',
                      }}>
                        <div className="avatar avatar-sm"
                          style={{ background: getAvatarColor(s.from?.name) }}>
                          {getInitials(s.from?.name)}
                        </div>
                        <span style={{ fontSize: '14px', color: '#e2e8f0', flex: 1 }}>
                          <strong>{s.from?.name}</strong>
                          <span style={{ color: '#64748b' }}> pays </span>
                          <strong>{s.to?.name}</strong>
                        </span>
                        <span style={{ fontWeight: 800, color: '#a5b4fc', fontSize: '16px' }}>
                          {formatCurrency(s.amount)}
                        </span>
                        <button className="btn-accent" onClick={() => handleSettle(s)}
                          style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          💳 Pay & Settle
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SETTLEMENTS TAB */}
          {activeTab === 'settlements' && (
            <div className="animate-fadeIn">
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0', marginBottom: '20px' }}>
                Settlement History
              </h2>

              {settlements.length === 0 ? (
                <div className="card-static" style={{ textAlign: 'center', padding: '48px' }}>
                  <p style={{ fontSize: '48px', marginBottom: '12px' }}>🤝</p>
                  <p style={{ color: '#64748b', fontSize: '14px' }}>
                    No settlements yet. Go to Balances tab to see optimized settlements.
                  </p>
                </div>
              ) : (
                <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {settlements.map(s => (
                    <div key={s._id} className="card" style={{ cursor: 'default' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '44px', height: '44px', borderRadius: '12px',
                          background: s.status === 'completed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {s.status === 'completed' ? 
                            <HiOutlineCheck size={20} color="#10b981" /> : 
                            <HiOutlineClock size={20} color="#f59e0b" />
                          }
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '14px', color: '#e2e8f0' }}>
                            <strong>{s.from?.name}</strong>
                            <span style={{ color: '#64748b' }}> → </span>
                            <strong>{s.to?.name}</strong>
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <span className={`badge badge-${s.status === 'completed' ? 'success' : 'warning'}`}>
                              {s.status}
                            </span>
                            <span style={{ color: '#475569', fontSize: '12px' }}>{timeAgo(s.createdAt)}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: '#f1f5f9' }}>
                          {formatCurrency(s.amount)}
                        </span>
                        {s.status === 'pending' && (
                          <button className="btn-accent" onClick={() => handleMarkComplete(s)}
                            style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            💳 Pay
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="animate-fadeIn">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>Analytics</h2>
                <button className="btn-secondary" onClick={handleExportCSV}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <HiOutlineDownload size={16} /> Export CSV
                </button>
              </div>

              {expenses.length === 0 ? (
                <div className="card-static" style={{ textAlign: 'center', padding: '48px' }}>
                  <p style={{ fontSize: '48px', marginBottom: '12px' }}>📊</p>
                  <p style={{ color: '#64748b', fontSize: '14px' }}>
                    Add expenses to see analytics
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                  gap: '20px',
                }}>
                  {/* Category Pie Chart */}
                  <div className="card-static">
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', marginBottom: '16px' }}>
                      Spending by Category
                    </h3>
                    {categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="total"
                            nameKey="category"
                          >
                            {categoryData.map((entry, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: '#1e293b', border: '1px solid rgba(99,102,241,0.2)',
                              borderRadius: '12px', color: '#e2e8f0',
                            }}
                            formatter={(value) => formatCurrency(value)}
                          />
                          <Legend
                            formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No data</p>
                    )}
                  </div>

                  {/* Monthly Bar Chart */}
                  <div className="card-static">
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', marginBottom: '16px' }}>
                      Monthly Trends
                    </h3>
                    {monthlyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={monthlyData}>
                          <XAxis dataKey="month" stroke="#475569" fontSize={12} />
                          <YAxis stroke="#475569" fontSize={12} tickFormatter={(v) => `₹${v}`} />
                          <Tooltip
                            contentStyle={{
                              background: '#1e293b', border: '1px solid rgba(99,102,241,0.2)',
                              borderRadius: '12px', color: '#e2e8f0',
                            }}
                            formatter={(value) => formatCurrency(value)}
                          />
                          <Bar dataKey="total" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366f1" />
                              <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No data</p>
                    )}
                  </div>

                  {/* Member Contributions */}
                  <div className="card-static" style={{ gridColumn: 'span 1' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', marginBottom: '16px' }}>
                      Member Contributions
                    </h3>
                    {memberData.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {memberData.map((m, i) => (
                          <div key={i}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="avatar avatar-sm"
                                  style={{ background: getAvatarColor(m.user?.name) }}>
                                  {getInitials(m.user?.name)}
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                                  {m.user?.name}
                                </span>
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: '#a5b4fc' }}>
                                {formatCurrency(m.totalPaid)} ({m.percentage}%)
                              </span>
                            </div>
                            <div style={{
                              height: '6px', borderRadius: '3px',
                              background: 'rgba(99,102,241,0.1)', overflow: 'hidden',
                            }}>
                              <div style={{
                                width: `${m.percentage}%`, height: '100%',
                                background: CHART_COLORS[i % CHART_COLORS.length],
                                borderRadius: '3px',
                                transition: 'width 0.8s ease',
                              }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No data</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="modal-overlay" onClick={() => setShowAddExpense(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#e2e8f0' }}>Add Expense</h2>
              <button className="btn-ghost" onClick={() => setShowAddExpense(false)} style={{ padding: '6px' }}>
                <HiOutlineX size={20} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Receipt Scanner UI */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.06))',
                border: '1px dashed rgba(99,102,241,0.3)',
                borderRadius: '12px', padding: '16px', textAlign: 'center', cursor: 'pointer'
              }}>
                <input type="file" id="receipt-upload" accept="image/jpeg, image/png, image/webp" 
                       style={{ display: 'none' }} onChange={handleReceiptUpload} disabled={isScanning} />
                <label htmlFor="receipt-upload" style={{ cursor: isScanning ? 'wait' : 'pointer', display: 'block' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🧾</div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>
                    {isScanning ? 'Scanning with AI...' : 'Smart Receipt Scanner'}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>
                    {isScanning ? 'Extracting details, please wait...' : 'Upload a photo of your bill to auto-fill details'}
                  </p>
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '6px' }}>
                  Description
                </label>
                <input className="input-field" placeholder="e.g. Dinner at restaurant"
                  value={expForm.description}
                  onChange={e => setExpForm({ ...expForm, description: e.target.value })} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '6px' }}>
                    Amount (₹)
                  </label>
                  <input className="input-field" type="number" step="0.01" min="0.01" placeholder="0.00"
                    value={expForm.amount}
                    onChange={e => setExpForm({ ...expForm, amount: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select className="input-field" value={expForm.category}
                    onChange={e => setExpForm({ ...expForm, category: e.target.value })}>
                    {Object.keys(categoryConfig).map(cat => (
                      <option key={cat} value={cat}>{categoryConfig[cat].icon} {cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '6px' }}>
                  Paid by
                </label>
                <select className="input-field" value={expForm.paidBy}
                  onChange={e => setExpForm({ ...expForm, paidBy: e.target.value })}>
                  {group?.members?.map(m => (
                    <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '10px' }}>
                  Split Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {['equal', 'percentage', 'custom'].map(type => (
                    <button key={type} type="button"
                      onClick={() => setExpForm({ ...expForm, splitType: type, splits: [] })}
                      style={{
                        padding: '10px', borderRadius: '10px',
                        background: expForm.splitType === type ? 'rgba(99,102,241,0.15)' : 'rgba(15,23,42,0.6)',
                        border: `1px solid ${expForm.splitType === type ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.08)'}`,
                        color: expForm.splitType === type ? '#a5b4fc' : '#64748b',
                        cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                        fontFamily: 'inherit',
                      }}>
                      {type === 'equal' ? '÷ Equal' : type === 'percentage' ? '% Percent' : '✏️ Custom'}
                    </button>
                  ))}
                </div>
              </div>

              {expForm.splitType !== 'equal' && (
                <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px', background: 'rgba(15,23,42,0.4)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.1)' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '4px' }}>
                    {expForm.splitType === 'percentage' ? 'Enter Percentages (%) ensuring it totals 100%' : 'Enter Exact Amounts (₹) matching total amount'}
                  </label>
                  {group?.members?.map(m => {
                    const splitObj = expForm.splits.find(s => s.user === m.user._id) || {};
                    const splitVal = expForm.splitType === 'percentage' ? splitObj.percentage || '' : splitObj.amount || '';
                    return (
                      <div key={m.user._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: '#e2e8f0', fontSize: '14px', flex: 1 }}>{m.user.name}</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="input-field"
                          style={{ width: '100px', padding: '8px 12px' }}
                          placeholder="0"
                          value={splitVal}
                          onChange={e => {
                            const val = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                            const field = expForm.splitType === 'percentage' ? 'percentage' : 'amount';
                            setExpForm(prev => {
                              const newSplits = [...prev.splits];
                              const idx = newSplits.findIndex(s => s.user === m.user._id);
                              if (idx >= 0) {
                                newSplits[idx][field] = val;
                              } else {
                                newSplits.push({ user: m.user._id, [field]: val });
                              }
                              return { ...prev, splits: newSplits };
                            });
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', marginTop: '4px' }}>
                💰 Add Expense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetail;
