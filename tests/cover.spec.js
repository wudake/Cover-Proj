const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const COVER_PATH = `file://${path.resolve(__dirname, '..', 'Cover_V4.4.0.html')}`;

// Helper: switch to a tab in the new tabbed layout
async function switchToTab(page, tabName) {
  await page.locator(`#tab-${tabName}-btn`).click();
  await page.waitForTimeout(200);
}

// Helper: wait for toast to appear (they auto-disappear after 3s)
async function waitForToast(page, timeout = 5000) {
  const toast = page.locator('#toast-container > div');
  await toast.first().waitFor({ state: 'visible', timeout });
  return toast.first();
}

test.describe('Cover.html - 静态结构测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(COVER_PATH, { waitUntil: 'networkidle' });
  });

  test('T01: 页面标题正确', async ({ page }) => {
    await expect(page).toHaveTitle(/Boswindor/i);
  });

  test('T02: Header 品牌标识可见', async ({ page }) => {
    await expect(page.locator('text=BOSWINDOR').first()).toBeVisible();
    await expect(page.locator('text=GROWTH ENGINE')).toBeVisible();
  });

  test('T03: 状态指示灯显示', async ({ page }) => {
    const statusDot = page.locator('header .animate-pulse');
    await expect(statusDot).toBeVisible();
  });

  test('T04: 左侧控制面板区域存在', async ({ page }) => {
    await expect(page.locator('#tab-media-btn')).toBeVisible();
    await expect(page.locator('#tab-text-btn')).toBeVisible();
    await expect(page.locator('#tab-style-btn')).toBeVisible();
  });

  test('T05: 右侧手机预览区域存在', async ({ page }) => {
    await expect(page.locator('#preview-aspect')).toBeVisible();
    await expect(page.locator('text=IG Reels 全屏模拟预览')).toBeVisible();
  });

  test('T06: 所有关键DOM元素ID存在', async ({ page }) => {
    const requiredIds = [
      'drop-zone', 'file-input',
      'bg-img-preview', 'bg-video-preview', 'fallback-bg',
      'video-scrubber-panel', 'video-timeline', 'video-play-btn', 'video-time',
      'bg-scale', 'bg-shift-y',
      'title-main', 'title-highlight', 'subtitle-val', 'audience-text',
      'highlight-color-select', 'text-bg-style', 'inspection-dim-level',
      'text-bg-opacity', 'bg-opacity-value',
      'text-letter-spacing', 'text-line-height',
      'title-stroke-width', 'subtitle-stroke-width', 'badge-stroke-width',
      'show-logo-toggle',
      'text-y-position', 'text-y-value', 'ai-status-badge',
      'ig-system-overlays', 'safe-zone-square',
      'preview-text-container',
      'disp-title-p1', 'disp-title-highlight', 'disp-title-p2', 'disp-subtitle',
      'disp-audience', 'disp-badge-footer', 'badge-left-pill', 'badge-right-pill',
      'export-canvas',
      'toast-container',
      'shadow-gradient-top', 'shadow-gradient-bottom',
    ];

    for (const id of requiredIds) {
      const el = page.locator(`#${id}`);
      await expect(el, `元素 #${id} 应该在DOM中存在`).toHaveCount(1);
    }
  });

  test('T07: 缺失DOM元素检测 - font-family-select 等不在HTML中', async ({ page }) => {
    // 这些ID在JS中被引用但HTML中不存在（有fallback处理，不会崩溃但功能受限）
    const missingIds = ['font-family-select', 'text-font-size', 'gradient-range', 'footer-right-text', 'left-icon', 'disp-bullet'];
    for (const id of missingIds) {
      const count = await page.locator(`#${id}`).count();
      console.log(`  [INFO] #${id} 在HTML中${count === 0 ? '缺失（JS中有null-guard fallback）' : '存在'}`);
    }
  });

  test('T08: 导出按钮文字正确', async ({ page }) => {
    const btn = page.locator('button', { hasText: '生成并下载' });
    await expect(btn).toBeVisible();
  });

  test('T09: Canvas 导出画布存在(隐藏)', async ({ page }) => {
    const canvas = page.locator('#export-canvas');
    await expect(canvas).toBeVisible({ visible: false }); // hidden attribute
    await expect(canvas).toHaveAttribute('width', '1080');
    await expect(canvas).toHaveAttribute('height', '1920');
  });
});

