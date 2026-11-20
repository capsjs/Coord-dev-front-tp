COMPOSE := docker compose
API_URL ?= http://localhost:3000

.DEFAULT_GOAL := help
.PHONY: help up down restart build rebuild logs logs-db ps reset test lint install hooks coverage shell db docs health

help: ## Affiche cette aide
	@echo "Commandes disponibles :"
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "} {printf "  \033[36mmake %-10s\033[0m %s\n", $$1, $$2}'

up: ## Démarre MySQL + API + frontend
	$(COMPOSE) up -d --build
	@echo "Attente de l'API..."
	@for i in $$(seq 1 60); do curl -sf $(API_URL)/api/health >/dev/null && break; sleep 1; done
	@curl -sf $(API_URL)/api/health >/dev/null \
		&& echo "API prête : $(API_URL)/api   |   Swagger : $(API_URL)/api/docs   |   Frontend : http://localhost:8080" \
		|| (echo "L'API ne répond pas, voir : make logs" && exit 1)

down: ## Arrête les conteneurs (les données sont conservées)
	$(COMPOSE) down

restart: ## Redémarre l'API
	$(COMPOSE) restart backend

build: ## Reconstruit et relance l'API après une modif du code
	$(COMPOSE) up -d --build backend

rebuild: ## Reconstruit tout sans cache
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d

logs: ## Suit les logs de l'API (Ctrl+C pour quitter)
	$(COMPOSE) logs -f backend

logs-db: ## Suit les logs de MySQL
	$(COMPOSE) logs -f db

ps: ## État des conteneurs
	$(COMPOSE) ps

reset: ## Supprime la base et repart de zéro (comptes de démo recréés)
	$(COMPOSE) down -v
	$(MAKE) up

install: ## Installe les dépendances npm du back (pour les tests / l'éditeur)
	cd backend && npm install

hooks: ## Active le hook pre-commit de l'équipe (à lancer une fois par clone)
	git config core.hooksPath .githooks
	@echo "Hook pre-commit activé : docker-compose.yml et lint vérifiés à chaque commit."

test: ## Lance les tests d'intégration (l'API doit tourner : make up)
	@test -d backend/node_modules || (cd backend && npm install)
	cd backend && API_URL=$(API_URL) npm test

# Les données de couverture sont produites dans le conteneur (chemins /app/src/...) : les tests unitaires
# et le rapport tournent donc dans un conteneur Node qui monte backend/ sur /app, pour que les chemins correspondent.
# --user : les fichiers créés appartiennent à l'utilisateur courant (sinon root sous Linux, notamment en CI).
NODE_IN_APP := docker run --rm --user "$(shell id -u):$(shell id -g)" -v "$(CURDIR)/backend:/app" -w /app node:22-alpine
COMPOSE_COVERAGE := $(COMPOSE) -f docker-compose.yml -f docker-compose.coverage.yml

coverage: ## Mesure la couverture du back (tests d'intégration + unitaires) → backend/coverage/report/index.html
	@test -d backend/node_modules || (cd backend && npm install)
	@# Repart d'une mesure vierge (suppression limitée à backend/coverage).
	$(NODE_IN_APP) node -e "require('fs').rmSync('coverage', { recursive: true, force: true })"
	@# L'API tourne en tant qu'utilisateur « node » dans son conteneur : elle doit pouvoir écrire dans tmp.
	mkdir -p backend/coverage/tmp && chmod 777 backend/coverage backend/coverage/tmp
	$(COMPOSE_COVERAGE) up -d --build db backend
	@echo "Attente de l'API..."
	@for i in $$(seq 1 60); do curl -sf $(API_URL)/api/health >/dev/null && break; sleep 1; done
	cd backend && API_URL=$(API_URL) npm test
	$(NODE_IN_APP) env NODE_V8_COVERAGE=/app/coverage/tmp node --test "test/unit/**/*.test.js"
	@# Arrêt propre (SIGTERM) : Node écrit la couverture à la sortie du processus.
	$(COMPOSE_COVERAGE) stop backend
	$(NODE_IN_APP) node node_modules/c8/bin/c8.js report
	@echo "Rapport HTML : backend/coverage/report/index.html"
	@# Relance l'API normalement (sans mesure de couverture).
	$(COMPOSE) up -d backend >/dev/null

lint: ## Vérifie le code du back (ESLint) et le contrat d'API (Spectral)
	@test -d backend/node_modules || (cd backend && npm install)
	cd backend && npm run lint && npm run lint:api

shell: ## Ouvre un shell dans le conteneur de l'API
	$(COMPOSE) exec backend sh

db: ## Ouvre la console MySQL
	$(COMPOSE) exec db sh -c 'mysql -u"$$MYSQL_USER" -p"$$MYSQL_PASSWORD" "$$MYSQL_DATABASE"'

health: ## Vérifie que l'API répond
	@curl -sf $(API_URL)/api/health && echo || echo "L'API ne répond pas"

docs: ## Ouvre le Swagger dans le navigateur
	@xdg-open $(API_URL)/api/docs >/dev/null 2>&1 || echo "Swagger : $(API_URL)/api/docs"
