import React, { useState, useEffect } from 'react';

// Configuración global de la API
const API_URL = 'http://localhost:8080/api';

// ==========================================
// SECCIÓN 1: COMPONENTE PRINCIPAL (App)
// ==========================================

export default function App() {
  // Estado para persistencia de la sesión administrativa (localStorage)
  const [adminToken, setAdminToken] = useState(() => {
    return localStorage.getItem('adminToken') || null;
  });

  // Estados de navegación y datos generales
  const [seccion, setSeccion] = useState('empleados');
  const [empleados, setEmpleados] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [historialAccesos, setHistorialAccesos] = useState([]);

  // Estados para filtros de búsqueda
  const [filtroEmpleadoSel, setFiltroEmpleadoSel] = useState('');
  const [filtroDepto, setFiltroDepto] = useState('');

  // Estados para ventanas modales
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [modalEditar, setModalEditar] = useState(null);
  const [modalHistorial, setModalHistorial] = useState(false);

  // Carga inicial de datos al verificar la sesión
  useEffect(() => {
    if (adminToken) {
      cargarEmpleados();
      cargarDepartamentos();
      cargarHistorial();
    }
  }, [adminToken]);

  // Manejo de Inicio de Sesión
  const handleLogin = (token) => {
    localStorage.setItem('adminToken', token);
    setAdminToken(token);
  };

  // Manejo de Cierre de Sesión
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setAdminToken(null);
  };

  // Petición GET: Cargar lista de empleados desde backend
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

  // Petición GET: Cargar lista de departamentos desde backend
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

  // Petición GET: Cargar logs de auditoría/historial de accesos
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

  // Abrir ventana modal del historial de un empleado
  const abrirHistorico = (emp) => {
    setEmpleadoSeleccionado(emp);
    setModalHistorial(true);
  };

  // Petición PUT: Activar o inhabilitar un empleado
  const toggleInhabilitarEmpleado = async (emp) => {
    const estadoNuevo = !emp.active;
    const confirmacion = window.confirm(`Desea ${estadoNuevo ? 'ACTIVAR' : 'INHABILITAR'} a ${emp.firstName} ${emp.lastName}?`);
    if (!confirmacion) return;

    setEmpleados(prev => prev.map(item => item.id === emp.id ? { ...item, active: estadoNuevo } : item));

    try {
      const res = await fetch(`${API_URL}/employees/${emp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...emp, active: estadoNuevo })
      });
      if (!res.ok) {
        cargarEmpleados();
        alert('Error al guardar cambios en el servidor.');
      }
    } catch {
      cargarEmpleados();
      alert('Error de conexión con el servidor.');
    }
  };

  // Petición PUT: Conceder o revocar autorización de acceso a la puerta
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

  // Si no existe token válido, renderiza únicamente la pantalla de login
  if (!adminToken) {
    return <ModuloLogin onLoginSuccess={handleLogin} />;
  }

  // Filtrado de empleados en memoria según selección de dropdowns
  const empleadosFiltrados = empleados.filter(emp => {
    const coincideEmpleado = filtroEmpleadoSel ? emp.id.toString() === filtroEmpleadoSel : true;
    const coincideDepto = filtroDepto ? (emp.department?.id == filtroDepto) : true;
    return coincideEmpleado && coincideDepto;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* Encabezado Principal y Menú de Navegación */}
      <header style={{ backgroundColor: '#0f172a', color: '#fff', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>ROOM_911 | Admin Access Control</h1>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Laboratorios XYZ - Control de Produccion</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setSeccion('empleados')} style={btnNav(seccion === 'empleados')}>Empleados</button>
          <button onClick={() => setSeccion('nuevo_empleado')} style={btnNav(seccion === 'nuevo_empleado')}>Crear Empleado</button>
          <button onClick={() => setSeccion('departamentos')} style={btnNav(seccion === 'departamentos')}>Departamentos</button>
          <button onClick={() => setSeccion('carga_masiva')} style={btnNav(seccion === 'carga_masiva')}>Carga CSV</button>
          <button onClick={() => setSeccion('lector')} style={btnNav(seccion === 'lector')}>Lector</button>
          <button onClick={handleLogout} style={{ ...btnNav(false), backgroundColor: '#ef4444' }}>Cerrar Sesion</button>
        </div>
      </header>

      {/* Cuerpo Principal del Contenido */}
      <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Vista: Lista y Filtro de Empleados */}
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
                  {empleados.map(emp => (
                    <option key={emp.id} value={emp.id}>
                       {emp.firstName} {emp.lastName} {emp.active === false ? '(Inhabilitado)' : ''}
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

            <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                  <tr>
                    <th style={thStyle}>ID Interno</th>
                    <th style={thStyle}>Empleado</th>
                    <th style={thStyle}>Departamento</th>
                    <th style={thStyle}>Estado Usuario</th>
                    <th style={thStyle}>Acceso ROOM_911</th>
                    <th style={thStyle}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {empleadosFiltrados.map((emp) => {
                    const estaActivo = emp.active !== false;
                    const tieneAcceso = emp.accessGranted === true && estaActivo;

                    return (
                      <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: estaActivo ? '#fff' : '#fef2f2' }}>
                        <td style={tdStyle}><b>{emp.internalId}</b></td>
                        <td style={tdStyle}>{emp.firstName} {emp.lastName}</td>
                        <td style={tdStyle}>{emp.department?.name || 'N/A'}</td>
                        
                        <td style={tdStyle}>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: estaActivo ? '#dbeafe' : '#fecdd3',
                            color: estaActivo ? '#1e40af' : '#9f1239'
                          }}>
                            {estaActivo ? 'USUARIO ACTIVO' : 'INHABILITADO'}
                          </span>
                        </td>

                        <td style={tdStyle}>
                          <button 
                            onClick={() => toggleAutorizacionEmpleado(emp)}
                            disabled={!estaActivo}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              border: 'none',
                              cursor: estaActivo ? 'pointer' : 'not-allowed',
                              backgroundColor: tieneAcceso ? '#dcfce7' : '#fee2e2',
                              color: tieneAcceso ? '#15803d' : '#b91c1c'
                            }}
                          >
                            {!estaActivo ? 'ACCESO DENEGADO (INACTIVO)' : (emp.accessGranted ? 'AUTORIZADO' : 'SIN ACCESO / REVOCADO')}
                          </button>
                        </td>

                        <td style={tdStyle}>
                          <button onClick={() => { setEmpleadoSeleccionado(emp); setModalEditar({ ...emp }); }} style={btnSm('#2563eb')}>Editar</button>
                          <button onClick={() => abrirHistorico(emp)} style={{ ...btnSm('#0284c7'), marginLeft: '6px' }}>Historico</button>
                          
                          <button 
                            onClick={() => toggleInhabilitarEmpleado(emp)} 
                            style={{ 
                              ...btnSm(estaActivo ? '#dc2626' : '#16a34a'), 
                              marginLeft: '6px' 
                            }}
                          >
                            {estaActivo ? 'Inhabilitar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {empleadosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No se encontraron empleados registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Carga condicional de módulos alternativos */}
        {seccion === 'nuevo_empleado' && (
          <ModuloCrearEmpleado 
            departamentos={departamentos} 
            onSuccess={() => {
              cargarEmpleados();
              setSeccion('empleados');
            }} 
          />
        )}

        {seccion === 'departamentos' && (
          <ModuloDepartamentos 
            departamentos={departamentos} 
            onSuccess={cargarDepartamentos} 
          />
        )}

        {seccion === 'carga_masiva' && <ModuloCargaCSV departamentos={departamentos} onSuccess={cargarEmpleados} />}
        {seccion === 'simulador' && <ModuloSimuladorLector onSuccessAcceso={cargarHistorial} />}

      </main>

      {/* Renderizado condicional de Ventanas Modales */}
      {modalEditar && (
        <ModalFormularioEmpleado 
          datos={modalEditar} 
          departamentos={departamentos} 
          onClose={() => setModalEditar(null)} 
          onSave={cargarEmpleados} 
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
  );
}

// ==========================================
// SECCIÓN 2: MÓDULOS Y VISTAS SECUNDARIAS
// ==========================================

// Componente de Login para Administradores
function ModuloLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setCargando(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        onLoginSuccess(data.token);
      } else {
        setErrorMsg(data.message || 'Credenciales invalidas.');
      }
    } catch {
      setErrorMsg('Error de conexion con el servidor Spring Boot.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
      <form onSubmit={handleLogin} style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '12px', width: '360px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
        <h2 style={{ textAlign: 'center', margin: '0 0 8px 0' }}>ROOM_911 Access</h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Acceso Exclusivo de Administracion</p>

        {errorMsg && (
          <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '12px', marginBottom: '14px', textAlign: 'center', fontWeight: 'bold' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Carnet ID o Nombre:</label>
          <input 
            type="text" 
            placeholder="ID Carnet" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            style={inputFull} 
            required 
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Contraseña:</label>
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
          {cargando ? 'Verificando...' : 'Ingresar como Admin'}
        </button>
      </form>
    </div>
  );
}

// Componente para Registro Individual de Empleados
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
      setMensaje({ tipo: 'error', texto: 'El Carnet es obligatorio y debe ser numerico.' });
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
    if (!form.password || form.password.length <8) {
      setMensaje({ tipo: 'error', texto: 'La contraseña debe tener minimo 8 caracteres.' });
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
        setMensaje({ tipo: 'error', texto: 'Error al registrar empleado.' });
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error de conexion con el servidor.' });
    }
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '28px', borderRadius: '12px', border: '1px solid #e2e8f0', maxWidth: '550px', margin: '0 auto' }}>
      <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#0f172a' }}>Registrar Nuevo Empleado</h3>
      <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Todos los campos son estrictamente obligatorios (*).</p>

      {mensaje && (
        <div style={{ padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', fontWeight: 'bold', backgroundColor: mensaje.tipo === 'exito' ? '#dcfce7' : '#fee2e2', color: mensaje.tipo === 'exito' ? '#15803d' : '#b91c1c' }}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Carnet / ID Interno *</label>
          <input type="text" placeholder="1099887766" value={form.internalId} onChange={e => setForm({ ...form, internalId: e.target.value })} style={inputFull} required />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nombre *</label>
            <input type="text" placeholder="Laura" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} style={inputFull} required />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Apellido *</label>
            <input type="text" placeholder="Montes" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} style={inputFull} required />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Departamento *</label>
          <select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} style={inputFull} required>
            <option value="">Seleccionar Departamento</option>
            {departamentos.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Contraseña *</label>
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

// Componente para Gestión de Departamentos
function ModuloDepartamentos({ departamentos, onSuccess }) {
  const [nombreDepto, setNombreDepto] = useState('');
  const [mensaje, setMensaje] = useState(null);

  const handleCrearDepartamento = async (e) => {
    e.preventDefault();
    if (!nombreDepto.trim()) return;

    try {
      const res = await fetch(`${API_URL}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nombreDepto.trim() })
      });

      if (res.ok) {
        setMensaje({ tipo: 'exito', texto: 'Departamento registrado correctamente.' });
        setNombreDepto('');
        if (onSuccess) onSuccess();
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error de conexion.' });
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ flex: '1 1 350px', backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3>Registrar Nuevo Departamento</h3>
        {mensaje && <p style={{ color: mensaje.tipo === 'exito' ? 'green' : 'red' }}>{mensaje.texto}</p>}
        <form onSubmit={handleCrearDepartamento} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input type="text" placeholder="Calidad" value={nombreDepto} onChange={e => setNombreDepto(e.target.value)} style={inputFull} required />
          <button type="submit" style={btnAccion('#2563eb')}>Crear Departamento</button>
        </form>
      </div>

      <div style={{ flex: '1 1 400px', backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3>Departamentos Registrados</h3>
        <ul>
          {departamentos.map(d => (
            /* Se eliminó el texto (ID: #{d.id}) para mostrar únicamente el nombre */
            <li key={d.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
              <b>{d.name}</b>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Componente para Importación Masiva mediante Archivos CSV (sin selector de departamento)
function ModuloCargaCSV({ onSuccess }) {
  const [archivo, setArchivo] = useState(null);
  const [msg, setMsg] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!archivo) return alert('Por favor, seleccione un archivo CSV.');

    const formData = new FormData();
    formData.append('file', archivo);

    try {
      const res = await fetch(`${API_URL}/employees/upload-csv`, { 
        method: 'POST', 
        body: formData 
      });

      if (res.ok) {
        setMsg('CSV procesado correctamente.');
        if (onSuccess) onSuccess();
      } else { 
        setMsg('Error al procesar el archivo CSV.'); 
      }
    } catch { 
      setMsg('Error de conexion con el servidor.'); 
    }
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', maxWidth: '600px', margin: '0 auto' }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#0f172a' }}>Cargar Empleados por CSV</h3>
      <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '8px' }}>
            Seleccionar archivo .CSV:
          </label>
          <input 
            type="file" 
            accept=".csv" 
            onChange={e => setArchivo(e.target.files[0])} 
            style={inputFull}
            required 
          />
        </div>

        <button type="submit" style={btnAccion('#0d9488')}>
          Cargar Archivo
        </button>
      </form>

      {msg && (
        <p style={{ marginTop: '16px', fontWeight: 'bold', fontSize: '14px', color: msg.includes('correctamente') ? '#16a34a' : '#dc2626' }}>
          {msg}
        </p>
      )}
    </div>
  );
}

// Componente para Simulacion de Tarjetas en Lector Fisico
function ModuloSimuladorLector({ onSuccessAcceso }) {
  const [carnet, setCarnet] = useState('');
  const [resultado, setResultado] = useState(null);

  const simularEntrada = async (e) => {
    e.preventDefault();
    setResultado(null);

    try {
      const res = await fetch(`${API_URL}/access/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalId: carnet.trim() })
      });
      const data = await res.json();
      setResultado(data);
      onSuccessAcceso();
    } catch {
      setResultado({ success: false, message: 'Error de comunicacion con el Lector.' });
    }
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0', maxWidth: '450px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Lector Fisico ROOM_911</h2>
      <form onSubmit={simularEntrada} style={{ marginTop: '20px' }}>
        <input 
          type="text" 
          placeholder="Carnet ID (Ej. 1099887766)" 
          value={carnet} 
          onChange={e => setCarnet(e.target.value)} 
          style={{ ...inputFull, textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }} 
          required 
        />
        <button type="submit" style={{ ...btnAccion('#0f172a'), width: '100%', marginTop: '12px' }}>Simular Lector Tarjeta</button>
      </form>

      {resultado && (
        <div style={{ marginTop: '20px', padding: '16px', borderRadius: '8px', backgroundColor: resultado.granted ? '#f0fdf4' : '#fef2f2', color: resultado.granted ? '#166534' : '#991b1b' }}>
          <h3>{resultado.granted ? 'ACCESO CONCEDIDO' : 'ACCESO DENEGADO'}</h3>
          <p style={{ margin: 0, fontSize: '14px' }}>{resultado.message}</p>
        </div>
      )}
    </div>
  );
}

// ==========================================
// SECCIÓN 3: VENTANAS MODALES
// ==========================================

// Modal de Formulario para Modificación de Datos de Empleado
function ModalFormularioEmpleado({ datos, departamentos, onClose, onSave }) {
  const [form, setForm] = useState({
    internalId: datos.internalId || '',
    firstName: datos.firstName || '',
    lastName: datos.lastName || '',
    departmentId: datos.department?.id || '',
    accessGranted: datos.accessGranted ?? true,
    active: datos.active ?? true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...datos,
      ...form,
      department: form.departmentId ? { id: parseInt(form.departmentId) } : datos.department
    };

    await fetch(`${API_URL}/employees/${datos.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    onSave();
    onClose();
  };

  return (
    <div style={modalOverlay}>
      <div style={modalBox}>
        <h3>Editar Empleado</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          <input type="text" placeholder="Carnet ID" value={form.internalId} onChange={e => setForm({ ...form, internalId: e.target.value })} style={inputFull} required />
          <input type="text" placeholder="Nombre" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} style={inputFull} required />
          <input type="text" placeholder="Apellido" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} style={inputFull} required />
          
          <select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} style={inputFull} required>
            <option value="">Departamento</option>
            {departamentos.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
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

// Modal para Consultar Histórico de Accesos Registrados por Empleado
function ModalHistoricoAcceso({ empleado, registros, onClose }) {
  return (
    <div style={modalOverlay}>
      <div style={{ ...modalBox, maxWidth: '650px', width: '90%' }}>
        <h3>Historico de Accesos: {empleado.firstName} {empleado.lastName}</h3>
        <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <th style={thStyle}>Fecha y Hora</th>
                <th style={thStyle}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((log, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={tdStyle}>{new Date(log.timestamp).toLocaleString()}</td>
                  <td style={tdStyle}>
                    <span style={{ color: log.successful ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                      {log.successful ? 'EXITOSO' : 'RECHAZADO'}
                    </span>
                  </td>
                </tr>
              ))}
              {registros.length === 0 && (
                <tr><td colSpan="2" style={{ padding: '12px', textAlign: 'center' }}>Sin accesos registrados.</td></tr>
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