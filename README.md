# eliotluca.com

Ton site personnel : qui tu es, ce que tu construis, ce que tu écris. Il réunit tes deux ventures (THE ENTITY, ORBES), ton parcours en finance, tes textes et quelques instruments de calcul.

Le site est statique (Astro) : pas de base de données, pas de traceur. Vercel le reconstruit et le met en ligne à chaque `git push`.

## Lancer le site en local

Il te faut Node 22.12 ou plus récent.

```sh
npm install
npm run dev
```

Le site tourne sur http://localhost:4321 et se recharge à chaque modification.

Pour voir la version de production (sans les brouillons, comme en ligne) :

```sh
npm run build
npm run preview
```

## Brouillons

Un texte reste un brouillon tant que son en-tête contient `draft: true`. Tous les textes actuels le sont : ils attendent ta relecture.

- En production, un brouillon n'existe pas : ni page, ni entrée dans la liste des textes, le flux RSS, le plan du site ou les images de partage. Les liens qui pointent vers lui mènent à `/writing`.
- En local, `npm run dev` affiche tous les brouillons, avec la mention « Draft, not published » (« Brouillon, non publié » pour un texte en français). Relis-les sur http://localhost:4321/writing.
- Pour publier un texte, passe `draft: false` (ou supprime la ligne), puis pousse.

Tant qu'aucun texte n'est publié, la page `/writing` est vide et le flux RSS ne contient aucun article. C'est prévu, rien ne casse.

## Publier un texte

1. Crée le fichier :

   ```sh
   npm run new -- "Titre du texte"
   npm run new -- "Titre du texte" --fr
   npm run new -- "Titre du manifeste" --manifesto
   ```

   Le script crée `src/content/writing/<slug>.md` (le titre en minuscules, sans accents), toujours en brouillon, et refuse d'écraser un fichier existant. Options : `--fr` pour un texte en français, `--manifesto` ou `--note` pour changer le type.

2. Remplis l'en-tête :

   | Champ | Rôle |
   | --- | --- |
   | `title` | Le titre affiché. |
   | `description` | Une phrase de résumé, reprise dans la liste des textes, le flux RSS et les aperçus de liens. Remplace celle que le script a mise par défaut. |
   | `date` | Date de publication, au format `2026-10-08`. Les textes sont classés du plus récent au plus ancien. |
   | `lang` | `en` ou `fr`. |
   | `kind` | `essay`, `manifesto` ou `note`. |
   | `draft` | `true` tant que le texte n'est pas prêt, `false` pour le publier. |
   | `place` | Facultatif : le lieu d'écriture, par exemple `Paris`. |

3. Écris le texte en Markdown sous l'en-tête et relis-le avec `npm run dev`.

4. Passe `draft: false`, puis :

   ```sh
   git add .
   git commit -m "Nouveau texte : Titre du texte"
   git push
   ```

   Vercel reconstruit le site en une minute environ. Le flux RSS (`/rss.xml`) et l'image de partage (`/og/writing/<slug>.png`) se génèrent tout seuls.

## Modifier tes informations

Tout ce qui est personnel est dans `src/data/site.ts` :

- `email` : l'adresse de contact affichée.
- `social` : tes liens LinkedIn, X, GitHub, Instagram. Une valeur vide masque le lien partout.
- `record` : ton parcours en finance, du plus récent au plus ancien. Ajoute `duration` pour afficher une durée.
- `education` : tes écoles et programmes.
- `disciplines` : tes disciplines et leur année de début.
- `now` : la page /now. Change `updated` à chaque mise à jour.

## Modifier les ventures et les projets

Chaque projet est un fichier de `src/content/work/` (`the-entity.md`, `orbes.md`). L'en-tête contient :

