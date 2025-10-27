export default {
  base: '/canvas-synth-daw/',
  server: {
    port: 55173,
  },
  preview: {
    port: 55173,
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler', // or "modern", "legacy"
      },
    },
  },
};
