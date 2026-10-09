/* ResearchFlow screenshot capture.
   Usage: node scripts/shots.mjs [only-substring...]
   Requires the dev server running on BASE_URL (default http://localhost:5173). */
import puppeteer from 'puppeteer';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'screenshots');
const BASE = process.env.BASE_URL || 'http://localhost:5173';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const USERS = {
  researcher: { name: 'Santhosh Kumar', email: 'santhosh.kumar@researchflow.app', role: 'researcher' },
  supervisor: { name: 'Dr. Meera Nair', email: 'meera.nair@researchflow.app', role: 'supervisor' },
  admin: { name: 'Arjun Patel', email: 'admin@researchflow.app', role: 'admin' },
};

const W = 1440, H = 900;

const SHOTS = [
  { file: '01-landing-light', path: '/', theme: 'light', full: true, scroll: true, wait: 2600, cap: 'Landing — light' },
  { file: '02-landing-dark', path: '/', theme: 'dark', full: true, scroll: true, wait: 2600, cap: 'Landing — dark' },
  { file: '03-landing-mobile-light', path: '/', theme: 'light', w: 390, h: 844, wait: 2200, cap: 'Landing — mobile' },
  { file: '04-login-light', path: '/login', theme: 'light', wait: 1500, cap: 'Login — light' },
  { file: '05-login-dark', path: '/login', theme: 'dark', wait: 1500, cap: 'Login — dark' },
  { file: '06-register-light', path: '/register', theme: 'light', wait: 1500, cap: 'Register — light' },
  { file: '07-otp-light', path: '/otp', theme: 'light', wait: 1200, sessionStore: { rf_pending_email: 'santhosh.kumar@researchflow.app' }, cap: 'OTP verify — light' },
  { file: '08-researcher-dashboard-light', path: '/app', session: 'researcher', theme: 'light', wait: 2500, cap: 'Researcher dashboard — light' },
  { file: '09-researcher-dashboard-dark', path: '/app', session: 'researcher', theme: 'dark', wait: 2500, cap: 'Researcher dashboard — dark' },
  { file: '10-supervisor-dashboard-light', path: '/app', session: 'supervisor', theme: 'light', wait: 2500, cap: 'Supervisor dashboard — light' },
  { file: '11-admin-dashboard-light', path: '/app', session: 'admin', theme: 'light', wait: 2500, cap: 'Admin dashboard — light' },
  { file: '12-project-overview-light', path: '/app/projects/p1', session: 'researcher', theme: 'light', wait: 1800, cap: 'Project overview — light' },
  { file: '13-tasks-kanban-light', path: '/app/projects/p1/tasks', session: 'researcher', theme: 'light', wait: 1600, cap: 'Tasks (Kanban) — light' },
  { file: '14-milestones-light', path: '/app/projects/p1/milestones', session: 'researcher', theme: 'light', wait: 1400, cap: 'Milestones — light' },
  { file: '15-documents-light', path: '/app/projects/p1/documents', session: 'researcher', theme: 'light', wait: 1500, cap: 'Documents — researcher' },
  { file: '16-documents-supervisor-light', path: '/app/projects/p1/documents', session: 'supervisor', theme: 'light', wait: 1500, cap: 'Documents — supervisor (review)' },
  { file: '17-experiments-light', path: '/app/projects/p1/experiments', session: 'researcher', theme: 'light', wait: 1500, cap: 'Experiments — light' },
  { file: '18-findings-light', path: '/app/projects/p1/findings', session: 'researcher', theme: 'light', wait: 1500, cap: 'Findings — light' },
  { file: '19-team-chat-light', path: '/app/projects/p1/team', session: 'researcher', theme: 'light', wait: 1500, cap: 'Team chat — light' },
  { file: '20-discussions-light', path: '/app/projects/p1/discussions', session: 'researcher', theme: 'light', wait: 1500, cap: 'Discussions — light' },
  { file: '21-meetings-light', path: '/app/projects/p1/meetings', session: 'researcher', theme: 'light', wait: 1500, cap: 'Meetings — light' },
  { file: '22-project-analytics-light', path: '/app/projects/p1/analytics', session: 'researcher', theme: 'light', wait: 2800, cap: 'Project analytics — light' },
  { file: '23-activity-light', path: '/app/projects/p1/activity', session: 'researcher', theme: 'light', wait: 1500, cap: 'Activity feed — light' },
  { file: '24-reviews-light', path: '/app/reviews', session: 'supervisor', theme: 'light', wait: 1700, cap: 'Reviews queue — supervisor' },
  { file: '25-ai-light', path: '/app/ai', session: 'researcher', theme: 'light', wait: 1800, cap: 'Research AI — light' },
  { file: '26-ai-dark', path: '/app/ai', session: 'researcher', theme: 'dark', wait: 1800, cap: 'Research AI — dark' },
  { file: '27-notifications-light', path: '/app/notifications', session: 'researcher', theme: 'light', wait: 1400, cap: 'Notifications — light' },
  { file: '28-profile-light', path: '/app/profile', session: 'researcher', theme: 'light', wait: 1400, cap: 'Profile — light' },
  { file: '29-settings-light', path: '/app/settings', session: 'researcher', theme: 'light', wait: 1400, cap: 'Settings — light' },
  { file: '30-admin-users-light', path: '/app/admin/users', session: 'admin', theme: 'light', wait: 1700, cap: 'Admin — users' },
  { file: '31-privacy-light', path: '/privacy-policy', theme: 'light', wait: 1200, cap: 'Privacy policy — light' },
  { file: '32-terms-light', path: '/terms', theme: 'light', wait: 1200, cap: 'Terms — light' },
  { file: '33-404-light', path: '/nope-not-here', theme: 'light', wait: 1200, cap: '404 page — light' },
];

