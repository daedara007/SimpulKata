import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    clearMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'src/services/aiService.ts',
        'src/services/paymentService.ts',
        'src/controllers/authController.ts',
        'src/controllers/audioController.ts',
        'src/controllers/uploadController.ts',
        'src/controllers/userController.ts',
        'src/controllers/adminController.ts',
      ],
    },
  },
});
