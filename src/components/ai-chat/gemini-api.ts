

export const processQueryWithGemini = async (query: string, data: any[], columns: any[]): Promise<string> => {
  // Check if API key is configured
  let GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
  
  // Remove any surrounding quotes that might have been added
  if (GEMINI_API_KEY.startsWith('"') && GEMINI_API_KEY.endsWith('"')) {
    GEMINI_API_KEY = GEMINI_API_KEY.slice(1, -1);
  }
  
  if (!GEMINI_API_KEY) {
    return "❌ Gemini API key is not configured. Please add your API key to the .env file.";
  }
  
  // Validate API key format (should start with AIza)
  if (!GEMINI_API_KEY.startsWith('AIza')) {
    return "❌ Invalid Gemini API key format. Please check your API key in the .env file.";
  }

  try {
    const dataContext = `
Dataset Context:
- Total rows: ${data.length}
- Total columns: ${columns.length}
- Column details: ${columns.map(col => `${col.label} (${col.type})`).join(', ')}
- Sample data: ${JSON.stringify(data.slice(0, 3), null, 2)}
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a data scientist analyzing a dataset. Here's the context:

${dataContext}

User question: "${query}"

Please provide a helpful analysis or answer based on the data context provided. If the user is asking for specific calculations, provide the actual calculations. If they want insights, provide meaningful observations about the data structure and potential patterns. Be concise but informative.`
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error('Gemini API error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if (error.message.includes('fetch')) {
        return "Network error: Unable to connect to Gemini API. Please check your internet connection.";
      }
    }
    return "Sorry, I encountered an error while processing your request. Please check your API key and try again.";
  }
};
