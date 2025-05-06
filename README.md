# AI助手复制工具

为AI助手平台（通义千问、文心一言、豆包、元宝、百度）添加复制按钮，整理markdown文本并去除参考文献角标。本工具仅在本地处理内容，不会上传任何数据。

## 功能特点

- 为AI平台的回答添加复制按钮
- 自动转换HTML为Markdown格式
- 可选择是否去除参考文献角标
- 支持Chrome扩展和油猴脚本两种安装方式
- 干净的用户界面和动画效果
- 支持Chrome和Firefox浏览器

## 支持的平台

- 百度-AI搜索
- 字节-豆包
- 腾讯-元宝

## 安装方式

### Chrome扩展

1. 从 [Chrome Web Store](https://chromewebstore.google.com) 安装
2. 或下载最新的 `.crx` 文件，拖拽到Chrome的扩展页面安装

### Firefox扩展

1. 从 [Firefox Add-ons](https://addons.mozilla.org/) 安装
2. 或下载最新的 `.xpi` 文件，在Firefox的扩展页面点击"从文件安装附加组件"

### 油猴脚本

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 点击 [此链接](#) 安装脚本
3. 或者复制 `dist/tampermonkey/ai-assistant-copy-tool.js` 到油猴的新脚本中

## 开发

本项目使用TypeScript开发，并支持同时构建Chrome扩展、Firefox扩展和油猴脚本。

### 项目结构

```
├── src/
│   ├── assets/          # 图标和静态资源
│   ├── shared/          # 共享代码
│   │   ├── styles/      # 共享样式文件
│   │   ├── templates.ts # HTML模板生成
│   │   ├── types.ts     # 类型定义
│   │   ├── copy.ts      # 复制功能核心逻辑
│   │   └── ui.ts        # UI相关函数
│   ├── chrome/          # 浏览器扩展特定代码
│   │   ├── popup/       # 弹出窗口相关
│   │   │   ├── index.ts  # 弹出窗口脚本
│   │   │   └── index.ejs # 弹出窗口HTML模板
│   │   ├── background.ts # 后台脚本
│   │   ├── content.ts    # 内容脚本
│   │   └── manifest.json # 清单文件
│   └── tampermonkey/    # 油猴脚本特定代码
│       └── index.ts     # 油猴脚本入口
├── dist/                # 构建输出目录
│   ├── chrome/          # Chrome扩展构建输出
│   ├── firefox/         # Firefox扩展构建输出
│   └── tampermonkey/    # 油猴脚本构建输出
├── webpack.config.js    # Webpack配置
└── package.json         # 项目依赖和脚本
```

### 构建命令

```bash
# 开发Chrome扩展（监视模式）
npm run dev:chrome

# 开发Firefox扩展（监视模式）
npm run dev:firefox

# 开发油猴脚本（监视模式）
npm run dev:tampermonkey

# 构建Chrome扩展
npm run build:chrome

# 构建Firefox扩展
npm run build:firefox

# 构建油猴脚本
# 不使用--mode=development，因为：1、油猴无法加载混淆后的代码；2、让用户直观看到源码可以放心使用
npm run build:tampermonkey

# 构建所有版本
npm run build
```

## 技术实现

- 使用TypeScript确保类型安全和更好的开发体验
- Webpack用于构建和优化输出
- 使用HTML模板引擎(EJS)生成弹出窗口界面
- 共享核心逻辑，减少代码重复
- 动态适配不同浏览器的manifest版本要求（Chrome使用Manifest V3，Firefox兼容处理）

## 隐私政策

本工具仅在本地处理内容，不会收集、存储或上传任何用户数据。所有的配置数据仅存储在用户的浏览器本地存储中。

## 许可

MIT
