import js from '@eslint/js';
import globals from 'globals';

export default [
  // Fichiers générés (doc Swagger statique, rapports de couverture) : pas du code de l'équipe.
  { ignores: ['docs-site/', 'coverage/'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
