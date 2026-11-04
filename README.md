# VivaLab · Encrypted Final Anaesthesia Viva PWA

Upload the **contents** of this folder to your GitHub repository root, then enable GitHub Pages for the `main` branch, root directory. Open the HTTPS site from a supported browser and choose **Install app**. Let the first installation finish loading and caching the protected resources before using it offline.

The question banks, their embedded images, and both source PDFs are encrypted at rest with AES-256-GCM. The key is derived from the access password using PBKDF2-SHA-256 (420,000 iterations; unique random salt). An authenticated verification blob checks the password before the books are decrypted. All questions and PDF files are decrypted in browser memory after successful unlock. Progress and personal notes are encrypted locally under the same key. The shell (HTML/CSS/app JavaScript), manifest, and icons are public, as all files are hosted statically.

Changing the password requires regenerating the encrypted content with a new key. Existing progress encrypted with the previous password must first be exported while unlocked and re-imported after re-encryption; it cannot be unlocked using the new key.

This app is intended for HTTPS hosting or localhost. Opening `index.html` directly from Android Downloads (`content://` or `file://`) is not supported for the encrypted PWA. GitHub Pages provides HTTPS.

The app retains topic browsing, one-by-one or continuous questions, per-question reveal or reveal-all, saved sessions, search, offline caching, and source-page opening (decrypted on demand). The navigation footer is collapsed initially; expand it to select questions and display preferences.

**Important rights note:** Password protection and encryption do not confer redistribution rights for copyrighted books. Do not publish the included textbook assets or their substantial reproduced content unless you have the necessary permissions. Encryption limits casual access but does not prevent copying after the content has been unlocked, and a shared fixed password is vulnerable to offline guessing.

## Unlock troubleshooting (v2)

- Enter the agreed password, with no surrounding spaces. This release also accepts case variations.
- On a fresh HTTPS site, the correct password decrypts `vault/check.enc` before loading both large encrypted question banks. The screen now reports which stage is in progress.
- If unlocking fails, use **Reset offline cache and reload**. This removes PWA cache files, leaves encrypted revision progress intact, and performs one online fresh reload. Do not use Android's **Clear storage / Clear data** if you need to keep your saved progress.
- If the failure message says *Saved progress could not be decrypted*, preserve the device data; cache reset alone will not repair a damaged progress record.
- The site must finish loading both question banks before the main interface appears.