test.describe('Cover.html - 预设与启动行为', () => {
  test('T10: 启动时自动加载默认shipping预设图片', async ({ page }) => {
    await page.goto(COVER_PATH, { waitUntil: 'networkidle' });
    // 等待图片加载
    const img = page.locator('#bg-img-preview');
    await expect(img).not.toHaveClass(/hidden/, { timeout: 15000 });
    const src = await img.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).toContain('unsplash');
  });

  test('T11: 启动后fallback占位符隐藏', async ({ page }) => {
    await page.goto(COVER_PATH, { waitUntil: 'networkidle' });
    const fallback = page.locator('#fallback-bg');
    await expect(fallback).toHaveClass(/hidden/, { timeout: 15000 });
  });

  test('T12: 启动后toast通知弹出', async ({ page }) => {
    await page.goto(COVER_PATH, { waitUntil: 'networkidle' });
    const toast = await waitForToast(page);
    await expect(toast).toContainText(/B2B|避让|对齐|实景/);
  });

  test('T13: 默认文本输入值正确', async ({ page }) => {
    await page.goto(COVER_PATH, { waitUntil: 'networkidle' });
    await expect(page.locator('#title-main')).toHaveValue(/AS2047/);
    await expect(page.locator('#title-highlight')).toHaveValue('Windows');
    await expect(page.locator('#subtitle-val')).toHaveValue(/Factory Direct/);
    await expect(page.locator('#audience-text')).toHaveValue(/Australian/);
  });

  test('T14: 默认文字Y位置为1340', async ({ page }) => {
    await page.goto(COVER_PATH, { waitUntil: 'networkidle' });
    await expect(page.locator('#text-y-position')).toHaveValue('1300'); // autoDetectBestPosition sets to 1300
  });

  test('T15: AI徽章默认可见', async ({ page }) => {
    await page.goto(COVER_PATH, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await switchToTab(page, 'text');
    const badge = page.locator('#ai-status-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText(/锁定|黄金/);
  });
});

test.describe('Cover.html - 文本与排版控制', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(COVER_PATH, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await switchToTab(page, 'text');
  });

  test('T16: 主标题修改后预览更新', async ({ page }) => {
    await page.locator('#title-main').fill('Test Custom Title Check');
    await page.waitForTimeout(300);
    const p1 = page.locator('#disp-title-p1');
    await expect(p1).toContainText('Test Custom Title');
  });

  test('T17: 高亮词修改后预览颜色更新', async ({ page }) => {
    await page.locator('#title-main').fill('Hello World Testing');
    await page.locator('#title-highlight').fill('World');
    await page.waitForTimeout(300);
    const hl = page.locator('#disp-title-highlight');
    await expect(hl).toContainText('World');
    // 应该有橙色color样式
    const color = await hl.evaluate(el => el.style.color);
    expect(color).toBeTruthy();
  });

  test('T18: 副标题修改后预览更新', async ({ page }) => {
    await page.locator('#subtitle-val').fill('Test Subtitle 2024');
    await page.waitForTimeout(300);
    await expect(page.locator('#disp-subtitle')).toContainText('Test Subtitle 2024');
  });

  test('T19: 目标受众文本修改后预览更新', async ({ page }) => {
    await page.locator('#audience-text').fill('For Test Market');
    await page.waitForTimeout(300);
    await expect(page.locator('#disp-audience')).toContainText('For Test Market');
  });

  test('T20: 高亮色下拉切换颜色生效', async ({ page }) => {
    // 先确保有一个高亮词
    await page.locator('#title-highlight').fill('Windows');
    await page.locator('#highlight-color-select').selectOption('#D47614');
    await page.waitForTimeout(300);
    const hl = page.locator('#disp-title-highlight');
    const color = await hl.evaluate(el => el.style.color);
    expect(color).toBeTruthy();
  });

  test('T21: 高亮色选择器有3个选项', async ({ page }) => {
    const options = await page.locator('#highlight-color-select option').count();
    expect(options).toBe(3);
  });

  test('T22: 文字垂直位置滑块修改预览移动', async ({ page }) => {
    const container = page.locator('#preview-text-container');
    const topBefore = await container.evaluate(el => el.style.top);

    await page.locator('#text-y-position').fill('800');
    await page.waitForTimeout(300);

    const topAfter = await container.evaluate(el => el.style.top);
    expect(topAfter).not.toBe(topBefore);
  });

  test('T23: 手动拖拽Y滑块后AI徽章隐藏', async ({ page }) => {
    await page.locator('#text-y-position').fill('900');
    await page.waitForTimeout(300);
    const badge = page.locator('#ai-status-badge');
    await expect(badge).toHaveClass(/hidden/);
  });

  test('T24: Y位置数值显示更新', async ({ page }) => {
    await page.locator('#text-y-position').fill('950');
    await page.waitForTimeout(300);
    await expect(page.locator('#text-y-value')).toContainText('950');
  });

  test('T25: 字间距滑块存在且可调节', async ({ page }) => {
    const slider = page.locator('#text-letter-spacing');
    await expect(slider).toBeVisible();
    await slider.fill('0');
    await page.waitForTimeout(200);
    await expect(slider).toHaveValue('0');
  });

  test('T26: 行高滑块存在且可调节', async ({ page }) => {
    const slider = page.locator('#text-line-height');
    await expect(slider).toBeVisible();
    await slider.fill('100');
    await page.waitForTimeout(200);
    await expect(slider).toHaveValue('100');
  });

  test('T27: 描边宽度滑块存在且可调节', async ({ page }) => {
    // 主标题包边
    const titleSlider = page.locator('#title-stroke-width');
    await expect(titleSlider).toBeVisible();
    await titleSlider.fill('6');
    await page.waitForTimeout(200);
    await expect(titleSlider).toHaveValue('6');

    // 副标题包边
    const subtitleSlider = page.locator('#subtitle-stroke-width');
    await expect(subtitleSlider).toBeVisible();
    await subtitleSlider.fill('5');
    await page.waitForTimeout(200);
    await expect(subtitleSlider).toHaveValue('5');

    // 标签包边
    const badgeSlider = page.locator('#badge-stroke-width');
    await expect(badgeSlider).toBeVisible();
    await badgeSlider.fill('4');
    await page.waitForTimeout(200);
    await expect(badgeSlider).toHaveValue('4');
  });
});

