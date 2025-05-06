// 共享的HTML模板
import { Config } from './types';

// 为了便于webpack构建时调用
export const DEFAULT_TEMPLATE_CONFIG = {
  removeReferences: true,
  userConsent: true,
  copyFormat: 'markdown' as 'markdown' | 'html',
  enableCopy: true
};

// 生成设置面板的HTML内容，为Chrome扩展和油猴脚本提供统一UI
export function createSettingsPanelHTML(
  config: Config, 
  options: {
    prefix?: string;      // 元素ID前缀，用于区分Chrome扩展和油猴脚本的元素
    title?: string;       // 标题
    includePrivacyLink?: boolean; // 是否包含隐私政策链接
    privacyLinkUrl?: string;      // 隐私政策链接URL
  } = {}
): string {
  const {
    prefix = '',
    title = 'AI助手智能复制工具-设置',
    includePrivacyLink = true,
    privacyLinkUrl = 'privacy.html'
  } = options;

  // 为ID添加前缀以避免冲突
  const ids = {
    enableCopy: `${prefix}enableCopy`,
    formatMarkdown: `${prefix}formatMarkdown`,
    formatHtml: `${prefix}formatHtml`,
    removeReferences: `${prefix}removeReferences`,
    userConsent: `${prefix}user-consent`,
    consentStatus: `${prefix}consentStatus`,
    saveButton: `${prefix}saveButton`,
    status: `${prefix}status`
  };

  return `
    <h2>${title}</h2>
    <div class="option-container">
      <div class="checkbox-container">
        <label for="${ids.enableCopy}" class="label-key">启用复制功能</label>
        <input type="checkbox" id="${ids.enableCopy}" ${config.enableCopy ? 'checked' : ''} />
      </div>
      <div class="checkbox-container">
        <label class="label-key">复制出的结果</label>
        <div class="radio-group">
          <input
            type="radio"
            id="${ids.formatMarkdown}"
            name="${prefix}copyFormat"
            value="markdown"
            ${config.copyFormat === 'markdown' ? 'checked' : ''}
          />
          <label for="${ids.formatMarkdown}">markdown</label>
          <input 
            type="radio" 
            id="${ids.formatHtml}" 
            name="${prefix}copyFormat" 
            value="html"
            ${config.copyFormat === 'html' ? 'checked' : ''}
          />
          <label for="${ids.formatHtml}">html格式</label>
        </div>
      </div>
      <div class="checkbox-container">
        <label for="${ids.removeReferences}" class="label-key">去除参考文献角标</label>
        <input type="checkbox" id="${ids.removeReferences}" ${config.removeReferences ? 'checked' : ''} />
      </div>
    </div>

    <div id="${prefix}consent-container" class="consent-container">
      <div class="checkbox-container">
        <input type="checkbox" id="${ids.userConsent}" ${config.userConsent ? 'checked' : ''} />
        <label for="${ids.userConsent}">
          <strong>我同意</strong>此扩展在我使用复制功能时临时处理内容
        </label>
      </div>
      <div id="${ids.consentStatus}" class="disabled-notice" style="${config.userConsent ? 'display: none;' : 'display: block;'}">
        请同意隐私政策以启用功能
      </div>
      <div class="privacy-notice">
        <strong>隐私说明：</strong>本扩展仅在您点击复制按钮时临时处理内容，所有数据处理均在本地完成，不会上传任何内容到服务器。
        ${includePrivacyLink ? `
        <a
          href="${privacyLinkUrl}"
          id="${prefix}privacy-link"
          target=${prefix ? 'blank' : '_blank'}
          class="privacy-link"
        >查看完整隐私政策 »</a>
        ` : ''}
      </div>
    </div>
    
    <div class="platforms-info">
      支持平台：百度-AI搜索、字节-豆包、腾讯-元宝
    </div>
    <div class="platforms-info unsupported">
      无须支持平台：百度-文心一言、阿里-通义千问
    </div>
    
    <button id="${ids.saveButton}">保存设置</button>
    <div id="${ids.status}" class="status-message"></div>
  `;
}

// 为了支持在webpack构建时使用CommonJS模块
// 使用类型判断来避免TypeScript错误
declare global {
  interface NodeModule {
    exports: any;
  }
  
  var module: NodeModule | undefined;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createSettingsPanelHTML,
    DEFAULT_CONFIG: DEFAULT_TEMPLATE_CONFIG
  };
} 