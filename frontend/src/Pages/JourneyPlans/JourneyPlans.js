import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../App.css';

export default function JourneyPlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [newPlan, setNewPlan] = useState({
    journey_plan_name: '',
    journey_plan_locations: '',
    start_date: '',
    end_date: '',
    activities: '',
    description: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [editPlan, setEditPlan] = useState({
    journey_plan_name: '',
    journey_plan_locations: '',
    start_date: '',
    end_date: '',
    activities: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(
        'http://localhost:5000/journeyplans',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlans(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch plans.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleChange = setter => e =>
    setter(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleNewSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      const payload = {
        journey_plan_name: newPlan.journey_plan_name,
        journey_plan_locations: newPlan.journey_plan_locations
          .split(',').map(s => s.trim()).filter(Boolean),
        start_date: newPlan.start_date,
        end_date: newPlan.end_date,
        activities: newPlan.activities
          .split(',').map(s => s.trim()).filter(Boolean),
        description: newPlan.description
      };
      const { data } = await axios.post(
        'http://localhost:5000/journeyplans',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewPlan({
        journey_plan_name: '',
        journey_plan_locations: '',
        start_date: '',
        end_date: '',
        activities: '',
        description: ''
      });
      fetchPlans();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add plan.');
    }
  };

  const startEdit = plan => {
    setEditingId(plan.id);
    setEditPlan({
      journey_plan_name: plan.journey_plan_name,
      journey_plan_locations: plan.journey_plan_locations.join(', '),
      start_date: plan.start_date,
      end_date: plan.end_date,
      activities: plan.activities.join(', '),
      description: plan.description
    });
  };

  const handleEditSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      const payload = {
        journey_plan_name: editPlan.journey_plan_name,
        journey_plan_locations: editPlan.journey_plan_locations
          .split(',').map(s => s.trim()).filter(Boolean),
        start_date: editPlan.start_date,
        end_date: editPlan.end_date,
        activities: editPlan.activities
          .split(',').map(s => s.trim()).filter(Boolean),
        description: editPlan.description
      };
      await axios.put(
        `http://localhost:5000/journeyplans/${editingId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingId(null);
      fetchPlans();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update.');
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/journeyplans/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPlans();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete.');
    }
  };

  if (loading) return <p className="container">Loading plans…</p>;

  return (
    <div className="container">
      <button onClick={logout} style={{ float: 'right', marginBottom: 20 }}>
        Logout
      </button>
      <h1>Journey Plans</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Add New Plan */}
      <div className="card" style={{ marginBottom: 30 }}>
        <h2>Add New Plan</h2>
        <form onSubmit={handleNewSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Plan Name</label>
              <input
                name="journey_plan_name"
                value={newPlan.journey_plan_name}
                onChange={handleChange(setNewPlan)}
                required
              />
            </div>
            <div className="form-group">
              <label>Locations (comma-separated)</label>
              <input
                name="journey_plan_locations"
                value={newPlan.journey_plan_locations}
                onChange={handleChange(setNewPlan)}
                required
              />
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                name="start_date"
                value={newPlan.start_date}
                onChange={handleChange(setNewPlan)}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                name="end_date"
                value={newPlan.end_date}
                onChange={handleChange(setNewPlan)}
              />
            </div>
            <div className="form-group">
              <label>Activities (comma-separated)</label>
              <input
                name="activities"
                value={newPlan.activities}
                onChange={handleChange(setNewPlan)}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Description</label>
              <textarea
                name="description"
                rows="3"
                value={newPlan.description}
                onChange={handleChange(setNewPlan)}
              />
            </div>
          </div>
          <button type="submit">Add Journey Plan</button>
        </form>
      </div>

      {/* Edit or Display Existing */}
      <h2>Your Plans</h2>
      {plans.length === 0 ? (
        <p>No plans yet.</p>
      ) : (
        plans.map(plan => (
          <div key={plan.id} className="card" style={{ marginBottom: 20 }}>
            {editingId === plan.id ? (
              <form onSubmit={handleEditSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Plan Name</label>
                    <input
                      name="journey_plan_name"
                      value={editPlan.journey_plan_name}
                      onChange={handleChange(setEditPlan)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Locations</label>
                    <input
                      name="journey_plan_locations"
                      value={editPlan.journey_plan_locations}
                      onChange={handleChange(setEditPlan)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      name="start_date"
                      value={editPlan.start_date}
                      onChange={handleChange(setEditPlan)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      name="end_date"
                      value={editPlan.end_date}
                      onChange={handleChange(setEditPlan)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Activities</label>
                    <input
                      name="activities"
                      value={editPlan.activities}
                      onChange={handleChange(setEditPlan)}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Description</label>
                    <textarea
                      name="description"
                      rows="3"
                      value={editPlan.description}
                      onChange={handleChange(setEditPlan)}
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
              <>
                <h3>{plan.journey_plan_name}</h3>
                <p>
                  <strong>Locations:</strong> {plan.journey_plan_locations.join(', ')}
                </p>
                <p>
             <strong>Dates:</strong>{' '}
            {plan.start_date
            ? new Date(plan.start_date).toLocaleDateString()
            : 'N/A'
              }{' '}
                →{' '}
            {plan.end_date
            ? new Date(plan.end_date).toLocaleDateString()
            : 'N/A'
             }
            </p>

                <p>
                  <strong>Activities:</strong> {plan.activities.join(', ')}
                </p>
                <p>{plan.description}</p>
                <div className="button-row">
                  <button onClick={() => startEdit(plan)}>Edit</button>
                  <button onClick={() => handleDelete(plan.id)}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
