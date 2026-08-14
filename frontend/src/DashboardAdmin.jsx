import React, { useState, useEffect } from 'react';

export default function DashboardAdmin({ historial = [] }) {
  const [usuariosAdmin, setUsuariosAdmin] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroRol, setFiltroRol] = useState('');

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/employees');
      if (response.ok) {
        const data = await response.json();
        setUsuariosAdmin(data);
      }
    } catch (error) {
      console.error('Error al cargar empleados:', error);
    } finally {
      setCargando(false);
    }
  };

  const totalExitosos = historial.filter((item) => item.exitoso).length;
  const totalDenegados = historial.filter((item) => !item.exitoso).length;

  const obtenerDepartamento = (u) => {
    if (!u) return 'Sin asignación';
    if (typeof u.department === 'string') return u.department;
    if (u.department && u.department.name) return u.department.name;
    return 'Sin asignación';
  };

  const listaRoles = [...new Set(usuariosAdmin.map(u => obtenerDepartamento(u)))];

  const usuariosFiltrados = usuariosAdmin.filter(u => {
    const busqueda = filtroTexto.trim().toLowerCase();
    const nombreCompleto = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const carnet = (u.internalId || u.id || '').toString().toLowerCase();
    const dep = obtenerDepartamento(u);

    const coincideTexto = busqueda === '' || nombreCompleto.includes(busqueda) || carnet.includes(busqueda);
    const coincideRol = filtroRol === '' || dep === filtroRol;

    return coincideTexto && coincideRol;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* MÉTRICAS SIMPLE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Solicitudes Totales</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0369a1', marginTop: '4px' }}>{historial.length}</div>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Accesos Aprobados</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#166534', marginTop: '4px' }}>{totalExitosos}</div>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Accesos Denegados</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#991b1b', marginTop: '4px' }}>{totalDenegados}</div>
        </div>
      </div>

      {/* TABLA PRINCIPAL SIMPLE */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b', textTransform: 'uppercase', fontWeight: '800' }}>
            👥 Personal Registrado en Sistema
          </h3>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por carnet o nombre..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', width: '230px' }}
            />

            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#ffffff' }}
            >
              <option value="">-- Todos los Departamentos --</option>
              {listaRoles.map((role, idx) => (
                <option key={idx} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>

        {cargando ? (
          <p style={{ textAlign: 'center', color: '#64748b' }}>Cargando empleados desde la base de datos...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'center' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '10px' }}>Nombre Completo</th>
                  <th style={{ padding: '10px' }}>Carnet (Internal ID)</th>
                  <th style={{ padding: '10px' }}>Departamento</th>
                  <th style={{ padding: '10px' }}>Permiso Acceso</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length > 0 ? (
                  usuariosFiltrados.map((u, i) => (
                    <tr key={u.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', fontWeight: '700', color: '#1e293b' }}>
                        {u.firstName || u.nombre} {u.lastName || u.apellido || ''}
                      </td>
                      <td style={{ padding: '10px', color: '#64748b', fontWeight: '600' }}>
                        {u.internalId || u.carnet || u.id}
                      </td>
                      <td style={{ padding: '10px', color: '#334155' }}>
                        {obtenerDepartamento(u)}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '800',
                          backgroundColor: u.accessGranted ? '#f0fdf4' : '#fef2f2',
                          color: u.accessGranted ? '#166534' : '#991b1b'
                        }}>
                          {u.accessGranted ? 'PERMITIDO' : 'DENEGADO'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '16px', color: '#64748b' }}>
                      No se encontraron usuarios coincidentes en la base de datos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}