import React, { useState } from "react";
import Terminal from "./Terminal";
import DashboardAdmin from "./DashboardAdmin";

export default function App() {
  const [pestana, setPestana] = useState('terminal');
  const [esAdmin, setEsAdmin] = useState(false);
  const [historial, setHistorial] = useState([]);

  const registrarAccesoYValidarRol = (registro) => {
    setHistorial((prev) => [registro, ...prev]);

    // Si el carnet ingresado pertenece a un Admin, se le otorgan los permisos
    if (registro.esAdmin || registro.departamento === 'Administración') {
      setEsAdmin(true);
      setPestana('admin');
    }
  };

  const cerrarSesion = () => {
    setEsAdmin(false);
    setPestana('terminal');
  };

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f1f5f9',
      minHeight: '100vh',
      padding: '20px',
      color: '#0f172a'
    }}>
      {/* HEADER SIMPLE */}
      <header style={{
        maxWidth: '1000px',
        margin: '0 auto 24px auto',
        backgroundColor: '#ffffff',
        padding: '16px 24px',
        borderRadius: '16px',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🛡️</span>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
            ROOM 911 <span style={{ color: '#0284c7', fontWeight: '400' }}>| System Control</span>
          </h1>
        </div>

        {/* NAVEGACIÓN Y CERRAR SESIÓN */}
        {esAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <nav style={{ display: 'flex', gap: '8px', backgroundColor: '#f8fafc', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <button
                onClick={() => setPestana('terminal')}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  backgroundColor: pestana === 'terminal' ? '#0f172a' : 'transparent',
                  color: pestana === 'terminal' ? '#ffffff' : '#64748b'
                }}
              >
                📟 Terminal de Entrada
              </button>

              <button
                onClick={() => setPestana('admin')}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  backgroundColor: pestana === 'admin' ? '#0f172a' : 'transparent',
                  color: pestana === 'admin' ? '#ffffff' : '#64748b'
                }}
              >
                📊 Panel Administrador
              </button>
            </nav>

            <button
              onClick={cerrarSesion}
              style={{
                padding: '8px 14px',
                border: '1px solid #fecaca',
                backgroundColor: '#fef2f2',
                color: '#991b1b',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              🚪 Cerrar Sesión
            </button>
          </div>
        )}
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {pestana === 'terminal' ? (
          <Terminal 
            registrarAcceso={registrarAccesoYValidarRol} 
            historial={historial} 
            esAdmin={esAdmin}
            cerrarSesion={cerrarSesion}
          />
        ) : (
          <DashboardAdmin historial={historial} />
        )}
      </main>
    </div>
  );
}