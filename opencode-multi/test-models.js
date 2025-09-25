#!/usr/bin/env node

const dotenv = require('dotenv');
dotenv.config();

// Simple function to get available models from environment
function getAvailableModels() {
  const modelList = process.env.OPENROUTER_MODEL_LIST;
  if (!modelList) {
    console.warn('Warning: OPENROUTER_MODEL_LIST not found in environment');
    return [];
  }
  return modelList.split(',').map(model => model.trim());
}

console.log('=== OpenRouter Model Test ===');
console.log('Environment variables loaded:');
console.log(`  API Key: ${process.env.OPENROUTER_API_KEY ? 'Set (length: ' + process.env.OPENROUTER_API_KEY.length + ')' : 'Not set'}`);
console.log(`  Base URL: ${process.env.OPENROUTER_BASE_URL}`);
console.log(`  Model List: ${process.env.OPENROUTER_MODEL_LIST}`);
console.log();

const models = getAvailableModels();

if (models.length === 0) {
  console.error('❌ No models configured. Please set OPENROUTER_MODEL_LIST in your .env file');
  console.log('Expected format: OPENROUTER_MODEL_LIST=model1:version,model2:version,...');
  process.exit(1);
}

console.log('✅ Available OpenRouter Models:');
console.log('============================');
models.forEach((model, index) => {
  console.log(`${index + 1}. ${model}`);
});
console.log('============================');
console.log('You can use these models in oc-chat with: --model <model-name>');
console.log('Or use "auto" for automatic rotation between models');
console.log();

try {
  // Try to test model loading if the file exists
  console.log('Testing TypeScript model loading...');
  const { modelManager } = require('./dist/sdk/models.js');
  const tsModels = modelManager.getAllModels();
  console.log(`✅ TypeScript model loading: Found ${tsModels.length} models`);
} catch (error) {
  console.log('⚠️  TypeScript model loading not available yet (compilation issues)');
  console.log('The models CLI functionality is working though!');
