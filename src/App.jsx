import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react';

/* --- SUPABASE CONFIGURATION --- */
const SUPABASE_URL = 'https://dazdiaigbsujajdepwpu.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_EuM0_lMAwowYEYTj73gx9A_oty9gbEp';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export default function App() {
  const [activeTab, setActiveTab] = useState('terminal');
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [actionType, setActionType] = useState('CHECK_IN'); // 'CHECK_IN' or 'CHECK_OUT'
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [checkIns, setCheckIns] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // 1. Fetch staff list
    const { data: staffData } = await supabase.from('staff').select('*');
    if (staffData) setStaffList(staffData);

    // 2. Fetch logs with joined staff relation
    const { data: logData, error } = await supabase
      .from('attendance_logs')
      .select('*, staff(*)')
      .order('timestamp', { ascending: false });

    if (!error && logData) setCheckIns(logData);
  };

  const getStaffName = (staffObj, staffId) => {
    if (staffObj) {
      if (staffObj.name) return staffObj.name;
      if (staffObj.full_name) return staffObj.full_name;
      if (staffObj.staff_name) return staffObj.staff_name;
      const textVal = Object.values(staffObj).find(val => typeof val === 'string' && val.length > 1 && !val.includes('-'));
      if (textVal) return textVal;
    }
    const found = staffList.find(s => String(s.id).trim() === String(staffId).trim());
    if (found) {
      return found.name || found.full_name || found.staff_name || Object.values(found).find(v => typeof v === 'string' && !v.includes('-')) || staffId;
    }
    return staffId;
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    if (!selectedStaff) {
      setStatusMessage({ type: 'error', text: 'Please select your name from the list.' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    const staffObj = staffList.find(s => String(s.id) === String(selectedStaff.id));
    const staffName = getStaffName(staffObj, selectedStaff.id);

    const { error } = await supabase.from('attendance_logs').insert([
      { 
        staff_id: selectedStaff.id, 
        action: actionType, 
        timestamp: new Date().toISOString() 
      }
    ]);

    if (error) {
      setStatusMessage({ type: 'error', text: 'Failed to record attendance: ' + error.message });
    } else {
      const actionText = actionType === 'CHECK_IN' ? 'checked in' : 'checked out';
      setStatusMessage({ type: 'success', text: `Success! ${staffName} successfully ${actionText}.` });
      setSelectedStaff(null);
      fetchData();
    }
    setLoading(false);
  };

  // The URL that the single master QR code will point to (current window location)
  const masterQrUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', flexWrap: 'wrap', gap: '1rem', boxSizing: 'border-box' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>African Simba Events</h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>Gate Attendance & QR Terminal</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('terminal')}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'terminal' ? '#3b82f6' : 'transparent', color: '#ffffff', cursor: 'pointer', fontWeight: '500', fontSize: '0.85rem' }}>
            📲 Terminal
          </button>
          <button 
            onClick={() => setActiveTab('masterQR')}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'masterQR' ? '#3b82f6' : 'transparent', color: '#ffffff', cursor: 'pointer', fontWeight: '500', fontSize: '0.85rem' }}>
            🖨️ QR Poster
          </button>
          <button 
            onClick={() => setActiveTab('admin')}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'admin' ? '#3b82f6' : 'transparent', color: '#ffffff', cursor: 'pointer', fontWeight: '500', fontSize: '0.85rem' }}>
            📊 Logs
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '1rem', maxWidth: '900px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {statusMessage && (
          <div style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px', backgroundColor: statusMessage.type === 'success' ? '#dcfce7' : '#fee2e2', color: statusMessage.type === 'success' ? '#166534' : '#991b1b', display: 'flex', alignItems: 'center', gap: '0.75rem', border: `1px solid ${statusMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`, boxSizing: 'border-box' }}>
            <span style={{ fontWeight: 'bold' }}>{statusMessage.type === 'success' ? '✓' : '⚠️'}</span>
            <span style={{ wordBreak: 'break-word' }}>{statusMessage.text}</span>
          </div>
        )}

        {activeTab === 'terminal' ? (
          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '1.35rem', color: '#1e293b', marginBottom: '0.5rem', textAlign: 'center' }}>
              Staff Gate Terminal
            </h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>Select your name and choose whether you are checking in or out.</p>

            <form onSubmit={handleSubmitAttendance} style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxSizing: 'border-box' }}>
              
              {/* Action Selector: Check In vs Check Out */}
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>Action Type</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setActionType('CHECK_IN')}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: `2px solid ${actionType === 'CHECK_IN' ? '#10b981' : '#cbd5e1'}`, backgroundColor: actionType === 'CHECK_IN' ? '#dcfce7' : '#f8fafc', color: actionType === 'CHECK_IN' ? '#166534' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    🟢 Check In
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('CHECK_OUT')}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: `2px solid ${actionType === 'CHECK_OUT' ? '#ef4444' : '#cbd5e1'}`, backgroundColor: actionType === 'CHECK_OUT' ? '#fee2e2' : '#f8fafc', color: actionType === 'CHECK_OUT' ? '#991b1b' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    🔴 Check Out
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>Select Staff Member</label>
                <select 
                  value={selectedStaff ? selectedStaff.id : ''} 
                  onChange={(e) => {
                    const found = staffList.find(s => String(s.id) === e.target.value);
                    setSelectedStaff(found || null);
                  }}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                >
                  <option value="">-- Choose your name --</option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {getStaffName(staff, staff.id)}
                    </option>
                  ))}
                </select>
              </div>

              <button 
                type="submit"
                disabled={loading}
                style={{ backgroundColor: actionType === 'CHECK_IN' ? '#059669' : '#dc2626', color: '#ffffff', padding: '0.85rem', borderRadius: '8px', border: 'none', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem', width: '100%' }}
              >
                {loading ? 'Processing...' : (actionType === 'CHECK_IN' ? 'Confirm Check In' : 'Confirm Check Out')}
              </button>
            </form>
          </div>
        ) : activeTab === 'masterQR' ? (
          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', textAlign: 'center', maxWidth: '600px', margin: '0 auto', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '0.5rem' }}>
              African Simba Events Entrance
            </h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Scan this master QR code using your phone camera to open the attendance terminal and log your check-in or check-out.</p>

            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '2px dashed #cbd5e1', display: 'inline-block', marginBottom: '1.5rem', maxWidth: '100%', boxSizing: 'border-box' }}>
              <QRCodeSVG value={masterQrUrl} size={200} style={{ maxWidth: '100%', height: 'auto' }} />
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', wordBreak: 'break-all', fontSize: '0.8rem', color: '#475569', boxSizing: 'border-box' }}>
              Terminal URL: {masterQrUrl}
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.35rem', color: '#1e293b', margin: 0 }}>
                Live Attendance Logs
              </h2>
              <button onClick={fetchData} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
                🔄 Refresh Logs
              </button>
            </div>

            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '350px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.85rem' }}>
                    <th style={{ padding: '0.75rem' }}>Staff Name</th>
                    <th style={{ padding: '0.75rem' }}>Action</th>
                    <th style={{ padding: '0.75rem' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {checkIns.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>No attendance records found yet.</td>
                    </tr>
                  ) : (
                    checkIns.map((record) => {
                      const isIn = record.action === 'CHECK_IN';
                      return (
                        <tr key={record.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#334155' }}>
                          <td style={{ padding: '0.75rem', fontWeight: '600', color: '#0f172a' }}>
                            {getStaffName(record.staff, record.staff_id)}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{ 
                              padding: '0.25rem 0.5rem', 
                              borderRadius: '4px', 
                              fontSize: '0.7rem', 
                              fontWeight: 'bold',
                              backgroundColor: isIn ? '#dcfce7' : '#fee2e2',
                              color: isIn ? '#166534' : '#991b1b'
                            }}>
                              {record.action}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>{new Date(record.timestamp).toLocaleString()}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}