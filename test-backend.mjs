const API_URL = 'http://localhost:3000/api/trpc/inspection.list';

async function testBackend() {
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response keys:', Object.keys(data));
    console.log('Result keys:', Object.keys(data.result || {}));
    
    // Mostrar la estructura completa pero resumida
    console.log('\nFull response (first 2000 chars):');
    const str = JSON.stringify(data, null, 2);
    console.log(str.substring(0, 2000));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testBackend();
