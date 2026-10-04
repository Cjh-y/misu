import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser', timeout:45_000, fullyParallel:false, reporter:'list',
  use:{baseURL:'http://127.0.0.1:4173',...devices['Desktop Chrome'],headless:true},
  webServer:{command:'npm run dev -- --host 127.0.0.1 --port 4173',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:30_000},
});
