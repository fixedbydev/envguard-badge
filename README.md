# envguard-badge

Cloudflare Worker that generates SVG badges and score landing pages for envguard.

## Endpoints

| Route | Description |
| --- | --- |
| `GET /badge/:score` | SVG badge for a score (0-100) |
| `GET /badge/passing` | Green "passing" badge |
| `GET /badge/failing` | Red "failing" badge |
| `GET /score?s=78` | Score landing page |
| `GET /` | Redirect to GitHub repo |

## Usage in README

```markdown
![env-guard score](https://envguard-badge.your-worker.workers.dev/badge/92)
```

## Deploy

```bash
npm install
npx wrangler deploy
```

## License

MIT
