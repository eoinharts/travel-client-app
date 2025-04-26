// src/pages/TravelLogs/TravelLogs.js
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../App.css';

export default function TravelLogs() {
  const navigate = useNavigate();
  const [logs, setLogs]           = useState([]);
  const [newLog, setNewLog]       = useState({
    title: '', description: '', start_date: '', end_date: '', tags: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [editLog, setEditLog]     = useState({
    title: '', description: '', start_date: '', end_date: '', tags: ''
  });
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(true);

  const fetchLogs = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(
        'http://localhost:5000/travellogs',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLogs(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch logs.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleChange = setter => e =>
    setter(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // Add new log
  const handleNewSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: newLog.title,
        description: newLog.description,
        start_date: newLog.start_date,
        end_date: newLog.end_date,
        tags: newLog.tags.split(',').map(t => t.trim()).filter(Boolean)
      };
      const { data: created } = await axios.post(
        'http://localhost:5000/travellogs',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLogs(prev => [...prev, created]);
      setNewLog({ title:'', description:'', start_date:'', end_date:'', tags:'' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add log.');
    }
  };

  // Begin editing: copy into editLog
  const startEdit = log => {
    setEditingId(log.id);
    setEditLog({
      title:       log.title,
      description: log.description,
      start_date:  log.start_date,
      end_date:    log.end_date,
      tags:        (log.tags || []).join(', ')
    });
  };

  // Submit edit
  const handleEditSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title:       editLog.title,
        description: editLog.description,
        start_date:  editLog.start_date,
        end_date:    editLog.end_date,
        tags:        editLog.tags.split(',').map(t => t.trim()).filter(Boolean)
      };
      await axios.put(
        `http://localhost:5000/travellogs/${editingId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLogs(prev =>
        prev.map(l =>
          l.id === editingId
            ? { ...l, ...payload }  // keep original post_date
            : l
        )
      );
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update.');
    }
  };

  // Delete
  const handleDelete = async id => {
    if (!window.confirm('Delete this log?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/travellogs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete.');
    }
  };

  if (loading) return <p className="container">Loading logs…</p>;

  return (
    <div className="container">
      <button onClick={logout} style={{ float:'right', marginBottom:20 }}>
        Logout
      </button>
      <h1>Travel Logs</h1>
      {error && <p style={{ color:'red' }}>{error}</p>}

      {/* Add Form */}
      <div className="card" style={{ marginBottom:30 }}>
        <h2>Add New Log</h2>
        <form onSubmit={handleNewSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Title</label>
              <input
                name="title"
                value={newLog.title}
                onChange={handleChange(setNewLog)}
                required
              />
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                name="start_date"
                value={newLog.start_date}
                onChange={handleChange(setNewLog)}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                name="end_date"
                value={newLog.end_date}
                onChange={handleChange(setNewLog)}
              />
            </div>
            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input
                name="tags"
                value={newLog.tags}
                onChange={handleChange(setNewLog)}
              />
            </div>
            <div className="form-group" style={{ gridColumn:'1 / -1' }}>
              <label>Description</label>
              <textarea
                name="description"
                rows="3"
                value={newLog.description}
                onChange={handleChange(setNewLog)}
              />
            </div>
          </div>
          <button type="submit">Add Travel Log</button>
        </form>
      </div>

      {/* Logs List */}
      <h2>Your Logs</h2>
      {logs.length === 0 ? (
        <p>No logs yet.</p>
      ) : logs.map(log => (
        <div key={log.id} className="card" style={{ marginBottom:16 }}>
          <h3>{log.title}</h3>
          <small>
            Posted on {new Date(log.post_date).toLocaleDateString()}
          </small>
          <p>
            <strong>Dates:</strong>{' '}
            {log.start_date?.slice(0,10) || 'N/A'} → {log.end_date?.slice(0,10) || 'N/A'}
          </p>
          <p>{log.description}</p>
          {log.tags.length > 0 && (
            <p><strong>Tags:</strong> {log.tags.join(', ')}</p>
          )}

          {editingId === log.id ? (
            /* **FULL** Edit Form */
            <form onSubmit={handleEditSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Title</label>
                  <input
                    name="title"
                    value={editLog.title}
                    onChange={handleChange(setEditLog)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={editLog.start_date}
                    onChange={handleChange(setEditLog)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={editLog.end_date}
                    onChange={handleChange(setEditLog)}
                  />
                </div>
                <div className="form-group">
                  <label>Tags</label>
                  <input
                    name="tags"
                    value={editLog.tags}
                    onChange={handleChange(setEditLog)}
                  />
                </div>
                <div className="form-group" style={{ gridColumn:'1 / -1' }}>
                  <label>Description</label>
                  <textarea
                    name="description"
                    rows="3"
                    value={editLog.description}
                    onChange={handleChange(setEditLog)}
                  />
                </div>
              </div>
              <div className="button-row">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="button-row">
              <button onClick={() => startEdit(log)}>Edit</button>
              <button onClick={() => handleDelete(log.id)}>Delete</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
