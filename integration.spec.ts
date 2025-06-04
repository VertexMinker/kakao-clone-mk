import { test, expect } from '@playwright/test';

test.describe('인증 테스트', () => {
  test('로그인 성공', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@kyobobook.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // 로그인 후 대시보드로 리다이렉트 확인
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('대시보드');
  });

  test('로그인 실패 - 잘못된 비밀번호', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@kyobobook.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // 오류 메시지 확인
    await expect(page.locator('.text-red-600')).toBeVisible();
    await expect(page.locator('.text-red-600')).toContainText('이메일 또는 비밀번호가 올바르지 않습니다');
  });
});

test.describe('제품 관리 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@kyobobook.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // 제품 목록 페이지로 이동
    await page.click('text=제품 관리');
  });

  test('제품 목록 조회', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('제품 관리');
    await expect(page.locator('table')).toBeVisible();
  });

  test('제품 검색', async ({ page }) => {
    await page.fill('input[placeholder="상품명 또는 SKU 검색"]', 'test');
    await page.press('input[placeholder="상품명 또는 SKU 검색"]', 'Enter');
    
    // 검색 결과 확인
    await expect(page.locator('table')).toBeVisible();
  });

  test('제품 상세 조회', async ({ page }) => {
    // 첫 번째 제품 클릭
    await page.click('table a:has-text("상세")');
    
    // 제품 상세 페이지 확인
    await expect(page.locator('h1')).toContainText('제품 상세');
  });
});

test.describe('재고 관리 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@kyobobook.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // 제품 목록 페이지로 이동
    await page.click('text=제품 관리');
    
    // 첫 번째 제품 클릭
    await page.click('table a:has-text("상세")');
  });

  test('재고 조정', async ({ page }) => {
    // 입/출고 버튼 클릭
    await page.click('button:has-text("입/출고")');
    
    // 입고 선택
    await page.click('#adjustmentTypeIn');
    
    // 수량 입력
    await page.fill('input#quantity', '5');
    
    // 메모 입력
    await page.fill('textarea#memo', '테스트 입고');
    
    // 재고 조정 버튼 클릭
    await page.click('button:has-text("재고 조정")');
    
    // 제품 상세 페이지로 돌아왔는지 확인
    await expect(page.locator('h1')).toContainText('제품 상세');
  });

  test('위치 변경', async ({ page }) => {
    // 위치변경 버튼 클릭
    await page.click('button:has-text("위치변경")');
    
    // 새 위치 입력
    await page.fill('input#toLocation', '테스트 위치');
    
    // 위치 변경 버튼 클릭
    await page.click('button:has-text("위치 변경")');
    
    // 제품 상세 페이지로 돌아왔는지 확인
    await expect(page.locator('h1')).toContainText('제품 상세');
  });
});
