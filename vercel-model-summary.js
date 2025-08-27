// AI Model Pricing Summary
// This file contains general information about AI model pricing

console.log('💰 AI MODEL PRICING INFORMATION:');
console.log('═'.repeat(60));

console.log('\n🏆 GENERAL PRICING GUIDELINES:');
console.log('─'.repeat(50));
console.log('• Model pricing varies by provider');
console.log('• Costs typically include input and output tokens');
console.log('• Some providers offer free tiers');
console.log('• Pricing may change over time');

console.log('\n📊 COST CONSIDERATIONS:');
console.log('─'.repeat(50));
console.log('• Larger models generally cost more');
console.log('• Streaming responses may have different pricing');
console.log('• Some providers offer discounted rates');

console.log('\n🔍 RECOMMENDATIONS:');
console.log('─'.repeat(50));
console.log('• Compare pricing across providers');
console.log('• Consider your usage patterns');
console.log('• Check for promotional pricing');

console.log('\n📝 NOTE:');
console.log('For the most current pricing information,');
console.log('please check the official provider documentation.');

console.log('\n🏆 BEST VALUE: meta/llama-4-scout');
console.log('   💰 Only $0.0002 per 1M tokens total');
console.log('   🆕 Latest Llama 4 technology');
console.log('   👁️ Multimodal (text + images)');
console.log('   🚀 17B parameters with 16 experts');

console.log('\n💡 REMEMBER:');
console.log('✨ Vercel gives you $5 free credits every 30 days');
console.log('🔄 All models work through your existing proxy');
console.log('🎯 For thinking models, use hide_thinking=true to see only final answers');
console.log('🏃‍♂️ Models served by Groq are fastest');
console.log('💰 Prices shown are per 1 million tokens');

console.log('\n🧪 Test any model with your proxy:');
console.log('curl -X POST "https://openai-proxy.alexandrite.workers.dev/v1/chat/completions" \\');
console.log('  -H "Authorization: Bearer YOUR_VERCEL_KEY" \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"model": "deepseek/deepseek-v3", "messages": [{"role": "user", "content": "Hello!"}]}\'');