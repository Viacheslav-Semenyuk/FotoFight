/**
 * Logger utility that works in both development and production
 * 
 * Usage:
 * - logger.log('Debug message') - only in development (__DEV__)
 * - logger.info('Info message') - always logged (uses console.info)
 * - logger.error('Error message') - always logged (uses console.error)
 * - logger.warn('Warning message') - always logged (uses console.warn)
 * - logger.force('Important message') - always logged (uses console.error for guaranteed output)
 */

// Declare global __DEV__ for TypeScript
declare const __DEV__: boolean;

class Logger {
  log(...args: any[]) {
    // В development режиме - обычный console.log
    // В production - ничего не выводим (оптимизируется компилятором)
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(...args);
    }
  }

  info(...args: any[]) {
    // console.info обычно не удаляется в production
    console.info(...args);
  }

  warn(...args: any[]) {
    // console.warn обычно не удаляется в production
    console.warn(...args);
  }

  error(...args: any[]) {
    // console.error НИКОГДА не удаляется - используйте для важных логов
    console.error(...args);
  }

  // Метод для принудительного логирования даже в production
  force(...args: any[]) {
    // Используем console.error для гарантированного вывода
    console.error('[FORCE LOG]', ...args);
  }
}

export const logger = new Logger();
export default logger;
