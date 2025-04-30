// 后台脚本，用于处理扩展的后台任务
console.log('AI助手复制工具 - 后台脚本加载完成');

// 监听扩展安装或更新事件
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 首次安装
    console.log('AI助手复制工具已安装');
    
    // 设置默认配置
    chrome.storage.local.set({
      removeReferences: true,
      userConsent: true,
      copyFormat: 'markdown',
      enableCopy: true
    });
  } else if (details.reason === 'update') {
    // 扩展更新
    console.log(`AI助手复制工具已更新到版本 ${chrome.runtime.getManifest().version}`);
  }
}); 