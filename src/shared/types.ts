// 共享类型定义

// 配置信息
export interface Config {
  removeReferences: boolean;
  userConsent: boolean;
  copyFormat: 'markdown' | 'html';
  enableCopy: boolean;
}

// AI平台配置
export interface PlatformConfig {
  name: string;
  selector: string;
  markdownContentClass: string;
  removeSelectorList: string[];
}

// 导出默认配置
export const DEFAULT_CONFIG: Config = {
  removeReferences: true, // 默认去除参考文献角标
  userConsent: true, // 默认获得用户同意
  copyFormat: 'markdown',
  enableCopy: true // 默认启用复制功能
};

// 支持的AI平台配置
export const PLATFORMS: PlatformConfig[] = [
  {
    name: '百度-AI搜索', 
    selector: '[class*="cosd-markdown-content"]', 
    markdownContentClass: 'marklang', 
    removeSelectorList: ['span[disable-audio="true"][disable-copy="true"]', '.cosd-markdown-code-copy.cos-link']
  },
  {
    name: '字节-豆包', 
    selector: '[class*="receive-message-box-content-"]', 
    markdownContentClass: 'flow-markdown-body',
    removeSelectorList: ['.ref_content_circle', '.code-area [class*="header-"]', '[class*="canvas_wrapper-"]']
  },
  {
    name: '腾讯-元宝', 
    selector: '[class*="hyc-content-md"]', 
    markdownContentClass: 'hyc-common-markdown', 
    removeSelectorList: ['.hyc-common-markdown__ref-list']
  }
]; 