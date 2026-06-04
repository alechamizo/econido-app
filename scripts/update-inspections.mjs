import mysql from 'mysql2/promise';

// Parsear DATABASE_URL
const dbUrl = process.env.DATABASE_URL || 'mysql://root@localhost/test';
const urlObj = new URL(dbUrl);

const connection = await mysql.createConnection({
  host: urlObj.hostname,
  user: urlObj.username,
  password: urlObj.password,
  database: urlObj.pathname.slice(1),
  ssl: true,
});

const inspectionsData = [
  { fecha: '2026-04-01', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 0, numPollos: 0, cajaId: 'B21-2', observaciones: 'Restos de áridos y topillos; ocupación incipiente' },
  { fecha: '2026-04-01', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 0, numPollos: 0, cajaId: 'B41-2', observaciones: 'Restos de material de cernícalo' },
  { fecha: '2026-04-01', ocupada: 1, especie: 'Gorrión común', numHuevos: 0, numPollos: 0, cajaId: 'B21-1', observaciones: 'Restos de paja; ocupación por gorriones' },
  { fecha: '2026-04-01', ocupada: 1, especie: 'Gorrión común', numHuevos: 0, numPollos: 0, cajaId: 'B23', observaciones: 'Restos de paja; ocupación por gorriones' },
  { fecha: '2026-04-01', ocupada: 1, especie: 'Gorrión común', numHuevos: 0, numPollos: 0, cajaId: 'B41-1', observaciones: 'Restos de paja; ocupación por gorriones' },
  { fecha: '2026-04-01', ocupada: 1, especie: 'Gorrión común', numHuevos: 0, numPollos: 0, cajaId: 'B42-1', observaciones: 'Ocupación por gorriones' },
  { fecha: '2026-04-01', ocupada: 1, especie: 'Gorrión común', numHuevos: 0, numPollos: 0, cajaId: 'B42-2', observaciones: 'Ocupación por gorriones' },
  { fecha: '2026-04-01', ocupada: 1, especie: 'Lechuza común', numHuevos: 5, numPollos: 1, cajaId: 'B31', observaciones: 'Un pollo visible junto a cinco huevos' },
  { fecha: '2026-04-01', ocupada: 1, especie: 'Lechuza común', numHuevos: 2, numPollos: 0, cajaId: 'B12-1', observaciones: 'Restos de egagrópilas y ocupación estable' },
  { fecha: '2026-04-01', ocupada: 0, especie: null, numHuevos: 0, numPollos: 0, cajaId: 'B12-2', observaciones: 'Sin indicios de ocupación' },
  { fecha: '2026-04-08', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 0, numPollos: 0, cajaId: 'A11', observaciones: 'Caja vacía con restos de ocupación por cernícalo.' },
  { fecha: '2026-04-08', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 0, numPollos: 0, cajaId: 'A12', observaciones: 'Caja vacía con restos de material de cernícalo.' },
  { fecha: '2026-04-08', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 0, numPollos: 0, cajaId: 'A31', observaciones: 'Restos de paja y egagrópilas.' },
  { fecha: '2026-04-08', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 0, numPollos: 0, cajaId: 'A32-1', observaciones: 'Restos de material de cernícalo.' },
  { fecha: '2026-04-08', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 0, numPollos: 0, cajaId: 'A41-2', observaciones: 'Pareja posada en la caja; sin huevos visibles.' },
  { fecha: '2026-04-08', ocupada: 1, especie: 'Gorrión común', numHuevos: 0, numPollos: 0, cajaId: 'A32-2', observaciones: 'Restos de paja; ocupación por gorriones.' },
  { fecha: '2026-04-08', ocupada: 1, especie: 'Lechuza común', numHuevos: 0, numPollos: 0, cajaId: 'A21-2', observaciones: 'Restos de egagrópilas; sin puesta.' },
  { fecha: '2026-04-08', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 0, numPollos: 0, cajaId: 'C11', observaciones: 'Ejemplar de cernícalo observado en el interior de la caja.' },
  { fecha: '2026-04-08', ocupada: 0, especie: null, numHuevos: 0, numPollos: 0, cajaId: 'A21-1', observaciones: 'No se observan indicios de ocupación.' },
  { fecha: '2026-04-08', ocupada: 0, especie: null, numHuevos: 0, numPollos: 0, cajaId: 'A41-1', observaciones: 'No se observan indicios de ocupación.' },
  { fecha: '2026-04-08', ocupada: 0, especie: null, numHuevos: 0, numPollos: 0, cajaId: 'A42-1', observaciones: 'Caja vacía.' },
  { fecha: '2026-04-17', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 5, numPollos: 0, cajaId: 'C21', observaciones: 'Puesta completa de cinco huevos observada en abril.' },
  { fecha: '2026-04-17', ocupada: 1, especie: 'Lechuza común', numHuevos: 6, numPollos: 0, cajaId: 'C221', observaciones: 'Lechuza en el interior con seis huevos.' },
  { fecha: '2026-04-17', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 5, numPollos: 0, cajaId: 'C223', observaciones: 'Hembra sale de la caja; cinco huevos en el interior.' },
  { fecha: '2026-04-17', ocupada: 1, especie: 'Lechuza común', numHuevos: 0, numPollos: 0, cajaId: 'A21-2', observaciones: 'Abundantes egagrópilas; sin huevos.' },
  { fecha: '2026-04-17', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 0, numPollos: 0, cajaId: 'C12', observaciones: 'Hembra presente; no se observan huevos. Actividad previa registrada en cámara.' },
  { fecha: '2026-04-17', ocupada: 1, especie: 'Gorrión común', numHuevos: 0, numPollos: 0, cajaId: 'C222', observaciones: 'Caja vacía con restos de pasto; probable ocupación por gorrión.' },
  { fecha: '2026-04-17', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 3, numPollos: 0, cajaId: 'C11', observaciones: 'Ocupada por cernícalo; al menos tres huevos. Se instala cámara.' },
  { fecha: '2026-05-11', ocupada: 1, especie: 'Lechuza común', numHuevos: 0, numPollos: 1, cajaId: 'C221', observaciones: 'Se observa un pollo vivo en la caja y uno muerto bajo el poste.' },
  { fecha: '2026-05-11', ocupada: 1, especie: null, numHuevos: 0, numPollos: 0, cajaId: 'C21', observaciones: 'Caja vacía; restos de plumas y egagrópilas. En abril había 5 huevos.' },
  { fecha: '2026-05-11', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 3, numPollos: 0, cajaId: 'A11', observaciones: 'Hembra presente en la caja; al menos tres huevos.' },
  { fecha: '2026-05-11', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 4, numPollos: 0, cajaId: 'A41-2', observaciones: 'Hembra sale de la caja; cuatro huevos.' },
  { fecha: '2026-05-11', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 5, numPollos: 0, cajaId: 'A41-1', observaciones: 'Sale hembra al inspeccionar; cinco huevos (uno más claro).' },
  { fecha: '2026-05-11', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 0, numPollos: 0, cajaId: 'C11', observaciones: 'Hembra incubando en el interior durante la inspección.' },
  { fecha: '2026-05-11', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 0, numPollos: 0, cajaId: 'A31', observaciones: 'Caja vacía durante la inspección; indicios de uso.' },
  { fecha: '2026-05-11', ocupada: 1, especie: 'Gorrión común', numHuevos: 0, numPollos: 0, cajaId: 'A12', observaciones: 'Restos de paja; actualmente vacía.' },
  { fecha: '2026-05-11', ocupada: 1, especie: 'Gorrión común', numHuevos: 0, numPollos: 0, cajaId: 'A32-2', observaciones: 'Caja vacía en la inspección; restos de paja.' },
  { fecha: '2026-05-11', ocupada: 1, especie: 'Gorrión común', numHuevos: 0, numPollos: 0, cajaId: 'A42-2', observaciones: 'Caja con pasto; posible ocupación por gorrión, actualmente vacía.' },
  { fecha: '2026-05-11', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 1, numPollos: 0, cajaId: 'A32-1', observaciones: 'Se observa un huevo; hembra no presente durante inspección.' },
  { fecha: '2026-05-11', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 2, numPollos: 0, cajaId: 'A21-1', observaciones: 'Se observan dos huevos; posible abandono tras desbroces próximos.' },
  { fecha: '2026-05-11', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 1, numPollos: 0, cajaId: 'C222', observaciones: 'Se observa un huevo y un ejemplar posado en la entrada.' },
  { fecha: '2026-05-11', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 2, numPollos: 0, cajaId: 'C223', observaciones: 'En mayo solo se observan dos huevos; posible pérdida parcial de puesta.' },
  { fecha: '2026-05-11', ocupada: 0, especie: null, numHuevos: 0, numPollos: 0, cajaId: 'A42-1', observaciones: 'Sin indicios de ocupación.' },
  { fecha: '2026-05-11', ocupada: 0, especie: null, numHuevos: 0, numPollos: 0, cajaId: 'A42-3', observaciones: 'No se detecta ocupación.' },
  { fecha: '2026-05-11', ocupada: 0, especie: null, numHuevos: 0, numPollos: 0, cajaId: 'C12', observaciones: 'Caja vacía; restos de egagrópilas y plumas sin actividad.' },
  { fecha: '2026-05-13', ocupada: 1, especie: 'Lechuza común', numHuevos: 0, numPollos: 3, cajaId: 'B12-1', observaciones: 'Pollos de distinto tamaño; posible asincronía. Presencia previa de jineta en grabaciones' },
  { fecha: '2026-05-13', ocupada: 1, especie: 'Lechuza común', numHuevos: 0, numPollos: 3, cajaId: 'B31', observaciones: 'Se detecta un pollo muerto en la base del poste' },
  { fecha: '2026-05-13', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 5, numPollos: 0, cajaId: 'B21-2', observaciones: 'Hembra incubando cinco huevos' },
  { fecha: '2026-05-13', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 6, numPollos: 0, cajaId: 'B12-2', observaciones: 'Hembra incubando en el interior de la caja' },
  { fecha: '2026-05-13', ocupada: 1, especie: 'Mochuelo europeo', numHuevos: 5, numPollos: 0, cajaId: 'B21-1', observaciones: 'Hembra sale durante la inspección; puesta activa' },
  { fecha: '2026-05-13', ocupada: 1, especie: 'Gorrión común', numHuevos: 0, numPollos: 0, cajaId: 'B42-1', observaciones: 'Ocupación mantenida' },
  { fecha: '2026-05-13', ocupada: 1, especie: 'Gorrión común', numHuevos: 0, numPollos: 0, cajaId: 'B42-2', observaciones: 'Ocupación mantenida en mayo' },
  { fecha: '2026-05-13', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 2, numPollos: 0, cajaId: 'B41-2', observaciones: 'Puesta confirmada; ejemplar posado en torreta cercana' },
  { fecha: '2026-05-13', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 3, numPollos: 0, cajaId: 'B23', observaciones: 'Cambio de ocupante respecto a abril' },
  { fecha: '2026-05-13', ocupada: 0, especie: null, numHuevos: 0, numPollos: 0, cajaId: 'B41-1', observaciones: 'Caja vacía en la revisión de mayo' },
  { fecha: '2026-06-02', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 0, numPollos: 5, cajaId: 'C11', observaciones: 'Se observan cinco pollos en el interior de la caja nido; desarrollo avanzado respecto a la incubación registrada en mayo.' },
  { fecha: '2026-06-02', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 0, numPollos: 0, cajaId: 'C223', observaciones: 'Caja vacía; indicios de posible depredación. Presencia de letrina en el entorno; pendiente confirmar si corresponde a jineta.' },
  { fecha: '2026-06-02', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 4, numPollos: 0, cajaId: 'C21', observaciones: 'Se observan al menos cuatro huevos en el interior; recuperación de la actividad reproductora tras el fracaso detectado en mayo.' },
  { fecha: '2026-06-02', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 0, numPollos: 0, cajaId: 'C12', observaciones: 'Sale un ejemplar adulto durante la inspección; la caja se encuentra vacía, sin huevos ni pollos.' },
  { fecha: '2026-06-02', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 3, numPollos: 0, cajaId: 'C222', observaciones: 'Se observan tres huevos en el interior; evolución positiva respecto a la puesta inicial registrada en mayo.' },
  { fecha: '2026-06-03', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 3, numPollos: 0, cajaId: 'C221', observaciones: 'Sale ejemplar adulto de cernícalo durante la inspección. En la revisión anterior (mayo) se registró un pollo de lechuza común. Cambio de especie ocupante y nueva puesta activa de tres huevos.' },
];

