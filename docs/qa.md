# Tests QA

`npm ci` puis `npm run test:coverage` exécute les tests avec un seuil de 100 % pour les lignes, instructions, fonctions et branches. Le périmètre contient tous les fichiers JavaScript/TypeScript de production ; configuration, dépendances, styles et tests ne sont pas du code applicatif instrumenté.

`npx playwright install chromium` puis `npm run test:e2e` vérifie les parcours dans un vrai navigateur mobile. Le rapport de couverture (`coverage/index.html`) et le rapport navigateur (`playwright-report/index.html`) sont archivés par GitHub Actions.

Les formulaires restent des démonstrations : les tests contrôlent leur validation et leur confirmation et vérifient qu’aucune requête d’envoi n’est effectuée. Une couverture de code de 100 % ne constitue pas une garantie d’absence de défauts, ni une mesure de tous les scénarios métier possibles.
