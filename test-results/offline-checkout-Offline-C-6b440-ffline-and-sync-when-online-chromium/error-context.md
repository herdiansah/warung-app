# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline-checkout.spec.ts >> Offline Checkout UI Flow >> should queue transaction when offline and sync when online
- Location: tests/e2e/offline-checkout.spec.ts:12:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.lucide-plus').first()

```

# Page snapshot

```yaml
- generic [ref=f1e4]:
  - generic [ref=f1e5]:
    - generic [ref=f1e6]:
      - heading "WarungApp" [level=1] [ref=f1e12]
      - paragraph [ref=f1e13]: Masuk untuk mencatat penjualan
    - generic [ref=f1e14]:
      - generic [ref=f1e15]:
        - generic [ref=f1e16]: Email
        - textbox "owner@example.com" [ref=f1e17]
      - generic [ref=f1e18]:
        - generic [ref=f1e19]: Password
        - generic [ref=f1e20]:
          - textbox "••••••••" [ref=f1e21]
          - button [ref=f1e22]
      - button "Masuk Sekarang" [ref=f1e26]
  - paragraph [ref=f1e30]: WarungApp v1.0 — Pencatatan Penjualan Warung
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import * as dotenv from 'dotenv';
  3  | import * as path from 'path';
  4  | import { fileURLToPath } from 'url';
  5  | 
  6  | const __filename = fileURLToPath(import.meta.url);
  7  | const __dirname = path.dirname(__filename);
  8  | 
  9  | dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  10 | 
  11 | test.describe('Offline Checkout UI Flow', () => {
  12 |   test('should queue transaction when offline and sync when online', async ({ page, context }) => {
  13 |     // 1. Login
  14 |     await page.goto('/login');
  15 |     await page.fill('input[type="email"]', 'owner@example.com');
  16 |     await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || '');
  17 |     await page.click('button[type="submit"]');
  18 |     
  19 |     // Ensure we are logged in by waiting for Dashboard or POS element
  20 |     await page.waitForURL('**/*');
  21 |     
  22 |     // Add product to database directly so it guarantees to exist
  23 |     const token = await page.evaluate(() => localStorage.getItem("warung_token"));
  24 |     await page.request.post('/api/products', {
  25 |       headers: { 'Authorization': `Bearer ${token}` },
  26 |       data: {
  27 |         name: "Playwright E2E Item",
  28 |         purchase_price: 10,
  29 |         selling_price: 20,
  30 |         stock: 50,
  31 |         unit: "Pcs"
  32 |       }
  33 |     });
  34 | 
  35 |     // Navigate to POS directly
  36 |     await page.goto('/pos');
  37 |     await page.waitForTimeout(3000); // Wait for fetch
  38 | 
  39 |     // Click the first Add to Cart button (plus icon)
  40 |     const addButton = page.locator('.lucide-plus').first();
  41 |     await addButton.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
> 42 |     await addButton.click({ force: true });
     |                     ^ Error: locator.click: Test timeout of 30000ms exceeded.
  43 |     await addButton.click({ force: true });
  44 |     
  45 |     // Verify item in cart
  46 |     await expect(page.locator('text=Total (')).toBeVisible();
  47 | 
  48 |     // 3. Emulate Offline
  49 |     await context.setOffline(true);
  50 |     
  51 |     // 4. Click Checkout
  52 |     await page.click('button:has-text("Simpan Transaksi")');
  53 |     
  54 |     // Should show pending UI (from catch block)
  55 |     await expect(page.locator('text=Koneksi terputus')).toBeVisible({ timeout: 5000 });
  56 |     
  57 |     // Wait for Toast to clear
  58 |     await page.waitForTimeout(5000);
  59 | 
  60 |     // SyncManager should show offline status and pending queue
  61 |     const syncManagerOffline = page.locator('div:has-text("Offline (1 antrean)")');
  62 |     await expect(syncManagerOffline).toBeVisible();
  63 | 
  64 |     // 5. Restore Network (Online)
  65 |     await context.setOffline(false);
  66 |     
  67 |     // We should see the Sync button
  68 |     const syncButton = page.locator('button:has-text("Sync 1 antrean")');
  69 |     await expect(syncButton).toBeVisible({ timeout: 15000 }); // give it time to trigger online event
  70 |     
  71 |     // 6. Click Sync
  72 |     await syncButton.click();
  73 |     
  74 |     // Wait for the sync to complete and the queue to clear
  75 |     const syncManagerOnline = page.locator('div:has-text("Online")');
  76 |     await expect(syncManagerOnline).toBeVisible({ timeout: 10000 });
  77 |   });
  78 | });
  79 | 
```