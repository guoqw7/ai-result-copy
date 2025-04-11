document.addEventListener('DOMContentLoaded', () => {
  const userConsentCheckbox = document.getElementById('userConsent') as HTMLInputElement;
  const removeReferencesCheckbox = document.getElementById('removeReferences') as HTMLInputElement;
  const statusDiv = document.getElementById('status') as HTMLDivElement;
  const saveButton = document.getElementById('saveButton') as HTMLButtonElement;
  const optionsDiv = document.getElementById('options') as HTMLDivElement;
  const consentStatusDiv = document.getElementById('consent-status') as HTMLDivElement;
  const privacyLink = document.getElementById('privacy-link') as HTMLAnchorElement;
  
  // 设置隐私政策链接的正确URL
  const extensionId = chrome.runtime.id;
  privacyLink.href = `chrome-extension://${extensionId}/privacy.html`;

  // 从存储中获取配置
  chrome.storage.local.get(['removeReferences', 'userConsent'], (result) => {
    // 如果配置存在，使用存储的配置；否则默认为true（去除参考文献角标）
    const removeReferences = result.removeReferences !== undefined ? result.removeReferences : true;
    const userConsent = result.userConsent !== undefined ? result.userConsent : false;
    
    removeReferencesCheckbox.checked = removeReferences;
    userConsentCheckbox.checked = userConsent;
    
    // 根据用户同意状态显示或隐藏选项
    if (userConsent) {
      optionsDiv.style.display = 'block';
      consentStatusDiv.style.display = 'none';
      updateStatus(removeReferences);
    } else {
      optionsDiv.style.display = 'none';
      consentStatusDiv.style.display = 'block';
    }
  });

  // 更新状态显示
  function updateStatus(removeReferences: boolean) {
    statusDiv.textContent = `已启用复制功能${removeReferences ? '（去除参考文献角标）' : '（保留参考文献角标）'}`;
  }

  // 用户同意选项变更事件
  userConsentCheckbox.addEventListener('change', () => {
    const userConsent = userConsentCheckbox.checked;
    
    // 保存用户同意状态
    chrome.storage.local.set({ userConsent }, () => {
      // 根据用户同意状态显示或隐藏选项
      if (userConsent) {
        optionsDiv.style.display = 'block';
        consentStatusDiv.style.display = 'none';
        updateStatus(removeReferencesCheckbox.checked);
      } else {
        optionsDiv.style.display = 'none';
        consentStatusDiv.style.display = 'block';
      }
      
      // 向所有标签页发送用户同意状态更新
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { 
              action: 'updateConfig', 
              config: { userConsent, removeReferences: removeReferencesCheckbox.checked } 
            }).catch(() => {
              // 忽略无法发送消息的错误
            });
          }
        });
      });
    });
  });

  // 保存按钮点击事件处理
  saveButton.addEventListener('click', () => {
    const removeReferences = removeReferencesCheckbox.checked;
    const userConsent = userConsentCheckbox.checked;
    
    // 保存配置到存储
    chrome.storage.local.set({ removeReferences, userConsent }, () => {
      updateStatus(removeReferences);
      
      // 显示保存成功提示
      statusDiv.textContent = `保存成功！${removeReferences ? '（去除参考文献角标）' : '（保留参考文献角标）'}`;
      
      // 向所有标签页发送配置更新消息
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { 
              action: 'updateConfig', 
              config: { removeReferences, userConsent } 
            }).catch(() => {
              // 忽略无法发送消息的错误（可能是某些标签页没有加载content script）
            });
          }
        });
      });
      
      // 1秒后自动关闭popup窗口
      setTimeout(() => {
        window.close();
      }, 1000);
    });
  });
});