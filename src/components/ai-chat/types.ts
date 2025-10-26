
// Props interface for the AIChat component
export interface AIChatProps {
  // Dataset rows
  data: any[];
  // Column definitions
  columns: any[];
}

// Message interface for chat messages
export interface Message {
  // Unique identifier for the message
  id: string;
  // Message type (user or AI)
  type: 'user' | 'ai';
  // Message content
  content: string;
  // Timestamp when the message was sent
  timestamp: Date;
  // Optional data associated with the message
  data?: any;
}

// Column interface for dataset columns
export interface Column {
  // Column key/identifier
  key: string;
  // Display label for the column
  label: string;
  // Data type of the column
  type: string;
}
