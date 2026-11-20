import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const round = process.argv[2] || 'round1';

async function run() {
  console.log(`Starting Visual Verification for ${round}...`);

  let token = null;
  // Ensure demo user exists & demo data is seeded via backend API
  try {
    const signupRes = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@leadmanager.com', password: 'Password123' }),
    });
    if (signupRes.ok) {
      const data = await signupRes.json();
      token = data.token;
    } else {
      const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@leadmanager.com', password: 'Password123' }),
      });
      const data = await loginRes.json();
      token = data.token;
    }

    if (token) {
      // Seed the 10 demo leads matching ref-2 & activity matching ref-3
      const seedRes = await fetch('http://localhost:5000/api/leads/demo-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Demo data reset status:', seedRes.status);
    }
  } catch (err) {
    console.warn('API seed note:', err.message);
  }

  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Viewport: 1280px
  console.log('Capturing Desktop 1280px...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });

  if (token) {
    await desktopContext.addInitScript((auth) => {
      localStorage.setItem('lead_manager_auth_token', auth.token);
      localStorage.setItem('lead_manager_auth_user', JSON.stringify({ email: 'demo@leadmanager.com' }));
    }, { token });
  }

  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // Wait for main dashboard to be fully rendered
  await desktopPage.waitForSelector('.recent-leads-table', { timeout: 10000 });
  await desktopPage.waitForTimeout(1500); // Allow charts animation to settle

  const desktopPath = path.join(SCREENSHOT_DIR, `overview-1280-${round}.png`);
  await desktopPage.screenshot({ path: desktopPath, fullPage: true });
  console.log(`Saved desktop screenshot: ${desktopPath}`);
  await desktopContext.close();

  // 2. Mobile Viewport: 375px
  console.log('Capturing Mobile 375px...');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
  });

  if (token) {
    await mobileContext.addInitScript((auth) => {
      localStorage.setItem('lead_manager_auth_token', auth.token);
      localStorage.setItem('lead_manager_auth_user', JSON.stringify({ email: 'demo@leadmanager.com' }));
    }, { token });
  }

  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  await mobilePage.waitForSelector('.recent-leads-table', { timeout: 10000 });
  await mobilePage.waitForTimeout(1500);

  const mobilePath = path.join(SCREENSHOT_DIR, `overview-375-${round}.png`);
  await mobilePage.screenshot({ path: mobilePath, fullPage: true });
  console.log(`Saved mobile screenshot: ${mobilePath}`);
  await mobileContext.close();

  await browser.close();
  console.log(`Visual verification capture for ${round} completed!`);
}

run().catch((err) => {
  console.error('Error during visual verification:', err);
  process.exit(1);
});
