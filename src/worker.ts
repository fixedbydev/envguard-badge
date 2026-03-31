/**
 * Cloudflare Worker that generates SVG badges and serves a score landing page.
 *
 * Routes:
 *   GET /badge/:score  → SVG badge image
 *   GET /badge/passing → green passing badge
 *   GET /badge/failing → red failing badge
 *   GET /score?s=78    → HTML score landing page
 *   GET /              → redirect to GitHub repo
 */

function getColor(score: number): string {
  if (score >= 90) return '#4c1';
  if (score >= 70) return '#a3c51c';
  if (score >= 50) return '#fe7d37';
  return '#e05d44';
}

function getTier(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs work';
  return 'At risk';
}

function generateBadgeSVG(label: string, value: string, color: string): string {
  const labelWidth = label.length * 6.5 + 12;
  const valueWidth = value.length * 6.5 + 12;
  const totalWidth = labelWidth + valueWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalWidth}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>`;
}

function generateScorePage(score: number): string {
  const color = getColor(score);
  const tier = getTier(score);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>envguard score: ${score}/100</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{background:#050508;color:#c8c8d0;font-family:'IBM Plex Mono',monospace;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px}
.score{font-size:120px;font-weight:700;color:${color};line-height:1;text-shadow:0 0 60px ${color}44}
.out-of{font-size:24px;color:#5a5a6e;margin-top:4px}
.tier{font-size:18px;color:${color};margin-top:16px;text-transform:uppercase;letter-spacing:4px}
.divider{width:60px;height:1px;background:#1a1a25;margin:32px 0}
.checks{max-width:480px;width:100%;text-align:left}
.checks h3{font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#333345;margin-bottom:16px}
.check{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1a1a25;font-size:13px;color:#5a5a6e}
.check span:last-child{color:#333345}
.cta{margin-top:40px}
.cta a{display:inline-block;padding:12px 32px;border:1px solid #f0a000;color:#f0a000;text-decoration:none;font-family:inherit;font-size:13px;letter-spacing:1px;text-transform:uppercase;transition:all 0.15s}
.cta a:hover{background:#f0a000;color:#050508}
.footer{margin-top:48px;font-size:11px;color:#333345}
</style>
</head>
<body>
<div class="score">${score}</div>
<div class="out-of">/ 100</div>
<div class="tier">${tier}</div>
<div class="divider"></div>
<div class="checks">
<h3>What we check</h3>
<div class="check"><span>Schema exists</span><span>15 pts</span></div>
<div class="check"><span>All keys in schema</span><span>15 pts</span></div>
<div class="check"><span>.env.example in sync</span><span>10 pts</span></div>
<div class="check"><span>No raw process.env</span><span>15 pts</span></div>
<div class="check"><span>No secrets in example</span><span>10 pts</span></div>
<div class="check"><span>.env in .gitignore</span><span>10 pts</span></div>
<div class="check"><span>Pre-dev script</span><span>5 pts</span></div>
<div class="check"><span>No empty values</span><span>10 pts</span></div>
<div class="check"><span>No duplicate keys</span><span>5 pts</span></div>
<div class="check"><span>Consistent naming</span><span>5 pts</span></div>
</div>
<div class="cta"><a href="https://www.npmjs.com/package/@stacklance/envguard-core">Get started with envguard</a></div>
<div class="footer">Run <code>npx env-guard doctor</code> to get your score</div>
</body>
</html>`;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Badge endpoint
    if (path.startsWith('/badge/')) {
      const param = path.slice(7);

      if (param === 'passing') {
        return new Response(generateBadgeSVG('env-guard', 'passing', '#4c1'), {
          headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' },
        });
      }

      if (param === 'failing') {
        return new Response(generateBadgeSVG('env-guard', 'failing', '#e05d44'), {
          headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' },
        });
      }

      const score = parseInt(param, 10);
      if (!isNaN(score) && score >= 0 && score <= 100) {
        const color = getColor(score);
        const svg = generateBadgeSVG('env-guard', \`\${score}/100\`, color);
        return new Response(svg, {
          headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' },
        });
      }

      return new Response('Invalid score', { status: 400 });
    }

    // Score landing page
    if (path === '/score') {
      const scoreParam = url.searchParams.get('s');
      const score = scoreParam ? parseInt(scoreParam, 10) : 0;
      if (isNaN(score) || score < 0 || score > 100) {
        return new Response('Invalid score', { status: 400 });
      }
      return new Response(generateScorePage(score), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Root redirect
    if (path === '/') {
      return Response.redirect('https://github.com/fixedbydev/envguard', 302);
    }

    return new Response('Not Found', { status: 404 });
  },
};
