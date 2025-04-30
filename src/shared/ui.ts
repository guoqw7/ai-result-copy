// UI相关的共享代码
import { Config } from './types';
import { createSettingsPanelHTML } from './templates';

// 创建油猴设置面板的HTML内容
export function createTampermonkeySettingsHTML(config: Config): string {
  return createSettingsPanelHTML(config, {
    prefix: 'tm-',
    includePrivacyLink: false // 油猴脚本中不包含隐私链接
  });
}

// 创建油猴设置面板
export function createTampermonkeySettingsPanel(
  config: Config, 
  updateConfigCallback: (newConfig: Partial<Config>) => void
): HTMLDivElement {
  // 创建主容器
  const panelWrapper = document.createElement('div');
  panelWrapper.className = 'tm-settings-panel';
  
  // 创建设置图标
  const settingsIcon = document.createElement('div');
  settingsIcon.textContent = '⚙️';
  settingsIcon.className = 'tm-settings-icon';
  
  // 创建设置面板内容
  const settingsPanel = document.createElement('div');
  settingsPanel.className = 'tm-settings-content';
  settingsPanel.innerHTML = createTampermonkeySettingsHTML(config);
  
  // 点击图标显示/隐藏设置面板
  settingsIcon.addEventListener('click', () => {
    settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
  });
  
  // 点击页面其他位置隐藏设置面板
  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as Node;
    if (!panelWrapper.contains(target)) {
      settingsPanel.style.display = 'none';
    }
  });
  
  // 绑定设置变更事件
  settingsPanel.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    const newConfig = {} as Partial<Config>;
    
    if (target.id === 'tm-remove-references') {
      newConfig.removeReferences = target.checked;
    } else if (target.id === 'tm-enableCopy') {
      newConfig.enableCopy = target.checked;
    } else if (target.id === 'tm-user-consent') {
      newConfig.userConsent = target.checked;
      const consentStatus = document.getElementById('tm-consent-status');
      if (consentStatus) {
        consentStatus.style.display = target.checked ? 'none' : 'block';
      }
    } else if (target.name === 'tm-copyFormat') {
      newConfig.copyFormat = target.value as 'markdown' | 'html';
    }
    
    updateConfigCallback(newConfig);
  });
  
  // 保存按钮事件
  const saveButton = settingsPanel.querySelector('#tm-saveButton');
  if (saveButton) {
    saveButton.addEventListener('click', () => {
      const statusElement = document.getElementById('tm-status');
      if (statusElement) {
        statusElement.textContent = '设置已保存';
        statusElement.style.display = 'block';
        
        // 2秒后隐藏提示
        setTimeout(() => {
          statusElement.style.display = 'none';
        }, 2000);
      }
    });
  }
  
  // 添加到DOM
  panelWrapper.appendChild(settingsIcon);
  panelWrapper.appendChild(settingsPanel);
  return panelWrapper;
}

// 移除所有复制按钮
export function removeAllCopyButtons(): void {
  const copyButtons = document.querySelectorAll('.ai-copy-button');
  copyButtons.forEach(button => button.remove());
}

// 显示临时状态消息
export function showStatusMessage(
  element: HTMLElement, 
  message: string, 
  options: {
    duration?: number;  // 消息显示时长 (ms)
    textColor?: string; // 文字颜色
    bgColor?: string;   // 背景颜色
  } = {}
): void {
  const {
    duration = 2000,
    textColor = '#4CAF50',
    bgColor = '#f1f8e9'
  } = options;

  // 保存原始样式
  const originalDisplay = element.style.display;
  const originalText = element.textContent;
  const originalColor = element.style.color;
  const originalBgColor = element.style.backgroundColor;
  
  // 设置新样式并显示
  element.textContent = message;
  element.style.color = textColor;
  element.style.backgroundColor = bgColor;
  element.style.display = 'block';
  
  // 在指定时间后恢复
  setTimeout(() => {
    element.style.display = originalDisplay;
    element.textContent = originalText;
    element.style.color = originalColor;
    element.style.backgroundColor = originalBgColor;
  }, duration);
} 