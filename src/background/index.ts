// 监听扩展安装事件
chrome.runtime.onInstalled.addListener(() => {
  // 初始化配置数据
  chrome.storage.local.set({ 
    removeReferences: true, // 默认去除参考文献角标
    userConsent: true // 默认获得用户同意
  });
  console.log('AI助手复制工具已安装');
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'configUpdate') {
    // 处理配置更新
    chrome.storage.local.set({ removeReferences: message.removeReferences }, () => {
      sendResponse({ status: 'success' });
    });
    return true; // 保持消息通道开启以支持异步响应
  }
});