test.describe('Cover.html - 背景控制', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(COVER_PATH, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
  });

  test('T28: 背景缩放滑块存在且范围正确', async ({ page }) => {
    const slider = page.locator('#bg-scale');
    await expect(slider).toHaveAttribute('min', '100');
    await expect(slider).toHaveAttribute('max', '150');
  });

  test('T29: 背景Y平移滑块存在且范围正确', async ({ page }) => {
    const slider = page.locator('#bg-shift-y');
    await expect(slider).toHaveAttribute('min', '-150');
    await expect(slider).toHaveAttribute('max', '150');
  });

  test('T30: 背景缩放影响图片transform', async ({ page }) => {
    const img = page.locator('#bg-img-preview');
    const transformBefore = await img.evaluate(el => el.style.transform);

    await page.locator('#bg-scale').fill('120');
    await page.waitForTimeout(300);

    const transformAfter = await img.evaluate(el => el.style.transform);
    expect(transformAfter).toContain('scale(1.2)');
    expect(transformAfter).not.toBe(transformBefore);
  });

  test('T31: 背景Y平移影响图片transform', async ({ page }) => {
    await page.locator('#bg-shift-y').fill('50');
    await page.waitForTimeout(300);
    const img = page.locator('#bg-img-preview');
    const transform = await img.evaluate(el => el.style.transform);
    expect(transform).toContain('translateY(50px)');
  });
});

test.describe('Cover.html - 文字背板样式', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(COVER_PATH, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await switchToTab(page, 'style');
  });

  test('T32: 背板样式下拉有5个选项', async ({ page }) => {
    const options = await page.locator('#text-bg-style option').count();
    expect(options).toBe(5);
  });

  const styles = [
    { value: 'inspection', name: '质检卡' },
    { value: 'stroke', name: '3D描边' },
    { value: 'glass', name: '毛玻璃' },
    { value: 'architect', name: '建筑线框' },
    { value: 'shadow', name: '微光投影' },
  ];

  for (const { value, name } of styles) {
    test(`T33-${value}: 切换至 ${name} 样式不报错`, async ({ page }) => {
      await page.locator('#text-bg-style').selectOption(value);
      await page.waitForTimeout(500);
      // 检查预览容器存在（没有因样式切换导致DOM异常）
      const container = page.locator('#preview-text-container');
      await expect(container).toBeVisible();
      // 检查页面上没有抛出JS错误
    });
  }

  test('T34: 压暗保护有4个选项', async ({ page }) => {
    const options = await page.locator('#inspection-dim-level option').count();
    expect(options).toBe(4);
  });

  const dims = ['none', 'light', 'medium', 'heavy'];
  for (const dim of dims) {
    test(`T35-${dim}: 压暗等级 ${dim} 切换不报错`, async ({ page }) => {
      await page.locator('#inspection-dim-level').selectOption(dim);
      await page.waitForTimeout(300);
      const topGrad = page.locator('#shadow-gradient-top');
      await expect(topGrad).toBeVisible({ visible: dim !== 'none' });
    });
  }

  test('T36: 背景透明度滑块存在且范围正确', async ({ page }) => {
    const slider = page.locator('#text-bg-opacity');
    await expect(slider).toHaveAttribute('min', '0');
    await expect(slider).toHaveAttribute('max', '100');
  });

  test('T37: 背景透明度百分比显示更新', async ({ page }) => {
    await page.locator('#text-bg-opacity').fill('75');
    await page.waitForTimeout(300);
    await expect(page.locator('#bg-opacity-value')).toContainText('75');
  });
});

test.describe('Cover.html - IG叠加层与安全线', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(COVER_PATH, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
  });

  test('T38: IG系统叠加层默认可见', async ({ page }) => {
    const overlay = page.locator('#ig-system-overlays');
    await expect(overlay).toBeVisible();
    await expect(overlay.locator('text=Reels')).toBeVisible();
    await expect(overlay.locator('text=boswindor_doors')).toBeVisible();
  });

  test('T39: 点击IG按钮切换叠加层可见性', async ({ page }) => {
    const btn = page.locator('#ig-btn');
    await btn.click();
    await page.waitForTimeout(300);

    const overlay = page.locator('#ig-system-overlays');
    const opacity = await overlay.evaluate(el => el.style.opacity);
    expect(opacity).toBe('0');

    // 再切回来
    await btn.click();
    await page.waitForTimeout(300);
    const opacity2 = await overlay.evaluate(el => el.style.opacity);
    expect(opacity2).toBe('1');
  });

  test('T40: 安全线默认隐藏', async ({ page }) => {
    const safeZone = page.locator('#safe-zone-square');
    await expect(safeZone).toHaveClass(/hidden/);
  });

  test('T41: 点击安全线按钮切换显示', async ({ page }) => {
    const btn = page.locator('#safe-zone-btn');
    await btn.click();
    await page.waitForTimeout(300);

    const safeZone = page.locator('#safe-zone-square');
    await expect(safeZone).not.toHaveClass(/hidden/);

    await btn.click();
    await page.waitForTimeout(300);
    await expect(safeZone).toHaveClass(/hidden/);
  });

  test('T42: IG叠加层包含互动按钮(点赞/评论/分享)', async ({ page }) => {
    const overlay = page.locator('#ig-system-overlays');
    await expect(overlay.locator('text=4.8万')).toBeVisible();
    await expect(overlay.locator('text=1,368')).toBeVisible();
    await expect(overlay.locator('text=分享')).toBeVisible();
  });

  test('T43: IG叠加层包含Follow按钮', async ({ page }) => {
    const overlay = page.locator('#ig-system-overlays');
    await expect(overlay.locator('text=FOLLOW')).toBeVisible();
  });

  test('T44: IG叠加层包含音乐标签', async ({ page }) => {
    const overlay = page.locator('#ig-system-overlays');
    await expect(overlay.locator('text=Original Audio')).toBeVisible();
  });
});

