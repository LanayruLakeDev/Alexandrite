// Analyze all available models from Vercel AI Gateway
// This script fetches models, providers, and pricing to help you choose the best option

const VERCEL_API_KEY = 'REPLACE_WITH_YOUR_ACTUAL_VERCEL_KEY'; // ⚠️ REMOVED FOR SECURITY
const VERCEL_ENDPOINT = 'https://ai-gateway.vercel.sh/v1/models';

async function analyzeVercelModels() {
  console.log('🚀 Analyzing Vercel AI Gateway Models...');
  console.log('📡 Fetching from:', VERCEL_ENDPOINT);
  console.log('─'.repeat(80));

  try {
    const response = await fetch(VERCEL_ENDPOINT, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      console.log('❌ Unexpected response format');
      console.log('Raw response:', JSON.stringify(data, null, 2));
      return;
    }

    console.log(`✅ Found ${data.data.length} models\n`);

    // Group models by provider for better organization
    const modelsByProvider = {};
    const pricingData = [];

    data.data.forEach(model => {
      // Extract provider from model ID (e.g., "openai/gpt-4o" -> "openai")
      const provider = model.id.includes('/') ? model.id.split('/')[0] : 'unknown';
      
      if (!modelsByProvider[provider]) {
        modelsByProvider[provider] = [];
      }
      modelsByProvider[provider].push(model);

      // Collect pricing info
      if (model.pricing) {
        pricingData.push({
          id: model.id,
          provider: provider,
          name: model.name || model.id,
          inputPrice: model.pricing.input || 0,
          outputPrice: model.pricing.output || 0,
          description: model.description || ''
        });
      }
    });

    // Display models by provider
    console.log('📋 MODELS BY PROVIDER:');
    console.log('═'.repeat(80));

    Object.keys(modelsByProvider).sort().forEach(provider => {
      const models = modelsByProvider[provider];
      console.log(`\n🏢 ${provider.toUpperCase()} (${models.length} models)`);
      console.log('─'.repeat(40));
      
      models.forEach(model => {
        console.log(`📌 ${model.id}`);
        if (model.name && model.name !== model.id) {
          console.log(`   Name: ${model.name}`);
        }
        if (model.description) {
          console.log(`   Description: ${model.description}`);
        }
        if (model.pricing) {
          console.log(`   💰 Input: $${model.pricing.input}/1M tokens`);
          console.log(`   💰 Output: $${model.pricing.output}/1M tokens`);
        }
        if (model.context_length) {
          console.log(`   📏 Context: ${model.context_length.toLocaleString()} tokens`);
        }
        console.log('');
      });
    });

    // Pricing analysis
    if (pricingData.length > 0) {
      console.log('\n💰 PRICING ANALYSIS:');
      console.log('═'.repeat(80));

      // Sort by input price (cheapest first)
      const sortedByInput = [...pricingData].sort((a, b) => a.inputPrice - b.inputPrice);
      
      console.log('\n🔥 CHEAPEST INPUT PRICING (per 1M tokens):');
      console.log('─'.repeat(50));
      sortedByInput.slice(0, 10).forEach((model, index) => {
        const num = (index + 1).toString().padStart(2);
        console.log(`${num}. $${model.inputPrice.toFixed(4)} - ${model.id} (${model.provider})`);
      });

      // Sort by output price (cheapest first)
      const sortedByOutput = [...pricingData].sort((a, b) => a.outputPrice - b.outputPrice);
      
      console.log('\n🔥 CHEAPEST OUTPUT PRICING (per 1M tokens):');
      console.log('─'.repeat(50));
      sortedByOutput.slice(0, 10).forEach((model, index) => {
        const num = (index + 1).toString().padStart(2);
        console.log(`${num}. $${model.outputPrice.toFixed(4)} - ${model.id} (${model.provider})`);
      });

      // Calculate total cost for typical usage
      console.log('\n📊 COST COMPARISON (1M input + 1M output tokens):');
      console.log('─'.repeat(50));
      const totalCosts = pricingData.map(model => ({
        ...model,
        totalCost: model.inputPrice + model.outputPrice
      })).sort((a, b) => a.totalCost - b.totalCost);

      totalCosts.slice(0, 15).forEach((model, index) => {
        const total = model.totalCost.toFixed(4);
        const num = (index + 1).toString().padStart(2);
        console.log(`${num}. $${total} - ${model.id} (${model.provider})`);
        console.log(`    Input: $${model.inputPrice.toFixed(4)} | Output: $${model.outputPrice.toFixed(4)}`);
      });

      // Find DeepSeek models specifically
      console.log('\n🧠 DEEPSEEK MODELS PRICING:');
      console.log('─'.repeat(50));
      const deepseekModels = pricingData.filter(model => 
        model.id.toLowerCase().includes('deepseek')
      ).sort((a, b) => (a.inputPrice + a.outputPrice) - (b.inputPrice + b.outputPrice));

      if (deepseekModels.length > 0) {
        deepseekModels.forEach(model => {
          const total = (model.inputPrice + model.outputPrice).toFixed(4);
          console.log(`💎 ${model.id}`);
          console.log(`   Provider: ${model.provider}`);
          console.log(`   Input: $${model.inputPrice.toFixed(4)} | Output: $${model.outputPrice.toFixed(4)} | Total: $${total}`);
          if (model.description) {
            console.log(`   Description: ${model.description}`);
          }
          console.log('');
        });
      } else {
        console.log('   No DeepSeek models found');
      }
    }

    // Summary and recommendations
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('═'.repeat(80));
    console.log('✨ For cheapest overall cost, look at the models at the top of the cost comparison');
    console.log('🧠 For reasoning tasks, consider DeepSeek models (they show thinking process)');
    console.log('⚡ For speed, smaller models typically respond faster');
    console.log('🎨 For creativity, larger models usually perform better');
    console.log('💰 Remember: Vercel gives you $5 free credits every 30 days!');

  } catch (error) {
    console.error('❌ Error analyzing models:', error.message);
    
    // Show what we can still do
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Check if your Vercel API key is valid');
    console.log('2. Ensure you have credits remaining');
    console.log('3. Try again in a few minutes if rate limited');
  }
}

// Test a specific model to see if it works
async function testCheapestModel() {
  console.log('\n🧪 Testing a cheap model...');
  
  const testPayload = {
    model: 'deepseek/deepseek-v3', // Known cheap and good model
    messages: [
      {
        role: 'user',
        content: 'Say hello in exactly 5 words.'
      }
    ],
    max_tokens: 50,
    temperature: 0.1
  };

  try {
    const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Test successful!');
    console.log(`Model: ${data.model || testPayload.model}`);
    console.log(`Response: ${data.choices[0].message.content}`);
    console.log(`Tokens used: ${JSON.stringify(data.usage)}`);

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
}

// Run the analysis
async function main() {
  await analyzeVercelModels();
  await testCheapestModel();
}

main();