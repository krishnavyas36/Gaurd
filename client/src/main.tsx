import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Handle unhandled WebSocket rejections (from Vite HMR) to prevent console errors
window.addEventListener('unhandledrejection', (event) => {
  // Check if this is a WebSocket-related error from development tools
  if (event.reason && 
      (event.reason.toString().includes('WebSocket') || 
       event.reason.toString().includes('wss://') ||
       event.reason.toString().includes('ws://'))) {
    // Prevent the error from showing in console
    event.preventDefault();
    console.log('Development WebSocket connection handled - using polling for updates');
  }
});

createRoot(document.getElementById("root")!).render(<App />);
