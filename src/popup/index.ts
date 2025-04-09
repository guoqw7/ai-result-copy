document.addEventListener('DOMContentLoaded', () => {
  const removeReferencesCheckbox = document.getElementById('removeReferences') as HTMLInputElement;
  const statusDiv = document.getElementById('status') as HTMLDivElement;
  const saveButton = document.getElementById('saveButton') as HTMLButtonElement;

  // 从存储中获取配置
  chrome.storage.local.get(['removeReferences'], (result) => {
    // 如果配置存在，使用存储的配置；否则默认为true（去除参考文献角标）
    const removeReferences = result.removeReferences !== undefined ? result.removeReferences : true;
    removeReferencesCheckbox.checked = removeReferences;
    updateStatus(removeReferences);
  });

  // 更新状态显示
  function updateStatus(removeReferences: boolean) {
    statusDiv.textContent = `已启用复制功能${removeReferences ? '（去除参考文献角标）' : '（保留参考文献角标）'}`;
  }

  // 保存按钮点击事件处理
  saveButton.addEventListener('click', () => {
    const removeReferences = removeReferencesCheckbox.checked;
    
    // 保存配置到存储
    chrome.storage.local.set({ removeReferences }, () => {
      updateStatus(removeReferences);
      
      // 显示保存成功提示
      statusDiv.textContent = `保存成功！${removeReferences ? '（去除参考文献角标）' : '（保留参考文献角标）'}`;
      
      // 向所有标签页发送配置更新消息
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { 
              action: 'updateConfig', 
              config: { removeReferences } 
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