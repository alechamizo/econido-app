import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Datos de cajas nido
const cajasNido = [
  { cajaId: 'Ext IB12-1', instalacion: 'PSF EXT I', tipoCaja: 'Estándar', latitude: '38.873912', longitude: '-6.972184' },
  { cajaId: 'Ext IB12-2', instalacion: 'PSF EXT I', tipoCaja: 'Estándar', latitude: '38.873455', longitude: '-6.971632' },
  { cajaId: 'Ext IB21-1', instalacion: 'PSF EXT I', tipoCaja: 'Estándar', latitude: '38.874221', longitude: '-6.973014' },
  { cajaId: 'Ext IB21-2', instalacion: 'PSF EXT I', tipoCaja: 'Estándar', latitude: '38.874008', longitude: '-6.972556' },
  { cajaId: 'Ext IB23', instalacion: 'PSF EXT I', tipoCaja: 'Estándar', latitude: '38.873612', longitude: '-6.973422' },
  { cajaId: 'Ext IB31', instalacion: 'PSF EXT I', tipoCaja: 'Estándar', latitude: '38.872994', longitude: '-6.972901' },
  { cajaId: 'Ext IB41-1', instalacion: 'PSF EXT I', tipoCaja: 'Estándar', latitude: '38.873388', longitude: '-6.971955' },
  { cajaId: 'Ext IB41-2', instalacion: 'PSF EXT I', tipoCaja: 'Estándar', latitude: '38.873721', longitude: '-6.972311' },
  { cajaId: 'Ext IB42-1', instalacion: 'PSF EXT I', tipoCaja: 'Estándar', latitude: '38.874044', longitude: '-6.971784' },
  { cajaId: 'Ext IB42-2', instalacion: 'PSF EXT I', tipoCaja: 'Estándar', latitude: '38.874312', longitude: '-6.972104' },
  { cajaId: 'Ext IIA11', instalacion: 'PSF EXT II', tipoCaja: 'Estándar', latitude: '38.869844', longitude: '-6.965332' },
  { cajaId: 'Ext IIA12', instalacion: 'PSF EXT II', tipoCaja: 'Estándar', latitude: '38.870112', longitude: '-6.964881' },
  { cajaId: 'Ext IIA21-1', instalacion: 'PSF EXT II', tipoCaja: 'Estándar', latitude: '38.870421', longitude: '-6.965114' },
  { cajaId: 'Ext IIA21-2', instalacion: 'PSF EXT II', tipoCaja: 'Estándar', latitude: '38.869988', longitude: '-6.965667' },
  { cajaId: 'Ext IIA31', instalacion: 'PSF EXT II', tipoCaja: 'Estándar', latitude: '38.870633', longitude: '-6.964552' },
  { cajaId: 'Ext IIA32-1', instalacion: 'PSF EXT II', tipoCaja: 'Estándar', latitude: '38.869701', longitude: '-6.964998' },
  { cajaId: 'Ext IIA32-2', instalacion: 'PSF EXT II', tipoCaja: 'Estándar', latitude: '38.870055', longitude: '-6.965244' },
  { cajaId: 'Ext IIA41-1', instalacion: 'PSF EXT II', tipoCaja: 'Estándar', latitude: '38.870488', longitude: '-6.965771' },
  { cajaId: 'Ext IIA41-2', instalacion: 'PSF EXT II', tipoCaja: 'Estándar', latitude: '38.870812', longitude: '-6.965401' },
  { cajaId: 'Ext IIA42-1', instalacion: 'PSF EXT II', tipoCaja: 'Estándar', latitude: '38.869923', longitude: '-6.964611' },
  { cajaId: 'Ext IIA42-2', instalacion: 'PSF EXT II', tipoCaja: 'Estándar', latitude: '38.870267', longitude: '-6.964933' },
  { cajaId: 'Ext IIA42-3', instalacion: 'PSF EXT II', tipoCaja: 'Estándar', latitude: '38.870541', longitude: '-6.965088' },
  { cajaId: 'Ext IIIC11', instalacion: 'PSF EXT III', tipoCaja: 'Estándar', latitude: '38.866412', longitude: '-6.958774' },
  { cajaId: 'Ext IIIC12', instalacion: 'PSF EXT III', tipoCaja: 'Estándar', latitude: '38.866721', longitude: '-6.959021' },
  { cajaId: 'Ext IIIC21', instalacion: 'PSF EXT III', tipoCaja: 'Estándar', latitude: '38.866955', longitude: '-6.958611' },
  { cajaId: 'Ext IIIC22-1', instalacion: 'PSF EXT III', tipoCaja: 'Estándar', latitude: '38.866304', longitude: '-6.959188' },
  { cajaId: 'Ext IIIC22-2', instalacion: 'PSF EXT III', tipoCaja: 'Estándar', latitude: '38.866588', longitude: '-6.958932' },
  { cajaId: 'Ext IIIC22-3', instalacion: 'PSF EXT III', tipoCaja: 'Estándar', latitude: '38.866843', longitude: '-6.959402' },
];

