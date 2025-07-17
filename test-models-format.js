// Test script to see NVIDIA models endpoint format
const API_KEY = 'nvapi-YOUR-API-KEY-HERE'; // Replace with your actual NVIDIA API key

console.log('🔍 Checking NVIDIA /models endpoint format...');

async function checkModelsFormat() {
  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (!response.ok) {
      console.log(`❌ Error: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    
    console.log('📋 Response structure:');
    console.log(`- Object type: ${data.object}`);
    console.log(`- Number of models: ${data.data ? data.data.length : 0}`);
    
    if (data.data && data.data.length > 0) {
      console.log('\n📝 First model example:');
      console.log(JSON.stringify(data.data[0], null, 2));
      
      console.log('\n📝 Few more model IDs:');
      data.data.slice(0, 5).forEach((model, i) => {
        console.log(`${i + 1}. ${model.id}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkModelsFormat();
