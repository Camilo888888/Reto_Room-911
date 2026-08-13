import React, { useState, useEffect } from 'react';

export default function App() {
  // 1. ESTADO DE AUTENTICACIÓN
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('app_isLoggedIn') === 'true';
  });
  
  // NAVEGACIÓN DE VISTAS (terminal | dashboard)
  const [vistaActual, setVistaActual] = useState('terminal');

  // FORMULARIO DE LOGIN
  const [loginForm, setLoginForm] = useState({ usuario: '', password: '' });

  // ESTADOS DE LA TERMINAL DE ACCESO
  const [carnetId, setCarnetId] = useState('');
  const [carnetValidado, setCarnetValidado] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [mensajeValidacion, setMensajeValidacion] = useState({ texto: '', tipo: '' });
  const [cargando, setCargando] = useState(false);
  const [contadorPuerta, setContadorPuerta] = useState(null);

  const [epp, setEpp] = useState({
    bata: false,
    cofia: false,
    tapabocas: false,
    calzado: false,
  });

  const [accessResult, setAccessResult] = useState({
    status: 'DENIED',
    message: 'ACCESO DENEGADO / ESPERANDO VALIDACIÓN DE CARNET Y EPP',
  });

  // DATOS BASE DE HISTORIAL
  const [historial, setHistorial] = useState([
    { id: 1, fecha: '06/08/2026 08:30', estado: 'ENTRADA EXITOSA', exitoso: true, nombre: 'Carlos Mendoza', carnet: '1018456789' },
    { id: 2, fecha: '05/08/2026 14:15', estado: 'ENTRADA EXITOSA', exitoso: true, nombre: 'Carlos Mendoza', carnet: '1018456789' },
    { id: 3, fecha: '04/08/2026 09:00', estado: 'DENEGADO (Sin Tapabocas)', exitoso: false, nombre: 'Carlos Mendoza', carnet: '1018456789' },
    { id: 4, fecha: '03/08/2026 11:20', estado: 'ENTRADA EXITOSA', exitoso: true, nombre: 'Ana Gómez', carnet: '1098765432' },
  ]);

  // DATOS BASE DE USUARIOS REGISTRADOS (DASHBOARD)
  const [usuariosAdmin, setUsuariosAdmin] = useState([
    { id: 1, nombre: 'Carlos Mendoza', carnet: '1018456789', rol: 'Operador Sanitario', estadoCertificado: 'VIGENTE', eppCumplimiento: '100%' },
    { id: 2, nombre: 'Ana Gómez', carnet: '1098765432', rol: 'Analista de Calidad', estadoCertificado: 'VIGENTE', eppCumplimiento: '95%' },
    { id: 3, nombre: 'Luis Fernando', carnet: '1022334455', rol: 'Técnico de Laboratorio', estadoCertificado: 'VENCIDO', eppCumplimiento: '70%' },
  ]);

  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  // TEMPORIZADOR DE PUERTA
  useEffect(() => {
    let timer;
    if (contadorPuerta !== null && contadorPuerta > 0) {
      timer = setTimeout(() => setContadorPuerta(contadorPuerta - 1), 1000);
    } else if (contadorPuerta === 0) {
      setAccessResult({
        status: 'DENIED',
        message: '🔒 PUERTA BLOQUEADA AUTOMÁTICAMENTE / ESPERANDO NUEVO INGRESO',
      });
      setContadorPuerta(null);
    }
    return () => clearTimeout(timer);
  }, [contadorPuerta]);

  // MANEJO DE SESIÓN
  const handleCerrarSesion = () => {
    sessionStorage.removeItem('app_isLoggedIn');
    setLoginForm({ usuario: '', password: '' });
    handleLimpiarFormulario();
    setIsLoggedIn(false);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    sessionStorage.setItem('app_isLoggedIn', 'true');
    setIsLoggedIn(true);
    setLoginForm({ usuario: '', password: '' });
  };

  const handleCheckboxChange = (e) => {
    setEpp({ ...epp, [e.target.name]: e.target.checked });
  };

  // VALIDACIÓN DE CARNET
  const handleValidarCarnet = async () => {
    if (!carnetId.trim()) {
      setCarnetValidado(false);
      setUsuarioActual(null);
      setMensajeValidacion({
        texto: 'Por favor ingrese o escanee un número de identificación.',
        tipo: 'error'
      });
      return;
    }

    setCargando(true);
    setMensajeValidacion({ texto: 'Consultando base de datos...', tipo: 'info' });

    try {
      const response = await fetch(`http://localhost:8080/api/usuarios/validar/${carnetId.trim()}`);
      const data = await response.json();

      if (response.ok && data.valido === true) {
        setCarnetValidado(true);
        const nombreValido = data.usuario 
          ? `${data.usuario.nombre} ${data.usuario.apellido || ''}`.trim() 
          : 'Carlos Mendoza';
        
        setUsuarioActual(nombreValido);
        setMensajeValidacion({ texto: `✅ ${data.mensaje}`, tipo: 'exito' });
      } else {
        setCarnetValidado(false);
        setUsuarioActual(null);
        setMensajeValidacion({
          texto: `❌ ${data.mensaje || 'Número de carnet no encontrado.'}`,
          tipo: 'error'
        });
      }
    } catch (error) {
      console.error('Error al conectar con la API:', error);
      setCarnetValidado(false);
      setUsuarioActual(null);
      setMensajeValidacion({
        texto: '⚠️ Error de conexión con el servidor Backend.',
        tipo: 'error'
      });
    } finally {
      setCargando(false);
    }
  };

  const handleKeyDownInput = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleValidarCarnet();
    }
  };

  const handleLimpiarFormulario = () => {
    setCarnetId('');
    setCarnetValidado(false);
    setUsuarioActual(null);
    setMensajeValidacion({ texto: '', tipo: '' });
    setContadorPuerta(null);
    setEpp({ bata: false, cofia: false, tapabocas: false, calzado: false });
    setAccessResult({
      status: 'DENIED',
      message: 'ACCESO DENEGADO / ESPERANDO VALIDACIÓN DE CARNET Y EPP',
    });
  };

  const handleConfirmarAcceso = () => {
    if (!carnetValidado) {
      setAccessResult({
        status: 'DENIED',
        message: 'ACCESO DENEGADO / CARNET NO VALIDADO EN SISTEMA',
      });
      return;
    }

    const eppCompleto = epp.bata && epp.cofia && epp.tapabocas && epp.calzado;
    const ahora = new Date();
    const fechaFormateada = `${ahora.toLocaleDateString()} ${ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const nombreRegistro = usuarioActual || 'Usuario Desconocido';

    if (eppCompleto) {
      const nuevoRegistro = {
        id: Date.now(),
        fecha: fechaFormateada,
        estado: 'ENTRADA EXITOSA',
        exitoso: true,
        nombre: nombreRegistro,
        carnet: carnetId
      };

      setAccessResult({
        status: 'SUCCESS',
        message: `ACCESO PERMITIDO / BIENVENIDO(A) ${nombreRegistro.toUpperCase()}`,
      });

      setHistorial([nuevoRegistro, ...historial]);
      setContadorPuerta(5);
    } else {
      const elementosFaltantes = [];
      if (!epp.bata) elementosFaltantes.push('Bata');
      if (!epp.cofia) elementosFaltantes.push('Cofia');
      if (!epp.tapabocas) elementosFaltantes.push('Tapabocas');
      if (!epp.calzado) elementosFaltantes.push('Polainas');

      const nuevoRegistro = {
        id: Date.now(),
        fecha: fechaFormateada,
        estado: `DENEGADO (Falta: ${elementosFaltantes.join(', ')})`,
        exitoso: false,
        nombre: nombreRegistro,
        carnet: carnetId
      };

      setAccessResult({
        status: 'DENIED',
        message: `ACCESO DENEGADO / FALTA: ${elementosFaltantes.join(', ').toUpperCase()}`,
      });

      setHistorial([nuevoRegistro, ...historial]);
      setContadorPuerta(null);
    }
  };

  const totalExitosos = historial.filter((item) => item.exitoso).length;
  const totalDenegados = historial.filter((item) => !item.exitoso).length;

  // VISTA 1: LOGIN
  if (!isLoggedIn) {
    return (
      <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '16px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '36px 32px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', width: '100%', maxWidth: '380px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          
          <div style={{ backgroundColor: '#e0f2fe', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px auto', fontSize: '32px' }}>
            🧪
          </div>

          <h2 style={{ margin: '0 0 6px 0', color: '#0369a1', fontSize: '22px', fontWeight: '800', textAlign: 'center' }}>LABORATORIOS XYZ</h2>
          <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>Sistema de Control de Acceso</p>
          
          <form onSubmit={handleLoginSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Usuario u Operador</label>
              <input
                type="text"
                autoComplete="off"
                placeholder="Ingrese usuario"
                value={loginForm.usuario}
                onChange={(e) => setLoginForm({ ...loginForm, usuario: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box', textAlign: 'center' }}
                required
              />
            </div>

            <div style={{ textAlign: 'center' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Contraseña</label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box', textAlign: 'center' }}
                required
              />
            </div>

            <button
              type="submit"
              style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '8px' }}
            >
              🔓 INICIAR SESIÓN
            </button>
          </form>
        </div>
      </div>
    );
  }

  // VISTA 2: PANEL GENERAL (HEADER + NAVEGACIÓN)
  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#0f172a', paddingBottom: '30px' }}>
      
      {/* HEADER */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>🧪</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '18px', color: '#0284c7', fontWeight: '800', lineHeight: 1.2 }}>LABORATORIOS XYZ</h1>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Terminal ROOM_911</span>
            </div>
          </div>

          {/* BOTONES DE NAVEGACIÓN Y ACCIONES */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <button
                onClick={() => setVistaActual('terminal')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: vistaActual === 'terminal' ? '#ffffff' : 'transparent',
                  color: vistaActual === 'terminal' ? '#0284c7' : '#64748b',
                  boxShadow: vistaActual === 'terminal' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                📱 Terminal
              </button>
              <button
                onClick={() => setVistaActual('dashboard')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: vistaActual === 'dashboard' ? '#ffffff' : 'transparent',
                  color: vistaActual === 'dashboard' ? '#0284c7' : '#64748b',
                  boxShadow: vistaActual === 'dashboard' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                📊 Dashboard Admin
              </button>
            </div>

            <button 
              onClick={handleCerrarSesion} 
              style={{ 
                padding: '8px 14px', 
                cursor: 'pointer', 
                borderRadius: '8px', 
                border: '1px solid #fecaca', 
                backgroundColor: '#fef2f2', 
                color: '#991b1b',
                fontWeight: '700',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL DEPENDIENDO DE LA PESTAÑA */}
      <main style={{ maxWidth: '1000px', margin: '20px auto', padding: '0 16px' }}>
        
        {/* ==================== VISTA 1: TERMINAL DE OPERADOR ==================== */}
        {vistaActual === 'terminal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* PANEL CARNET */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b', textTransform: 'uppercase', fontWeight: '800', width: '100%', textAlign: 'center' }}>
                  💳 Lectura de Carnet Corporativo
                </h3>
                <button
                  onClick={handleLimpiarFormulario}
                  style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap' }}
                >
                  🔄 Limpiar
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', margin: '12px 0' }}>
                <label style={{ color: '#334155', fontWeight: '700', fontSize: '14px' }}>
                  N° Carnet:
                </label>
                <input
                  type="text"
                  value={carnetId}
                  onKeyDown={handleKeyDownInput}
                  onChange={(e) => {
                    setCarnetId(e.target.value);
                    setCarnetValidado(false);
                    setUsuarioActual(null);
                    setMensajeValidacion({ texto: '', tipo: '' });
                  }}
                  placeholder="Ej: 1018456789"
                  style={{ width: '240px', padding: '8px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', textAlign: 'center', fontWeight: '600' }}
                />
                <button
                  onClick={handleValidarCarnet}
                  disabled={cargando}
                  style={{ 
                    backgroundColor: cargando ? '#cbd5e1' : '#0284c7', 
                    color: '#ffffff', 
                    border: 'none', 
                    padding: '9px 20px', 
                    borderRadius: '8px', 
                    fontWeight: 'bold', 
                    fontSize: '14px',
                    cursor: cargando ? 'not-allowed' : 'pointer'
                  }}
                >
                  {cargando ? '⏳...' : '👤 VALIDAR'}
                </button>
              </div>

              {mensajeValidacion.texto && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  textAlign: 'center',
                  fontSize: '13px',
                  backgroundColor: mensajeValidacion.tipo === 'exito' ? '#f0fdf4' : mensajeValidacion.tipo === 'info' ? '#f0f9ff' : '#fef2f2',
                  color: mensajeValidacion.tipo === 'exito' ? '#166534' : mensajeValidacion.tipo === 'info' ? '#0369a1' : '#991b1b',
                  border: `1px solid ${mensajeValidacion.tipo === 'exito' ? '#bbf7d0' : mensajeValidacion.tipo === 'info' ? '#bae6fd' : '#fecaca'}`
                }}>
                  {mensajeValidacion.texto}
                </div>
              )}
            </div>

            {/* COLUMNAS POSICIONADAS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              
              {/* PANEL EPP */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', color: '#1e293b', textTransform: 'uppercase', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', textAlign: 'center' }}>
                    🛡️ Validación Sanitaria y EPP
                  </h3>

                  <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Certificados Médicos:</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '13px' }}>
                      <span style={{ color: '#334155', fontWeight: '500' }}>Manipulación:</span>
                      <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}>VIGENTE - 15/12/2026</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <span style={{ color: '#334155', fontWeight: '500' }}>Bioseguridad:</span>
                      <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}>VIGENTE</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Checklist Obligatorio EPP:</p>
                    {[
                      { name: 'bata', label: 'Bata Esterilizada' },
                      { name: 'cofia', label: 'Cofia Quirúrgica' },
                      { name: 'tapabocas', label: 'Tapabocas N95' },
                      { name: 'calzado', label: 'Calzado Especial / Polainas' },
                    ].map((item) => (
                      <label key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', border: '1px solid #f1f5f9', backgroundColor: epp[item.name] ? '#f0fdf4' : '#ffffff' }}>
                        <input
                          type="checkbox"
                          name={item.name}
                          checked={epp[item.name]}
                          onChange={handleCheckboxChange}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0284c7' }}
                        />
                        <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleConfirmarAcceso}
                  style={{ marginTop: '20px', width: '100%', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: '800', cursor: 'pointer' }}
                >
                  🛡️ CONFIRMAR ACCESO
                </button>
              </div>

              {/* PANEL HISTORIAL */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', color: '#1e293b', textTransform: 'uppercase', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', textAlign: 'center' }}>
                    🕒 Historial de Ingresos
                  </h3>

                  <p style={{ margin: '0 0 10px 0', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Registros Recientes:</p>
                  
                  <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                    {historial.map((item) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', fontSize: '13px' }}>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: '700', color: '#1e293b' }}>{item.nombre}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.fecha}</div>
                        </div>
                        <span style={{ fontWeight: '800', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', backgroundColor: item.exitoso ? '#f0fdf4' : '#fef2f2', color: item.exitoso ? '#166534' : '#991b1b', textAlign: 'center' }}>
                          {item.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '16px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Estadísticas:</p>
                  <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748b', display: 'block', fontWeight: '500' }}>Exitosos</span>
                      <strong style={{ color: '#166534', fontSize: '20px', fontWeight: '800' }}>{totalExitosos}</strong>
                    </div>
                    <div style={{ borderRight: '1px solid #cbd5e1' }}></div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748b', display: 'block', fontWeight: '500' }}>Denegados</span>
                      <strong style={{ color: '#991b1b', fontSize: '20px', fontWeight: '800' }}>{totalDenegados}</strong>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* INDICADOR LUMINOSO */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', textAlign: 'center' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>
                Estado de Acceso / Indicador Luminoso
              </p>
              
              <div style={{
                padding: '18px',
                borderRadius: '12px',
                border: accessResult.status === 'SUCCESS' ? '2px solid #22c55e' : '2px solid #ef4444',
                backgroundColor: accessResult.status === 'SUCCESS' ? '#f0fdf4' : '#fef2f2',
                color: accessResult.status === 'SUCCESS' ? '#15803d' : '#b91c1c',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
                fontWeight: '800',
                fontSize: '16px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '28px' }}>{accessResult.status === 'SUCCESS' ? '🔓' : '🔒'}</span>
                <div>
                  <div style={{ textAlign: 'center' }}>{accessResult.message}</div>
                  {contadorPuerta !== null && (
                    <div style={{ fontSize: '13px', marginTop: '6px', color: '#15803d', fontWeight: '600', textAlign: 'center' }}>
                      ⏳ Cierre automático en <strong>{contadorPuerta}s</strong>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '28px' }}>🚪</span>
              </div>
            </div>

          </div>
        )}

        {/* ==================== VISTA 2: DASHBOARD DE ADMINISTRADOR ==================== */}
        {vistaActual === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* TARJETAS DE MÉTRICAS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Total Solicitudes</span>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#0369a1', marginTop: '4px' }}>{historial.length}</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Accesos Aprobados</span>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#166534', marginTop: '4px' }}>{totalExitosos}</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Accesos Rechazados</span>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#991b1b', marginTop: '4px' }}>{totalDenegados}</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Cumplimiento EPP</span>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#0284c7', marginTop: '4px' }}>
                  {historial.length > 0 ? `${Math.round((totalExitosos / historial.length) * 100)}%` : '0%'}
                </div>
              </div>
            </div>

            {/* TABLA DE PERSONAL / CARNETS */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b', textTransform: 'uppercase', fontWeight: '800' }}>
                  👥 Control de Personal Registrado
                </h3>
                <input
                  type="text"
                  placeholder="Buscar por carnet o nombre..."
                  value={filtroBusqueda}
                  onChange={(e) => setFiltroBusqueda(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', width: '220px' }}
                />
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'center' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                      <th style={{ padding: '10px' }}>Nombre</th>
                      <th style={{ padding: '10px' }}>Carnet</th>
                      <th style={{ padding: '10px' }}>Rol / Puesto</th>
                      <th style={{ padding: '10px' }}>Certificado Médico</th>
                      <th style={{ padding: '10px' }}>Tasa EPP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosAdmin
                      .filter(u => u.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) || u.carnet.includes(filtroBusqueda))
                      .map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px', fontWeight: '700', color: '#1e293b' }}>{u.nombre}</td>
                          <td style={{ padding: '10px', color: '#64748b' }}>{u.carnet}</td>
                          <td style={{ padding: '10px', color: '#334155' }}>{u.rol}</td>
                          <td style={{ padding: '10px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '800',
                              backgroundColor: u.estadoCertificado === 'VIGENTE' ? '#f0fdf4' : '#fef2f2',
                              color: u.estadoCertificado === 'VIGENTE' ? '#166534' : '#991b1b'
                            }}>
                              {u.estadoCertificado}
                            </span>
                          </td>
                          <td style={{ padding: '10px', fontWeight: '700', color: '#0284c7' }}>{u.eppCumplimiento}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* HISTORIAL COMPLETO DE AUDITORÍA */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#1e293b', textTransform: 'uppercase', fontWeight: '800', textAlign: 'center' }}>
                📋 Registro General de Ingresos (Auditoría)
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'center' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                      <th style={{ padding: '10px' }}>Fecha / Hora</th>
                      <th style={{ padding: '10px' }}>Usuario</th>
                      <th style={{ padding: '10px' }}>Carnet</th>
                      <th style={{ padding: '10px' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((h) => (
                      <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', color: '#64748b' }}>{h.fecha}</td>
                        <td style={{ padding: '10px', fontWeight: '700', color: '#1e293b' }}>{h.nombre}</td>
                        <td style={{ padding: '10px', color: '#64748b' }}>{h.carnet || 'N/A'}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '800',
                            backgroundColor: h.exitoso ? '#f0fdf4' : '#fef2f2',
                            color: h.exitoso ? '#166534' : '#991b1b'
                          }}>
                            {h.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}