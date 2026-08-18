import React, { useState } from 'react';

export default function Terminal({ registrarAcceso, historial = [], esAdmin, cerrarSesion }) {
  const [carnet, setCarnet] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(false);

  const handleVerificar = async (e) => {
    e.preventDefault();
    if (!carnet.trim()) return;

    setCargando(true);
    setMensaje(null);

    try {
      // Petición al endpoint de validación en Spring Boot
      const res = await fetch(`http://localhost:8080/api/employees/validate/${carnet.trim()}`);
      const data = await res.json();

      if (res.ok && data.valid) {
        const emp = data.employee;
        const depNombre = typeof emp.department === 'string' 
          ? emp.department 
          : (emp.department?.name || 'General');

        // Detecta si pertenece a administración o si la propiedad isAdmin viene en true
        const esAdministrador = depNombre.toLowerCase().includes('admin') || emp.isAdmin === true;

        const resultadoRegistro = {
          carnet: carnet.trim(),
          nombre: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
          exitoso: true,
          departamento: depNombre,
          esAdmin: esAdministrador, // Notifica a App.jsx si es Admin
          fecha: new Date().toLocaleTimeString()
        };

        setMensaje({
          tipo: 'exito',
          texto: `✅ ACCESO CONCEDIDO: ${resultadoRegistro.nombre} (${depNombre})`
        });

        // Notifica a App.jsx para cambiar de vista e iniciar sesión
        if (registrarAcceso) {
          registrarAcceso(resultadoRegistro);
        }

      } else {
        // Acceso denegado o carnet no registrado
        setMensaje({
          tipo: 'error',
          texto: `❌ ${data.message || 'ACCESO DENEGADO'}`
        });

        if (registrarAcceso) {
          registrarAcceso({
            carnet: carnet.trim(),
            nombre: data.employee ? `${data.employee.firstName || ''} ${data.employee.lastName || ''}`.trim() : 'Desconocido',
            exitoso: false,
            departamento: data.employee?.department?.name || 'N/A',
            esAdmin: false,
            fecha: new Date().toLocaleTimeString()
          });
        }
      }
    } catch (error) {
      console.error('Error al conectar con la API:', error);
      setMensaje({
        tipo: 'error',
        texto: '⚠️ ERROR DE CONEXIÓN: No se pudo conectar con el servidor backend.'
      });
    } finally {
      setCargando(false);
      setCarnet('');
    }
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      padding: '32px',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      maxWidth: '500px',
      margin: '0 auto',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
    }}>
      {/* BADGE DE SESIÓN ADMIN EN LA TERMINAL */}
      {esAdmin && (
        <div style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          backgroundColor: '#f8fafc',
          padding: '8px 14px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0'
        }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#0369a1' }}>
            🔑 Sesión de Admin Activa
          </span>
          <button
            onClick={cerrarSesion}
            style={{
              padding: '4px 10px',
              border: 'none',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      )}

      <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#0f172a', textAlign: 'center' }}>
        📟 Terminal de Control de Acceso
      </h2>
      <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#64748b', textAlign: 'center' }}>
        Ingrese su carnet o ID interno para validar credenciales
      </p>

      <form onSubmit={handleVerificar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input
          type="text"
          placeholder="Número de Carnet (ej. 1099887766)"
          value={carnet}
          onChange={(e) => setCarnet(e.target.value)}
          disabled={cargando}
          style={{
            padding: '12px 16px',
            fontSize: '15px',
            borderRadius: '10px',
            border: '1px solid #cbd5e1',
            outline: 'none',
            textAlign: 'center',
            fontWeight: '600'
          }}
        />

        <button
          type="submit"
          disabled={cargando}
          style={{
            padding: '12px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          {cargando ? 'Verificando...' : 'Verificar Acceso'}
        </button>
      </form>

      {mensaje && (
        <div style={{
          marginTop: '20px',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: '700',
          textAlign: 'center',
          backgroundColor: mensaje.tipo === 'exito' ? '#f0fdf4' : '#fef2f2',
          color: mensaje.tipo === 'exito' ? '#166534' : '#991b1b',
          border: `1px solid ${mensaje.tipo === 'exito' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {mensaje.texto}
        </div>
      )}

      {historial.length > 0 && (
        <div style={{ marginTop: '28px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>
            Últimas verificaciones:
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {historial.slice(0, 3).map((item, idx) => (
              <li key={idx} style={{
                fontSize: '12px',
                display: 'flex',
                justify: 'space-between',
                padding: '8px 12px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px'
              }}>
                <span><b>{item.carnet}</b> - {item.nombre}</span>
                <span style={{ fontWeight: '800', color: item.exitoso ? '#166534' : '#991b1b' }}>
                  {item.exitoso ? 'PERMITIDO' : 'DENEGADO'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}