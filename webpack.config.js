const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const ExtReloader = require('webpack-ext-reloader');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = env => {
  const { target, mode, browser } = env;
  // const isChrome = target === 'chrome';
  const isTampermonkey = target === 'tampermonkey';
  const isFirefox = browser === 'firefox';
  
  // 基础配置
  const baseConfig = {
    // 防止Content Security Policy的限制。需要将devtool改为'source-map'。同时，我们需要确保manifest.json中的配置正确，移除不必要的unsafe-eval相关设置。这些修改将解决CSP限制导致的脚本执行错误问题。需要修改webpack配置，将devtool设置为'source-map'以解决Content Security Policy的限制问题。
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: isTampermonkey 
            ? ['css-loader'] // 油猴脚本只需要CSS文本
            : ['style-loader', 'css-loader'] // Chrome扩展需要注入样式
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.css'],
      // 添加路径别名
      alias: {
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@chrome': path.resolve(__dirname, 'src/chrome'),
        '@tampermonkey': path.resolve(__dirname, 'src/tampermonkey')
      }
    }
  };
  
  // 配置允许HTML模板处理TypeScript文件
  const htmlWebpackOptions = {
    template: './src/chrome/popup/index.ejs',
    filename: 'popup.html',
    chunks: ['popup'],
    templateParameters: {
      defaultConfig: JSON.stringify({
        removeReferences: true,
        userConsent: true,
        copyFormat: 'markdown',
        enableCopy: true
      })
    }
  };
  
  // Chrome 扩展配置
  const chromeConfig = {
    ...baseConfig,
    entry: {
      popup: './src/chrome/popup/index.ts',
      background: './src/chrome/background.ts',
      content: './src/chrome/content.ts',
    },
    output: {
      path: path.resolve(__dirname, isFirefox ? 'dist/firefox' : 'dist/chrome'),
      filename: '[name].js',
    },
    plugins: [
      new CleanWebpackPlugin(),
      // 使用HtmlWebpackPlugin预编译模板
      new HtmlWebpackPlugin(htmlWebpackOptions),
      new CopyPlugin({
        patterns: [
          { 
            from: 'src/chrome/manifest.json', 
            to: 'manifest.json',
            transform(content) {
              // 解析manifest.json内容
              const manifest = JSON.parse(content.toString('utf8'));
              
              // 根据目标浏览器修改background配置
              if (isFirefox) {
                manifest.background = {
                  scripts: ["background.js"]
                };
                manifest.browser_specific_settings = {
                  "gecko": {
                    "id": "ai-assistant-copy-tool@example.com"
                  }
                };
              } else {
                manifest.background = {
                  service_worker: "background.js"
                };
              }
              
              // 返回修改后的manifest内容，确保UTF-8编码
              return Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');
            }
          },
          // 移除popup.html，因为现在由HtmlWebpackPlugin生成
          { from: 'src/assets', to: 'assets', noErrorOnMissing: true },
          { from: 'src/privacy.html', to: 'privacy.html' },
        ],
      }),
      mode === 'development' && new ExtReloader({
        reloadPage: true,
        entries: {
          contentScript: 'content',
          background: 'background',
          extensionPage: 'popup'
        }
      }),
    ].filter(Boolean),
  };

  // 油猴脚本配置
  const tampermonkeyConfig = {
    ...baseConfig,
    entry: {
      'ai-assistant-copy-tool': './src/tampermonkey/index.ts',
    },
    output: {
      path: path.resolve(__dirname, 'dist/tampermonkey'),
      filename: '[name].js',
    },
    externals: {
      'turndown': 'TurndownService',
      'turndown-plugin-gfm': 'turndownPluginGfm'
    },
    plugins: [
      new CleanWebpackPlugin(),
    ],
    // 即使在production模式下也禁用代码压缩
    optimization: {
      minimize: false
    }
  };

  // 根据目标返回对应配置
  if (isTampermonkey) {
    return tampermonkeyConfig;
  } else {
    return chromeConfig; // 默认为 Chrome 扩展
  }
};
