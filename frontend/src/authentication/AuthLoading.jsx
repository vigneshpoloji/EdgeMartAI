import React from 'react';

export default function AuthLoading({ dashboard }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: dashboard ? '60vh' : '100vh',
        fontFamily: 'sans-serif'
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}
        />
        <p>{dashboard ? 'Loading dashboard...' : 'Loading session...'}</p>
      </div>
    </div>
  );
}