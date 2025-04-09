// 配置信息
interface Config {
  removeReferences: boolean;
}

// 默认配置
let config: Config = {
  removeReferences: true // 默认去除参考文献角标
};

// AI平台配置
interface PlatformConfig {
  name: string;
  selector: string;
  markdownContentClass: string;
  referenceSelector: string;
}

// 支持的AI平台配置
const platforms: PlatformConfig[] = [
  // { name: '阿里-通义千问', selector: '', markdownContentClass: '', referenceSelector: ''  },
  { name: '百度-AI搜索', selector: 'cosd-markdown-content', markdownContentClass: 'marklang', referenceSelector: 'span[disable-audio="true"][disable-copy="true"]' },
  // { name: '百度-文心一言', selector: '', markdownContentClass: '', referenceSelector: ''  },
  { name: '字节-豆包', selector: 'receive-message-box-content-', markdownContentClass: 'flow-markdown-body', referenceSelector: '.ref_content_circle'  },
  { name: '腾讯-元宝', selector: 'hyc-content-md', markdownContentClass: 'hyc-common-markdown', referenceSelector: '.hyc-common-markdown__ref-list'  }
];

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateConfig') {
    // 更新配置
    config = { ...config, ...message.config };
    console.log('配置已更新:', config);
    // 重新应用复制按钮
    applyToPlatforms();
    sendResponse({ status: 'success' });
    return true;
  }
});

