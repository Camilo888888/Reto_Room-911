import React, { useState, useEffect } from 'react';

// URL base de la API Spring Boot
const API_URL = 'http://localhost:8080/api';

export default function UserTerminal({ userSession, onLogout }) {
  // Datos del usuario logueado obteniendo departamento de PostgreSQL
  const currentUser = {
    internalId: userSession?.internalId || '',
    firstName: userSession?.firstName || '',
    lastName: userSession?.lastName || '',
    departmentName: userSession?.departmentName || userSession?.department?.name || 'Sin Departamento',
    accessGranted: userSession?.accessGranted ?? true
  };

  // Estados locales para la funcionalidad de la vista
  const [historialPersonal, setHistorialPersonal] = useState([]);
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [mensajeHistorial, setMensajeHistorial] = useState('');
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  // Estados para la funcionalidad de Cambio de Contraseña
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [pwdEstado, setPwdEstado] = useState({ tipo: '', mensaje: '' });
  const [procesandoPwd, setProcesandoPwd] = useState(false);

  // Estados para simulación de ingreso
  const [epp, setEpp] = useState({
    bata: true,
    cofia: true,
    tapabocas: true,
    calzado: true
  });
  const [resultadoAcceso, setResultadoAcceso] = useState(null);

  // Cargar historial al iniciar
  useEffect(() => {
    if (currentUser.internalId) {
      consultarHistorial('');
    }
  }, [currentUser.internalId]);

  // Consulta real de historial a PostgreSQL (con o sin filtro por fecha)
  const consultarHistorial = async (fechaParam) => {
    setCargandoHistorial(true);
    setMensajeHistorial('');
    try {
      let url = `${API_URL}/access-logs/employee/${currentUser.internalId}`;
      if (fechaParam) {
        url += `?date=${fechaParam}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHistorialPersonal(data);
        if (data.length === 0) {
          setMensajeHistorial(fechaParam ? "No hay registros para la fecha seleccionada." : "No existen registros de acceso.");
        }
      } else {
        setHistorialPersonal([]);
        setMensajeHistorial("Error al cargar el historial desde el servidor.");
      }
    } catch (e) {
      console.error(e);
      setHistorialPersonal([]);
      setMensajeHistorial("Error de conexión con la base de datos.");
    } finally {
      setCargandoHistorial(false);
    }
  };

  const handleFiltrarFecha = (e) => {
    e.preventDefault();
    if (!fechaFiltro) return;
    consultarHistorial(fechaFiltro);
  };

  const handleLimpiarFiltro = () => {
    setFechaFiltro('');
    consultarHistorial('');
  };

  // Proceso de Cambio de Contraseña
  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setPwdEstado({ tipo: '', mensaje: '' });

    if (!pwdForm.currentPassword) {
      setPwdEstado({ tipo: 'error', mensaje: 'Debe ingresar la contraseña actual.' });
      return;
    }
    if (pwdForm.newPassword.length < 8) {
      setPwdEstado({ tipo: 'error', mensaje: 'La nueva contraseña debe tener mínimo 8 caracteres.' });
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdEstado({ tipo: 'error', mensaje: 'La confirmación de la contraseña no coincide.' });
      return;
    }

    setProcesandoPwd(true);

    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internalId: currentUser.internalId,
          currentPassword: pwdForm.currentPassword,
          newPassword: pwdForm.newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        setPwdEstado({ tipo: 'exito', mensaje: 'Contraseña actualizada correctamente.' });
        setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPwdEstado({ tipo: 'error', mensaje: data.message || 'Error al cambiar la contraseña.' });
      }
    } catch (err) {
      setPwdEstado({ tipo: 'error', mensaje: 'Error de conexión con el servidor.' });
    } finally {
      setProcesandoPwd(false);
    }
  };

  // Simulación y guardado permanente del registro
  const handleRegistrarAcceso = async () => {
    const eppCompleto = epp.bata && epp.cofia && epp.tapabocas && epp.calzado;

    try {
      const res = await fetch(`${API_URL}/access/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internalId: currentUser.internalId,
          eppStatus: eppCompleto
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResultadoAcceso({
          exito: data.granted,
          mensaje: data.granted ? "Entrada registrada" : "Acceso denegado"
        });
        // Recargar tabla desde PostgreSQL
        consultarHistorial(fechaFiltro);
      }
    } catch (e) {
      console.error(e);
      setResultadoAcceso({ exito: false, mensaje: "Error al comunicar con la base de datos" });
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'Segoe UI, Arial, sans-serif', color: '#0f172a' }}>

      {/* HEADER CON INFORMACION DE USUARIO Y DEPARTAMENTO REAL */}
      <header style={{
        backgroundColor: '#0f172a',
        borderBottom: '3px solid #2563eb',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#ffffff'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            ROOM_911 | Terminal de Acceso
          </h1>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Sistema de Control Sanitario</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', color: '#ffffff' }}>
              {currentUser.firstName} {currentUser.lastName}
            </span>
            <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '600', display: 'block' }}>
              Departamento: {currentUser.departmentName}
            </span>
          </div>
          <button
            onClick={onLogout}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ maxWidth: '1100px', margin: '28px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* REGISTRO DE INGRESO */}
        <div style={cardStyle}>
          <h3 style={sectionHeaderStyle}>REGISTRAR INGRESO Y VERIFICACIÓN EPP</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <label style={checkboxBoxStyle(epp.bata)}>
              <input type="checkbox" checked={epp.bata} onChange={e => setEpp({ ...epp, bata: e.target.checked })} style={checkboxStyle} />
              <span>Bata Esterilizada</span>
            </label>
            <label style={checkboxBoxStyle(epp.cofia)}>
              <input type="checkbox" checked={epp.cofia} onChange={e => setEpp({ ...epp, cofia: e.target.checked })} style={checkboxStyle} />
              <span>Cofia Quirúrgica</span>
            </label>
            <label style={checkboxBoxStyle(epp.tapabocas)}>
              <input type="checkbox" checked={epp.tapabocas} onChange={e => setEpp({ ...epp, tapabocas: e.target.checked })} style={checkboxStyle} />
              <span>Tapabocas N95</span>
            </label>
            <label style={checkboxBoxStyle(epp.calzado)}>
              <input type="checkbox" checked={epp.calzado} onChange={e => setEpp({ ...epp, calzado: e.target.checked })} style={checkboxStyle} />
              <span>Calzado Especial</span>
            </label>
          </div>

          <button onClick={handleRegistrarAcceso} style={btnPrimaryStyle}>
            REGISTRAR ENTRADA
          </button>

          {resultadoAcceso && (
            <div style={{
              marginTop: '12px',
              padding: '10px 14px',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '13px',
              backgroundColor: resultadoAcceso.exito ? '#dcfce7' : '#fee2e2',
              color: resultadoAcceso.exito ? '#14532d' : '#991b1b',
              border: `1px solid ${resultadoAcceso.exito ? '#bbf7d0' : '#fecaca'}`
            }}>
              {resultadoAcceso.mensaje}
            </div>
          )}
        </div>

        {/* HISTÓRICO DE REGISTROS CON FILTRO DE FECHA */}
        <div style={cardStyle}>
          <h3 style={sectionHeaderStyle}>HISTÓRICO DE REGISTROS</h3>

          {/* COMPONENTE FILTRO POR FECHA */}
          <form onSubmit={handleFiltrarFecha} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>Fecha:</span>
            <input
              type="date"
              value={fechaFiltro}
              onChange={e => setFechaFiltro(e.target.value)}
              style={inputStyle}
            />
            <button type="submit" style={btnSecondaryStyle}>Consultar</button>
            {fechaFiltro && (
              <button type="button" onClick={handleLimpiarFiltro} style={btnOutlineStyle}>Mostrar todos</button>
            )}
          </form>

          {/* TABLA MEJORADA CON ALTO CONTRASTE Y SIN EMOJIS */}
          <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: '#ffffff' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                  <th style={thStyle}>Fecha</th>
                  <th style={thStyle}>Hora</th>
                  <th style={thStyle}>Identificación</th>
                  <th style={thStyle}>Estado</th>
                  <th style={thStyle}>Información adicional</th>
                </tr>
              </thead>
              <tbody>
                {historialPersonal.map((reg) => {
                  const fechaObj = new Date(reg.timestamp);
                  const fechaStr = fechaObj.toLocaleDateString('es-CO');
                  const horaStr = fechaObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  const esExito = Boolean(reg.granted);

                  return (
                    <tr key={reg.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={tdStyle}>{fechaStr}</td>
                      <td style={tdStyle}>{horaStr}</td>
                      <td style={tdStyle}>{reg.employeeInternalId}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          backgroundColor: esExito ? '#dcfce7' : '#fee2e2',
                          color: esExito ? '#14532d' : '#991b1b',
                          border: `1px solid ${esExito ? '#86efac' : '#fca5a5'}`
                        }}>
                          {esExito ? 'Entrada registrada' : 'Acceso denegado'}
                        </span>
                      </td>
                      <td style={tdStyle}>{reg.details || 'Registro del sistema'}</td>
                    </tr>
                  );
                })}

                {historialPersonal.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
                      {cargandoHistorial ? "Cargando registros de PostgreSQL..." : (mensajeHistorial || "No hay registros disponibles.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MÓDULO DE CAMBIO DE CONTRASEÑA */}
        <div style={cardStyle}>
          <h3 style={sectionHeaderStyle}>CAMBIAR CONTRASEÑA</h3>

          {pwdEstado.mensaje && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 'bold',
              marginBottom: '16px',
              backgroundColor: pwdEstado.tipo === 'exito' ? '#dcfce7' : '#fee2e2',
              color: pwdEstado.tipo === 'exito' ? '#14532d' : '#991b1b',
              border: `1px solid ${pwdEstado.tipo === 'exito' ? '#86efac' : '#fca5a5'}`
            }}>
              {pwdEstado.mensaje}
            </div>
          )}

          <form onSubmit={handleCambiarPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '400px' }}>
            <div>
              <label style={labelStyle}>Contraseña actual</label>
              <input
                type="password"
                value={pwdForm.currentPassword}
                onChange={e => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                style={inputStyleFull}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Nueva contraseña</label>
              <input
                type="password"
                value={pwdForm.newPassword}
                onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                style={inputStyleFull}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Confirmar nueva contraseña</label>
              <input
                type="password"
                value={pwdForm.confirmPassword}
                onChange={e => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                style={inputStyleFull}
                required
              />
            </div>

            <button
              type="submit"
              disabled={procesandoPwd}
              style={{ ...btnPrimaryStyle, width: 'fit-content', opacity: procesandoPwd ? 0.7 : 1 }}
            >
              {procesandoPwd ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}

// ESTILOS DE ALTO CONTRASTE Y FORMATO FORMAL
const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  padding: '24px'
};

const sectionHeaderStyle = {
  margin: '0 0 16px 0',
  fontSize: '15px',
  fontWeight: 'bold',
  color: '#0f172a',
  borderBottom: '2px solid #e2e8f0',
  paddingBottom: '8px'
};

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#334155',
  marginBottom: '6px'
};