- `name`, `line` (la phrase de présentation), `role`, `status`, `since` (année) ;
- `url` et `urlLabel` : le lien vers le site du projet ;
- `tier` : `venture` pour THE ENTITY et ORBES, `lab` pour les projets à l'étude ;
- `order` : l'ordre d'affichage ;
- `facts` : les chiffres affichés, chacun avec `value` et `label`. Uniquement des chiffres réels et publics.

Le texte sous l'en-tête devient la page du projet.

Pour masquer un projet, ajoute `visible: false` dans son en-tête : il disparaît des listes et sa page n'est plus générée, en local comme en ligne. Le contenu reste dans le fichier.

## Mettre en ligne sur Vercel

1. Pousse le dépôt sur GitHub (dépôt privé si tu veux, Vercel y a accès).
2. Sur vercel.com : Add New, Project, puis importe le dépôt. Vercel reconnaît Astro tout seul (commande `npm run build`, dossier `dist`). Aucune variable d'environnement n'est nécessaire. Dans Settings, Build and Deployment, vérifie que la version de Node est 22 ou plus récente.
3. Chaque `git push` sur la branche principale met le site à jour. Les autres branches obtiennent une URL de prévisualisation.

`vercel.json` règle les adresses propres (`/about` plutôt que `/about.html`, sans barre finale), le cache des fichiers versionnés et des images de partage, et les en-têtes de sécurité. Une adresse inconnue affiche la page `404.html`.

### Brancher eliotluca.com

1. Dans le projet Vercel : Settings, Domains. Ajoute `eliotluca.com` et `www.eliotluca.com`, et fais rediriger `www` vers `eliotluca.com` (c'est l'adresse déclarée dans le site, le flux RSS et le plan du site).
2. Chez ton registrar, dans la zone DNS :

   | Type | Nom | Valeur |
   | --- | --- | --- |
   | `A` | `@` (domaine nu) | `76.76.21.21` |
   | `CNAME` | `www` | `cname.vercel-dns.com` |

   Supprime les anciens enregistrements `A`, `AAAA` ou `CNAME` de `@` et `www` qui pointent ailleurs. Si Vercel affiche d'autres valeurs dans Domains, ce sont elles qui comptent.

La propagation prend de quelques minutes à quelques heures. Le certificat HTTPS se crée tout seul. Vercel indique « Valid Configuration » quand tout est en place.

## Avant la mise en ligne

- [ ] Renseigner les liens `social` dans `src/data/site.ts`.
- [ ] Créer la boîte `hello@eliotluca.com` (ou changer `email`) et vérifier qu'elle reçoit bien.
- [ ] Relire `record` et `education` : ajouter dates et noms de fonds seulement si tu veux les rendre publics.
- [ ] Mettre à jour ORBES après la clôture du tirage du 11 octobre 2026 : `status` et `facts` dans `src/content/work/orbes.md`, le texte de cette page, et l'entrée ORBES de `now` dans `src/data/site.ts`.
- [ ] Vérifier les chiffres de THE ENTITY (`src/content/work/the-entity.md`) contre joinentity.com le jour du lancement.
- [ ] Relire chaque texte et passer `draft: false` sur ceux à publier.
- [ ] Mettre à jour la page /now (`now.updated`) le jour du lancement.
- [ ] Après la mise en ligne : tester un lien du site dans LinkedIn ou iMessage pour voir l'aperçu, et ajouter `https://eliotluca.com/sitemap-index.xml` dans Google Search Console.

## Repères

| Chemin | Contenu |
| --- | --- |
| `src/pages/` | Les pages du site. |
| `src/content/writing/` | Les textes. |
| `src/content/work/` | Les ventures et projets. |
| `src/data/site.ts` | Tes informations personnelles. |
| `src/styles/global.css` | Couleurs, typographie, styles partagés. |
| `src/lib/og.ts` | Les images de partage (1200 × 630), générées au build. |
| `public/favicon.svg` | L'icône (un E capitale). Après modification, `node scripts/icons.mjs` régénère `apple-touch-icon.png`. |
