
// Your Gemini API Key - now loaded from environment variables
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export const INITIAL_AI_MESSAGE = `Hello! I'm your AI data assistant powered by Gemini. I can help you analyze your data with {dataLength} rows and {columnsLength} columns. 

Try asking me questions like:
• "What are the top 5 values in [column]?"
• "Show me the average of [numeric column]"
• "How many unique values are in [column]?"
• "Find records where [column] is greater than [value]"
• "Analyze trends in my data"
• "Give me insights about this dataset"

What would you like to explore?`;
