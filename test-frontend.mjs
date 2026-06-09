// Simular lo que hace el frontend
const API_URL = 'http://localhost:3000/api/trpc/inspection.list';

async function testFrontend() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    
    if (data.result && data.result.data && data.result.data.json) {
      const inspections = data.result.data.json;
      
      console.log('Total inspections received:', inspections.length);
      
      // Simular el filtrado del frontend
      const filteredInspections = inspections.filter(i => {
        // Sin filtros, mostrar todas
        return true;
      });
      
      console.log('\nFiltered inspections:', filteredInspections.length);
      
      // Mostrar las primeras 3 inspecciones como se mostrarían en el historial
      console.log('\n=== First 3 Inspections as they would appear ===');
      filteredInspections.slice(0, 3).forEach((inspection, idx) => {
        console.log(`\n[${idx + 1}] ${inspection.nestBox?.cajaId || `Caja #${inspection.nestBoxId}`}`);
        console.log(`    Ocupada: ${inspection.ocupada ? 'Sí' : 'No'}`);
        console.log(`    Especie: ${inspection.especie || 'N/A'}`);
        console.log(`    Multimedia: ${inspection.multimediaUrls?.length || 0} archivos`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testFrontend();