try {
  console.log('Iniciando actualización de inspecciones...');
  console.log(`Conectando a: ${urlObj.hostname}`);
  console.log(`Base de datos: ${urlObj.pathname.slice(1)}`);
  
  for (const insp of inspectionsData) {
    // Obtener el ID de la caja nido
    const [boxes] = await connection.query(
      'SELECT id FROM nestBoxes WHERE cajaId = ?',
      [insp.cajaId]
    );
    
    if (boxes.length === 0) {
      console.log(`⚠️ Caja nido no encontrada: ${insp.cajaId}`);
      continue;
    }
    
    const nestBoxId = boxes[0].id;
    
    // Insertar inspección
    await connection.query(
      `INSERT INTO inspections (nestBoxId, fecha, ocupada, especie, numHuevos, numPollos, observaciones, userId, estadoConservacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nestBoxId, insp.fecha, insp.ocupada, insp.especie, insp.numHuevos, insp.numPollos, insp.observaciones, 1, 'Bueno']
    );
    
    // Actualizar estado de la caja nido
    const estadoActual = insp.ocupada ? 'ocupada' : 'vacia';
    await connection.query(
      'UPDATE nestBoxes SET estadoActual = ?, ultimaEspecie = ? WHERE id = ?',
      [estadoActual, insp.especie || 'Desconocida', nestBoxId]
    );
    
    console.log(`✅ Inspección agregada para caja ${insp.cajaId} (${insp.fecha})`);
  }
  
  await connection.end();
  console.log('\n✨ Actualización completada exitosamente');
  process.exit(0);
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