const filter = process.argv.slice(2);
const TODO = SHOTS.filter((s) => !filter.length || s.file.includes(filter[0]) || s.cap.toLowerCase().includes(filter[0]));

const errors = [];
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--force-color-profile=srgb', '--hide-scrollbars', '--font-render-hinting=none'],
});

await mkdir(OUT, { recursive: true });

for (const shot of TODO) {
  const page = await browser.newPage();
  await page.setViewport({ width: shot.w || W, height: shot.h || H, deviceScaleFactor: 1 });
  await page.browserContext().overridePermissions(BASE, ['notifications']);
  if (shot.session) {
    await page.evaluateOnNewDocument((u) => {
      try { localStorage.setItem('rf_session', JSON.stringify(u)); } catch (e) {}
    }, USERS[shot.session]);
  }
  if (shot.sessionStore) {
    await page.evaluateOnNewDocument((kv) => {
      for (const [k, v] of Object.entries(kv)) try { sessionStorage.setItem(k, v); } catch (e) {}
    }, shot.sessionStore);
  }
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') pageErrors.push('console: ' + m.text());
  });

  const url = BASE + shot.path + (shot.path.includes('?') ? '&' : '?') + 't=' + shot.theme;
  const t0 = Date.now();
  let status = 'ok';
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    if (shot.scroll) {
      await page.evaluate(async () => {
        const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));
        const step = 600;
        const h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        for (let y = 0; y <= h; y += step) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await sleepMs(160);
        }
        window.scrollTo({ top: h, behavior: 'instant' });
        await sleepMs(400);
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
    }
    if (shot.scroll) {
      const hidden = await page.evaluate(() =>
        [...document.querySelectorAll('[style*="opacity: 0"]')].length);
      if (hidden > 0) pageErrors.push(`⚠ ${hidden} reveal element(s) still hidden after scroll`);
    }
    await sleep(shot.wait);
    // Freeze all running animations so full-page capture is stable.
    await page.evaluate(() => {
      try {
        document.getAnimations().forEach((a) => a.pause());
        document.querySelectorAll('html, body').forEach((el) => el.style.animationPlayState = 'paused');
      } catch (e) {}
    }).catch(() => {});
    await page.screenshot({ path: path.join(OUT, shot.file + '.png'), fullPage: !!shot.full });
  } catch (e) {
    status = 'FAIL: ' + String(e).split('\n')[0];
    try { await page.screenshot({ path: path.join(OUT, shot.file + '.png') }); } catch (e2) {}
  }
  if (pageErrors.length) {
    const uniq = [...new Set(pageErrors)].slice(0, 4);
    errors.push({ file: shot.file, errors: uniq });
  }
  console.log(`[${status === 'ok' ? '✓' : '✗'}] ${shot.file}  (${Date.now() - t0}ms)${pageErrors.length ? '  ⚠ ' + pageErrors.length + ' error(s)' : ''}`);
  await page.close();
}

