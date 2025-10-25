// Simple Node.js script to list available Gemini models
// Run with: node list-models.js

const API_KEY = "AIzaSyDjghcnRP4_WmY3HxkGZPnVJg-hMEbKtJw";

async function listModels() {
  console.log('Listing available Gemini models...');
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );
    
    const data = await response.json();
    console.log('Response status:', response.status);
    
    if (response.ok) {
      console.log('✅ Successfully retrieved models:');
      data.models?.forEach(model => {
        console.log(`- ${model.name}: ${model.displayName || model.name}`);
      });
    } else {
      console.log('❌ API Error:');
      console.log('Status:', response.status);
      console.log('Error:', data.error?.message || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Network Error:');
    console.log(error.message);
  }
}

listModels();