const inputStyle = {
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #94a3b8',
  fontSize: '13px',
  backgroundColor: '#ffffff',
  color: '#0f172a'
};

const inputStyleFull = {
  ...inputStyle,
  width: '100%',
  boxSizing: 'border-box'
};

const checkboxStyle = {
  width: '18px',
  height: '18px',
  accentColor: '#2563eb',
  cursor: 'pointer'
};

const checkboxBoxStyle = (checked) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 14px',
  borderRadius: '6px',
  border: `1px solid ${checked ? '#2563eb' : '#cbd5e1'}`,
  backgroundColor: checked ? '#eff6ff' : '#ffffff',
  fontSize: '13px',
  fontWeight: 'bold',
  color: checked ? '#1e40af' : '#475569',
  cursor: 'pointer'
});

const btnPrimaryStyle = {
  padding: '10px 20px',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  fontWeight: 'bold',
  fontSize: '13px',
  cursor: 'pointer'
};

const btnSecondaryStyle = {
  padding: '8px 16px',
  backgroundColor: '#0f172a',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  fontWeight: 'bold',
  fontSize: '13px',
  cursor: 'pointer'
};

const btnOutlineStyle = {
  padding: '8px 16px',
  backgroundColor: '#ffffff',
  color: '#475569',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  fontWeight: 'bold',
  fontSize: '13px',
  cursor: 'pointer'
};

const thStyle = {
  padding: '12px 16px',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase'
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: '13px',
  color: '#1e293b'
};