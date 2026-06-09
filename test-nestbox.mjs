const API_URL = 'http://localhost:3000/api/trpc/nestBox.list';

async function testNestBoxes() {
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    
    if (data.result && data.result.data) {
      const nestBoxes = data.result.data;
      console.log('Total nestBoxes:', nestBoxes.json ? nestBoxes.json.length : 'unknown');
      
      if (nestBoxes.json && nestBoxes.json.length > 0) {
        console.log('\n=== First NestBox ===');
        const first = nestBoxes.json[0];
        console.log('id:', first.id);
        console.log('cajaId:', first.cajaId);
        console.log('instalacion:', first.instalacion);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testNestBoxes();
