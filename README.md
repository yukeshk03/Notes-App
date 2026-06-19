# Notes

A minimal, private, markdown-first notes and to-do workspace that runs entirely in your browser. No accounts, no server, no tracking — everything is stored in this browser's local storage.

## Features

- **Notes** — Markdown editor with a live Preview mode, slash (`/`) command menu, formatting toolbar, clickable checklists, tags, notebooks (categories), pinning, word count, and per-note Markdown export.
- **Notebooks** — Organize notes into notebooks with a grid or Trello-style board view; rename or delete notebooks from Settings.
- **To-Do** — Calendar and Kanban views, draggable tasks (between days and between stages), reminders, and customizable Kanban stages.
- **Trash** — Deleted notes and tasks are recoverable for 30 days before being purged automatically.
- **Command palette** — `Ctrl/Cmd+K` to jump to any note, task, or view.
- **Backup & restore** — Export everything to a JSON file from Settings, or import a previous backup.
- **Light & dark themes.**

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```
   npm install
   ```
2. Run the app:
   ```
   npm run dev
   ```
3. Open the printed local URL in your browser.

## Deploy to GitHub Pages

This repo includes a ready-to-use GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys automatically.

1. Push this project to a new GitHub repository.
2. In the repo, go to **Settings → Pages**, and under "Build and deployment" set **Source** to **GitHub Actions**.
3. Push to the `main` branch (or run the workflow manually from the **Actions** tab).
4. After it finishes, your app will be live at `https://<your-username>.github.io/<repo-name>/`.

Every future push to `main` redeploys automatically.

## Build

```
npm run build
```

Outputs a static site to `dist/`, deployable to any static host (Vercel, Netlify, GitHub Pages, etc.) — no backend required.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd + K` | Open quick search |
| `Ctrl/Cmd + N` | New note |
| `Ctrl/Cmd + F` | Focus the notes search box |
| `Ctrl/Cmd + B` / `I` / `U` | Bold / Italic / Underline selection (in editor) |
| `Ctrl/Cmd + K` (in editor) | Insert link |
| `/` at the start of a line | Open the block menu in the editor |
| `Esc` | Close the open panel, dialog, or note |

## Data & privacy

All notes and tasks are stored only in `localStorage` in your browser. Nothing is sent to a server. This also means your data is tied to one browser on one device — use **Settings → Data → Export backup** periodically, or before clearing your browser data or switching devices.

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS v4, `react-markdown` + `remark-gfm` for the live preview, and `date-fns` for date handling.