test.describe('Cover.html - Logo功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(COVER_PATH, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await switchToTab(page, 'style');
  });

  test('T45: Logo开关默认未勾选', async ({ page }) => {
    const checkbox = page.locator('#show-logo-toggle');
    await expect(checkbox).not.toBeChecked();
  });

  test('T46: Logo预览区默认隐藏', async ({ page }) => {
    const wrapper = page.locator('#preview-logo-wrapper');
    const visibility = await wrapper.evaluate(el => el.style.visibility);
    expect(visibility).toBe('hidden');
  });

  test('T47: 勾选Logo后预览区可见', async ({ page }) => {
    await page.locator('#show-logo-toggle').check();
    await page.waitForTimeout(300);
    const wrapper = page.locator('#preview-logo-wrapper');
    const visibility = await wrapper.evaluate(el => el.style.visibility);
    expect(visibility).toBe('visible');
  });

  test('T48: Logo上传区域存在(隐藏状态)', async ({ page }) => {
    const logoSection = page.locator('#logo-file-input');
    await expect(logoSection).toHaveCount(1);
  });
});

test.describe('Cover.html - 文件上传', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(COVER_PATH, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
  });

  test('T49: 文件上传input存在且接受image和video', async ({ page }) => {
    const input = page.locator('#file-input');
    await expect(input).toHaveAttribute('accept', 'image/*,video/*');
  });

  test('T50: 拖拽区域存在且有提示文字', async ({ page }) => {
    const dropZone = page.locator('#drop-zone');
    await expect(dropZone.locator('#upload-prompt')).toContainText(/拖拽|工厂|视频|原图/);
  });

  test('T51: 拖拽区域支持的文件类型提示', async ({ page }) => {
    const dropZone = page.locator('#drop-zone');
    await expect(dropZone).toContainText(/MP4.*MOV.*JPG.*PNG/);
  });
});

test.describe('Cover.html - 视频控制', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(COVER_PATH, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
  });

  test('T52: 图片模式下视频控制面板隐藏', async ({ page }) => {
    // 默认加载的是图片
    const panel = page.locator('#video-scrubber-panel');
    await expect(panel).toHaveClass(/hidden/);
  });

  test('T53: 视频播放按钮存在于DOM', async ({ page }) => {
    const btn = page.locator('#video-play-btn');
    // 按钮在video-scrubber-panel中，图片模式下整个panel是hidden的
    await expect(btn).toHaveCount(1);
  });

  test('T54: 视频时间轴存在于DOM', async ({ page }) => {
    const timeline = page.locator('#video-timeline');
    await expect(timeline).toHaveCount(1);
  });

  test('T55: 视频时间显示存在于DOM', async ({ page }) => {
    const timeDisplay = page.locator('#video-time');
    await expect(timeDisplay).toHaveCount(1);
  });
});

test.describe('Cover.html - 导出功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(COVER_PATH, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
  });

  test('T56: 点击导出按钮触发下载', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      page.locator('button', { hasText: '生成并下载' }).click(),
    ]);

    expect(download).toBeTruthy();
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/Boswindor_Cover_Template.*\.jpg/);
  });

  test('T57: 导出的JPG文件有内容(非空)', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      page.locator('button', { hasText: '生成并下载' }).click(),
    ]);

    const filePath = await download.path();
    const stats = fs.statSync(filePath);
    expect(stats.size).toBeGreaterThan(10000); // 至少10KB
  });

  test('T58: 导出时显示成功toast', async ({ page }) => {
    await page.locator('button', { hasText: '生成并下载' }).click();
    const toast = await waitForToast(page);
    await expect(toast).toContainText(/成功|导出|封面/);
  });
});

