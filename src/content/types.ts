// 类型定义文件

// 配置信息
export interface Config {
  removeReferences: boolean;
  userConsent: boolean; // 添加用户同意选项
}

// AI平台配置
export interface PlatformConfig {
  name: string;
  selector: string;
  markdownContentClass: string;
  // 需要移除的元素对应的选择器列表
  removeSelectorList: string[];
}