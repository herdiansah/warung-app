# Security Policy

## Supported version

Security fixes are applied to the latest commit on `main`.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Report it privately through [@herdiansah](https://github.com/herdiansah) on GitHub, including:

- a description of the issue and potential impact;
- reproducible steps or a proof of concept;
- affected files, versions, or configuration; and
- suggested mitigation, if available.

The maintainer will acknowledge the report, investigate it, and coordinate a fix and disclosure timeline. Please do not disclose the issue publicly until a fix is available.

## Deployment guidance

Use a unique JWT secret of at least 32 characters, configure the initial admin account through environment variables, keep the server bound to loopback unless protected by a reverse proxy, and never commit `.env` files or production database dumps.
