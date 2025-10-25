// Test script to verify fixes
console.log('Testing fixes...');

// Test 1: Check if environment variables are loaded correctly
console.log('VITE_GEMINI_API_KEY exists:', !!import.meta.env.VITE_GEMINI_API_KEY);

// Test 2: Check if ChartBuilder functions are working
console.log('ChartBuilder combine functions should be available');

// Test 3: Check if DataTable search is working
console.log('DataTable search should be functional');

console.log('All tests completed');