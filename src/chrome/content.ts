// Chrome 扩展内容脚本
import { Config, DEFAULT_CONFIG, PLATFORMS, PlatformConfig } from '@shared/types';
import { 
  initTurndownService, 
  createGlowingAnimationStyle, 
  applyToPlatforms, 
  observeDOMChanges 
} from '@shared/copy';
import { removeAllCopyButtons } from '@shared/ui';
import '@shared/styles/common.css';

// 配置
let config: Config = { ...DEFAULT_CONFIG };

// 复制到剪贴板函数 - Chrome 扩展版本
async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('复制失败:', err);
    // 备用复制方法
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
  }
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateConfig') {
    // 更新配置
    config = { ...config, ...message.config };
    console.log('配置已更新:', config);
    
    // 检查是否有用户同意
    const shouldApplyButtons = config.enableCopy && config.userConsent;
    
    if (shouldApplyButtons) {
      // 重新应用复制按钮
      applyToPlatforms(PLATFORMS, config, turndownService, copyToClipboard);
    } else {
      // 如果用户不同意或禁用复制，移除所有复制按钮
      removeAllCopyButtons();
    }
    
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
    
    // 检查是否有用户同意
    const shouldApplyButtons = config.enableCopy && config.userConsent;
    
    if (shouldApplyButtons) {
      // 加载配置后应用复制按钮
      applyToPlatforms(PLATFORMS, config, turndownService, copyToClipboard);
    } else {
      // 如果用户不同意或禁用复制，移除所有复制按钮
      removeAllCopyButtons();
    }
  });
}

// 添加动画样式
document.head.appendChild(createGlowingAnimationStyle());

// 初始化 Turndown 服务
const turndownService = initTurndownService();

// 创建MutationObserver实例
let observer: MutationObserver | null = null;

// 在页面加载完成后执行初始化操作
document.addEventListener('DOMContentLoaded', () => {
  console.log('AI助手复制工具已加载');
  loadConfig();
  
  // 仅当用户同意且功能启用时添加观察器
  if (config.enableCopy && config.userConsent) {
    observer = observeDOMChanges(PLATFORMS, config, turndownService, copyToClipboard);
  }
});

// 页面可能已经加载完成，立即执行
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('页面已加载，立即应用AI助手复制工具');
  loadConfig();
  
  // 仅当用户同意且功能启用时添加观察器
  if (config.enableCopy && config.userConsent) {
    observer = observeDOMChanges(PLATFORMS, config, turndownService, copyToClipboard);
  }
} 