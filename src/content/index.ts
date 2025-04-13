// 导入类型定义和复制功能相关函数
import { Config, PlatformConfig } from './types';
import { applyToPlatforms } from './copy';

// 默认配置
let config: Config = {
  removeReferences: true, // 默认去除参考文献角标
  userConsent: true,// 默认获得用户同意
  copyFormat: 'markdown',
  enableCopy: true // 默认启用复制功能
};

// 支持的AI平台配置
const platforms: PlatformConfig[] = [
  // { name: '阿里-通义千问', selector: '[class*=""]', markdownContentClass: '', referenceSelector: ''  },
  // ['去除参考文献角标','去除百度-AI搜索平台特有的：普通【代码块】的头部功能区','去除豆包平台特有的：可全屏放大的【代码块】对应元素，此元素会包含base64编码的TRAE图标，也会被连带复制出来'] 
  { name: '百度-AI搜索', selector: '[class*="cosd-markdown-content"]', markdownContentClass: 'marklang', removeSelectorList: ['span[disable-audio="true"][disable-copy="true"]', '.cosd-markdown-code-copy.cos-link'] },
  // { name: '百度-文心一言', selector: '[class*=""]', markdownContentClass: '', removeSelectorList: ['']  },
  {
    name: '字节-豆包', selector: '[class*="receive-message-box-content-"]', markdownContentClass: 'flow-markdown-body',
    // ['去除参考文献角标','去除豆包平台特有的：普通【代码块】的头部功能区','去除豆包平台特有的：可全屏放大的【代码块】对应元素，此元素会包含base64编码的TRAE图标，也会被连带复制出来'] 
    removeSelectorList: ['.ref_content_circle', '.code-area [class*="header-"]', '[class*="canvas_wrapper-"]']
  },
  { name: '腾讯-元宝', selector: '[class*="hyc-content-md"]', markdownContentClass: 'hyc-common-markdown', removeSelectorList: ['.hyc-common-markdown__ref-list'] }
];

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateConfig') {
    // 更新配置
    config = { ...config, ...message.config };
    console.log('配置已更新:', config);
    // 重新应用复制按钮
    applyToPlatforms(platforms, config);
    sendResponse({ status: 'success' });
    return true;
  }
});

// 从存储中加载配置
function loadConfig() {
  chrome.storage.local.get(['removeReferences', 'userConsent', 'copyFormat', 'enableCopy'], (result) => {
    if (result.removeReferences !== undefined) {
      config.removeReferences = result.removeReferences;
    }
    if (result.userConsent !== undefined) {
      config.userConsent = result.userConsent;
    }
    if (result.copyFormat !== undefined) {
      config.copyFormat = result.copyFormat;
    }
    if (result.enableCopy !== undefined) {
      config.enableCopy = result.enableCopy;
    }
    console.log('加载配置:', config);
    // 加载配置后应用复制按钮
    applyToPlatforms(platforms, config);
  });
}

// 监听DOM变化，为新的回答添加复制按钮
function observeDOMChanges() {
  const observer = new MutationObserver(mutations => {
    let shouldApply = false;

    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldApply = true;
      }
    });

    if (shouldApply) {
      applyToPlatforms(platforms, config);
    }
  });

  // 观察整个文档的变化
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// 在页面加载完成后执行初始化操作
document.addEventListener('DOMContentLoaded', () => {
  console.log('AI助手复制工具已加载');
  loadConfig();
  observeDOMChanges();
});

// 页面可能已经加载完成，立即执行
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('页面已加载，立即应用AI助手复制工具');
  loadConfig();
  observeDOMChanges();
}