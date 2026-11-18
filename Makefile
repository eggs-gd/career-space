# SonarQube (docs/sonarqube.md of eggs-gd/.github).
# `make sonar` is the one command: tests with coverage, the scan, the quality gate. It runs in the
# SonarQube workflow (.github/workflows/sonarqube.yml of eggs-gd/.github), and by hand on a checkout
# to see the findings before a push.
# `npm run coverage` is the repository's own script: it runs the tests and writes coverage/lcov.info
# with the paths of the sources the scanner reads (the .ts files, not their compiled output; where
# tests run from a build, that takes source maps).
# SONAR_GATE=false publishes the report without waiting for the gate.
# SONAR_SCOPE on the command line is what the analysis is of, as the workflow knows it from the event
# (empty: the default branch); without it, scripts/sonar-scope says it for the checkout.
SONAR_GATE ?= true

.PHONY: sonar
sonar:
	@env=./.env; [ -f $$env ] || env="$$(git rev-parse --path-format=absolute --git-common-dir)/../.env"; \
	set -a; [ ! -f "$$env" ] || . "$$env"; set +a; \
	test -n "$$SONAR_HOST_URL" && test -n "$$SONAR_TOKEN" || { echo 'sonar: set SONAR_HOST_URL and SONAR_TOKEN (.env)' >&2; exit 1; }; \
	$(if $(filter command line,$(origin SONAR_SCOPE)),scope='$(SONAR_SCOPE)',scope=$$(scripts/sonar-scope) || exit 1); \
	echo "sonar: $${scope:-main branch}"; \
	npm run coverage && \
	sonar-scanner -Dsonar.qualitygate.wait=$(SONAR_GATE) $$scope
