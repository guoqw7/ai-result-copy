const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const ExtReloader = require('webpack-ext-reloader');

module.exports = (env, argv) => ({
  // 防止Content Security Policy的限制。需要将devtool改为'source-map'。同时，我们需要确保manifest.json中的配置正确，移除不必要的unsafe-eval相关设置。这些修改将解决CSP限制导致的脚本执行错误问题。需要修改webpack配置，将devtool设置为'source-map'以解决Content Security Policy的限制问题。
  devtool: 'source-map',
  entry: {
    popup: './src/popup/index.ts',
    background: './src/background/index.ts',
    content: './src/content/index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'src/popup/index.html', to: 'popup.html' },
        { from: 'src/assets', to: 'assets', noErrorOnMissing: true },
        { from: 'src/privacy.html', to: 'privacy.html' },
      ],
    }),
    argv.mode === 'development' && new ExtReloader({
        port: 9091,
        reloadPage: true,
        manifest: path.resolve(__dirname, 'src/manifest.json'),
        entries: {
          contentScript: ['content'],
          background: ['background'],
          extensionPage: ['popup'],
        },
      }),
  ].filter(Boolean),
});