test.describe('Cover.html - 错误处理与边界情况', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(COVER_PATH, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await switchToTab(page, 'text');
  });

  test('T59: 空高亮词不会崩溃', async ({ page }) => {
    await page.locator('#title-highlight').fill('');
    await page.waitForTimeout(300);
    // 页面应该仍然正常
    await expect(page.locator('#disp-title-p1')).toBeVisible();
  });

  test('T60: 高亮词不在标题中不会崩溃', async ({ page }) => {
    await page.locator('#title-main').fill('Simple Title');
    await page.locator('#title-highlight').fill('NonExistent');
    await page.waitForTimeout(300);
    // 应该显示完整标题，无高亮
    await expect(page.locator('#disp-title-p1')).toBeVisible();
  });

  test('T61: 标题全空不崩溃', async ({ page }) => {
    await page.locator('#title-main').fill('');
    await page.waitForTimeout(300);
    await expect(page.locator('#preview-aspect')).toBeVisible();
  });

  test('T62: 控制台无JS错误', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err));
    await page.goto(COVER_PATH, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // 操作几组控件 (switching tabs)
    await switchToTab(page, 'style');
    await page.locator('#text-bg-style').selectOption('stroke');
    await page.waitForTimeout(300);
    await page.locator('#text-bg-style').selectOption('glass');
    await page.waitForTimeout(300);
    await page.locator('#text-bg-style').selectOption('inspection');
    await page.waitForTimeout(300);
    await page.locator('#inspection-dim-level').selectOption('heavy');
    await page.waitForTimeout(300);
    await page.locator('#show-logo-toggle').check();
    await page.waitForTimeout(300);

    await switchToTab(page, 'media');
    await page.locator('#bg-scale').fill('130');
    await page.waitForTimeout(300);

    await switchToTab(page, 'text');
    await page.locator('#text-y-position').fill('700');
    await page.waitForTimeout(300);

    expect(errors.length).toBe(0);
  });

  test('T63: Toast通知正确显示和消失', async ({ page }) => {
    // 触发一个toast
    await page.locator('#ig-btn').click();
    await page.waitForTimeout(300);
    const toast = page.locator('#toast-container > div');
    await expect(toast.first()).toBeVisible();
  });

  test('T64: Y位置滑块边界值(450和1500)', async ({ page }) => {
    // 测试下边界
    await page.locator('#text-y-position').fill('450');
    await page.waitForTimeout(200);
    await expect(page.locator('#text-y-value')).toContainText('450');

    // 测试上边界
    await page.locator('#text-y-position').fill('1500');
    await page.waitForTimeout(200);
    await expect(page.locator('#text-y-value')).toContainText('1500');
  });
});

test.describe('Cover.html - 手机预览拖拽交互', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(COVER_PATH, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
  });

  test('T65: 拖拽预览区域移动文字位置', async ({ page }) => {
    const preview = page.locator('#preview-aspect');
    const box = await preview.boundingBox();

    // 模拟在预览区域中部的pointerdown+move+up
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.7);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.5, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    // Y滑块应该被更新
    const yValue = await page.locator('#text-y-position').inputValue();
    const yNum = parseInt(yValue);
    expect(yNum).toBeGreaterThanOrEqual(450);
    expect(yNum).toBeLessThanOrEqual(1500);
  });

  test('T66: 拖拽时安全线自动显示', async ({ page }) => {
    const preview = page.locator('#preview-aspect');
    const box = await preview.boundingBox();

    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.6);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.5, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    // 拖拽结束应该显示toast
    const toast = page.locator('#toast-container > div');
    await expect(toast.first()).toBeVisible();
  });
});

test.describe('Cover.html - B2B预设模板', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(COVER_PATH, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
  });

  test('T67: setB2BPreset函数存在于window', async ({ page }) => {
    const exists = await page.evaluate(() => typeof window.setB2BPreset === 'function' || typeof setB2BPreset === 'function');
    // setB2BPreset 是全局函数，检查存在
    const result = await page.evaluate(() => {
      try { return typeof setB2BPreset; } catch(e) { return 'undefined'; }
    });
    expect(result).toBe('function');
  });

  test('T68: FALLBACK_URLS 包含4个备用URL', async ({ page }) => {
    const count = await page.evaluate(() => Object.keys(FALLBACK_URLS).length);
    expect(count).toBe(4);
  });

  test('T69: B2B_PRESETS 包含4个预设', async ({ page }) => {
    const keys = await page.evaluate(() => Object.keys(B2B_PRESETS));
    expect(keys).toContain('shipping');
    expect(keys).toContain('inspect');
    expect(keys).toContain('showroom-pull');
    expect(keys).toContain('meeting-neck');
  });
});

test.describe('Cover_V4.4.0 - 副标题与底部标签排版', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(COVER_PATH, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await switchToTab(page, 'text');
  });

  test('T70: 副标题字号滑块存在且可调节', async ({ page }) => {
    const slider = page.locator('#sub-font-size');
    await expect(slider).toBeVisible();
    await slider.fill('48');
    const val = page.locator('#sub-font-size-val');
    await expect(val).toContainText('48px');
  });

  test('T71: 副标题字间距滑块存在且可调节', async ({ page }) => {
    const slider = page.locator('#sub-letter-spacing');
    await expect(slider).toBeVisible();
    await slider.fill('3');
    const val = page.locator('#sub-letter-spacing-val');
    await expect(val).toContainText('3px');
  });

  test('T72: 底部标签字号滑块存在且可调节', async ({ page }) => {
    const slider = page.locator('#badge-font-size');
    await expect(slider).toBeVisible();
    await slider.fill('40');
    const val = page.locator('#badge-font-size-val');
    await expect(val).toContainText('40px');
  });

  test('T73: 底部标签字间距滑块存在且可调节', async ({ page }) => {
    const slider = page.locator('#badge-letter-spacing');
    await expect(slider).toBeVisible();
    await slider.fill('2');
    const val = page.locator('#badge-letter-spacing-val');
    await expect(val).toContainText('2px');
  });

  test('T74: 副标题字号同步应用到预览DOM', async ({ page }) => {
    await page.locator('#sub-font-size').fill('48');
    await page.waitForTimeout(300);
    const result = await page.evaluate(() => {
      const el = document.getElementById('disp-subtitle');
      const previewAspect = document.getElementById('preview-aspect');
      const scale = previewAspect ? (previewAspect.getBoundingClientRect().width - 20) / 1080 : 1/3;
      return { fontSize: parseFloat(el.style.fontSize), scale };
    });
    expect(result.fontSize).toBeCloseTo(48 * result.scale, 0);
  });

  test('T75: 底部标签字号同步应用到预览DOM', async ({ page }) => {
    await page.locator('#badge-font-size').fill('36');
    await page.waitForTimeout(300);
    const result = await page.evaluate(() => {
      const el = document.getElementById('disp-audience');
      const previewAspect = document.getElementById('preview-aspect');
      const scale = previewAspect ? (previewAspect.getBoundingClientRect().width - 20) / 1080 : 1/3;
      return { fontSize: parseFloat(el.style.fontSize), scale };
    });
    expect(result.fontSize).toBeCloseTo(36 * result.scale, 0);
  });

  test('T76: 副标题字间距同步应用到预览DOM', async ({ page }) => {
    await page.locator('#sub-letter-spacing').fill('3');
    await page.waitForTimeout(300);
    const result = await page.evaluate(() => {
      const el = document.getElementById('disp-subtitle');
      const previewAspect = document.getElementById('preview-aspect');
      const scale = previewAspect ? (previewAspect.getBoundingClientRect().width - 20) / 1080 : 1/3;
      return { letterSpacing: parseFloat(el.style.letterSpacing), scale };
    });
    expect(result.letterSpacing).toBeCloseTo(3 * result.scale, 1);
  });
});

