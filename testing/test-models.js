// Test script to list available models from NVIDIA API
const API_KEY = 'nvapi-YOUR-API-KEY-HERE'; // Replace with your actual NVIDIA API key

console.log('🔍 Testing NVIDIA NIM API - Getting available models...');
console.log(`📡 URL: https://integrate.api.nvidia.com/v1/models`);
console.log(`🔑 API Key: ${API_KEY.substring(0, 12)}...`);
console.log('─'.repeat(60));

async function testModelsEndpoint() {
  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error Response:');
      console.log(errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Available Models:');
    
    if (data.data && Array.isArray(data.data)) {
      data.data.forEach((model, index) => {
        console.log(`${index + 1}. ${model.id}`);
      });
    } else {
      console.log('Full response:');
      console.log(JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Network Error:');
    console.log(error.message);
  }
}

testModelsEndpoint();
