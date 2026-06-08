# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Educational web app demonstrating the AES-CBC Padding Oracle Attack vs AES-CTR mode. Built with Flask (Python) + a single-file vanilla JS frontend.

## Commands

```bash
# Install dependencies
pip install flask cryptography

# Run the dev server (port 5000)
python app.py
```

No build step, no test runner configured yet. The app is entirely served by Flask.

## Architecture

```
app.py        — Flask routes only; imports from crypto.py; CORS enabled
crypto.py     — All AES logic: CBC encrypt/decrypt, CTR encrypt/decrypt, PKCS#7 padding
index.html    — Single-file frontend served by Flask at GET /; all JS inline
```

**Data flow:** Flask serves `index.html` at `GET /`. The page talks to the API via `fetch()` JSON. All byte serialization between client and server is **hex only** — no base64 anywhere.

## API endpoints

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/encrypt` | `{ message }` | `{ ciphertext: "<hex IV+CT>" }` |
| POST | `/paddingOracle` | `{ ciphertext: "<hex>" }` | 200 (padding valid) / 403 (invalid) |
| POST | `/decryptCbc` | `{ ciphertext: "<hex>" }` | `{ plaintext }` |
| POST | `/encryptCtr` | `{ message }` | `{ ciphertext: "<hex nonce+CT>" }` |
| POST | `/decryptCtr` | `{ ciphertext: "<hex>" }` | `{ plaintext }` |

## Crypto layer (`crypto.py`)

- Uses `cryptography` library hazmat primitives (`cryptography.hazmat.primitives.ciphers`)
- PKCS#7 padding is implemented **manually** (not via `cryptography`'s `PKCS7` padding class) to make the logic visible
- IV/nonce generated with `os.urandom(16)`
- CBC key and CTR key are module-level constants (random at startup, in-memory only)
- The padding oracle endpoint calls only the padding validation part of decrypt — it must **not** leak timing or error details beyond the HTTP status code

## Frontend (`index.html`)

Three sections in order: **CBC Demo → Attack → CTR Demo**

**Attack logic (pure JS, no crypto libs):**
- Reads hex ciphertext from the CBC Demo section
- Splits into 16-byte blocks
- For each block, recovers plaintext byte by byte via `/paddingOracle` queries
- The attack mutates `C[i-1]` to force valid padding and XOR-recovers the intermediate value, then XOR with original `C[i-1]` to get plaintext
- Live log: current block, current byte index, total oracle queries, recovered bytes so far

## Conventions

- **Language:** all identifiers, endpoints, JS variables/functions → English camelCase
- **Comments:** French only, no emoji
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`)
- **Routing vs crypto:** keep them strictly separated — `app.py` must not contain cipher logic, `crypto.py` must not import Flask

## UI

- Dark terminal/hacker aesthetic
- Monospace font: JetBrains Mono or Fira Code loaded from Google Fonts
- Real-time attack log with a streaming feel (append lines as each byte is recovered)
- Visual diff between the original message and the recovered plaintext after attack completes
