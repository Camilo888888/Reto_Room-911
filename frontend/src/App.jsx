import React, { useState, useEffect } from 'react';

// Configuración global de la API
const API_URL = 'http://localhost:8080/api';

// Estilo CSS Global para eliminar márgenes y bordes blancos del navegador
const GlobalStyles = () => (
  <style>{`
    * {
      box-sizing: border-box;
    }
    html, body, #root {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: 100% !important;
      overflow-x: hidden;
    }
  `}</style>
);

// ==========================================
// SECCIÓN 1: COMPONENTE PRINCIPAL (App)
// ==========================================

export default function App() {
  // Cambiar el nombre de la pestaña del navegador
  useEffect(() => {
    document.title = 'ROOM_911 | Control de Acceso';
  }, []);

  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken') || null);
  const [userSession, setUserSession] = useState(() => {
    const saved = localStorage.getItem('userSession');
    return saved ? JSON.parse(saved) : null;
  });

  // Estado para alternar la vista de login inicial entre 'admin' y 'user'
  const [modoAcceso, setModoAcceso] = useState('admin');

  const [seccion, setSeccion] = useState('empleados');
  const [empleados, setEmpleados] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [historialAccesos, setHistorialAccesos] = useState([]);

  const [filtroEmpleadoSel, setFiltroEmpleadoSel] = useState('');
  const [filtroDepto, setFiltroDepto] = useState('');

  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [modalEditar, setModalEditar] = useState(null);
  const [modalHistorial, setModalHistorial] = useState(false);

  useEffect(() => {
    if (adminToken) {
      cargarTodo();
    }
  }, [adminToken]);

  const cargarTodo = () => {
    cargarEmpleados();
    cargarDepartamentos();
    cargarHistorial();
  };

  const handleAdminLogin = (token) => {
    localStorage.setItem('adminToken', token);
    setAdminToken(token);
  };

  const handleUserLogin = (sessionData) => {
    localStorage.setItem('userSession', JSON.stringify(sessionData));
    setUserSession(sessionData);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userSession');
    setAdminToken(null);
    setUserSession(null);
  };

  const cargarEmpleados = async () => {
    try {
      const res = await fetch(`${API_URL}/employees`);
      if (res.ok) {
        const data = await res.json();
        setEmpleados(data);
      }
    } catch (e) {
      console.error('Error al cargar empleados:', e);
    }
  };

  const cargarDepartamentos = async () => {
    try {
      const res = await fetch(`${API_URL}/departments`);
      if (res.ok) {
        const data = await res.json();
        setDepartamentos(data);
      }
    } catch (e) {
      console.error('Error al cargar departamentos:', e);
    }
  };

  const cargarHistorial = async () => {
    try {
      const res = await fetch(`${API_URL}/access-logs`);
      if (res.ok) {
        const data = await res.json();
        setHistorialAccesos(data);
      }
    } catch (e) {
      console.error('Error al cargar historial de accesos:', e);
    }
  };

  const abrirHistorico = (emp) => {
    setEmpleadoSeleccionado(emp);
    setModalHistorial(true);
  };

  const toggleInhabilitarEmpleado = async (emp) => {
    const estadoNuevo = !emp.active;
    const confirmacion = window.confirm(`¿Desea ${estadoNuevo ? 'ACTIVAR' : 'INHABILITAR'} a ${emp.firstName} ${emp.lastName}?`);
    if (!confirmacion) return;

    try {
      const res = await fetch(`${API_URL}/employees/${emp.id}/toggle-status`, {
        method: 'PATCH'
      });
      if (res.ok) {
        cargarEmpleados();
      } else {
        alert('Error al guardar cambios en el servidor.');
      }
    } catch {
      alert('Error de conexión con el servidor.');
    }
  };

  const toggleAutorizacionEmpleado = async (emp) => {
    const nuevoAcceso = !emp.accessGranted;

    setEmpleados(prev => prev.map(item => item.id === emp.id ? { ...item, accessGranted: nuevoAcceso } : item));

    try {
      const res = await fetch(`${API_URL}/employees/${emp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...emp, accessGranted: nuevoAcceso })
      });
      if (!res.ok) cargarEmpleados();
    } catch {
      cargarEmpleados();
      alert('Error de conexión.');
    }
  };

  // VISTA PARA USUARIO OPERATIVO/FUNCIONARIO
  if (userSession) {
    return (
      <>
        <GlobalStyles />
        <UserTerminal userSession={userSession} onLogout={handleLogout} />
      </>
    );
  }

  // Pantalla de Inicio de Sesión
  if (!adminToken) {
    return (
      <>
        <GlobalStyles />
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setModoAcceso('admin')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: modoAcceso === 'admin' ? '#2563eb' : '#334155',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Administrador
            </button>
            <button
              onClick={() => setModoAcceso('user')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: modoAcceso === 'user' ? '#2563eb' : '#334155',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Funcionario
            </button>
          </div>

          {modoAcceso === 'admin' ? (
            <ModuloLogin onLoginSuccess={handleAdminLogin} esAdmin={true} />
          ) : (
            <ModuloLogin onLoginSuccess={handleUserLogin} esAdmin={false} />
          )}
        </div>
      </>
    );
  }

  const empleadosOrdenados = [...empleados].sort((a, b) => Number(a.internalId) - Number(b.internalId));

  const empleadosFiltrados = empleadosOrdenados.filter(emp => {
    const coincideEmpleado = filtroEmpleadoSel ? emp.id.toString() === filtroEmpleadoSel : true;
    const coincideDepto = filtroDepto ? (emp.department?.id == filtroDepto) : true;
    return coincideEmpleado && coincideDepto;
  });

  const empleadosActivos = empleadosFiltrados.filter(emp => Boolean(emp.active));
  const empleadosInactivos = empleadosFiltrados.filter(emp => !Boolean(emp.active));

  const renderTablaEmpleados = (lista, titulo, esTablaActivos) => (
    <div style={{ marginBottom: '32px' }}>
      <h3 style={{ margin: '0 0 12px 0', color: esTablaActivos ? '#0f172a' : '#991b1b', fontSize: '18px' }}>
        {titulo} ({lista.length})
      </h3>
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Empleado</th>
              <th style={thStyle}>Departamento</th>
              <th style={thStyle}>Estado Usuario</th>
              <th style={thStyle}>Acceso ROOM_911</th>
              <th style={thStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((emp) => {
              const estaActivo = Boolean(emp.active);
              const tieneAcceso = emp.accessGranted === true && estaActivo;

              return (
                <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: estaActivo ? '#fff' : '#fef2f2' }}>
                  <td style={tdStyle}><b>{emp.internalId}</b></td>
                  <td style={tdStyle}>{emp.firstName} {emp.lastName}</td>
                  <td style={tdStyle}>{emp.department?.name || 'N/D'}</td>

                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '11px',
                      fontWeight: '700',
                      lineHeight: '1.2',
                      whiteSpace: 'nowrap',
                      backgroundColor: estaActivo ? '#dbeafe' : '#fecdd3',
                      color: estaActivo ? '#1e40af' : '#9f1239'
                    }}>
                      {estaActivo ? 'USUARIO ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>

                  <td style={tdStyle}>
                    <button
                      onClick={() => toggleAutorizacionEmpleado(emp)}
                      disabled={!estaActivo}
                      style={{
                        display: 'inline-flex',
                        padding: '6px 14px',
                        borderRadius: '16px',
                        fontSize: '11px',
                        fontWeight: '700',
                        border: 'none',
                        cursor: estaActivo ? 'pointer' : 'not-allowed',
                        backgroundColor: tieneAcceso ? '#dcfce7' : '#fee2e2',
                        color: tieneAcceso ? '#15803d' : '#b91c1c',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {!estaActivo ? 'ACCESO DENEGADO' : (emp.accessGranted ? 'AUTORIZADO' : 'SIN ACCESO')}
                    </button>
                  </td>

                  <td style={tdStyle}>
                    <button onClick={() => { setEmpleadoSeleccionado(emp); setModalEditar({ ...emp }); }} style={btnSm('#2563eb')}>Editar</button>
                    <button onClick={() => abrirHistorico(emp)} style={{ ...btnSm('#0284c7'), marginLeft: '6px' }}>Histórico</button>

                    <button
                      onClick={() => toggleInhabilitarEmpleado(emp)}
                      style={{
                        ...btnSm(estaActivo ? '#dc2626' : '#16a34a'),
                        marginLeft: '6px'
                      }}
                    >
                      {estaActivo ? 'Inactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {lista.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                  No hay usuarios {esTablaActivos ? 'activos' : 'inactivos'}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: '100vh', width: '100vw', backgroundColor: '#f8fafc', fontFamily: 'Segoe UI, sans-serif' }}>
        <header style={{ backgroundColor: '#0f172a', color: '#fff', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>ROOM_911 | Control de Acceso Administrativo</h1>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Laboratorios XYZ - Control de Producción</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => setSeccion('empleados')} style={btnNav(seccion === 'empleados')}>Usuarios</button>
            <button onClick={() => setSeccion('nuevo_empleado')} style={btnNav(seccion === 'nuevo_empleado')}>Crear Empleado</button>
            <button onClick={() => setSeccion('departamentos')} style={btnNav(seccion === 'departamentos')}>Departamentos</button>
            <button onClick={() => setSeccion('carga_masiva')} style={btnNav(seccion === 'carga_masiva')}>Carga CSV</button>
            <button onClick={() => setSeccion('lector')} style={btnNav(seccion === 'lector')}>Lector</button>
            <button onClick={handleLogout} style={{ ...btnNav(false), backgroundColor: '#ef4444' }}>Cerrar Sesión</button>
          </div>
        </header>

        <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>

          {seccion === 'empleados' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '20px', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Seleccionar Empleado:</label>
                  <select
                    value={filtroEmpleadoSel}
                    onChange={(e) => setFiltroEmpleadoSel(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                  >
                    <option value="">Todos los Empleados</option>
                    {empleadosOrdenados.map(emp => (
                      <option key={emp.id} value={emp.id}>
                         {emp.firstName} {emp.lastName} {emp.active === false ? '(Inactivo)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Seleccionar Departamento:</label>
                  <select
                    value={filtroDepto}
                    onChange={(e) => setFiltroDepto(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                  >
                    <option value="">Todos los Departamentos</option>
                    {departamentos.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              {renderTablaEmpleados(empleadosActivos, 'Usuarios Activos', true)}
              {renderTablaEmpleados(empleadosInactivos, 'Usuarios Inactivos', false)}
            </div>
          )}

          {seccion === 'nuevo_empleado' && (
            <ModuloCrearEmpleado
              departamentos={departamentos.filter(d => Boolean(d.active))}
              onSuccess={() => {
                cargarTodo();
                setSeccion('empleados');
              }}
            />
          )}

          {seccion === 'departamentos' && (
            <ModuloDepartamentos
              departamentos={departamentos}
              onSuccess={cargarTodo}
            />
          )}

          {seccion === 'carga_masiva' && (
            <ModuloCargaCSV
              departamentosExistentes={departamentos}
              empleadosExistentes={empleados}
              onSuccess={cargarTodo}
            />
          )}

          {seccion === 'lector' && (
            <ModuloSimuladorLector
              empleados={empleados}
              onSuccessAcceso={cargarHistorial}
            />
          )}

        </main>

        {modalEditar && (
          <ModalFormularioEmpleado
            datos={modalEditar}
            departamentos={departamentos.filter(d => Boolean(d.active))}
            onClose={() => setModalEditar(null)}
            onSave={cargarTodo}
          />
        )}

        {modalHistorial && (
          <ModalHistoricoAcceso
            empleado={empleadoSeleccionado}
            registros={historialAccesos.filter(h => h.employeeInternalId === empleadoSeleccionado?.internalId)}
            onClose={() => setModalHistorial(false)}
          />
        )}
      </div>
    </>
  );
}

// ==========================================================
// UserTerminal: Interfaz de Funcionario con Histórico Real
// ==========================================================
function UserTerminal({ userSession, onLogout }) {
  const [numIdentificacion, setNumIdentificacion] = useState(userSession?.internalId || '');
  const [fechaFiltro, setFechaFiltro] = useState('');

  // Estado para persistir y controlar las fechas de los certificados
  const [fechasCertificados, setFechasCertificados] = useState(() => {
    const savedFechas = localStorage.getItem(`cert_fechas_${userSession.internalId}`);
    return savedFechas ? JSON.parse(savedFechas) : {
      manipulacion: '',
      bioseguridad: '',
      vacunacion: '',
      aptitud: ''
    };
  });

  useEffect(() => {
    localStorage.setItem(`cert_fechas_${userSession.internalId}`, JSON.stringify(fechasCertificados));
  }, [fechasCertificados, userSession.internalId]);

  const handleFechaChange = (campo, val) => {
    setFechasCertificados(prev => ({
      ...prev,
      [campo]: val
    }));
  };

  const obtenerEstadoCertificado = (fechaStr) => {
    if (!fechaStr) return { estado: 'SIN FECHA', expiraStr: 'N/D', vigente: false };

    const fechaEmision = new Date(fechaStr + 'T00:00:00');
    const fechaVencimiento = new Date(fechaEmision);
    fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);

    const hoy = new Date();
    const esVigente = hoy <= fechaVencimiento;
    const expiraStr = fechaVencimiento.toLocaleDateString('es-CO');

    return {
      estado: esVigente ? 'VIGENTE' : 'VENCIDO',
      expiraStr: expiraStr,
      vigente: esVigente
    };
  };

  const [epp, setEpp] = useState({
    bata: false,
    cofia: false,
    tapabocas: false,
    calzado: false
  });

  const [simulandoLectura, setSimulandoLectura] = useState(false);
  const [resultadoUltimoAcceso, setResultadoUltimoAcceso] = useState({
    evaluado: false,
    exito: false,
    mensaje: 'PENDIENTE DE VALIDACIÓN'
  });

  const [historialPersonal, setHistorialPersonal] = useState([]);
  const [resumenAcceso, setResumenAcceso] = useState({
    exitosos: 0,
    denegados: 0
  });

  // Identifica al usuario autenticado mediante userSession.internalId y consulta PostgreSQL con parámetro de fecha si aplica
  const fetchHistorial = async (fechaParam = '') => {
    try {
      // Construcción de la URL de consulta filtrada a la base de datos
      let url = `${API_URL}/access-logs?employeeInternalId=${userSession.internalId}`;
      if (fechaParam) {
        url += `&date=${fechaParam}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const logs = await res.json();

        // Mapeo seguro de los campos retornados desde PostgreSQL
        const formateados = logs.map(log => {
          const exito = log.granted ?? log.successful ?? (log.status === 'ALLOWED');
          const fechaObj = log.timestamp ? new Date(log.timestamp) : new Date();

          return {
            id: log.id,
            fecha: fechaObj.toLocaleDateString('es-CO'),
            hora: fechaObj.toLocaleTimeString('es-CO'),
            tipoRegistro: log.type || 'Lector Biométrico',
            estado: exito ? 'ENTRADA EXITOSA' : 'ACCESO DENEGADO',
            identificacion: userSession.internalId,
            descripcion: log.details || log.message || (exito ? 'Acceso autorizado al recinto' : 'Restricción de ingreso'),
            exitoso: exito
          };
        });

        setHistorialPersonal(formateados);

        // Cálculo del resumen de accesos autenticados
        const exitososCount = logs.filter(l => l.granted ?? l.successful ?? (l.status === 'ALLOWED')).length;
        setResumenAcceso({
          exitosos: exitososCount,
          denegados: logs.length - exitososCount
        });
      }
    } catch (err) {
      console.error('Error al cargar historial desde PostgreSQL:', err);
    }
  };

  useEffect(() => {
    if (userSession?.internalId) {
      fetchHistorial();
    }
  }, [userSession.internalId]);

  // Handler para consulta con filtro de fecha desde PostgreSQL
  const handleConsultarFecha = (e) => {
    e.preventDefault();
    fetchHistorial(fechaFiltro);
  };

  // Handler para restablecer y mostrar todos los registros del usuario
  const handleMostrarTodos = () => {
    setFechaFiltro('');
    fetchHistorial('');
  };

  const handleEppChange = (e) => {
    setEpp({
      ...epp,
      [e.target.name]: e.target.checked
    });
  };

  const eppCompleto = epp.bata && epp.cofia && epp.tapabocas && epp.calzado;

  const validarCarnetIngresado = () => {
    if (!numIdentificacion.trim()) {
      alert('Por favor ingrese un número de identificación válido.');
      return false;
    }
    if (String(numIdentificacion).trim() !== String(userSession.internalId).trim()) {
      alert('El número de carnet no coincide con el usuario en sesión.');
      return false;
    }
    return true;
  };

  // Envía y guarda el nuevo registro de acceso en PostgreSQL
  const simularLectorCarnet = async () => {
    if (!validarCarnetIngresado()) return;

    const certs = [
      obtenerEstadoCertificado(fechasCertificados.manipulacion),
      obtenerEstadoCertificado(fechasCertificados.bioseguridad),
      obtenerEstadoCertificado(fechasCertificados.vacunacion),
      obtenerEstadoCertificado(fechasCertificados.aptitud)
    ];

    const faltaFecha = certs.some(c => c.estado === 'SIN FECHA');
    if (faltaFecha) {
      alert('Por favor ingrese la fecha para cada una de las acreditaciones médicas.');
      return;
    }

    const algunVencido = certs.some(c => !c.vigente);

    setSimulandoLectura(true);

    let exito = false;
    let mensaje = '';

    if (!userSession.accessGranted) {
      mensaje = 'ACCESO DENEGADO - USUARIO SIN AUTORIZACIÓN';
    } else if (algunVencido) {
      mensaje = 'ACCESO DENEGADO - CERTIFICADO MÉDICO VENCIDO';
    } else if (!eppCompleto) {
      mensaje = 'ACCESO DENEGADO - EPP INCOMPLETO';
    } else {
      exito = true;
      mensaje = 'ACCESO CONCEDIDO - EPP Y ACREDITACIONES VERIFICADAS';
    }

    try {
      // POST para INSERT/CREATE real en PostgreSQL mediante el backend
      await fetch(`${API_URL}/access/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internalId: userSession.internalId,
          granted: exito,
          message: mensaje,
          timestamp: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error('Error al registrar acceso en PostgreSQL:', err);
    }

    setTimeout(() => {
      setResultadoUltimoAcceso({ evaluado: true, exito, mensaje });
      setSimulandoLectura(false);
      fetchHistorial(fechaFiltro);
    }, 400);
  };

  const userCardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    padding: '24px'
  };

  const sectionHeaderStyle = {
    borderBottom: '2px solid #e2e8f0',
    paddingBottom: '10px',
    marginBottom: '16px'
  };

  const listaCertificados = [
    { key: 'manipulacion', label: 'Examen de Manipulación' },
    { key: 'bioseguridad', label: 'Certificación de Bioseguridad' },
    { key: 'vacunacion', label: 'Esquema de Vacunación' },
    { key: 'aptitud', label: 'Aptitud Ocupacional Lab' }
  ];

  return (
    <div style={{ minHeight: '100vh', width: '100vw', backgroundColor: '#f1f5f9', fontFamily: 'Segoe UI, Arial, sans-serif', color: '#0f172a' }}>

      {/* HEADER DE FUNCIONARIO */}
      <header style={{
        backgroundColor: '#0f172a',
        borderBottom: '3px solid #2563eb',
        padding: '16px 36px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#ffffff'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '0.5px' }}>
            LABORATORIOS XYZ | ROOM_911
          </h1>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Terminal de Acceso Operativo</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Funcionario</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff', display: 'block' }}>
              {userSession.firstName} {userSession.lastName} ({userSession.internalId})
            </span>
            <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '600' }}>
              Depto: {userSession.department?.name || 'No Asignado'}
            </span>
          </div>
          <button
            onClick={onLogout}
            style={{
              backgroundColor: '#dc2626',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '12px',
              color: '#ffffff',
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

        {/* CONTENEDOR DE DOS COLUMNAS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px' }}>

          {/* CHECKLIST EPP Y ACREDITACIONES */}
          <div style={{ ...userCardStyle, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={sectionHeaderStyle}>
                <h3 style={{ margin: 0, fontSize: '14px', color: '#0f172a', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Verificación de Bioseguridad y EPP
                </h3>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Acreditaciones Médicas (Vigencia 1 año)
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {listaCertificados.map((item) => {
                    const infoCert = obtenerEstadoCertificado(fechasCertificados[item.key]);
                    return (
                      <div key={item.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#1e293b', fontWeight: '600' }}>{item.label}:</span>
                          <span style={{
                            backgroundColor: infoCert.estado === 'VIGENTE' ? '#dcfce7' : (infoCert.estado === 'VENCIDO' ? '#fee2e2' : '#f1f5f9'),
                            color: infoCert.estado === 'VIGENTE' ? '#14532d' : (infoCert.estado === 'VENCIDO' ? '#991b1b' : '#64748b'),
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}>
                            {infoCert.estado}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>Fecha:</span>
                            <input
                              type="date"
                              value={fechasCertificados[item.key]}
                              onChange={(e) => handleFechaChange(item.key, e.target.value)}
                              style={{
                                padding: '3px 6px',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                                fontSize: '11px',
                                backgroundColor: '#ffffff'
                              }}
                            />
                          </div>

                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            Vence: <b style={{ color: '#334155' }}>{infoCert.expiraStr}</b>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Lista de Chequeo EPP
                </span>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '12px' }}>
                  Seleccione los elementos de protección verificados antes de ingresar:
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { key: 'bata', label: 'Bata Esterilizada' },
                    { key: 'cofia', label: 'Cofia Quirúrgica' },
                    { key: 'tapabocas', label: 'Tapabocas N95' },
                    { key: 'calzado', label: 'Polainas / Calzado' }
                  ].map((item) => (
                    <label
                      key={item.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '4px',
                        border: `1px solid ${epp[item.key] ? '#bbf7d0' : '#cbd5e1'}`,
                        backgroundColor: epp[item.key] ? '#f0fdf4' : '#ffffff',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: epp[item.key] ? '#166534' : '#475569'
                      }}
                    >
                      <input
                        type="checkbox"
                        name={item.key}
                        checked={epp[item.key]}
                        onChange={handleEppChange}
                        style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={simularLectorCarnet}
              disabled={simulandoLectura}
              style={{
                marginTop: '24px',
                width: '100%',
                padding: '12px',
                backgroundColor: '#1e293b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: simulandoLectura ? 'not-allowed' : 'pointer'
              }}
            >
              {simulandoLectura ? 'REGISTRANDO EN BASE DE DATOS...' : 'CONFIRMAR EPP Y REGISTRAR INGRESO'}
            </button>
          </div>

          {/* HISTÓRICO DE REGISTROS - SECCIÓN CORREGIDA CON TABLA Y FILTRO REAL */}
          <div style={{ ...userCardStyle, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={sectionHeaderStyle}>
                <h3 style={{ margin: 0, fontSize: '14px', color: '#0f172a', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Histórico de Registros
                </h3>
              </div>

              {/* Controles de selección y consulta por fecha */}
              <form onSubmit={handleConsultarFecha} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={fechaFiltro}
                    onChange={(e) => setFechaFiltro(e.target.value)}
                    style={{ ...inputFull, padding: '6px 10px', fontSize: '12px' }}
                  />
                </div>
                <button type="submit" style={{ ...btnSm('#2563eb'), padding: '8px 14px' }}>
                  Consultar
                </button>
                <button type="button" onClick={handleMostrarTodos} style={{ ...btnSm('#64748b'), padding: '8px 14px' }}>
                  Mostrar Todos
                </button>
              </form>

              {/* Tabla organizada con estilos existentes del proyecto */}
              <div style={{ overflowX: 'auto', maxHeight: '250px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0', stickyHeader: 'true' }}>
                    <tr>
                      <th style={thStyle}>Fecha</th>
                      <th style={thStyle}>Hora</th>
                      <th style={thStyle}>Tipo</th>
                      <th style={thStyle}>Identificación</th>
                      <th style={thStyle}>Estado</th>
                      <th style={thStyle}>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialPersonal.map((log, idx) => (
                      <tr key={log.id || idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: log.exitoso ? '#ffffff' : '#fef2f2' }}>
                        <td style={tdStyle}><b>{log.fecha}</b></td>
                        <td style={tdStyle}>{log.hora}</td>
                        <td style={tdStyle}>{log.tipoRegistro}</td>
                        <td style={tdStyle}>{log.identificacion}</td>
                        <td style={tdStyle}>
                          <span style={{
                            display: 'inline-flex',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            backgroundColor: log.exitoso ? '#dcfce7' : '#fee2e2',
                            color: log.exitoso ? '#15803d' : '#b91c1c'
                          }}>
                            {log.estado}
                          </span>
                        </td>
                        <td style={tdStyle}>{log.descripcion}</td>
                      </tr>
                    ))}
                    {historialPersonal.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                          No hay registros para la fecha seleccionada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RESUMEN DE ACTIVIDAD DESDE BASE DE DATOS */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                Resumen de Intentos
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#166534', fontWeight: 'bold', textTransform: 'uppercase' }}>Exitosos</span>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#15803d' }}>{resumenAcceso.exitosos}</div>
                </div>
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#991b1b', fontWeight: 'bold', textTransform: 'uppercase' }}>Denegados</span>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#b91c1c' }}>{resumenAcceso.denegados}</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* INDICADOR DE ACCESO FINAL */}
        <div style={userCardStyle}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
            Estado de Respuesta del Sistema
          </span>

          <div style={{
            padding: '16px 24px',
            borderRadius: '6px',
            backgroundColor: !resultadoUltimoAcceso.evaluado ? '#f8fafc' : (resultadoUltimoAcceso.exito ? '#f0fdf4' : '#fef2f2'),
            border: `2px solid ${!resultadoUltimoAcceso.evaluado ? '#cbd5e1' : (resultadoUltimoAcceso.exito ? '#16a34a' : '#dc2626')}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: !resultadoUltimoAcceso.evaluado ? '#475569' : (resultadoUltimoAcceso.exito ? '#15803d' : '#dc2626')
          }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
              {resultadoUltimoAcceso.mensaje}
            </span>

            <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#ffffff', border: '1px solid currentColor' }}>
              {resultadoUltimoAcceso.exito ? 'PUERTA DESBLOQUEADA' : 'PUERTA BLOQUEADA'}
            </span>
          </div>
        </div>

      </main>
    </div>
  );
}

// ==========================================
// SECCIÓN 2: MÓDULOS Y VISTAS SECUNDARIAS
// ==========================================

function ModuloLogin({ onLoginSuccess, esAdmin = true }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setCargando(true);

    try {
      const endpoint = esAdmin ? `${API_URL}/auth/login` : `${API_URL}/auth/user-login`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        onLoginSuccess(esAdmin ? data.token : data);
      } else {
        setErrorMsg(data.message || 'Credenciales inválidas.');
      }
    } catch {
      setErrorMsg('Error de conexión con el servidor Spring Boot.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={handleLogin} style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '12px', width: '360px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
      <h2 style={{ textAlign: 'center', margin: '0 0 8px 0', color: '#0f172a' }}>Acceso ROOM_911</h2>
      <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
        {esAdmin ? 'Acceso Exclusivo de Administración' : 'Acceso de Funcionario'}
      </p>

      {errorMsg && (
        <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '12px', marginBottom: '14px', textAlign: 'center', fontWeight: 'bold' }}>
          {errorMsg}
        </div>
      )}

      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Carnet ID:</label>
        <input
          type="text"
          placeholder="ID Carnet"
          value={username}
          onChange={e => setUsername(e.target.value.replace(/\D/g, ''))}
          style={inputFull}
          required
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Contraseña:</label>
        <input
          type="password"
          placeholder="********"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={inputFull}
          required
        />
      </div>

      <button
        type="submit"
        disabled={cargando}
        style={{ ...btnAccion('#2563eb'), width: '100%', cursor: cargando ? 'not-allowed' : 'pointer', opacity: cargando ? 0.7 : 1 }}
      >
        {cargando ? 'Verificando...' : (esAdmin ? 'Ingresar como Administrador' : 'Ingresar como Funcionario')}
      </button>
    </form>
  );
}