// Datos de inspecciones
const inspecciones = [
  { cajaId: 'Ext IB12-1', fecha: '2026-03-12', ocupada: 1, especie: 'Gorrión común', numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Nido activo con material vegetal' },
  { cajaId: 'Ext IB12-2', fecha: '2026-03-12', ocupada: 0, especie: null, numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Caja limpia, sin indicios' },
  { cajaId: 'Ext IB21-1', fecha: '2026-03-13', ocupada: 1, especie: 'Lavandera blanca', numHuevos: 0, numPollos: 0, estadoConservacion: 'necesita_reparacion', observaciones: 'Uso puntual' },
  { cajaId: 'Ext IB21-2', fecha: '2026-03-13', ocupada: 1, especie: 'Gorrión común', numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Presencia de excrementos recientes' },
  { cajaId: 'Ext IB23', fecha: '2026-03-14', ocupada: 0, especie: null, numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Sin ocupación' },
  { cajaId: 'Ext IB31', fecha: '2026-03-14', ocupada: 1, especie: 'Carbonero común', numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Nido incipiente' },
  { cajaId: 'Ext IB41-1', fecha: '2026-03-15', ocupada: 0, especie: null, numHuevos: 0, numPollos: 0, estadoConservacion: 'necesita_reparacion', observaciones: 'Ligera inclinación' },
  { cajaId: 'Ext IB41-2', fecha: '2026-03-15', ocupada: 1, especie: 'Gorrión común', numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Adultos observados en las inmediaciones' },
  { cajaId: 'Ext IB42-1', fecha: '2026-03-15', ocupada: 0, especie: null, numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Sin signos de uso' },
  { cajaId: 'Ext IB42-2', fecha: '2026-03-15', ocupada: 1, especie: 'Estornino negro', numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Nido consolidado' },
  { cajaId: 'Ext IIA11', fecha: '2026-03-18', ocupada: 1, especie: 'Gorrión común', numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Entrada frecuente' },
  { cajaId: 'Ext IIA12', fecha: '2026-03-18', ocupada: 0, especie: null, numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Caja sin uso' },
  { cajaId: 'Ext IIA21-1', fecha: '2026-03-19', ocupada: 1, especie: 'Lavandera blanca', numHuevos: 0, numPollos: 0, estadoConservacion: 'necesita_reparacion', observaciones: 'Nido poco profundo' },
  { cajaId: 'Ext IIA21-2', fecha: '2026-03-19', ocupada: 0, especie: null, numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Sin ocupación' },
  { cajaId: 'Ext IIA31', fecha: '2026-03-20', ocupada: 1, especie: 'Cernícalo vulgar', numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Posible uso reproductor' },
  { cajaId: 'Ext IIA32-1', fecha: '2026-03-20', ocupada: 0, especie: null, numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Caja estable' },
  { cajaId: 'Ext IIA32-2', fecha: '2026-03-20', ocupada: 1, especie: 'Gorrión común', numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Material vegetal y plumas' },
  { cajaId: 'Ext IIA41-1', fecha: '2026-03-21', ocupada: 0, especie: null, numHuevos: 0, numPollos: 0, estadoConservacion: 'necesita_reparacion', observaciones: 'Puerta ligeramente suelta' },
  { cajaId: 'Ext IIA41-2', fecha: '2026-03-21', ocupada: 1, especie: 'Estornino negro', numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Nido activo' },
  { cajaId: 'Ext IIA42-1', fecha: '2026-03-21', ocupada: 0, especie: null, numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Sin indicios' },
  { cajaId: 'Ext IIA42-2', fecha: '2026-03-21', ocupada: 1, especie: 'Gorrión común', numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Uso continuado' },
  { cajaId: 'Ext IIA42-3', fecha: '2026-03-21', ocupada: 0, especie: null, numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Caja vacía' },
  { cajaId: 'Ext IIIC11', fecha: '2026-03-25', ocupada: 1, especie: 'Gorrión común', numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Nido en uso' },
  { cajaId: 'Ext IIIC12', fecha: '2026-03-25', ocupada: 0, especie: null, numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Caja limpia' },
  { cajaId: 'Ext IIIC21', fecha: '2026-03-26', ocupada: 1, especie: 'Lavandera blanca', numHuevos: 0, numPollos: 0, estadoConservacion: 'necesita_reparacion', observaciones: 'Uso esporádico' },
  { cajaId: 'Ext IIIC22-1', fecha: '2026-03-26', ocupada: 0, especie: null, numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Sin ocupación' },
  { cajaId: 'Ext IIIC22-2', fecha: '2026-03-26', ocupada: 1, especie: 'Gorrión común', numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Nido avanzado' },
  { cajaId: 'Ext IIIC22-3', fecha: '2026-03-26', ocupada: 0, especie: null, numHuevos: 0, numPollos: 0, estadoConservacion: 'bueno', observaciones: 'Sin signos' },
];

try {
  console.log('Insertando cajas nido...');
  for (const caja of cajasNido) {
    await connection.execute(
      'INSERT INTO nestBoxes (cajaId, instalacion, tipoCaja, latitude, longitude, estadoActual, ultimaEspecie) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [caja.cajaId, caja.instalacion, caja.tipoCaja, caja.latitude, caja.longitude, 'desconocido', null]
    );
  }
  console.log(`✓ ${cajasNido.length} cajas nido insertadas`);

  console.log('Insertando inspecciones...');
  let inspCount = 0;
  for (const insp of inspecciones) {
    const [rows] = await connection.execute(
      'SELECT id FROM nestBoxes WHERE cajaId = ?',
      [insp.cajaId]
    );
    
    if (rows.length > 0) {
      const nestBoxId = rows[0].id;
      await connection.execute(
        'INSERT INTO inspections (nestBoxId, userId, fecha, ocupada, especie, numHuevos, numPollos, estadoConservacion, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [nestBoxId, 1, insp.fecha, insp.ocupada, insp.especie, insp.numHuevos, insp.numPollos, insp.estadoConservacion, insp.observaciones]
      );
      inspCount++;
    }
  }
  console.log(`✓ ${inspCount} inspecciones insertadas`);

  console.log('\n✅ Datos cargados exitosamente');
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await connection.end();
}
