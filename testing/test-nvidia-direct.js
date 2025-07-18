// Test script to connect directly to NVIDIA NIM API with DeepSeek R1
const API_KEY = 'YOUR-API-KEY-HERE'; // Replace with your actual NVIDIA API key
const MODEL = 'deepseek-ai/deepseek-r1-0528'; // DeepSeek R1 model

console.log('🔍 Testing NVIDIA NIM API with DeepSeek R1 for thinking tokens...');
console.log(`📡 URL: https://integrate.api.nvidia.com/v1/chat/completions`);
console.log(`🤖 Model: ${MODEL}`);
console.log(`🔑 API Key: ${API_KEY.substring(0, 12)}...`);
console.log('─'.repeat(60));

async function testDeepSeekR1() {
  const payload = {
    model: MODEL,
    messages: [
      {
        role: "user",
        content: "What is 2+2? Please show your reasoning step by step."
      }
    ],
    temperature: 0.7,
    max_tokens: 1000,
    stream: false
  };

  try {
    console.log('📤 Sending request payload:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('─'.repeat(60));

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log('📊 Response Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    console.log('─'.repeat(60));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error Response:');
      console.log(errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Full JSON Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('─'.repeat(60));
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      console.log('🤖 Raw AI Response Content:');
      console.log('─'.repeat(60));
      console.log(data.choices[0].message.content);
      console.log('─'.repeat(60));
      
      // Check if thinking tokens are present
      const content = data.choices[0].message.content;
      if (content.includes('<thinking>') || content.includes('<thought>')) {
        console.log('🧠 THINKING TOKENS FOUND!');
      } else {
        console.log('❌ NO THINKING TOKENS FOUND');
      }
    }
    
  } catch (error) {
    console.log('❌ Network Error:');
    console.log(error.message);
  }
}

testDeepSeekR1();

console.log('🔍 Testing NVIDIA NIM API directly...');
console.log(`📡 URL: https://integrate.api.nvidia.com/v1/chat/completions`);
console.log(`🤖 Model: ${MODEL}`);
console.log(`🔑 API Key: ${API_KEY.substring(0, 12)}...`);
console.log('─'.repeat(60));

async function testNvidiaDirectly() {
  const payload = {
    model: MODEL,
    messages: [
      {
        role: "user",
        content: "Hello! Please respond with a short greeting."
      }
    ],
    temperature: 0.6,
    top_p: 0.7,
    max_tokens: 100,
    stream: false
  };

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error Response:');
      console.log(errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Success! Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      console.log('\n🤖 AI Response:');
      console.log(data.choices[0].message.content);
    }
    
  } catch (error) {
    console.log('❌ Network Error:');
    console.log(error.message);
  }
}

testNvidiaDirectly();
