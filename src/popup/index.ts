document.addEventListener('DOMContentLoaded', () => {
  const userConsentCheckbox = document.getElementById('user-consent') as HTMLInputElement;
  const removeReferencesCheckbox = document.getElementById('removeReferences') as HTMLInputElement;
  const enableCopyCheckbox = document.getElementById('enableCopy') as HTMLInputElement;
  const saveButton = document.getElementById('saveButton') as HTMLButtonElement;
  const consentStatusDiv = document.getElementById('consent-status') as HTMLDivElement;

  // 从存储中获取配置
  chrome.storage.local.get(['removeReferences', 'userConsent', 'copyFormat', 'enableCopy'], (result) => {
    // 如果配置存在，使用存储的配置；否则使用默认值
    const removeReferences = result.removeReferences !== undefined ? result.removeReferences : true;
    const userConsent = result.userConsent !== undefined ? result.userConsent : false;
    const enableCopy = result.enableCopy !== undefined ? result.enableCopy : true;
    
    removeReferencesCheckbox.checked = removeReferences;
    userConsentCheckbox.checked = userConsent;
    enableCopyCheckbox.checked = enableCopy;
    
    // 根据用户同意状态显示或隐藏选项
    if (userConsent) {
      consentStatusDiv.style.display = 'none';
    } else {
      consentStatusDiv.style.display = 'block';
    }
  });

  // 启用复制功能复选框变更事件
  enableCopyCheckbox.addEventListener('change', () => {
    const enableCopy = enableCopyCheckbox.checked;
    chrome.storage.local.set({ enableCopy });
  });

  // 用户同意选项变更事件
  userConsentCheckbox.addEventListener('change', () => {
    const userConsent = userConsentCheckbox.checked;
    
    // 保存用户同意状态
    chrome.storage.local.set({ userConsent }, () => {
      // 根据用户同意状态显示或隐藏选项
      if (userConsent) {
        consentStatusDiv.style.display = 'none';
      } else {
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
    const enableCopy = enableCopyCheckbox.checked;
    const copyFormat = document.querySelector('input[name="copyFormat"]:checked') as HTMLInputElement;
    
    // 保存配置到存储
    chrome.storage.local.set({ removeReferences, userConsent, enableCopy, copyFormat: copyFormat.value }, () => {
      // 向所有标签页发送配置更新消息
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { 
              action: 'updateConfig', 
              config: { removeReferences, userConsent, enableCopy, copyFormat: copyFormat.value } 
            }).catch(() => {
              // 忽略无法发送消息的错误（可能是某些标签页没有加载content script）
            });
          }
        });
      });
      
      // 显示保存成功提示
      saveButton.textContent = '保存成功！';
      saveButton.style.backgroundColor = '#4caf50';
      saveButton.disabled = true;
      
      // 1秒后自动关闭popup窗口
      setTimeout(() => {
        window.close();
      }, 1000);
    });
  });
});