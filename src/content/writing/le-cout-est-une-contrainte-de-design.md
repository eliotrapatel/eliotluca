---
title: "Le coût est une contrainte de design"
description: "Raisonner en coût par utilisateur et par requête avant de penser fonctionnalités : la frugalité comme méthode de conception."
date: 2026-09-14
lang: fr
kind: essay
draft: true
---

Une facture d'hébergement en dit plus long sur une architecture que n'importe quel schéma.

Quand je lis la facture d'un projet, je vois les décisions qui ont été prises, et surtout celles qui ne l'ont pas été : la base de données surdimensionnée par précaution, le service managé ajouté parce qu'il était à un clic, le modèle le plus cher appelé pour reformuler une date. Le coût est le relevé le plus honnête d'une conception.

## Compter à l'envers

La plupart des produits se conçoivent dans le même ordre : la liste des fonctionnalités, puis le choix des outils, puis la découverte de la facture. Je fais l'inverse. Avant de dessiner un écran, je pose deux chiffres : ce que me coûte un utilisateur par mois, ce que me coûte une requête.

Ces deux unités changent la nature du débat. Chaque fonctionnalité devient une ligne qui ajoute tant de centimes par utilisateur, en échange de tant de valeur perçue. Une page qui interroge cinq services à chaque chargement coûte à peu près cinq fois ce qu'elle pourrait coûter, et cela se voit tout de suite. Quand on raisonne par unité, les arbitrages deviennent visibles, et ce qui est visible se discute.

Ce réflexe me vient de la finance. En private equity, on ne regarde jamais un chiffre d'affaires sans regarder ce qu'il coûte à produire, et une marge se construit ligne par ligne. Un logiciel n'échappe pas à cette règle au motif que ses coûts s'affichent dans une console plutôt que dans une usine.

## Ce qu'un petit serveur sait faire

Un ordre de grandeur suffit à recadrer beaucoup de projets. Un serveur modeste, de ceux qu'on loue une dizaine d'euros par mois, peut servir des centaines d'utilisateurs payants si l'architecture est sobre. Cela tient à des choix simples : servir des pages statiques ou mises en cache, garder une seule base de données bien indexée, faire le travail lourd en tâches planifiées plutôt qu'à chaque clic. Une application construite ainsi demande très peu de machine.

La facture grimpe rarement à cause du trafic. Elle grimpe avec l'accumulation de briques ajoutées au cas où : une file de messages pour trois événements par heure, un cluster pour un service qui tiendrait dans un seul processus, des environnements de test qui tournent la nuit sans personne pour s'en servir. Chaque brique a un coût fixe, un coût de maintenance et un coût d'attention. Le troisième est le plus cher.

Ce site en donne un petit exemple. Il est statique, sans base de données ni script de suivi, et son hébergement ne coûte presque rien. Publier un texte consiste à ajouter un fichier. Je n'ai rien sacrifié en le construisant ainsi : je n'avais besoin de rien d'autre.

## Le token est une ligne de coût

Avec l'IA, la tentation est de traiter le modèle comme une boîte noire facturée à l'usage et de découvrir le montant en fin de mois. C'est une erreur de comptable autant que d'ingénieur. Un token est une unité de coût comme une autre, et trois règles suffisent à le maîtriser.

Mettre en cache la partie stable du prompt. Dans la plupart des applications, l'essentiel du contexte envoyé au modèle ne change pas d'une requête à l'autre : les instructions, le format attendu, les documents de référence. Les fournisseurs proposent des mécanismes de cache pour cette partie fixe, facturée nettement moins cher quand elle est réutilisée. Placer le stable en tête et le variable à la fin est une décision d'architecture à part entière.

Envoyer chaque requête au plus petit modèle capable d'y répondre. Classer un message, extraire un champ, reformuler une phrase : un petit modèle le fait très bien, pour une fraction du prix. Le grand modèle se réserve aux tâches qui exigent un vrai raisonnement. Un routeur, même rudimentaire, qui trie les requêtes avant de les envoyer, peut changer l'ordre de grandeur de la facture.

Donner un budget à chaque requête. Un plafond de tokens en sortie, un nombre maximal d'appels pour un agent, un délai au-delà duquel on abandonne. Sans budget, une boucle mal écrite peut coûter en une nuit ce que le produit rapporte en un mois. Avec un budget, le pire cas est connu d'avance, et un pire cas connu se provisionne.

Aucune de ces règles n'est sophistiquée. Elles demandent seulement de traiter le coût comme une donnée d'entrée du système, au même titre que la latence ou la justesse des réponses.

## La seule question avant d'acheter

Avant d'acheter quoi que ce soit, un outil, un abonnement, une machine, je me pose une seule question : de quoi ai-je réellement besoin ? Ni ce dont j'aurais besoin si le projet décuplait, ni ce qu'utilisent des entreprises cent fois plus grandes. Ce dont j'ai besoin maintenant, pour le problème que j'ai maintenant.

La question paraît évidente. Elle est rarement posée, parce qu'acheter donne l'impression d'avancer. S'abonner à un outil procure le sentiment de décider, alors que cela repousse souvent la décision qui compte : savoir ce que l'on construit. Le jour où le besoin grandit, on achète, et ce jour-là on sait précisément quoi.

## Ce que la contrainte produit

Une contrainte de coût oblige à comprendre ce que l'on fait. Pour servir beaucoup avec peu, il faut savoir où passe chaque requête, ce que chaque composant apporte, ce qui peut être calculé une fois plutôt que mille. Un système conçu sous contrainte est plus simple, et un système simple tombe moins souvent en panne, se répare plus vite et s'explique en une page.

Les objets obéissent à la même logique. En joaillerie, le prix de l'or, le poids de la pièce et les heures d'atelier pèsent sur chaque dessin avant même que la forme soit arrêtée. Ces limites donnent au dessin sa précision.

Reste un malentendu à écarter. Le but n'est pas d'être bon marché, c'est d'obtenir le plus de valeur possible pour chaque euro dépensé, valeur mesurée du point de vue de celui qui utilise le système. Un produit bon marché qui ne sert à rien coûte trop cher, quel que soit son prix. Et parfois, maximiser la valeur par euro veut dire dépenser davantage sur la seule ligne qui compte, précisément parce qu'on a refusé de dépenser sur toutes les autres.

Une facture courte se lit en une minute. Elle dit exactement ce qu'on a choisi de payer, et pourquoi.