// ---- gallery -------------------------------------------------------------
const items = SHOTS.map((s) => ({ ...s, src: s.file + '.png' }));
let html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>ResearchFlow — Screenshot gallery</title>
<style>
  :root{color-scheme:light}
  *{box-sizing:border-box}
  body{margin:0;font-family:Inter,system-ui,sans-serif;background:#f7f4ee;color:#241f1c;padding:32px 24px 64px}
  h1{font-family:Georgia,serif;font-size:26px;margin:0 0 4px}
  p.sub{margin:0 0 28px;color:#6b625a}
  h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#8a5a44;margin:34px 0 12px;border-bottom:1px solid #e5ded4;padding-bottom:8px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:18px}
  a.card{display:block;border:1px solid #e5ded4;border-radius:12px;overflow:hidden;background:#fff;text-decoration:none;color:inherit;transition:box-shadow .15s}
  a.card:hover{box-shadow:0 8px 24px rgba(60,40,30,.12)}
  a.card img{width:100%;display:block;border-bottom:1px solid #efe9e0}
  .meta{padding:10px 14px;font-size:13px}
  .meta b{display:block;margin-bottom:2px}
  .meta span{color:#8a8178;font-size:12px;font-family:'IBM Plex Mono',monospace}
</style></head><body>
<h1>ResearchFlow — screenshot review</h1>
<p class="sub">${items.length} pages captured · light &amp; dark themes · captured from the live dev build</p>
`;
const groups = [
  ['Landing', items.filter((i) => i.file.startsWith('0') && +i.file.slice(0, 2) <= 3)],
  ['Auth', items.filter((i) => +i.file.slice(0, 2) >= 4 && +i.file.slice(0, 2) <= 7)],
  ['Dashboards', items.filter((i) => +i.file.slice(0, 2) >= 8 && +i.file.slice(0, 2) <= 11)],
  ['Project workspace', items.filter((i) => +i.file.slice(0, 2) >= 12 && +i.file.slice(0, 2) <= 23)],
  ['Reviews · AI · app pages', items.filter((i) => +i.file.slice(0, 2) >= 24 && +i.file.slice(0, 2) <= 29)],
  ['Admin · legal · errors', items.filter((i) => +i.file.slice(0, 2) >= 30 && +i.file.slice(0, 2) <= 33)],
];
for (const [name, group] of groups) {
  html += `<h2>${name}</h2><div class="grid">` + group.map((i) => `<a class="card" href="${i.src}"><img src="${i.src}" alt="${i.cap}" loading="lazy"/><div class="meta"><b>${i.cap}</b><span>${i.file}.png</span></div></a>`).join('') + `</div>`;
}
html += `</body></html>`;
await writeFile(path.join(OUT, 'index.html'), html);

await browser.close();

console.log(`\nGallery: ${path.join(OUT, 'index.html')}`);
if (errors.length) {
  console.log(`\n⚠ ${errors.length} page(s) had console/page errors:`);
  for (const e of errors) console.log('  •', e.file, '\n     -', e.errors.join('\n     - '));
} else {
  console.log('\n✓ No console or page errors detected.');
}
process.exit(0);
