// Generar inspecciones realistas para 2 meses

const SPECIES = [
  'cernicalo_vulgar',
  'cernicalo_primilla',
  'carraca_europea',
  'mochuelo_europeo',
  'lechuza',
  'gorrion',
  'otros'
];

const SPECIES_NAMES = {
  cernicalo_vulgar: 'Cernícalo vulgar',
  cernicalo_primilla: 'Cernícalo primilla',
  carraca_europea: 'Carraca europea',
  mochuelo_europeo: 'Mochuelo europeo',
  lechuza: 'Lechuza',
  gorrion: 'Gorrión',
  otros: 'Otros'
};

const OBSERVATIONS = [
  'Nido activo con material vegetal',
  'Caja limpia, sin indicios',
  'Presencia de huevos',
  'Pollos en desarrollo',
  'Nido abandonado',
  'Reparación necesaria',
  'Depredador detectado',
  'Parásitos observados',
  'Nido bien mantenido',
  'Actividad reproductora en curso'
];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateInspections() {
  const inspections = [];
  const nestBoxIds = Array.from({ length: 28 }, (_, i) => 30002 + i);
  
  // Generar 2-3 inspecciones por caja nido para 2 meses (abril-mayo 2026)
  const aprilStart = new Date('2026-04-01');
  const mayEnd = new Date('2026-05-31');
  
  nestBoxIds.forEach((nestBoxId, idx) => {
    // 2-3 inspecciones por caja
    const inspectionCount = Math.random() > 0.5 ? 3 : 2;
    
    for (let i = 0; i < inspectionCount; i++) {
      const fecha = randomDate(aprilStart, mayEnd);
      
      // 70% de probabilidad de ocupación
      const ocupada = Math.random() > 0.3 ? 1 : 0;
      
      let especie = null;
      let numHuevos = 0;
      let numPollos = 0;
      
      if (ocupada) {
        especie = SPECIES[Math.floor(Math.random() * SPECIES.length)];
        numHuevos = Math.floor(Math.random() * 6); // 0-5 huevos
        numPollos = Math.floor(Math.random() * 5); // 0-4 pollos
      }
      
      inspections.push({
        nestBoxId,
        fecha: fecha.toISOString(),
        ocupada,
        especie,
        numHuevos,
        numPollos,
        estadoConservacion: ['bueno', 'necesita_reparacion', 'caida'][Math.floor(Math.random() * 3)],
        observaciones: OBSERVATIONS[Math.floor(Math.random() * OBSERVATIONS.length)],
        multimediaUrls: [],
        userId: 1
      });
    }
  });
  
  return inspections;
}

const inspections = generateInspections();
console.log(`Generadas ${inspections.length} inspecciones para 28 cajas nido en 2 meses`);
console.log('\nPrimeras 5 inspecciones:');
inspections.slice(0, 5).forEach((insp, idx) => {
  console.log(`\n[${idx + 1}] Caja ${insp.nestBoxId}`);
  console.log(`    Fecha: ${new Date(insp.fecha).toLocaleDateString('es-ES')}`);
  console.log(`    Ocupada: ${insp.ocupada ? 'Sí' : 'No'}`);
  if (insp.especie) {
    console.log(`    Especie: ${SPECIES_NAMES[insp.especie]}`);
    console.log(`    Huevos: ${insp.numHuevos}, Pollos: ${insp.numPollos}`);
  }
  console.log(`    Observaciones: ${insp.observaciones}`);
});

// Guardar como JSON para insertar en la BD
const fs = await import('fs');
fs.writeFileSync('inspections.json', JSON.stringify(inspections, null, 2));
console.log('\n✅ Inspecciones guardadas en inspections.json');
