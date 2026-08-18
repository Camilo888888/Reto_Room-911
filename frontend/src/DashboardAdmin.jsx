import React from 'react';

export default function AdminDashboard({ usuario }) {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      padding: '32px',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
    }}>
      <h2 style={{ color: '#0f172a', marginTop: 0 }}>
        ⚙️ Panel Administrador
      </h2>
      <p style={{ color: '#64748b' }}>
        Bienvenido/a, <strong>{usuario?.nombre || 'Administrador'}</strong>.
      </p>

      <div style={{
        backgroundColor: '#f8fafc',
        padding: '16px',
        borderRadius: '8px',
        marginTop: '20px',
        border: '1px solid #e2e8f0'
      }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Información de la Sesión:</h4>
        <p style={{ margin: '4px 0', fontSize: '14px', color: '#334155' }}>
          <strong>Carnet:</strong> {usuario?.carnet || 'N/A'}
        </p>
        <p style={{ margin: '4px 0', fontSize: '14px', color: '#334155' }}>
          <strong>Departamento:</strong> {usuario?.departamento || 'Administración'}
        </p>
      </div>
    </div>
  );
}