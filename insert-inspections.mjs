import fs from 'fs';

const inspections = JSON.parse(fs.readFileSync('inspections.json', 'utf-8'));

// Convertir a SQL INSERT
const values = inspections.map(insp => {
  const fecha = new Date(insp.fecha).toISOString().slice(0, 19).replace('T', ' ');
  const especie = insp.especie ? `'${insp.especie}'` : 'NULL';
  const observaciones = insp.observaciones ? `'${insp.observaciones.replace(/'/g, "''")}'` : 'NULL';
  
  return `(${insp.nestBoxId}, 1, '${fecha}', ${insp.ocupada}, ${especie}, ${insp.numHuevos}, ${insp.numPollos}, 'bueno', ${observaciones}, '[]', NOW(), NOW())`;
}).join(',\n');

const sql = `DELETE FROM inspections WHERE id > 0;
INSERT INTO inspections (nestBoxId, userId, fecha, ocupada, especie, numHuevos, numPollos, estadoConservacion, observaciones, multimediaUrls, createdAt, updatedAt) 
VALUES
${values};`;

fs.writeFileSync('insert-inspections.sql', sql);
console.log('✅ SQL generado en insert-inspections.sql');
console.log(`Total inspecciones a insertar: ${inspections.length}`);
