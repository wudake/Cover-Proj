# Cover-Proj

Boswindor 专属海外社媒封面生成器 — 一款运行在浏览器端的 B2B 工业品牌 IG Reels 封面一键设计工具。

## 功能

- **三标签面板**: 素材管理 (图片/视频上传) / 文字排版 (8 个可调参数) / 样式切换 (5 种工业背板)
- **手机预览**: 1/3 比例实时预览，支持拖拽文字定位、IG 系统 UI 叠加层、安全线辅助
- **AI 智能定位**: 自动分析背景复杂度，锁定文字最佳 Y 位置
- **B2B 预设**: 4 个工业场景模板一键切换 (shipping / inspect / showroom-pull / meeting-neck)
- **Canvas 导出**: 1080×1920 JPG 高质量输出
- **品牌系统**: Boswindor 标准色板、字体、Logo 管理

## 快速开始

```bash
npm install
npx playwright test
```

浏览器直接打开 `Cover_V4.0.0.html` 即可使用。

## 项目结构

```
├── Cover.html              # V1.0.0 稳定版
├── Cover_V4.0.0.html       # V4.0.0 主文件
├── PRD.md                  # 产品需求文档
├── package.json            # Playwright 依赖
├── playwright.config.js    # Playwright (Edge) 配置
└── tests/
    └── cover.spec.js       # 88 个 E2E 测试用例
```

## 技术栈

HTML5 Canvas · Tailwind CSS · Google Fonts · FontAwesome · Vanilla JS · Playwright

## 版本

**V4.0.0** — 增强排版默认值、Canvas letterSpacing 渲染、badge pill 背景、分隔线、导出阴影渐变

详见 [PRD.md](./PRD.md)