function ModuloCrearEmpleado({ departamentos, onSuccess }) {
  const [form, setForm] = useState({
    internalId: '',
    firstName: '',
    lastName: '',
    departmentId: '',
    accessGranted: true,
    password: '',
    active: true
  });
  const [mensaje, setMensaje] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);

    if (!form.internalId.trim() || isNaN(form.internalId.trim())) {
      setMensaje({ tipo: 'error', texto: 'El Carnet es obligatorio y debe ser numérico.' });
      return;
    }
    if (!form.firstName.trim()) {
      setMensaje({ tipo: 'error', texto: 'El nombre es obligatorio.' });
      return;
    }
    if (!form.lastName.trim()) {
      setMensaje({ tipo: 'error', texto: 'El apellido es obligatorio.' });
      return;
    }
    if (!form.departmentId) {
      setMensaje({ tipo: 'error', texto: 'Debe seleccionar un departamento obligatorio.' });
      return;
    }
    if (!form.password || form.password.length < 8) {
      setMensaje({ tipo: 'error', texto: 'La contraseña debe tener mínimo 8 caracteres.' });
      return;
    }

    try {
      const payload = {
        internalId: form.internalId.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        password: form.password,
        accessGranted: form.accessGranted,
        active: form.active,
        department: { id: parseInt(form.departmentId) }
      };

      const res = await fetch(`${API_URL}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMensaje({ tipo: 'exito', texto: 'Empleado registrado correctamente.' });
        if (onSuccess) onSuccess();
      } else {
        setMensaje({ tipo: 'error', texto: 'Error al registrar empleado. Verifique que el Carnet ID no exista.' });
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error de conexión con el servidor.' });
    }
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '28px', borderRadius: '12px', border: '1px solid #e2e8f0', maxWidth: '550px', margin: '0 auto' }}>
      <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#0f172a' }}>Registrar Nuevo Empleado</h3>
      <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Todos los campos son obligatorios.</p>

      {mensaje && (
        <div style={{ padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', fontWeight: 'bold', backgroundColor: mensaje.tipo === 'exito' ? '#dcfce7' : '#fee2e2', color: mensaje.tipo === 'exito' ? '#15803d' : '#b91c1c' }}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={labelStyle}>Carnet / ID *</label>
          <input
            type="text"
            placeholder="1000"
            value={form.internalId}
            onChange={e => setForm({ ...form, internalId: e.target.value.replace(/\D/g, '') })}
            style={inputFull}
            required
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Nombre *</label>
            <input
              type="text"
              placeholder="Laura"
              value={form.firstName}
              onChange={e => setForm({ ...form, firstName: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') })}
              style={inputFull}
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Apellido *</label>
            <input
              type="text"
              placeholder="Montes"
              value={form.lastName}
              onChange={e => setForm({ ...form, lastName: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') })}
              style={inputFull}
              required
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Departamento *</label>
          <select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} style={inputFull} required>
            <option value="">Seleccionar Departamento</option>
            {departamentos.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Contraseña *</label>
          <input type="password" placeholder="********" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={inputFull} required />
        </div>

        <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.accessGranted} onChange={e => setForm({ ...form, accessGranted: e.target.checked })} style={{ width: '18px', height: '18px' }} />
            <b>Otorgar acceso al ROOM_911</b>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} style={{ width: '18px', height: '18px' }} />
            <b>Usuario Activo</b>
          </label>
        </div>

        <button type="submit" style={{ ...btnAccion('#2563eb'), width: '100%', marginTop: '10px', padding: '12px' }}>Registrar Empleado</button>
      </form>
    </div>
  );
}

function ModuloDepartamentos({ departamentos, onSuccess }) {
  const [nombreDepto, setNombreDepto] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [mensaje, setMensaje] = useState(null);

  const handleCrearDepartamento = async (e) => {
    e.preventDefault();
    if (!nombreDepto.trim()) return;

    try {
      const res = await fetch(`${API_URL}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nombreDepto.trim(), active: true })
      });

      if (res.ok) {
        setMensaje({ tipo: 'exito', texto: 'Departamento registrado correctamente.' });
        setNombreDepto('');
        if (onSuccess) onSuccess();
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error de conexión con el servidor.' });
    }
  };

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) return;

    try {
      const res = await fetch(`${API_URL}/departments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() })
      });

      if (res.ok) {
        setEditingId(null);
        setEditName('');
        if (onSuccess) onSuccess();
      }
    } catch {
      alert('Error al guardar la modificación del departamento.');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await fetch(`${API_URL}/departments/${id}/toggle-status`, {
        method: 'PATCH'
      });

      if (res.ok && onSuccess) {
        onSuccess();
      }
    } catch {
      alert('Error al cambiar el estado del departamento.');
    }
  };

  const deptoActivos = departamentos.filter(d => Boolean(d.active));
  const deptoInactivos = departamentos.filter(d => !Boolean(d.active));

  const renderTablaDepartamentos = (lista, titulo, esTablaActivos) => (
    <div style={{ marginBottom: '24px' }}>
      <h4 style={{ margin: '0 0 10px 0', color: esTablaActivos ? '#0f172a' : '#991b1b', fontSize: '16px' }}>{titulo}</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
            <th style={thStyle}>Departamento</th>
            <th style={thStyle}>Estado</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((d) => {
            const estaActivo = Boolean(d.active);

            return (
              <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: estaActivo ? '#fff' : '#fef2f2' }}>
                <td style={tdStyle}>
                  {editingId === d.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))}
                      style={{ ...inputFull, padding: '4px 8px' }}
                    />
                  ) : (
                    <span style={{ color: estaActivo ? '#0f172a' : '#94a3b8', fontWeight: 'bold' }}>
                      {d.name}
                    </span>
                  )}
                </td>

                <td style={tdStyle}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    backgroundColor: estaActivo ? '#dcfce7' : '#fee2e2',
                    color: estaActivo ? '#15803d' : '#b91c1c'
                  }}>
                    {estaActivo ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </td>

                <td style={{ ...tdStyle, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '6px', whiteSpace: 'nowrap' }}>
                  {editingId === d.id ? (
                    <>
                      <button onClick={() => handleSaveEdit(d.id)} style={btnSm('#16a34a')}>Guardar</button>
                      <button onClick={() => setEditingId(null)} style={btnSm('#64748b')}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(d.id); setEditName(d.name); }} style={btnSm('#2563eb')}>Editar</button>
                      <button
                        onClick={() => handleToggleStatus(d.id)}
                        style={btnSm(estaActivo ? '#dc2626' : '#0284c7')}
                      >
                        {estaActivo ? 'Inactivar' : 'Activar'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          {lista.length === 0 && (
            <tr>
              <td colSpan="3" style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                No hay departamentos {esTablaActivos ? 'activos' : 'inactivos'}.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ flex: '1 1 320px', backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
        <h3 style={{ marginTop: 0, color: '#0f172a' }}>Registrar Nuevo Departamento</h3>
        {mensaje && (
          <p style={{ color: mensaje.tipo === 'exito' ? '#16a34a' : '#dc2626', fontWeight: 'bold', fontSize: '13px' }}>
            {mensaje.texto}
          </p>
        )}
        <form onSubmit={handleCrearDepartamento} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Nombre del departamento"
            value={nombreDepto}
            onChange={e => setNombreDepto(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))}
            style={inputFull}
            required
          />
          <button type="submit" style={btnAccion('#2563eb')}>Crear Departamento</button>
        </form>
      </div>

      <div style={{ flex: '2 1 500px', backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        {renderTablaDepartamentos(deptoActivos, 'Departamentos Activos', true)}
        {renderTablaDepartamentos(deptoInactivos, 'Departamentos Inactivos', false)}
      </div>
    </div>
  );
}

function ModuloCargaCSV({ departamentosExistentes = [], empleadosExistentes = [], onSuccess }) {
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [reporte, setReporte] = useState(null);

  const parseBoolean = (val, defaultVal = true) => {
    if (val === undefined || val === null || val === '') return defaultVal;
    const clean = String(val).trim().toLowerCase();
    return ['true', '1', 'si', 'sí', 'activo', 'permitir'].includes(clean);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!archivo) return alert('Por favor, seleccione un archivo CSV.');

    setCargando(true);
    setReporte(null);

    const reader = new FileReader();
    reader.readAsText(archivo, 'UTF-8');

    reader.onload = async (evt) => {
      const contenido = evt.target.result;
      const lineas = contenido.split(/\r\n|\n/).filter(linea => linea.trim() !== '');

      if (lineas.length <= 1) {
        setReporte({
          total: 0,
          exitosos: 0,
          fallidos: 0,
          detalles: [{ fila: '-', error: 'El archivo está vacío o solo contiene la cabecera.' }]
        });
        setCargando(false);
        return;
      }

      const separador = lineas[0].includes(';') ? ';' : ',';
      const cabeceras = lineas[0].split(separador).map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));

      const indexMap = {
        internalId: cabeceras.findIndex(h => ['internalid', 'carnet', 'id', 'carnetid'].includes(h)),
        firstName: cabeceras.findIndex(h => ['firstname', 'nombre', 'nombres'].includes(h)),
        lastName: cabeceras.findIndex(h => ['lastname', 'apellido', 'apellidos'].includes(h)),
        department: cabeceras.findIndex(h => ['department', 'departamento', 'depto'].includes(h)),
        accessGranted: cabeceras.findIndex(h => ['accessgranted', 'acceso', 'permitiracceso'].includes(h)),
        active: cabeceras.findIndex(h => ['active', 'activo', 'estado'].includes(h)),
        password: cabeceras.findIndex(h => ['password', 'contrasena', 'clave'].includes(h))
      };

      if (indexMap.internalId === -1 || indexMap.firstName === -1 || indexMap.lastName === -1) {
        setReporte({
          total: 0,
          exitosos: 0,
          fallidos: 1,
          detalles: [{ fila: 1, error: 'Cabeceras no reconocidas. El CSV debe incluir: Carnet (o internalId), Nombre y Apellido.' }]
        });
        setCargando(false);
        return;
      }

      let exitosos = 0;
      let fallidos = 0;
      const erroresDetallados = [];

      const mapDepartamentos = new Map();
      departamentosExistentes.forEach(d => mapDepartamentos.set(d.name.trim().toLowerCase(), d));

      const carnetProcesadosEnLote = new Set();
      const carnetExistentesBD = new Set(empleadosExistentes.map(e => String(e.internalId).trim()));

      for (let i = 1; i < lineas.length; i++) {
        const numFila = i + 1;
        const columnas = lineas[i].split(separador).map(c => c.trim().replace(/^["']|["']$/g, ''));

        const internalId = indexMap.internalId !== -1 ? columnas[indexMap.internalId] : '';
        const firstName = indexMap.firstName !== -1 ? columnas[indexMap.firstName] : '';
        const lastName = indexMap.lastName !== -1 ? columnas[indexMap.lastName] : '';
        const deptoNombre = indexMap.department !== -1 ? columnas[indexMap.department] : '';
        const rawAccess = indexMap.accessGranted !== -1 ? columnas[indexMap.accessGranted] : 'true';
        const rawActive = indexMap.active !== -1 ? columnas[indexMap.active] : 'true';
        const rawPassword = indexMap.password !== -1 ? columnas[indexMap.password] : '12345678';

        if (!internalId || isNaN(internalId)) {
          fallidos++;
          erroresDetallados.push({ fila: numFila, error: `Carnet ID "${internalId}" inválido o no numérico.` });
          continue;
        }

        if (!firstName || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(firstName)) {
          fallidos++;
          erroresDetallados.push({ fila: numFila, error: `El nombre "${firstName}" debe contener solo letras.` });
          continue;
        }

        if (!lastName || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(lastName)) {
          fallidos++;
          erroresDetallados.push({ fila: numFila, error: `El apellido "${lastName}" debe contener solo letras.` });
          continue;
        }

        if (carnetExistentesBD.has(internalId) || carnetProcesadosEnLote.has(internalId)) {
          fallidos++;
          erroresDetallados.push({ fila: numFila, error: `Registro duplicado. El Carnet ID "${internalId}" ya existe.` });
          continue;
        }

        let deptoObj = null;
        if (deptoNombre) {
          const keyDepto = deptoNombre.trim().toLowerCase();
          if (mapDepartamentos.has(keyDepto)) {
            deptoObj = mapDepartamentos.get(keyDepto);
          } else {
            try {
              const resDepto = await fetch(`${API_URL}/departments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: deptoNombre.trim(), active: true })
              });
              if (resDepto.ok) {
                deptoObj = await resDepto.json();
                mapDepartamentos.set(keyDepto, deptoObj);
              }
            } catch (err) {
              console.error('Error al autocrear departamento:', err);
            }
          }
        }

        if (!deptoObj) {
          fallidos++;
          erroresDetallados.push({ fila: numFila, error: `No se pudo asignar ni crear el departamento "${deptoNombre}".` });
          continue;
        }

        const payload = {
          internalId: internalId,
          firstName: firstName,
          lastName: lastName,
          password: rawPassword.length >= 8 ? rawPassword : 'ContrasenaPorDefecto123!',
          accessGranted: parseBoolean(rawAccess, true),
          active: parseBoolean(rawActive, true),
          department: { id: deptoObj.id }
        };

        try {
          const resEmp = await fetch(`${API_URL}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (resEmp.ok) {
            exitosos++;
            carnetProcesadosEnLote.add(internalId);
          } else {
            fallidos++;
            erroresDetallados.push({ fila: numFila, error: `El servidor rechazó el registro (ID ${internalId}).` });
          }
        } catch {
          fallidos++;
          erroresDetallados.push({ fila: numFila, error: `Error de conexión al procesar la fila.` });
        }
      }

      setReporte({
        total: lineas.length - 1,
        exitosos,
        fallidos,
        detalles: erroresDetallados
      });

      setCargando(false);
      if (exitosos > 0 && onSuccess) {
        onSuccess();
      }
    };
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', maxWidth: '700px', margin: '0 auto' }}>
      <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Cargar Empleados por Archivo CSV</h3>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
        Soporta encabezados: <code>carnet, nombre, apellido, departamento, acceso, activo, contraseña</code>.
      </p>

      <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={e => setArchivo(e.target.files[0])}
            style={inputFull}
            required
          />
        </div>

        <button type="submit" disabled={cargando} style={{ ...btnAccion('#0d9488'), opacity: cargando ? 0.6 : 1 }}>
          {cargando ? 'Procesando y Validando CSV...' : 'Procesar e Importar CSV'}
        </button>
      </form>

      {reporte && (
        <div style={{ marginTop: '24px', padding: '16px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>Resultado de la Importación Masiva</h4>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1, padding: '10px', backgroundColor: '#e2e8f0', borderRadius: '6px', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: '#475569' }}>Total Procesados</span>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{reporte.total}</div>
            </div>
            <div style={{ flex: 1, padding: '10px', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '6px', textAlign: 'center' }}>
              <span style={{ fontSize: '12px' }}>Exitosos</span>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{reporte.exitosos}</div>
            </div>
            <div style={{ flex: 1, padding: '10px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', textAlign: 'center' }}>
              <span style={{ fontSize: '12px' }}>Con Errores</span>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{reporte.fallidos}</div>
            </div>
          </div>

          {reporte.detalles.length > 0 && (
            <div>
              <h5 style={{ margin: '0 0 8px 0', color: '#991b1b' }}>Detalle de Errores e Inconsistencias:</h5>
              <div style={{ maxHeight: '180px', overflowY: 'auto', backgroundColor: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #fee2e2' }}>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#991b1b' }}>
                  {reporte.detalles.map((err, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>
                      <b>Fila {err.fila}:</b> {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ModuloSimuladorLector({ empleados = [], onSuccessAcceso }) {
  const [carnet, setCarnet] = useState('');
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const simularEntrada = async (e) => {
    e.preventDefault();
    if (!carnet.trim()) return;

    setCargando(true);
    setResultado(null);

    const empleado = empleados.find(emp => String(emp.internalId) === carnet.trim());
    let esValido = false;
    let mensaje = '';
    let nombre = '';

    if (!empleado) {
      mensaje = 'Carnet no registrado en el sistema.';
    } else if (!empleado.active) {
      mensaje = 'Usuario inactivo. Acceso denegado.';
      nombre = `${empleado.firstName} ${empleado.lastName}`;
    } else if (!empleado.accessGranted) {
      mensaje = 'Sin autorización de acceso.';
      nombre = `${empleado.firstName} ${empleado.lastName}`;
    } else {
      esValido = true;
      mensaje = 'Acceso permitido.';
      nombre = `${empleado.firstName} ${empleado.lastName}`;
    }

    try {
      await fetch(`${API_URL}/access/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalId: carnet.trim() })
      });
    } catch (err) {
      console.error('Error al registrar log de acceso:', err);
    }

    setTimeout(() => {
      setResultado({ granted: esValido, message: mensaje, employeeName: nombre });
      setCargando(false);
      setCarnet('');
      if (onSuccessAcceso) onSuccessAcceso();
    }, 400);
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      padding: '32px',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      maxWidth: '420px',
      margin: '0 auto',
      textAlign: 'center'
    }}>
      <h3 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '18px' }}>
        Lector ROOM_911
      </h3>
      <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
        Ingrese el número de carnet
      </p>

      <form onSubmit={simularEntrada} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          type="text"
          placeholder="1000"
          value={carnet}
          onChange={e => setCarnet(e.target.value.replace(/\D/g, ''))}
          disabled={cargando}
          style={{
            width: '100%',
            padding: '10px',
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: '600',
            backgroundColor: '#fff',
            color: '#334155',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
          required
          autoFocus
        />

        <button
          type="submit"
          disabled={cargando}
          style={{
            padding: '10px 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: cargando ? '#94a3b8' : '#2563eb',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: '600',
            cursor: cargando ? 'not-allowed' : 'pointer'
          }}
        >
          {cargando ? 'Verificando...' : 'Simular Lectura'}
        </button>
      </form>

      {resultado && (
        <div style={{
          marginTop: '20px',
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: resultado.granted ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${resultado.granted ? '#bbf7d0' : '#fecaca'}`,
          textAlign: 'left'
        }}>
          <span style={{
            display: 'block',
            fontWeight: 'bold',
            fontSize: '13px',
            color: resultado.granted ? '#166534' : '#991b1b',
            marginBottom: '2px'
          }}>
            {resultado.granted ? 'Acceso Concedido' : 'Acceso Denegado'}
          </span>
          {resultado.employeeName && (
            <span style={{ display: 'block', fontSize: '13px', color: '#334155', fontWeight: '500' }}>
              {resultado.employeeName}
            </span>
          )}
          <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            {resultado.message}
          </span>
        </div>
      )}
    </div>
  );
}

// ==========================================
// SECCIÓN 3: VENTANAS MODALES
// ==========================================

function ModalFormularioEmpleado({ datos, departamentos, onClose, onSave }) {
  const [form, setForm] = useState({
    internalId: datos.internalId || '',
    firstName: datos.firstName || '',
    lastName: datos.lastName || '',
    password: '',
    departmentId: datos.department?.id || '',
    accessGranted: datos.accessGranted ?? true,
    active: datos.active ?? true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...datos,
      internalId: form.internalId,
      firstName: form.firstName,
      lastName: form.lastName,
      accessGranted: form.accessGranted,
      active: form.active,
      department: form.departmentId ? { id: parseInt(form.departmentId) } : datos.department
    };

    if (form.password.trim().length > 0) {
      if (form.password.trim().length < 8) {
        alert('La contraseña nueva debe tener al menos 8 caracteres.');
        return;
      }
      payload.password = form.password.trim();
    }

    try {
      const res = await fetch(`${API_URL}/employees/${datos.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSave();
        onClose();
      } else {
        alert('Error al guardar cambios.');
      }
    } catch {
      alert('Error de conexión con el servidor.');
    }
  };

  return (
    <div style={modalOverlay}>
      <div style={modalBox}>
        <h3 style={{ marginTop: 0, color: '#0f172a' }}>Editar Empleado</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          <div>
            <label style={labelStyle}>Carnet ID</label>
            <input
              type="text"
              placeholder="Carnet ID"
              value={form.internalId}
              onChange={e => setForm({ ...form, internalId: e.target.value.replace(/\D/g, '') })}
              style={inputFull}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Nombre</label>
            <input
              type="text"
              placeholder="Nombre"
              value={form.firstName}
              onChange={e => setForm({ ...form, firstName: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') })}
              style={inputFull}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Apellido</label>
            <input
              type="text"
              placeholder="Apellido"
              value={form.lastName}
              onChange={e => setForm({ ...form, lastName: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') })}
              style={inputFull}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Cambiar Contraseña (Mín. 8 caracteres)</label>
            <input
              type="password"
              placeholder="Dejar en blanco para mantener la contraseña actual"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              style={inputFull}
            />
          </div>

          <div>
            <label style={labelStyle}>Departamento</label>
            <select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} style={inputFull} required>
              <option value="">Seleccionar Departamento</option>
              {departamentos.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}>
            <input type="checkbox" checked={form.accessGranted} onChange={e => setForm({ ...form, accessGranted: e.target.checked })} />
            <b>Permitir Acceso a ROOM_911</b>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
            <b>Usuario Activo en Sistema</b>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button type="button" onClick={onClose} style={btnSm('#64748b')}>Cancelar</button>
            <button type="submit" style={btnAccion('#2563eb')}>Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalHistoricoAcceso({ empleado, registros, onClose }) {
  return (
    <div style={modalOverlay}>
      <div style={{ ...modalBox, maxWidth: '650px', width: '90%' }}>
        <h3 style={{ marginTop: 0, color: '#0f172a' }}>
          Histórico de Accesos: {empleado?.firstName} {empleado?.lastName}
        </h3>
        <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                <th style={thStyle}>Fecha y Hora</th>
                <th style={thStyle}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {registros && registros.map((log, idx) => {
                const exito = log.granted ?? log.successful ?? log.status === 'ALLOWED' ?? false;
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={tdStyle}>{log.timestamp ? new Date(log.timestamp).toLocaleString('es-ES') : 'N/D'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: exito ? '#dcfce7' : '#fee2e2',
                        color: exito ? '#15803d' : '#b91c1c'
                      }}>
                        {exito ? 'EXITOSO' : 'RECHAZADO'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {(!registros || registros.length === 0) && (
                <tr>
                  <td colSpan="2" style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                    Sin accesos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ textAlign: 'right', marginTop: '16px' }}>
          <button onClick={onClose} style={btnSm('#64748b')}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SECCIÓN 4: ESTILOS Y RECURSOS REUTILIZABLES
// ==========================================

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#475569',
  marginBottom: '4px'
};

const btnNav = (active) => ({
  padding: '8px 14px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: active ? '#2563eb' : '#334155',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '13px'
});

const btnAccion = (color) => ({
  padding: '10px 16px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: color,
  color: '#fff',
  fontWeight: 'bold',
  cursor: 'pointer'
});

const btnSm = (color) => ({
  padding: '6px 12px',
  borderRadius: '4px',
  border: 'none',
  backgroundColor: color,
  color: '#fff',
  fontSize: '12px',
  fontWeight: 'bold',
  cursor: 'pointer'
});

const inputFull = {
  width: '100%',
  padding: '10px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  boxSizing: 'border-box'
};

const thStyle = {
  padding: '12px',
  color: '#475569',
  fontSize: '12px',
  fontWeight: 'bold'
};

const tdStyle = {
  padding: '12px',
  fontSize: '13px',
  color: '#334155'
};

const modalOverlay = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalBox = {
  backgroundColor: '#fff',
  padding: '24px',
  borderRadius: '12px',
  maxWidth: '500px',
  width: '100%',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
};