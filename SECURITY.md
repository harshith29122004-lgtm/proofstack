# Security Policy

## Scope and current deployment status

ProofStack is an early-stage, local-first prototype. It is not currently presented as a hardened multi-user or public-internet service. Do not expose the API directly to the public internet or use it to process confidential or sensitive documents.

Before any shared or production deployment, the project needs a security review covering authentication and authorization, upload isolation, parser resource limits, data-at-rest protection, request limits, and operational logging.

## Reporting a vulnerability

Please do not disclose vulnerabilities in public issues or include exploit details in public discussions.

Use GitHub's private vulnerability reporting feature for this repository if it is available. If it is not available, contact the maintainer privately through the GitHub profile and include:
- A concise description of the affected component.
- Steps to reproduce using synthetic or non-sensitive data.
- The potential impact.
- Any suggested mitigation.

Please allow reasonable time for investigation and a fix before public disclosure.

## Secrets and sensitive data

Never commit API keys, passwords, access tokens, real user documents, or private workspace data. Use synthetic samples when reporting issues. Revoke and rotate any credential that may have been exposed.
