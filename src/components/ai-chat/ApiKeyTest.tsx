import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const ApiKeyTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('What is 2+2?');

  const testApiKey = async () => {
    setIsLoading(true);
    setTestResult('Testing...');
    
    try {
      // Get API key directly from environment
      const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
      
      if (!GEMINI_API_KEY) {
        setTestResult('❌ API key not found in environment variables');
        setIsLoading(false);
        return;
      }
      
      setTestResult(`API Key loaded: ${GEMINI_API_KEY.substring(0, 10)}...`);
      
      // Test the API key with a simple request
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        setTestResult(`✅ API Key is valid! Response: ${data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response text'}`);
      } else {
        setTestResult(`❌ API Error: ${response.status} - ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      setTestResult(`❌ Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Gemini API Key Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Test Prompt</label>
          <Input 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a test prompt"
          />
        </div>
        <Button 
          onClick={testApiKey} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Testing...' : 'Test API Key'}
        </Button>
        <div className="p-4 bg-gray-100 rounded-lg">
          <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
        </div>
      </CardContent>
    </Card>
  );
};