// 从存储中加载配置
function loadConfig() {
  chrome.storage.local.get(['removeReferences'], (result) => {
    if (result.removeReferences !== undefined) {
      config.removeReferences = result.removeReferences;
    }
    console.log('加载配置:', config);
    // 加载配置后应用复制按钮
    applyToPlatforms();
  });
}
// Markdown 工具函数
function stripMarkdown(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, '$1')  // 移除代码块
    .replace(/\*\*(.*?)\*\*/g, '$1')   // 移除加粗
    .replace(/\*(.*?)\*/g, '$1')       // 移除斜体
    .replace(/`([^`]+)`/g, '$1')       // 移除行内代码
    .replace(/^#+\s+/gm, '')           // 移除标题标记
    .replace(/^[-*]\s+/gm, '')         // 移除无序列表标记
    .replace(/^\d+\.\s+/gm, '')        // 移除有序列表标记
    .replace(/^>\s+/gm, '')            // 移除引用标记
    .replace(/^>\s+/gm, '')            // 移除引用标记
    .trim();
}
// 处理Markdown文本，根据配置决定是否去除参考文献角标和特殊span节点
function processMarkdown(markdown:Element, referenceSelector:string): Element {
  // 创建节点的深拷贝，以免修改原始节点
  const clonedMarkdown = markdown.cloneNode(true) as Element;
  // 根据配置决定是否在拷贝的节点上移除参考文献角标
  if (config.removeReferences) {
    clonedMarkdown.querySelectorAll(referenceSelector).forEach(span => span.remove());
  }
  return clonedMarkdown;
}

const backgroundColorOut = 'linear-gradient(135deg, rgba(25, 239, 192, 0.6), rgba(64, 128, 255, 0.4))';
const backgroundColorOver = 'linear-gradient(135deg, rgba(25, 239, 192, 0.8), rgba(64, 128, 255, 0.6))';
// 创建复制按钮
function createCopyButton(position: 'top' | 'middle' | 'bottom' = 'top'): HTMLButtonElement {

  const button = document.createElement('button');
  button.textContent = '复制'
  button.className = 'ai-copy-button';
  button.style.position = 'absolute';
  
  // 根据位置设置top和bottom值
  switch(position) {
    case 'top':
      button.style.top = '10px';
      break;
    case 'middle':
      button.style.top = '50%';
      button.style.transform = 'translateY(-50%)';
      break;
    case 'bottom':
      button.style.bottom = '10px';
      break;
  }
  button.style.right = '10px';
  button.style.padding = '4px 8px';
  button.style.background = backgroundColorOut;
  button.style.color = 'white';
  button.style.border = '2px dashed #fff';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  button.style.fontSize = '16px';
  button.style.zIndex = '1000';
  button.style.animation = 'glowing 2s infinite';
  
  // 添加荧光动画样式
  const style = document.createElement('style');
  style.textContent = `
    @keyframes glowing {
      0% { box-shadow: 0 0 5px rgba(0, 255, 128, 0.8), 0 0 10px rgba(0, 0, 0, 0.8), 0 0 15px rgba(64, 128, 255, 0.6); }
      50% { box-shadow: 0 0 15px rgba(0, 255, 128, 1), 0 0 20px rgba(255, 7, 160, 0.9), 0 0 25px rgba(64, 128, 255, 0.8); }
      100% { box-shadow: 0 0 5px rgba(0, 255, 128, 0.8), 0 0 10px rgba(0, 0, 0, 0.8), 0 0 15px rgba(64, 128, 255, 0.6); }
    }
  `;
  document.head.appendChild(style);

  button.addEventListener('mouseover', () => {
    button.style.background = backgroundColorOver;
  });

  button.addEventListener('mouseout', () => {
    button.style.background = backgroundColorOut;
  });

  return button;
}

// 为AI回答添加复制按钮
function addCopyButtonToAnswer(answerElement: Element, platform: PlatformConfig) {
  // 检查是否已经添加了复制按钮
  if (answerElement.querySelector('.ai-copy-button')) {
    return;
  }

  // 设置相对定位，以便正确放置复制按钮
  if (window.getComputedStyle(answerElement).position === 'static') {
    (answerElement as HTMLElement).style.position = 'relative';
  }

  // 创建三个不同位置的复制按钮
  const positions: Array<'top' | 'middle' | 'bottom'> = ['top', 'middle', 'bottom'];
  positions.forEach(position => {
    const button = createCopyButton(position);
    answerElement.appendChild(button);

    // 为每个按钮添加点击事件
    button.addEventListener('click', async () => {
      // 让按钮获得焦点
      button.focus();
      // 查找Markdown内容
      const markdownElement = answerElement.querySelector(`[class*="${platform.markdownContentClass}"]`);
      if (!markdownElement) {
        console.error('未找到Markdown内容元素');
        return;
      }

      // 创建闪光效果遮罩层
      const flashOverlay = document.createElement('div');
      flashOverlay.style.position = 'absolute';
      flashOverlay.style.top = '0';
      flashOverlay.style.left = '0';
      flashOverlay.style.width = '100%';
      flashOverlay.style.height = '100%';
      flashOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0)';
      flashOverlay.style.animation = 'flash-animation 1s ease-in-out';
      flashOverlay.style.pointerEvents = 'none';
      flashOverlay.style.zIndex = '999';

      // 添加增强的闪光动画样式
      const style = document.createElement('style');
      style.textContent = `
        @keyframes flash-animation {
          0% { opacity: 0; transform: scale(1); filter: brightness(1); background-color: rgba(255, 255, 255, 0); }
          25% { opacity: 1; transform: scale(1.02); filter: brightness(1.5); background-color: rgba(255, 255, 255, 0.95); }
          50% { opacity: 0.5; transform: scale(1.01); filter: brightness(1.2); background-color: rgba(255, 255, 255, 0.5); }
          100% { opacity: 0; transform: scale(1); filter: brightness(1); background-color: rgba(255, 255, 255, 0); }
        }
      `;
      document.head.appendChild(style);
      answerElement.appendChild(flashOverlay);

      // 动画结束后移除遮罩层和样式
      flashOverlay.addEventListener('animationend', () => {
        flashOverlay.remove();
        style.remove();
      });

      const markdownOuterHTML = processMarkdown(markdownElement, platform.referenceSelector);
      const htmlContent = markdownOuterHTML.innerHTML;
      // 获取原始Markdown文本
      const markdownText = markdownOuterHTML.textContent || '';

      // 为纯文本环境准备纯文本
      const plainText = stripMarkdown(markdownText);
      if (!markdownText) {
        console.error('Markdown内容为空');
        return;
      }

      // 创建包含两种格式的 ClipboardItem
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([htmlContent], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' })
      });
      try {
        // 使用现代Clipboard API复制文本
        await navigator.clipboard.write([clipboardItem]);

        // 临时改变按钮文本表示成功
        button.textContent = '已复制';
        button.style.backgroundColor = backgroundColorOut;

        setTimeout(() => {
          button.textContent = '复制';
          button.style.backgroundColor = backgroundColorOver;
        }, 1500);
      } catch (err) {
        console.error('复制失败:', err);
        setTimeout(() => {
          button.textContent = '复制';
          button.style.backgroundColor = backgroundColorOver;
        }, 1500);
      }
    });
  });
}
// 为特定平台应用复制按钮
function applyToPlatform(platform: PlatformConfig) {
  const answerElements = document.querySelectorAll(`[class*="${platform.selector}"]`);

  answerElements.forEach(element => {
    addCopyButtonToAnswer(element, platform);
  });
}

// 为所有支持的平台应用复制按钮
function applyToPlatforms() {
  platforms.forEach(platform => {
    applyToPlatform(platform);
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
      applyToPlatforms();
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