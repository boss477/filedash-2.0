// React DOM client for rendering
import { createRoot } from 'react-dom/client'

// Main application component
import App from './App.tsx'

// Global CSS styles
import './index.css'

// Render the application
createRoot(document.getElementById("root")!).render(<App />);