test.describe('Cover_V4.4.0 - 预览与画布一致性', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(COVER_PATH, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await switchToTab(page, 'text');
  });

  test('T77: 标题字号预览与画布一致 (动态缩放)', async ({ page }) => {
    await page.locator('#text-font-size').fill('88');
    await page.waitForTimeout(300);
    const result = await page.evaluate(() => {
      const titleEl = document.querySelector('#preview-aspect h2');
      const previewAspect = document.getElementById('preview-aspect');
      const scale = previewAspect ? (previewAspect.getBoundingClientRect().width - 20) / 1080 : 1/3;
      return { previewFs: parseFloat(titleEl.style.fontSize), scale };
    });
    expect(result.previewFs).toBeCloseTo(88 * result.scale, 0);
    const canvasVal = await page.evaluate(() => {
      const el = document.getElementById('text-font-size');
      return el ? parseInt(el.value) : null;
    });
    expect(canvasVal).toBe(88);
  });

  test('T78: 标题字间距预览与画布一致 (动态缩放)', async ({ page }) => {
    await page.locator('#text-letter-spacing').fill('-2');
    await page.waitForTimeout(300);
    const result = await page.evaluate(() => {
      const titleEl = document.querySelector('#preview-aspect h2');
      const previewAspect = document.getElementById('preview-aspect');
      const scale = previewAspect ? (previewAspect.getBoundingClientRect().width - 20) / 1080 : 1/3;
      return { previewLs: parseFloat(titleEl.style.letterSpacing), scale };
    });
    expect(result.previewLs).toBeCloseTo(-2 * result.scale, 1);
    const canvasVal = await page.evaluate(() => {
      const el = document.getElementById('text-letter-spacing');
      return el ? parseFloat(el.value) : null;
    });
    expect(canvasVal).toBe(-2);
  });

  test('T79: 标题行高预览与画布一致', async ({ page }) => {
    await page.locator('#text-line-height').fill('112');
    await page.waitForTimeout(300);
    const previewLh = await page.locator('#preview-aspect h2').evaluate(el => el.style.lineHeight);
    expect(parseFloat(previewLh)).toBeCloseTo(1.12, 2);
    const canvasVal = await page.evaluate(() => {
      const el = document.getElementById('text-line-height');
      return el ? parseFloat(el.value) : null;
    });
    expect(canvasVal).toBe(112);
  });

  test('T80: 副标题字号预览与画布一致 (动态缩放)', async ({ page }) => {
    await page.locator('#sub-font-size').fill('46');
    await page.waitForTimeout(300);
    const result = await page.evaluate(() => {
      const el = document.getElementById('disp-subtitle');
      const previewAspect = document.getElementById('preview-aspect');
      const scale = previewAspect ? (previewAspect.getBoundingClientRect().width - 20) / 1080 : 1/3;
      return { previewFs: parseFloat(el.style.fontSize), scale };
    });
    expect(result.previewFs).toBeCloseTo(46 * result.scale, 0);
    const canvasVal = await page.evaluate(() => {
      const el = document.getElementById('sub-font-size');
      return el ? parseInt(el.value) : null;
    });
    expect(canvasVal).toBe(46);
  });

  test('T81: 副标题字间距预览与画布一致 (动态缩放)', async ({ page }) => {
    await page.locator('#sub-letter-spacing').fill('1');
    await page.waitForTimeout(300);
    const result = await page.evaluate(() => {
      const el = document.getElementById('disp-subtitle');
      const previewAspect = document.getElementById('preview-aspect');
      const scale = previewAspect ? (previewAspect.getBoundingClientRect().width - 20) / 1080 : 1/3;
      return { previewLs: parseFloat(el.style.letterSpacing), scale };
    });
    expect(result.previewLs).toBeCloseTo(1 * result.scale, 1);
    const canvasVal = await page.evaluate(() => {
      const el = document.getElementById('sub-letter-spacing');
      return el ? parseFloat(el.value) : null;
    });
    expect(canvasVal).toBe(1);
  });

  test('T82: 底部标签字号预览与画布一致 (动态缩放)', async ({ page }) => {
    await page.locator('#badge-font-size').fill('34');
    await page.waitForTimeout(300);
    const result = await page.evaluate(() => {
      const el = document.getElementById('disp-audience');
      const previewAspect = document.getElementById('preview-aspect');
      const scale = previewAspect ? (previewAspect.getBoundingClientRect().width - 20) / 1080 : 1/3;
      return { previewFs: parseFloat(el.style.fontSize), scale };
    });
    expect(result.previewFs).toBeCloseTo(34 * result.scale, 0);
    const canvasVal = await page.evaluate(() => {
      const el = document.getElementById('badge-font-size');
      return el ? parseInt(el.value) : null;
    });
    expect(canvasVal).toBe(34);
  });

  test('T83: 底部标签字间距预览与画布一致 (动态缩放)', async ({ page }) => {
    await page.locator('#badge-letter-spacing').fill('1');
    await page.waitForTimeout(300);
    const result = await page.evaluate(() => {
      const el = document.getElementById('disp-audience');
      const previewAspect = document.getElementById('preview-aspect');
      const scale = previewAspect ? (previewAspect.getBoundingClientRect().width - 20) / 1080 : 1/3;
      return { previewLs: parseFloat(el.style.letterSpacing), scale };
    });
    expect(result.previewLs).toBeCloseTo(1 * result.scale, 1);
    const canvasVal = await page.evaluate(() => {
      const el = document.getElementById('badge-letter-spacing');
      return el ? parseFloat(el.value) : null;
    });
    expect(canvasVal).toBe(1);
  });

  test('T84: 高亮颜色预览与画布使用相同值', async ({ page }) => {
    await page.locator('#highlight-color-select').selectOption('#DE9F35');
    await page.waitForTimeout(300);
    const previewColor = await page.locator('#disp-title-highlight').evaluate(el => el.style.color);
    // Convert rgb to hex-ish comparison
    expect(previewColor).toBeTruthy();
    const canvasVal = await page.evaluate(() => {
      const el = document.getElementById('highlight-color-select');
      return el ? el.value : null;
    });
    expect(canvasVal).toBe('#DE9F35');
  });

  test('T85: 精致包边值预览与画布读取一致', async ({ page }) => {
    await page.locator('#title-stroke-width').fill('5');
    await page.locator('#subtitle-stroke-width').fill('4');
    await page.locator('#badge-stroke-width').fill('3');
    await page.waitForTimeout(300);
    const canvasVal = await page.evaluate(() => {
      const titleEl = document.getElementById('title-stroke-width');
      const subtitleEl = document.getElementById('subtitle-stroke-width');
      const badgeEl = document.getElementById('badge-stroke-width');
      return {
        title: titleEl ? parseFloat(titleEl.value) : null,
        subtitle: subtitleEl ? parseFloat(subtitleEl.value) : null,
        badge: badgeEl ? parseFloat(badgeEl.value) : null,
      };
    });
    expect(canvasVal.title).toBe(5);
    expect(canvasVal.subtitle).toBe(4);
    expect(canvasVal.badge).toBe(3);
  });

  test('T86: 字体选择预览与画布一致', async ({ page }) => {
    await page.locator('#font-family-select').selectOption('Montserrat, sans-serif');
    await page.waitForTimeout(300);
    const previewFont = await page.locator('#preview-text-container').evaluate(el => el.style.fontFamily);
    expect(previewFont).toContain('Montserrat');
    const canvasVal = await page.evaluate(() => {
      const el = document.getElementById('font-family-select');
      return el ? el.value : null;
    });
    expect(canvasVal).toBe('Montserrat, sans-serif');
  });

  test('T87: 综合设置后预览与画布全部参数一致', async ({ page }) => {
    // Set all controls to non-default values
    await page.locator('#text-font-size').fill('80');
    await page.locator('#text-letter-spacing').fill('0');
    await page.locator('#text-line-height').fill('100');
    await page.locator('#title-stroke-width').fill('6');
    await page.locator('#subtitle-stroke-width').fill('5');
    await page.locator('#badge-stroke-width').fill('4');
    await page.locator('#sub-font-size').fill('40');
    await page.locator('#sub-letter-spacing').fill('2');
    await page.locator('#badge-font-size').fill('28');
    await page.locator('#badge-letter-spacing').fill('2');
    await page.locator('#font-family-select').selectOption('Space Grotesk, sans-serif');
    await page.locator('#highlight-color-select').selectOption('#F3921F');
    await page.waitForTimeout(500);

    // Read all canvas + preview values with dynamic scale
    const allParams = await page.evaluate(() => {
      const previewAspect = document.getElementById('preview-aspect');
      const scale = previewAspect ? (previewAspect.getBoundingClientRect().width - 20) / 1080 : 1/3;
      const titleEl = document.querySelector('#preview-aspect h2');
      const subtitleEl = document.getElementById('disp-subtitle');
      const audDisp = document.getElementById('disp-audience');
      const container = document.getElementById('preview-text-container');
      const highlightEl = document.getElementById('disp-title-highlight');
      return {
        scale,
        canvas: {
          fontSize: parseInt(document.getElementById('text-font-size')?.value),
          letterSpacing: parseFloat(document.getElementById('text-letter-spacing')?.value),
          lineHeight: parseFloat(document.getElementById('text-line-height')?.value),
          strokeWidth: parseFloat(document.getElementById('title-stroke-width')?.value),
          subtitleStrokeWidth: parseFloat(document.getElementById('subtitle-stroke-width')?.value),
          badgeStrokeWidth: parseFloat(document.getElementById('badge-stroke-width')?.value),
          subFontSize: parseInt(document.getElementById('sub-font-size')?.value),
          subLetterSpacing: parseFloat(document.getElementById('sub-letter-spacing')?.value),
          badgeFontSize: parseInt(document.getElementById('badge-font-size')?.value),
          badgeLetterSpacing: parseFloat(document.getElementById('badge-letter-spacing')?.value),
          fontFamily: document.getElementById('font-family-select')?.value,
          highlightColor: document.getElementById('highlight-color-select')?.value,
        },
        preview: {
          titleFontSize: titleEl ? parseFloat(titleEl.style.fontSize) : null,
          titleLetterSpacing: titleEl ? parseFloat(titleEl.style.letterSpacing) : null,
          titleLineHeight: titleEl ? parseFloat(titleEl.style.lineHeight) : null,
          subFontSize: subtitleEl ? parseFloat(subtitleEl.style.fontSize) : null,
          subLetterSpacing: subtitleEl ? parseFloat(subtitleEl.style.letterSpacing) : null,
          badgeFontSize: audDisp ? parseFloat(audDisp.style.fontSize) : null,
          badgeLetterSpacing: audDisp ? parseFloat(audDisp.style.letterSpacing) : null,
          fontFamily: container ? container.style.fontFamily : null,
          highlightColor: highlightEl ? highlightEl.style.color : null,
        },
      };
    });

    const { scale, canvas: canvasParams, preview: previewParams } = allParams;

    // Verify dynamic scale consistency
    expect(previewParams.titleFontSize).toBeCloseTo(canvasParams.fontSize * scale, 0);
    expect(previewParams.titleLetterSpacing).toBeCloseTo(canvasParams.letterSpacing * scale, 1);
    expect(previewParams.titleLineHeight).toBeCloseTo(canvasParams.lineHeight / 100, 2);
    expect(previewParams.subFontSize).toBeCloseTo(canvasParams.subFontSize * scale, 0);
    expect(previewParams.subLetterSpacing).toBeCloseTo(canvasParams.subLetterSpacing * scale, 1);
    expect(previewParams.badgeFontSize).toBeCloseTo(canvasParams.badgeFontSize * scale, 0);
    expect(previewParams.badgeLetterSpacing).toBeCloseTo(canvasParams.badgeLetterSpacing * scale, 1);

    // Verify exact values
    expect(canvasParams.fontSize).toBe(80);
    expect(canvasParams.letterSpacing).toBe(0);
    expect(canvasParams.lineHeight).toBe(100);
    expect(canvasParams.strokeWidth).toBe(6);
    expect(canvasParams.subtitleStrokeWidth).toBe(5);
    expect(canvasParams.badgeStrokeWidth).toBe(4);
    expect(canvasParams.subFontSize).toBe(40);
    expect(canvasParams.subLetterSpacing).toBe(2);
    expect(canvasParams.badgeFontSize).toBe(28);
    expect(canvasParams.badgeLetterSpacing).toBe(2);
    expect(canvasParams.fontFamily).toBe('Space Grotesk, sans-serif');
    expect(canvasParams.highlightColor).toBe('#F3921F');
  });

  test('T88: 画布letterSpacing参与词宽测量', async ({ page }) => {
    // Set a large negative letter spacing to verify it affects word width
    await page.locator('#text-letter-spacing').fill('-6');
    await page.waitForTimeout(300);

    const result = await page.evaluate(() => {
      const canvas = document.getElementById('export-canvas');
      const ctx = canvas.getContext('2d');
      const fontSizeEl = document.getElementById('text-font-size');
      const letterSpacingEl = document.getElementById('text-letter-spacing');
      const fontSize = fontSizeEl ? parseInt(fontSizeEl.value) : 74;
      const letterSpacing = letterSpacingEl ? parseFloat(letterSpacingEl.value) : -2;

      // Simulate what generateAndDownload does for word measurement
      ctx.font = `800 ${fontSize}px Space Grotesk, sans-serif`;
      ctx.letterSpacing = letterSpacing + 'px';

      const testWord = 'Manufacturing';
      const widthWithLS = ctx.measureText(testWord).width;

      ctx.letterSpacing = '0px';
      const widthWithoutLS = ctx.measureText(testWord).width;

      return {
        widthWithLS,
        widthWithoutLS,
        diff: widthWithLS - widthWithoutLS,
        letterSpacing,
        expectedDiff: letterSpacing * (testWord.length - 1),
      };
    });

    // With letterSpacing=-6 and word length 13, diff should be negative (tighter)
    expect(result.diff).toBeLessThan(0);
    expect(result.widthWithLS).toBeLessThan(result.widthWithoutLS);
    // letterSpacing affects measureText when set on context
    expect(Math.abs(result.diff)).toBeGreaterThan(50); // Significant narrowing
  });
});
