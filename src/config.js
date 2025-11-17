// Configure your published Google Apps Script Web App URL here.
// Example: export const SHEETS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx.../exec";

   // Read from environment variable (set in .env file)
   export const SHEETS_SCRIPT_URL = import.meta.env.VITE_SHEETS_SCRIPT_URL || "";

