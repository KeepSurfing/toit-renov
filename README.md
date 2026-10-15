# Toit-Reno — maquette de site vitrine

Maquette commerciale (one-page) pour **Couvreur Toit-Reno**, 77 Av. du Général Leclerc, 33200 Bordeaux — 06 66 56 48 47.
Couverture, rénovation et entretien de toiture à Bordeaux et en Gironde.

## Hébergement

Site statique : `index.html`, `app.js` et `image-markup.js` (toutes les images sont embarquées en data-URI).
Aucune étape de build. Sur Vercel : importer le dépôt, framework « Other », rien à configurer — `index.html` est servi à la racine.

## Contenu

`index.html` — la page et les styles.\n`app.js` et `image-markup.js` — les interactions et le rendu des images.
`assets/` — photographies sources fournies par l'entreprise (déjà intégrées dans `index.html`).

## Éléments encore provisoires (à valider avec Toit-Reno)

- Note Google **4,9 / 5 · 28 avis** (reprise du brief) ; noms et dates des avis à reprendre de la fiche Google.
- Section « Nos réalisations » : les **4 chiffres** (340 / 90 / 55 / 70) sont des placeholders.
- Section « Un artisan local » : présentation / parcours / équipe à compléter.
- Comparateur avant/après : intitulé volontairement factuel (« Une réalisation Toit-Reno »).
- Communes de la zone d'intervention : liste indicative.
- Horaires (« à confirmer »), mentions légales, et raccordement du formulaire de contact.

## Tests QA

Commandes, périmètre et rapports : [documentation QA](docs/qa.md).
