// ==UserScript==
// @name         AI助手复制工具
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  为AI助手平台（通义千问、文心一言、豆包、元宝、百度）添加复制按钮，整理markdown文本并去除参考文献角标
// @author       AI助手复制工具
// @match        *://*.baidu.com/*
// @match        *://*.doubao.com/*
// @match        *://*.tencent.com/*
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://cdn.jsdelivr.net/npm/turndown@7.1.2/dist/turndown.js
// @require      https://cdn.jsdelivr.net/npm/turndown-plugin-gfm@1.0.2/dist/turndown-plugin-gfm.js
// ==/UserScript==

import { Config, PlatformConfig, DEFAULT_CONFIG, PLATFORMS } from '../shared/types';
import {
  initTurndownService,
  applyToPlatforms,
  observeDOMChanges,
  createGlowingAnimationStyle
} from '../shared/copy';
import { removeAllCopyButtons } from '../shared/ui';
import { createSettingsPanelHTML } from '../shared/templates';
import { showStatusMessage } from '../shared/ui';
import commonCss from '../shared/styles/common.css';
import tampermonkeyCss from '../shared/styles/tampermonkey.css';

(function() {
    'use strict';

    // 添加样式
    GM_addStyle(commonCss);
    GM_addStyle(tampermonkeyCss);

    // 添加动画样式
    document.head.appendChild(createGlowingAnimationStyle());

    // 配置
    const config: Config = {
        removeReferences: GM_getValue('removeReferences', DEFAULT_CONFIG.removeReferences),
        userConsent: GM_getValue('userConsent', DEFAULT_CONFIG.userConsent),
        copyFormat: GM_getValue('copyFormat', DEFAULT_CONFIG.copyFormat) as 'markdown' | 'html',
        enableCopy: GM_getValue('enableCopy', DEFAULT_CONFIG.enableCopy)
    };

    // 复制到剪贴板函数 - 油猴脚本版本
    async function copyToClipboard(text: string): Promise<void> {
        GM_setClipboard(text);
    }

    // 更新配置方法
    function updateConfig(newConfig: Partial<Config>) {
        Object.assign(config, newConfig);
        
        // 保存到GM存储
        GM_setValue('removeReferences', config.removeReferences);
        GM_setValue('userConsent', config.userConsent);
        GM_setValue('copyFormat', config.copyFormat);
        GM_setValue('enableCopy', config.enableCopy);
        
        // 检查是否有用户同意
        const shouldApplyButtons = config.enableCopy && config.userConsent;
        
        if (shouldApplyButtons) {
            // 重新应用复制按钮
            applyToPlatforms(PLATFORMS, config, turndownService, copyToClipboard);
        } else {
            // 如果用户不同意或禁用复制，移除所有复制按钮
            removeAllCopyButtons();
        }
    }

    // 初始化 Turndown 服务
    const turndownService = initTurndownService();
    
    // 创建MutationObserver实例
    let observer: MutationObserver | null = null;
    
    // 设置面板实例
    let settingsPanel: HTMLDivElement | null = null;
    
    // 设置面板位置状态
    const panelPosition = {
        top: GM_getValue('settingsPanelTop', 300),
        isDragging: false,
        dragStartY: 0,
        dragStartTop: 0,
        isPanelOpen: false,
        wasDragged: false
    };

    // 创建油猴设置面板的HTML内容
    function createTampermonkeySettingsHTML(config: Config): string {
        return createSettingsPanelHTML(config, {
            prefix: 'tm-',
            includePrivacyLink: false // 油猴脚本中不包含隐私链接
        });
    }

    // 创建油猴设置面板
    function createTampermonkeySettingsPanel(): HTMLDivElement {
        // 创建设置面板内容
        const settingsContent = document.createElement('div');
        settingsContent.className = 'tm-settings-content';
        settingsContent.innerHTML = createTampermonkeySettingsHTML(config);
        
        // 添加关闭按钮
        const closeButton = document.createElement('div');
        closeButton.className = 'tm-settings-close';
        closeButton.innerHTML = '×';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '15px';
        closeButton.style.fontSize = '24px';
        closeButton.style.fontWeight = 'bold';
        closeButton.style.cursor = 'pointer';
        closeButton.style.color = '#999';
        closeButton.title = '关闭';
        
        // 定义关闭面板的函数
        const closePanel = () => {
            settingsContent.style.display = 'none';
            panelPosition.isPanelOpen = false;
        };
        
        // 关闭按钮点击事件
        closeButton.addEventListener('click', closePanel);
        
        // 绑定设置变更事件
        settingsContent.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            const newConfig = {} as Partial<Config>;
            
            if (target.id === 'tm-removeReferences') {
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
            
            updateConfig(newConfig);
        });
        
        // 保存按钮事件
        const saveButton = settingsContent.querySelector('#tm-saveButton');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                const statusElement = document.getElementById('tm-status');
                if (statusElement) {
                    showStatusMessage(statusElement, '设置已保存');
                }
                // 保存后关闭设置面板
                setTimeout(() => {
                    closePanel();
                }, 1500);
            });
        }
        
        // 添加关闭按钮到面板内容
        settingsContent.appendChild(closeButton);
        
        return settingsContent;
    }

    // 创建单个设置按钮
    function createFixedSettingsButton(): HTMLDivElement {
        const button = document.createElement('div');
        button.className = 'tm-fixed-settings-button';
        button.innerHTML = '⚙️';
        button.title = '设置';
        button.style.top = `${panelPosition.top}px`;
        button.style.position = 'fixed';
        button.style.right = '0';
        button.style.width = '30px';
        button.style.fontSize = '20px';
        button.style.textAlign = 'right';
        button.style.lineHeight = '30px';
        button.style.borderTopLeftRadius = '34px';
        button.style.borderBottomLeftRadius = '34px';
        button.style.cursor = 'pointer';
        button.style.background = 'linear-gradient(135deg, rgba(25, 239, 192, 0.6), rgba(64, 128, 255, 0.4))';
        
        // 添加点击事件，打开设置面板
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // 防止冒泡到document
            
            // 如果刚刚拖动过，不触发打开面板
            if (panelPosition.wasDragged) {
                panelPosition.wasDragged = false;
                return;
            }
            
            openSettingsPanel();
        });
        
        // 添加拖动功能
        button.addEventListener('mousedown', (e) => {
            // 仅响应鼠标左键
            if (e.button !== 0) return;
            
            // 如果面板已打开，不允许拖动按钮
            if (panelPosition.isPanelOpen) {
                e.stopPropagation();
                return;
            }
            
            panelPosition.isDragging = true;
            panelPosition.wasDragged = false; // 重置拖动状态
            panelPosition.dragStartY = e.clientY;
            panelPosition.dragStartTop = panelPosition.top;
            
            e.preventDefault(); // 防止文本选择
            
            // 添加临时全局鼠标事件监听器
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });
        
        return button;
    }
    
    // 处理鼠标移动事件
    function handleMouseMove(e: MouseEvent): void {
        if (!panelPosition.isDragging) return;
        
        const button = document.querySelector('.tm-fixed-settings-button') as HTMLElement;
        if (!button) return;
        
        // 计算新位置
        const deltaY = e.clientY - panelPosition.dragStartY;
        
        // 如果移动距离大于5像素，标记为已拖动
        if (Math.abs(deltaY) > 5) {
            panelPosition.wasDragged = true;
        }
        
        const newTop = Math.max(10, panelPosition.dragStartTop + deltaY);
        const maxTop = window.innerHeight - 50; // 防止按钮被拖到屏幕外
        
        panelPosition.top = Math.min(newTop, maxTop);
        button.style.top = `${panelPosition.top}px`;
        
        // 如果面板是打开的，同时更新面板位置
        if (panelPosition.isPanelOpen && settingsPanel) {
            const settingsContent = settingsPanel.querySelector('.tm-settings-content') as HTMLElement;
            if (settingsContent) {
                adjustPanelPosition(settingsContent);
            }
        }
    }
    
    // 处理鼠标松开事件
    function handleMouseUp(e: MouseEvent): void {
        if (!panelPosition.isDragging) return;
        
        panelPosition.isDragging = false;
        
        // 保存新位置到GM存储
        GM_setValue('settingsPanelTop', panelPosition.top);
        
        // 移除临时事件监听器
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        // 阻止事件冒泡，防止触发click事件
        e.preventDefault();
        e.stopPropagation();
    }

    // 调整面板位置，确保在屏幕内
    function adjustPanelPosition(panel: HTMLElement) {
        const button = document.querySelector('.tm-fixed-settings-button') as HTMLElement;
        if (!button || !panel) return;
        
        const buttonRect = button.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        
        // 设置面板固定定位
        panel.style.position = 'fixed';
        
        // 水平位置：从按钮左侧开始，向左展开
        panel.style.right = `${buttonRect.width}px`;
        panel.style.background = '#fff';
        panel.style.padding = '20px';
        panel.style.width = '500px';
        panel.style.border = '2px dashed rgb(186 186 186)';
        panel.style.borderRadius = '10px';
        panel.style.zIndex = '999';
        
        // 计算垂直位置
        const buttonTop = buttonRect.top;
        const windowHeight = window.innerHeight;
        const panelHeight = panelRect.height;
        
        // 自动调整，优先在按钮下方显示
        if (buttonTop + panelHeight < windowHeight) {
            // 如果面板在按钮下方能完全显示
            panel.style.top = `${buttonTop}px`;
            panel.style.bottom = 'auto';
        } else if (buttonTop - panelHeight > 0) {
            // 如果面板在按钮上方能完全显示
            panel.style.bottom = `${windowHeight - buttonTop}px`;
            panel.style.top = 'auto';
        } else {
            // 都显示不全，尽量适应屏幕
            if (buttonTop < windowHeight / 2) {
                // 按钮在屏幕上半部分，面板放在下方
                panel.style.top = `${buttonTop}px`;
                panel.style.bottom = 'auto';
                panel.style.maxHeight = `${windowHeight - buttonTop - 20}px`;
                panel.style.overflowY = 'auto';
            } else {
                // 按钮在屏幕下半部分，面板放在上方
                panel.style.bottom = `${windowHeight - buttonTop}px`;
                panel.style.top = 'auto';
                panel.style.maxHeight = `${buttonTop - 20}px`;
                panel.style.overflowY = 'auto';
            }
        }
    }

    // 打开设置面板的方法
    function openSettingsPanel() {
        // 如果设置面板不存在，则创建
        if (!settingsPanel) {
            settingsPanel = createTampermonkeySettingsPanel();
            document.body.appendChild(settingsPanel);
            
            // 添加点击外部区域关闭面板
            document.addEventListener('click', (e) => {
                if (panelPosition.isPanelOpen && settingsPanel) {
                    const button = document.querySelector('.tm-fixed-settings-button') as HTMLElement;
                    
                    // 检查点击是否在面板或按钮外部
                    if (!settingsPanel.contains(e.target as Node) && 
                        !button.contains(e.target as Node)) {
                        settingsPanel.style.display = 'none';
                        panelPosition.isPanelOpen = false;
                    }
                }
            });
        }
        
        // 显示设置面板
        if (settingsPanel) {
            settingsPanel.style.display = 'block';
            panelPosition.isPanelOpen = true;
            
            // 调整面板位置
            adjustPanelPosition(settingsPanel);
        }
    }

    // 初始化
    function init() {
        console.log('AI助手复制工具已加载');
        
        // 添加固定设置按钮
        const fixedSettingsButton = createFixedSettingsButton();
        document.body.appendChild(fixedSettingsButton);
        
        // 检查是否有用户同意
        const shouldApplyButtons = config.enableCopy && config.userConsent;
        
        if (shouldApplyButtons) {
            // 应用复制按钮
            applyToPlatforms(PLATFORMS, config, turndownService, copyToClipboard);
            
            // 启动观察器
            observer = observeDOMChanges(PLATFORMS, config, turndownService, copyToClipboard);
        }
    }

    // 页面加载完成后执行初始化操作
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})(); 