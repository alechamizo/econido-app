const API_URL_INSPECTIONS = 'http://localhost:3000/api/trpc/inspection.list';
const API_URL_NESTBOXES = 'http://localhost:3000/api/trpc/nestBox.list';

async function checkDB() {
  try {
    // Get all inspections
    const inspResp = await fetch(API_URL_INSPECTIONS);
    const inspData = await inspResp.json();
    const inspections = inspData.result.data.json;
    
    // Get all nest boxes
    const nbResp = await fetch(API_URL_NESTBOXES);
    const nbData = nbResp.json();
    const nestBoxes = (await nbData).result.data.json;
    
    console.log('Total inspections:', inspections.length);
    console.log('Total nest boxes:', nestBoxes.length);
    
    // Find unique nestBoxIds in inspections
    const nestBoxIds = new Set(inspections.map(i => i.nestBoxId));
    console.log('\nUnique nestBoxIds in inspections:', Array.from(nestBoxIds).sort((a, b) => a - b));
    
    // Find which nestBoxIds don't have a matching nest box
    const validNestBoxIds = new Set(nestBoxes.map(nb => nb.id));
    const invalidIds = Array.from(nestBoxIds).filter(id => !validNestBoxIds.has(id));
    
    console.log('\nInvalid nestBoxIds (not in nest_boxes table):', invalidIds);
    console.log('Valid nestBoxIds:', Array.from(validNestBoxIds).sort((a, b) => a - b));
    
    // Count inspections by invalid ID
    console.log('\nInspections with invalid nestBoxIds:');
    invalidIds.forEach(id => {
      const count = inspections.filter(i => i.nestBoxId === id).length;
      console.log(`  nestBoxId ${id}: ${count} inspections`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDB();
