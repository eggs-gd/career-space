# Contributing

How a change goes in, and the rule about who writes it, are in the README's "Contributing" section
and in `AGENTS.md`. The organization's defaults apply otherwise:
<https://github.com/eggs-gd/.github/blob/main/CONTRIBUTING.md>.

## SonarQube (optional)

The analysis runs on GitHub: the SonarQube workflow, on the organization's self-hosted runner next
to the maintainer's server, on every pull request and on a push to `main`. Its gate and findings
come as a comment on the pull request. A pull request from a fork runs only after the maintainer
approves it. Nothing to set up for any of that.

`git config core.hooksPath .githooks` turns on the local gate, the **pre-commit** hook: with the
SonarQube CLI (`brew install sonarqube-cli`) installed and the two variables below set, a secrets
scan of the staged files. The hook's Go lint does not apply here (no Go in this repository). A
finding stops the commit.

To see the findings before a push, a maintainer runs the analysis by hand. It needs the
[SonarScanner CLI](https://docs.sonarsource.com/sonarqube-community-build/analyzing-source-code/scanners/sonarscanner)
(`brew install sonar-scanner`), the server's address and a user token. They stay out of the
repository: put them in the environment, or in a git-ignored `.env` at the root.

```bash
SONAR_HOST_URL=http://your-server:9000
SONAR_TOKEN=<a SonarQube user token>
```

```bash
make sonar                    # tests with coverage, the scan; fails on a red quality gate
make sonar SONAR_GATE=false   # send the report without waiting for the gate
```

The setup and the reasons for it are in the organization's
[SonarQube standard](https://github.com/eggs-gd/.github/blob/main/docs/sonarqube.md).
