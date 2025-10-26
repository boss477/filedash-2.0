// Class value utility for conditional class names
import { clsx, type ClassValue } from "clsx"

// Tailwind CSS class merging utility
import { twMerge } from "tailwind-merge"

// Utility function to merge class names with Tailwind CSS
// Combines clsx (conditional classes) with twMerge (Tailwind class merging)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
