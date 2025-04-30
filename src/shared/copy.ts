// 复制功能相关代码
import { Config, PlatformConfig } from './types';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

// 背景颜色常量
export const BACKGROUND_COLOR_OUT = 'linear-gradient(135deg, rgba(25, 239, 192, 0.6), rgba(64, 128, 255, 0.4))';
export const BACKGROUND_COLOR_OVER = 'linear-gradient(135deg, rgba(25, 239, 192, 0.8), rgba(64, 128, 255, 0.6))';
export const SETTINGS_BACKGROUND_OUT = 'linear-gradient(135deg, rgba(64, 128, 255, 0.6), rgba(25, 239, 192, 0.4))';
export const SETTINGS_BACKGROUND_OVER = 'linear-gradient(135deg, rgba(64, 128, 255, 0.8), rgba(25, 239, 192, 0.6))';

// 初始化turndown服务
export function initTurndownService(): TurndownService {
  const turndownService = new TurndownService({
    preformattedCode: true,  // 是否保留预格式化代码，设为true时会保持代码块的原始格式，包括缩进和换行
    headingStyle: 'atx',     // 标题样式，'atx'使用#号(如：# 标题)，'setext'使用底线(如：标题\n===)
    bulletListMarker: '-',   // 无序列表的标记符号，可以是 '-', '*', 或 '+'
    emDelimiter: '*',       // 斜体文本的分隔符，可以是 '_' 或 '*'
    strongDelimiter: '**',   // 加粗文本的分隔符
    codeBlockStyle: 'fenced' // 代码块样式，'fenced'使用```包裹，'indented'使用缩进
  });

  turndownService.use(gfm);

  // 自定义代码块规则
  turndownService.addRule('codeBlock', {
    filter: function (node: Node): boolean {
      if (!(node instanceof HTMLElement)) {
        return false;
      }
      // 比如【百度-AI搜索】平台，pre元素下的code元素，不是子元素而是后代元素，为了使其识别为代码块，所以需要特殊处理
      const codeElement = (node as HTMLElement).querySelector('code');
      return node.nodeName === 'PRE' && codeElement !== null;
    },
    replacement: function (content: string, node: Node): string {
      const codeElement = (node as HTMLElement).querySelector('code');
      const code = codeElement?.textContent?.trim() || '';
      const lang = codeElement?.getAttribute('class') || '';
      const languageMatch = lang.match(/language-([\w-]+)/i);
      const language = languageMatch ? languageMatch[1] : '';
      return '\n```' + (language ? language + '\n' : '\n') + code + '\n```\n';
    }
  });

  // 自定义escape函数，避免不必要的转义
  turndownService.escape = function(text) {
    return text
      .replace(/\\([!"#$%&'()*+,\-./:;<=>?@\[\]^_`{|}~])/g, '$1') // 移除已有的转义
      .replace(/([*_`])/g, '\\$1'); // 只转义特殊Markdown字符
  };

  return turndownService;
}

// Markdown 工具函数
export function stripMarkdown(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, '$1')  // 移除代码块
    .replace(/\*\*(.*?)\*\*/g, '$1')   // 移除加粗
    .replace(/\*(.*?)\*/g, '$1')       // 移除斜体
    .replace(/`([^`]+)`/g, '$1')       // 移除行内代码
    .replace(/^#+\s+/gm, '')           // 移除标题标记
    .replace(/^[-*]\s+/gm, '')         // 移除无序列表标记
    .replace(/^\d+\.\s+/gm, '')        // 移除有序列表标记
    .replace(/^>\s+/gm, '')            // 移除引用标记
    .trim();
}

// 处理Markdown文本，根据配置决定是否去除参考文献角标和特殊span节点
export function processMarkdown(markdown: Element, removeSelectorList: string[], config: Config): Element {
  // 创建节点的深拷贝，以免修改原始节点
  const clonedMarkdown = markdown.cloneNode(true) as Element;
  
  // 根据配置决定是否在拷贝的节点上移除参考文献角标
  if (config.removeReferences) {
    removeSelectorList.forEach(selector => {
      clonedMarkdown.querySelectorAll(selector).forEach(node => node.remove());
    });
  }

  // 移除零宽连字符
  const treeWalker = document.createTreeWalker(clonedMarkdown, NodeFilter.SHOW_TEXT);
  let currentNode;
  while (currentNode = treeWalker.nextNode()) {
    currentNode.textContent = currentNode.textContent?.replace(/&zwnj;|\u200c/g, '') ?? '';
  }
  
  return clonedMarkdown;
}

// 创建复制按钮的闪光动画样式
export function createGlowingAnimationStyle(): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes glowing {
      0% { box-shadow: 0 0 5px rgba(0, 255, 128, 0.8), 0 0 10px rgba(0, 0, 0, 0.8), 0 0 15px rgba(64, 128, 255, 0.6); }
      50% { box-shadow: 0 0 15px rgba(0, 255, 128, 1), 0 0 20px rgba(255, 7, 160, 0.9), 0 0 25px rgba(64, 128, 255, 0.8); }
      100% { box-shadow: 0 0 5px rgba(0, 255, 128, 0.8), 0 0 10px rgba(0, 0, 0, 0.8), 0 0 15px rgba(64, 128, 255, 0.6); }
    }
    
    @keyframes flash-animation {
      0% { opacity: 0; transform: scale(1); filter: brightness(1); background-color: rgba(255, 255, 255, 0); }
      25% { opacity: 1; transform: scale(1.02); filter: brightness(1.5); background-color: rgba(255, 255, 255, 0.95); }
      50% { opacity: 0.5; transform: scale(1.01); filter: brightness(1.2); background-color: rgba(255, 255, 255, 0.5); }
      100% { opacity: 0; transform: scale(1); filter: brightness(1); background-color: rgba(255, 255, 255, 0); }
    }
  `;
  return style;
}

// 创建复制按钮
export function createCopyButton(position: 'top' | 'middle' | 'bottom' = 'top'): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = '复制';
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
  button.style.background = BACKGROUND_COLOR_OUT;
  button.style.color = 'white';
  button.style.border = '2px dashed #fff';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  button.style.fontSize = '16px';
  button.style.zIndex = '1000';
  button.style.animation = 'glowing 2s infinite';

  // 添加悬停效果
  button.addEventListener('mouseover', () => {
    button.style.background = BACKGROUND_COLOR_OVER;
  });

  button.addEventListener('mouseout', () => {
    button.style.background = BACKGROUND_COLOR_OUT;
  });

  return button;
}

// 创建闪光效果遮罩层
export function createFlashOverlay(): HTMLDivElement {
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
  
  return flashOverlay;
}

// 为AI回答添加复制按钮
export function addCopyButtonToAnswer(
  answerElement: Element, 
  platform: PlatformConfig, 
  config: Config, 
  turndownService: TurndownService,
  copyToClipboard: (text: string) => Promise<void>
) {
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

      // 添加闪光效果
      const flashOverlay = createFlashOverlay();
      answerElement.appendChild(flashOverlay);

      // 动画结束后移除遮罩层
      flashOverlay.addEventListener('animationend', () => {
        flashOverlay.remove();
      });

      // 处理Markdown内容
      const markdownOuterHTML = processMarkdown(markdownElement, platform.removeSelectorList, config);
      
      // 根据用户选择的格式进行复制
      let content = '';
      
      if (config.copyFormat === 'markdown') {
        content = turndownService.turndown(markdownOuterHTML.outerHTML);
      } else {
        content = markdownOuterHTML.outerHTML;
      }
      
      // 复制到剪贴板
      await copyToClipboard(content);
      
      // 修改按钮文本提示复制成功
      const originalText = button.textContent;
      button.textContent = '✓ 已复制';
      
      // 一段时间后恢复按钮文本
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    });
  });
}

// 为单个平台应用复制功能
export function applyToPlatform(
  platform: PlatformConfig, 
  config: Config,
  turndownService: TurndownService,
  copyToClipboard: (text: string) => Promise<void>
) {
  if (!config.enableCopy) return;
  
  const answerElements = document.querySelectorAll(platform.selector);
  if (answerElements.length === 0) return;
  
  answerElements.forEach(element => {
    addCopyButtonToAnswer(element, platform, config, turndownService, copyToClipboard);
  });
}

// 为所有平台应用复制功能
export function applyToPlatforms(
  platforms: PlatformConfig[], 
  config: Config,
  turndownService: TurndownService,
  copyToClipboard: (text: string) => Promise<void>
) {
  platforms.forEach(platform => {
    applyToPlatform(platform, config, turndownService, copyToClipboard);
  });
}

// 监听DOM变化，为新的回答添加复制按钮
export function observeDOMChanges(
  platforms: PlatformConfig[], 
  config: Config,
  turndownService: TurndownService,
  copyToClipboard: (text: string) => Promise<void>
) {
  const observer = new MutationObserver(mutations => {
    let shouldApply = false;

    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldApply = true;
      }
    });

    if (shouldApply) {
      applyToPlatforms(platforms, config, turndownService, copyToClipboard);
    }
  });

  // 观察整个文档的变化
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  return observer;
} 