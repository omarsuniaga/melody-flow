module.exports = {
  env: {
    node: true,
    commonjs: true
  },
  root: true,
  parser: 'vue-eslint-parser', // Permite parsear SFC .vue
  parserOptions: {
    parser: '@typescript-eslint/parser', // Usa TS en <script lang="ts">
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  extends: [
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    // tus reglas
  }
}
