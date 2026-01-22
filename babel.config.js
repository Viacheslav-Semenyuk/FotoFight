module.exports = function(api) {
  api.cache(true);
  
  // В production Expo по умолчанию может удалять console.log
  // Но мы хотим видеть все логи в loggerService даже в release сборке
  // Поэтому отключаем удаление console в production
  
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Отключаем удаление console в production
          // Это позволит loggerService перехватывать все логи
          jsxRuntime: 'automatic',
        }
      ]
    ],
    // Отключаем удаление console в production, чтобы loggerService мог перехватывать логи
    env: {
      production: {
        // Не добавляем плагин transform-remove-console
        // Это позволит console.log/warn/error оставаться в коде
        // и loggerService сможет их перехватывать
        plugins: [],
      },
    },
  };
};
