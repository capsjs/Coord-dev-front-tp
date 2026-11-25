# Runbook d’exploitation — CoordEvents

**Projet :** CoordEvents — React / Vite, API Express 5 (Node.js 22), MySQL 8.4, Docker Compose  
**Emplacement recommandé :** `docs/runbook.md`  
**Périmètre :** environnement Docker Compose du dépôt. Ce document ne décrit pas un hébergement de production distant non présent dans le dépôt.  
**Pré-requis :** Git, Docker + Compose, `make`, `curl`, Node.js 22 et npm pour les tests locaux. Exécuter les commandes à la **racine du dépôt**, sauf indication contraire.

## 1. Accès et configuration

| Composant | Accès local |
|---|---|
| Interface web | http://localhost:8080 |
| API | http://localhost:3000/api |
| Santé API | http://localhost:3000/api/health |
| Swagger | http://localhost:3000/api/docs |
| MySQL (hôte) | localhost:3307 |

Configuration : copier `.env.example` en `.env` puis personnaliser les variables. **Ne jamais versionner `.env` ni des secrets réels.** En dehors des démonstrations, remplacer `JWT_SECRET`, les mots de passe MySQL et administrateur, et désactiver `SEED_DEMO`. La variable `CORS_ORIGIN` doit correspondre à l’origine du navigateur.

```bash
cp .env.example .env
# Modifier .env avec les paramètres adaptés
```

## 2. Déployer une version

**Avant de commencer :** disposer d'une branche validée (PR examinée, CI verte), conserver le SHA de la version actuellement déployée, vérifier les sauvegardes et prévoir une interruption éventuelle.

```bash
# Vérifier le dépôt et noter la version précédente
git status
git rev-parse --short HEAD

# Sur un environnement de déploiement fondé sur main
git switch main
git pull --ff-only origin main

# Valider la configuration et reconstruire/démarrer les trois services
docker compose config -q
make up

# Contrôles immédiats
make ps
curl -fsS http://localhost:3000/api/health
```

**Vérifications fonctionnelles :** ouvrir http://localhost:8080, consulter la liste, tester une connexion et les opérations autorisées selon les rôles. Ne pas utiliser les comptes de démonstration en production. Contrôler les logs avec `docker compose logs --tail=100 backend`.

**Tests avant validation :** l'API doit être démarrée pour les tests d'intégration backend.

```bash
make test
(cd backend && npm run matrix:check)
(cd frontend && npm ci && npm run lint && npm run test:run && npm run build)
```

Les workflows GitHub Actions `CI Back`, `CI Front` et `CI Contrat d'API` complètent ces contrôles en PR selon les fichiers modifiés. Ils ne constituent **pas**, dans ce dépôt, un déploiement automatique de l'application vers un serveur public.

## 3. Redémarrer

| Besoin | Commande | Conséquence |
|---|---|---|
| Redémarrer seulement l’API | `make restart` | Pas de reconstruction de l'image |
| Recompiler et relancer l’API modifiée | `make build` | Prend en compte les changements de `backend/src` |
| Reconstruire toute l’application | `make up` | Reconstruit et relance front, back et DB selon les besoins |
| Arrêter sans effacer les données | `make down` | Volume MySQL conservé |
| Relancer après arrêt | `make up` | Redémarre les services |

**Attention :** `make reset` exécute `docker compose down -v` et **supprime les données MySQL** du volume. Ne jamais l'utiliser pour diagnostiquer ou redémarrer une installation contenant des données à préserver.

## 4. Revenir en arrière (rollback)

### 4.1 Rollback du code — sans effacer la base

Le rollback est basé sur un **SHA Git connu et testé**. Avant toute opération, noter le SHA actuel (`git rev-parse HEAD`) et conserver une sauvegarde de la base.

```bash
# Depuis la racine, après vérification que l'arbre de travail est propre
git status
# Renseigner ici le SHA précédemment validé, à la place du texte entre chevrons
git switch --detach SHA_PRECEDENT
make up
make ps
curl -fsS http://localhost:3000/api/health
```

Tester ensuite les fonctionnalités essentielles. Un `git switch --detach` place volontairement le dépôt en HEAD détachée : c'est acceptable pour un rollback temporaire, **ne pas faire de nouveaux commits dans cet état**. Pour rétablir la version actuelle après diagnostic :

```bash
git switch main
git pull --ff-only origin main
make up
```

**Limite importante :** revenir au code précédent **ne restaure pas automatiquement le schéma ni les données MySQL**. Si une nouvelle version modifie la base de façon incompatible, préparer une procédure de migration inverse ou de restauration testée ; ne pas exécuter un rollback aveugle sur des données réelles.

### 4.2 Sauvegarde SQL avant une opération risquée

```bash
mkdir -p backups
# Le fichier généré contient des données potentiellement sensibles : le garder hors Git.
docker compose exec -T db sh -c 'exec mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' > backups/events-avant-deploiement.sql
```

Vérifier que le fichier n'est pas vide et le conserver en lieu sécurisé. Une restauration écrase ou modifie les données présentes : **à effectuer uniquement après validation explicite, dans une fenêtre d'intervention et sur une sauvegarde vérifiée**.

