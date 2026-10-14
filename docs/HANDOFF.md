# Source handoff

1. Extract `CampusLoop-Final.zip` into a new folder. Open the enclosed `CampusLoop` folder in your editor or terminal.
2. Install Node.js 22.13+ (Node 24 was used for validation).
3. Run `npm ci`, then `npm run setup`, then `npm run dev`.
4. Open http://127.0.0.1:5173. No login or API credentials are needed.
5. Stop the server with Ctrl+C when finished.

The ZIP has no Git history, remote repository, hosting account or personal credentials. Local data and dependencies are created on your computer. The app is a shared fictional demo on that computer, not separate authenticated student accounts.

## Push from your account

Create an empty repository under your own Git provider account. From the extracted source directory:

```sh
git init -b main
git add .
git status --short
git commit -m "Add weekly ride matching and booking"
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

Replace `YOUR_REPOSITORY_URL` with your own repository URL. Authenticate using your own Git account when prompted. Inspect `git status` before committing: `.dev.vars`, `.env` files, `.wrangler`, `node_modules`, `dist` and ZIP files under `outputs` should not be staged. The included ignore rules cover these paths. Do not force-add ignored files.

## Reviewer access

Send the clean ZIP or your repository link with the README instructions. A repository link is source access, not a hosted preview. This edition does not publish a website.

Before recording, follow `docs/DEMO.md` and reset the sample data.
