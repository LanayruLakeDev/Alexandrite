// Test QwQ-32B for thinking tokens
const API_KEY = 'nvapi-YOUR-API-KEY-HERE'; // Replace with your actual NVIDIA API key
const MODEL = 'qwen/qwq-32b'; // QwQ thinking model

console.log('🔍 Testing QwQ-32B for thinking tokens...');
console.log(`📡 URL: https://integrate.api.nvidia.com/v1/chat/completions`);
console.log(`🤖 Model: ${MODEL}`);
console.log('─'.repeat(60));

async function testQwQThinking() {
  const payload = {
    model: MODEL,
    messages: [
      {
        role: "user",
        content: "Solve this step by step: If a train travels 120 km in 2 hours, what is its speed in km/h? Show your reasoning process."
      }
    ],
    temperature: 0.7,
    max_tokens: 1000,
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
    console.log('✅ Success! Full Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const content = data.choices[0].message.content;
      console.log('\n🤖 AI Response:');
      console.log('─'.repeat(60));
      console.log(content);
      console.log('─'.repeat(60));
      
      // Check for thinking tokens
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

testQwQThinking();
