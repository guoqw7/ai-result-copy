// 扩展的弹出窗口脚本
import { Config, DEFAULT_CONFIG } from '@shared/types';
import { showStatusMessage } from '@shared/ui';
import '@shared/styles/common.css'; // 导入共享样式

// 当文档加载完成时初始化UI
document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup script loaded');
  
  // 加载配置并更新UI元素
  loadConfig();
  
  // 绑定事件处理器
  bindEventHandlers();
});

// 加载配置
function loadConfig(): void {
  chrome.storage.local.get(['removeReferences', 'userConsent', 'copyFormat', 'enableCopy'], (result) => {
    // 使用存储中的配置或默认值
    const config: Config = {
      removeReferences: result.removeReferences ?? DEFAULT_CONFIG.removeReferences,
      userConsent: result.userConsent ?? DEFAULT_CONFIG.userConsent,
      copyFormat: result.copyFormat ?? DEFAULT_CONFIG.copyFormat,
      enableCopy: result.enableCopy ?? DEFAULT_CONFIG.enableCopy
    };
    
    console.log('加载的配置:', config);
    
    // 直接更新UI元素
    const removeReferencesCheckbox = document.getElementById('removeReferences') as HTMLInputElement;
    const enableCopyCheckbox = document.getElementById('enableCopy') as HTMLInputElement;
    const formatMarkdownRadio = document.getElementById('formatMarkdown') as HTMLInputElement;
    const formatHtmlRadio = document.getElementById('formatHtml') as HTMLInputElement;
    const userConsentCheckbox = document.getElementById('user-consent') as HTMLInputElement;
    const consentStatusElement = document.getElementById('consentStatus');
    
    console.log('UI元素:', {
      removeReferencesCheckbox,
      enableCopyCheckbox,
      formatMarkdownRadio,
      formatHtmlRadio,
      userConsentCheckbox,
      consentStatusElement
    });
    
    if (removeReferencesCheckbox) removeReferencesCheckbox.checked = config.removeReferences;
    if (enableCopyCheckbox) enableCopyCheckbox.checked = config.enableCopy;
    
    if (formatMarkdownRadio && formatHtmlRadio) {
      formatMarkdownRadio.checked = config.copyFormat === 'markdown';
      formatHtmlRadio.checked = config.copyFormat === 'html';
    }
    
    if (userConsentCheckbox) userConsentCheckbox.checked = config.userConsent;
    if (consentStatusElement) consentStatusElement.style.display = config.userConsent ? 'none' : 'block';
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
  const consentStatusElement = document.getElementById('consentStatus');
  const saveButton = document.getElementById('saveButton');
  const statusElement = document.getElementById('status');
  
  console.log('绑定元素:', {
    removeReferencesCheckbox,
    enableCopyCheckbox,
    formatMarkdownRadio,
    formatHtmlRadio,
    userConsentCheckbox,
    consentStatusElement,
    saveButton,
    statusElement
  });
  
  // 用户同意复选框变更事件
  userConsentCheckbox?.addEventListener('change', () => {
    if (consentStatusElement) {
      consentStatusElement.style.display = userConsentCheckbox.checked ? 'none' : 'block';
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
  
  console.log('保存的配置:', config);
  
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