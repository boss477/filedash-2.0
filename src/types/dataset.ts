// Type definition for a dataset object
export interface Dataset {
  // Unique identifier for the dataset
  id: string;
  // Display name for the dataset
  name: string;
  // Array of data rows
  data: any[];
  // Array of column definitions
  columns: any[];
  // Timestamp when the dataset was uploaded
  uploadedAt: Date;
}
