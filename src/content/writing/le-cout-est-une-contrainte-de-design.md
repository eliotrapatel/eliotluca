---
title: "Le coût est une contrainte de design"
description: "Avant de construire quoi que ce soit, je pose deux chiffres : ce que coûte un utilisateur par mois et ce que coûte une requête. Tout le reste en découle."
date: 2026-09-14
lang: fr
kind: essay
draft: false
---

Avant de construire quoi que ce soit, je pose deux chiffres : ce que me coûte un utilisateur par mois, et ce que me coûte une requête. La plupart des produits se font dans l'ordre inverse. On dresse la liste des fonctionnalités, on choisit les outils, puis on découvre la facture. Je préfère partir de la facture, parce qu'elle oblige à comprendre ce que l'on construit.

Raisonner par unité change la discussion. Une fonctionnalité cesse d'être une bonne ou une mauvaise idée : elle devient une ligne qui ajoute quelques centimes par utilisateur, en échange d'une valeur que l'on peut estimer. Une page qui interroge cinq services à chaque chargement coûte à peu près cinq fois ce qu'elle pourrait coûter. Une fois que c'est écrit noir sur blanc, on peut décider si cela en vaut la peine.

C'est d'ailleurs ainsi qu'une facture grimpe. Rarement à cause du trafic, presque toujours à cause de ce que l'on a ajouté « au cas où » : la base de données surdimensionnée par prudence, le service pris parce qu'il était à un clic, la file de messages installée pour trois événements par heure. Chacune de ces briques a un prix, demande de l'entretien et occupe de l'attention, ce qui finit par coûter plus cher que le reste.

Un serveur modeste, de ceux que l'on loue une dizaine d'euros par mois, peut servir des centaines d'utilisateurs payants si l'on s'en tient à quelques choix simples : des pages mises en cache, une seule base de données bien indexée, le travail lourd fait la nuit plutôt qu'à chaque clic. Ce site en est un petit exemple. Il est statique, sans base de données, et son hébergement ne coûte presque rien.

L'intelligence artificielle rend cette discipline plus nécessaire encore, parce que chaque appel à un modèle est facturé selon la quantité de texte traitée. Trois habitudes suffisent à garder la main.

La première est de mettre en cache la partie du contexte qui ne change pas d'une requête à l'autre, c'est-à-dire les instructions et les documents de référence. Les fournisseurs la facturent alors beaucoup moins cher.

La deuxième est d'envoyer chaque requête au plus petit modèle capable d'y répondre. Classer un message ou extraire une date ne demande pas le modèle le plus puissant, et l'écart de prix entre les deux est considérable.

La troisième est de fixer un plafond à chaque requête, pour la longueur de la réponse comme pour le nombre d'appels, afin qu'une boucle mal écrite ne coûte pas en une nuit ce que le produit rapporte en un mois.

J'ai fait de ce calcul un petit outil, [Copilot economics](/instruments/copilot-economics), qui montre ce qu'un assistant coûte par utilisateur et la marge qu'il laisse.

Il y a un malentendu à éviter : je ne cherche pas à dépenser le moins possible, je cherche à savoir ce que chaque euro achète. Il m'arrive de dépenser beaucoup sur une seule ligne, celle qui fait la qualité du produit, justement parce que j'ai refusé de dépenser sur toutes les autres.

Je retrouve la même logique dans tout ce que je fais. Un objet se dessine avec son poids et son temps de fabrication en tête, une entreprise s'évalue avec ses marges, un logiciel se conçoit avec son coût par utilisateur. Dans les trois cas, c'est la contrainte qui rend le travail précis.
