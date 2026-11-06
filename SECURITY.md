# Security Policy

## Supported versions

ProofStack is an early-stage, local-first prototype. Security fixes are currently applied to the default development branch.

## Reporting a vulnerability

Please do not publish exploitable details, credentials, private documents, or proof-of-concept payloads in a public issue. Use GitHub's private vulnerability reporting for this repository where available. If private reporting is unavailable, contact the maintainer privately through the email listed on the GitHub profile.

Include the affected version/commit, impact, and safe reproduction steps. Allow time for a fix before public disclosure.

## Deployment and data handling

- Keep the API bound to loopback unless you have independently designed and implemented authentication, authorization, and network controls.
- Do not expose this prototype directly to the public internet or use it as a multi-user service.
- Do not upload confidential, regulated, or otherwise sensitive documents to a shared or untrusted machine.
- Workspace documents and extracted text are stored locally in `server/data/workspace.json`; protect that directory and its backups.
- Uploads are held in memory and constrained by file-count, file-size, request-part, and extracted-text limits. These controls reduce resource exposure but are not a substitute for parser sandboxing.
- Treat uploaded files as untrusted input. Keep Node.js and parser dependencies updated.

## Known limitations

The current prototype does not provide user authentication, per-user authorization, encrypted-at-rest storage, parser process isolation, malware scanning, or multi-tenant document isolation. Do not treat it as production-hardened.