## 5. Diagnostiquer un incident

**Séquence de diagnostic :**

1. Identifier le symptôme, l'heure, la dernière PR/le dernier SHA déployé et son périmètre (front, API, base, authentification).
2. Vérifier l'état des services : `make ps` et `docker compose ps`.
3. Vérifier l’API : `curl -i http://localhost:3000/api/health`.
4. Consulter les journaux : `docker compose logs --tail=100 backend`, puis `docker compose logs --tail=100 db` ; pour le front : `docker compose logs --tail=100 frontend`.
5. Contrôler la configuration résolue : `docker compose config` **sans divulguer ses secrets** ; vérifier les ports, variables d'environnement, état du disque et statut de MySQL.
6. Reproduire le défaut ; noter le code HTTP, le chemin appelé et le message JSON `{ "error": "..." }` sans conserver de jeton ni de mot de passe dans un ticket.
7. Après correction, reconstruire si nécessaire (`make build` ou `make up`) puis lancer `make test` et les tests frontend.
8. Enregistrer l'incident, le SHA correctif, la PR et la preuve de validation dans le ticket de suivi.

| Symptôme | Vérification / action |
|---|---|
| Le front ne répond pas | `docker compose ps frontend` ; logs frontend ; port `8080` disponible |
| API indisponible | `make health` ; logs backend ; port `3000` disponible |
| API démarre mal | Santé DB (`docker compose ps db`) ; logs de connexion ; cohérence de `.env` |
| HTTP 401 | Jeton absent, invalide ou expiré ; refaire une connexion et vérifier `JWT_SECRET` |
| HTTP 403 | Vérifier le rôle et la propriété de l'événement, sans contourner les contrôles |
| Tests réussissent sur le code, pas sur l'API | Reconstruire Docker avec `make up` : une image ancienne peut encore tourner |
| Erreur de contrat OpenAPI | Vérifier `backend/openapi.yaml`, `npm run lint:api` et la réponse réellement envoyée |
| CI rouge | Ouvrir l'exécution GitHub Actions correspondante ; corriger lint, tests, couverture ou matrice avant fusion |

**Escalade :** si la cause reste incertaine ou que des données sont menacées, stopper l'opération risquée, prévenir l'équipe et conserver logs, SHA, heure et résultat des tests. Ne pas détruire les volumes pour « réparer » un incident.

## 6. Validation et traçabilité des changements

La source des critères et des stories est `docs/exigences.json`. Les tests comportent des tags tels que `[F02.3]`. La matrice `docs/matrice-tracabilite.md` est générée à partir de ces sources et **ne doit pas être éditée à la main**.

```bash
(cd backend && npm run matrix)
(cd backend && npm run matrix:check)
```

**État du dépôt à la rédaction :** la matrice générée relie exigence → story Jira (par section) → tests backend/frontend → version de contrat API. **Le chaînage commit/PR par exigence n'est pas encore fourni automatiquement**. Pour satisfaire intégralement le critère « exigence → story → test → commit/PR », il faudra compléter la source de traçabilité (ou ajouter un registre connexe versionné), puis faire évoluer `backend/scripts/matrice.js` pour produire les colonnes **Commit** et **PR**, et les faire contrôler par `matrix:check`.

Format cible (exemple de structure, identifiants de commit/PR à renseigner uniquement après vérification) :

| Exigence | Story Jira | Test lié | Commit | PR |
|---|---|---|---|---|
| F02.3 | SCRUM-16 | `backend/test/events.test.js` — refus 403 | À vérifier | À vérifier |
| F08b.2 | SCRUM-20 | `backend/test/unit/eventAccess.test.js` — contrôle d'accès | À vérifier | À vérifier |

**Procédure de validation d'une story :** lier les tests aux exigences par identifiant ; mettre à jour et vérifier la matrice ; inclure la référence `SCRUM-XX` dans la PR ; vérifier les checks CI ; noter le SHA du commit fusionné et le numéro de PR ; reporter ces références dans la source qui alimente la matrice. Les exigences du Sprint 3 doivent rester indiquées comme non livrées tant que leur implémentation et leurs tests ne sont pas présents.

## 7. Checklist de clôture d'un déploiement

- [ ] SHA, branche et PR de la version consignés
- [ ] CI GitHub Actions réussie selon les workflows applicables
- [ ] Configuration et secrets vérifiés (sans divulgation)
- [ ] Sauvegarde pertinente vérifiée avant modification à risque
- [ ] `make up`, `make ps` et contrôle `/api/health` réussis
- [ ] Parcours front, login et autorisations testés
- [ ] Tests backend/frontend et `matrix:check` réussis
- [ ] Procédure de retour arrière et SHA précédent connus
- [ ] Compte rendu de mise en service ou d'incident ajouté à la story/PR

---

*Références de dépôt : `README.md`, `Makefile`, `docker-compose.yml`, `.env.example`, `backend/package.json`, `frontend/package.json`, `docs/exigences.json`, `docs/matrice-tracabilite.md` et `.github/workflows/`. Adapter les commandes et valider la sauvegarde/restauration avant toute utilisation dans un environnement de production réel.*
