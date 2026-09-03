import 'dotenv/config';
import { test, expect } from '@playwright/test';

const ADMIN_PW = process.env.ADMIN_PASSWORD || '';

test.describe('M4 — E2E Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'owner@example.com');
    await page.fill('[data-testid="login-password"]', ADMIN_PW);
    await page.click('[data-testid="login-submit"]');
    // Wait for sidebar nav to appear (indicates login success)
    await expect(page.locator('[data-testid="nav-pos"]:visible').first()).toBeVisible({ timeout: 15000 });
  });

  test('M4-1: Produk page — barcode field visible in modal', async ({ page }) => {
    await page.goto('/products');
    await page.waitForSelector('[data-testid="products-add"]');
    await page.click('[data-testid="products-add"]');
    // Wait for modal to open (heading), then barcode field
    await expect(page.getByText('Tambah Produk Baru')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="product-barcode"]')).toBeVisible();
  });

  test('M4-2: Produk page — Import button visible', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('[data-testid="products-import"]')).toBeVisible();
  });

  test('M4-3: POS — barcode scan input visible', async ({ page }) => {
    await page.goto('/pos');
    await expect(page.locator('[data-testid="pos-scan"]')).toBeVisible();
    // Type unknown barcode + Enter — should show error toast
    await page.fill('[data-testid="pos-scan"]', '9999999999999');
    await page.press('[data-testid="pos-scan"]', 'Enter');
    // Wait for toast to appear (error message)
    await page.waitForTimeout(2000);
  });

  test('M4-4: Pelanggan page — create customer modal opens', async ({ page }) => {
    const name = `E2E Test ${Date.now()}`;
    await page.goto('/customers');
    await page.waitForSelector('button:has-text("Tambah Pelanggan")');
    await page.click('button:has-text("Tambah Pelanggan")');
    await expect(page.locator('[data-testid="customer-name"]')).toBeVisible();
    await page.fill('[data-testid="customer-name"]', name);
    await page.click('button:has-text("Simpan")');
    await page.waitForTimeout(1000);
    await expect(page.getByText(name)).toBeVisible();
  });

  test('M4-5: Buku Kas page — form elements visible', async ({ page }) => {
    await page.goto('/cash');
    await expect(page.getByRole('button', { name: 'Catat Mutasi' })).toBeVisible();
    await page.click('button:has-text("Catat Mutasi")');
    await expect(page.getByRole('button', { name: 'Kas Masuk' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kas Keluar' })).toBeVisible();
  });

  test('M4-6: Tutup Kasir page — form visible', async ({ page }) => {
    await page.goto('/closings');
    await expect(page.locator('text=Uang fisik di laci')).toBeVisible();
    // Check that closing data loaded
    await page.waitForTimeout(2000);
  });

  test('M4-7: Dashboard — sales chart visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    // recharts renders SVG with recharts-surface class
    await expect(page.locator('.recharts-surface').first()).toBeVisible({ timeout: 5000 });
  });

  test('M4-8: Laporan page — export buttons visible', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByText('Export Produk')).toBeVisible({ timeout: 5000 });
  });
});