// 扩展的弹出窗口脚本
import { Config, DEFAULT_CONFIG } from '@shared/types';
import { createSettingsPanelHTML } from '@shared/templates';
import { showStatusMessage } from '@shared/ui';
import '@shared/styles/common.css'; // 导入共享样式

// 当文档加载完成时初始化UI
document.addEventListener('DOMContentLoaded', () => {
  // 首先加载配置
  loadConfig().then(config => {
    // 然后渲染设置面板
    renderSettingsPanel(config);
    
    // 绑定事件处理器
    bindEventHandlers();
  });
});

// 加载配置
function loadConfig(): Promise<Config> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['removeReferences', 'userConsent', 'copyFormat', 'enableCopy'], (result) => {
      // 使用存储中的配置或默认值
      const config: Config = {
        removeReferences: result.removeReferences ?? DEFAULT_CONFIG.removeReferences,
        userConsent: result.userConsent ?? DEFAULT_CONFIG.userConsent,
        copyFormat: result.copyFormat ?? DEFAULT_CONFIG.copyFormat,
        enableCopy: result.enableCopy ?? DEFAULT_CONFIG.enableCopy
      };
      
      resolve(config);
    });
  });
}

// 渲染设置面板
function renderSettingsPanel(config: Config): void {
  const settingsContainer = document.getElementById('settings-container');
  if (!settingsContainer) return;
  
  // 使用共享的模板生成HTML
  settingsContainer.innerHTML = createSettingsPanelHTML(config, {
    prefix: '', // Chrome扩展不需要前缀
    privacyLinkUrl: 'privacy.html' // 使用Chrome扩展的隐私政策链接
  });
}

// 绑定事件处理器
function bindEventHandlers(): void {
  // 获取DOM元素
  const removeReferencesCheckbox = document.getElementById('removeReferences') as HTMLInputElement;
  const enableCopyCheckbox = document.getElementById('enableCopy') as HTMLInputElement;
  const formatMarkdownRadio = document.getElementById('formatMarkdown') as HTMLInputElement;
  const formatHtmlRadio = document.getElementById('formatHtml') as HTMLInputElement;
  const userConsentCheckbox = document.getElementById('user-consent') as HTMLInputElement;
  const consentStatus = document.getElementById('consent-status');
  const saveButton = document.getElementById('saveButton');
  const statusElement = document.getElementById('status');
  
  // 用户同意复选框变更事件
  userConsentCheckbox?.addEventListener('change', () => {
    if (consentStatus) {
      consentStatus.style.display = userConsentCheckbox.checked ? 'none' : 'block';
    }
  });
  
  // 保存按钮点击事件
  saveButton?.addEventListener('click', saveConfig);
}

// 保存配置
function saveConfig(): void {
  // 获取DOM元素的值
  const removeReferencesCheckbox = document.getElementById('removeReferences') as HTMLInputElement;
  const enableCopyCheckbox = document.getElementById('enableCopy') as HTMLInputElement;
  const userConsentCheckbox = document.getElementById('user-consent') as HTMLInputElement;
  const statusElement = document.getElementById('status') as HTMLElement;
  const saveButton = document.getElementById('saveButton') as HTMLButtonElement;
  
  // 获取选中的单选按钮
  const selectedRadio = document.querySelector('input[name="copyFormat"]:checked') as HTMLInputElement;
  
  // 构建配置对象
  const config: Config = {
    removeReferences: removeReferencesCheckbox?.checked ?? DEFAULT_CONFIG.removeReferences,
    userConsent: userConsentCheckbox?.checked ?? DEFAULT_CONFIG.userConsent,
    copyFormat: (selectedRadio?.value as 'markdown' | 'html') ?? DEFAULT_CONFIG.copyFormat,
    enableCopy: enableCopyCheckbox?.checked ?? DEFAULT_CONFIG.enableCopy
  };
  
  // 保存到存储
  chrome.storage.local.set(config, () => {
    // 向所有标签页发送配置更新消息
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { 
            action: 'updateConfig', 
            config 
          }).catch(() => {
            // 忽略无法发送消息的错误
          });
        }
      });
    });
    
    // 显示保存成功提示
    if (statusElement) {
      showStatusMessage(statusElement, '保存成功！');
    }
    
    if (saveButton) {
      saveButton.textContent = '保存成功！';
      saveButton.style.backgroundColor = '#4caf50';
      saveButton.disabled = true;
    }
    
    // 1秒后自动关闭popup窗口
    setTimeout(() => {
      window.close();
    }, 1000);
  });
} 