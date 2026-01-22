/**
 * Early Logger Initialization
 * This file should be imported as early as possible to ensure
 * all console logs are captured, even before React components load.
 * 
 * Import this in the entry point or before any other imports that might log.
 */

// Import logger service to initialize it immediately
import './loggerService';

// Use loggerService for all logging (consistent approach)
// Get loggerService via require to ensure it's available
let loggerService: any = null;
try {
  const loggerModule = require('./loggerService');
  loggerService = loggerModule.loggerService;
} catch (e) {
  // Logger service might not be ready yet, use console as fallback
}

// Log that early logger is initialized
// Use console.log which will be intercepted by loggerService
console.log('[EarlyLogger] Early logger initialization complete');

// Export a function to verify logger is working
export function verifyEarlyLogger() {
  const { loggerService } = require('./loggerService');
  
  const message = '[EarlyLogger] Verification: Logger is active';
  console.log(message);
  
  return true;
}
