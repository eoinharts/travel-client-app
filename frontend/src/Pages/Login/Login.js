// src/pages/login/Login.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    address: ''
  });
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');

  // On mount, load user if previously logged in
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const toggleMode = () => {
    setMode(m => (m === 'login' ? 'register' : 'login'));
    setFormData({ username: '', password: '', email: '', address: '' });
    setMessage('');
    setUser(null);
  };

  const handleChange = e => {
    setFormData(fd => ({ ...fd, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('Working…');
    try {
      if (mode === 'login') {
        const { data } = await axios.post(
          'http://localhost:5000/users/login',
          {
            username: formData.username,
            password: formData.password
          }
        );
        // save token & user
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setMessage('✅ Logged in!');
        navigate('/travellogs');
      } else {
        await axios.post(
          'http://localhost:5000/users/register',
          {
            username: formData.username,
            password: formData.password,
            email:    formData.email,
            address:  formData.address
          }
        );
        setMessage('✅ Registered! Please log in.');
        setMode('login');
        setFormData(fd => ({ ...fd, password: '' }));
      }
    } catch (err) {
      console.error(err.response || err);
      setMessage(
        err.response?.data?.message ||
        '❌ Something went wrong.'
      );
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setMessage('');
    navigate('/');
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 20 }}>
      <h1>{mode === 'login' ? 'Login' : 'Register'}</h1>

      {mode === 'login' && user ? (
        <div style={{ marginBottom: 20 }}>
          <button onClick={logout} style={{ float: 'right' }}>
            Logout
          </button>
          <h2>Welcome, {user.username}!</h2>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Address:</strong> {user.address}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <label>Username</label><br/>
            <input
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Password</label><br/>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          {mode === 'register' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label>Email</label><br/>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: 8 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Address</label><br/>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  style={{ width: '100%', padding: 8 }}
                />
              </div>
            </>
          )}
          <button type="submit" style={{ padding: '8px 16px' }}>
            {mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </form>
      )}

      {message && (
        <p style={{ color: message.startsWith('❌') ? 'red' : 'green', marginBottom: 20 }}>
          {message}
        </p>
      )}

      <p>
        {mode === 'login'
          ? "Don't have an account?"
          : "Already have an account?"}{' '}
        <button
          onClick={toggleMode}
          style={{
            background: 'none',
            border: 'none',
            color: '#0077cc',
            textDecoration: 'underline',
            cursor: 'pointer',
            padding: 0
          }}
        >
          {mode === 'login' ? 'Sign Up' : 'Log In'}
        </button>
      </p>
    </div>
  );
}
