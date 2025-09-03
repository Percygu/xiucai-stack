// 简单直接的复制按钮功能实现
document.addEventListener('DOMContentLoaded', function() {
  // 定期检查复制按钮
  setInterval(function() {
    // 查找所有复制按钮
    const copyButtons = document.querySelectorAll('.copy-code-button, .copy-button, .vp-copy, .vp-code-copy, [class*="copy"]');
    
    copyButtons.forEach(function(button) {
      // 如果按钮已经有我们的事件监听器，跳过
      if (button.hasAttribute('data-copy-handler')) {
        return;
      }
      
      // 标记这个按钮已经处理过
      button.setAttribute('data-copy-handler', 'true');
      
      // 添加点击事件
      button.addEventListener('click', function(e) {
        // 阻止默认行为
        e.preventDefault();
        e.stopPropagation();
        
        // 查找相关代码块
        let codeBlock = null;
        let parent = this.parentElement;
        
        // 查找最近的代码块
        while (parent && !codeBlock) {
          codeBlock = parent.querySelector('pre code') || parent.querySelector('pre');
          if (!codeBlock) {
            parent = parent.parentElement;
          }
        }
        
        // 如果找到代码块，复制内容
        if (codeBlock) {
          // 获取代码内容
          const codeText = codeBlock.textContent || '';
          
          // 创建临时文本区域
          const textArea = document.createElement('textarea');
          textArea.value = codeText;
          textArea.style.position = 'fixed';
          textArea.style.left = '-9999px';
          document.body.appendChild(textArea);
          textArea.select();
          
          try {
            // 执行复制命令
            document.execCommand('copy');
            
            // 显示复制成功提示
            this.classList.add('copied');
            setTimeout(() => {
              this.classList.remove('copied');
            }, 2000);
          } catch (err) {
            console.error('复制失败:', err);
          }
          
          // 移除临时文本区域
          document.body.removeChild(textArea);
        }
      });
    });
  }, 1000);
  
  // 防止普通文本复制，但允许代码块复制
  document.addEventListener('copy', function(e) {
    // 获取选中内容的容器元素
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const container = selection.getRangeAt(0).commonAncestorContainer;
    let element = container.nodeType === 3 ? container.parentNode : container;
    
    // 检查是否在代码块内
    let isInCode = false;
    for (let i = 0; i < 5 && element; i++) {
      if (element.tagName === 'PRE' || element.tagName === 'CODE' || 
          (element.classList && (element.classList.contains('language-') || 
                                element.classList.contains('code-block')))) {
        isInCode = true;
        break;
      }
      element = element.parentElement;
    }
    
    // 检查是否是由复制按钮触发的复制事件
    const isCopyButtonEvent = document.activeElement && 
      (document.activeElement.classList.contains('copy-code-button') || 
       document.activeElement.classList.contains('copy-button') ||
       document.activeElement.classList.contains('vp-copy') ||
       document.activeElement.classList.contains('vp-code-copy') ||
       document.activeElement.tagName === 'BUTTON' && 
       document.activeElement.closest('.code-copy-button, .copy-button, .vp-copy, .vp-code-copy'));
    
    // 如果不是在代码块内且不是复制按钮事件，阻止复制
    if (!isInCode && !isCopyButtonEvent) {
      e.preventDefault();
    }
  });
  
  // 禁用键盘快捷键复制，但允许在代码块中使用
  document.addEventListener('keydown', function(e) {
    // 检查当前活动元素是否在代码块内
    let activeElement = document.activeElement;
    let isInCodeBlock = false;
    
    // 向上查找父元素，检查是否是代码相关元素
    for (let i = 0; i < 5 && activeElement; i++) {
      if (activeElement.tagName === 'PRE' || 
          activeElement.tagName === 'CODE' || 
          (activeElement.classList && (
            activeElement.classList.contains('language-') || 
            activeElement.classList.contains('code-block') ||
            activeElement.classList.contains('code')
          ))) {
        isInCodeBlock = true;
        break;
      }
      activeElement = activeElement.parentElement;
    }
    
    // 如果不是在代码块内，则禁用复制快捷键
    if (!isInCodeBlock && e.ctrlKey && (e.key === 'c' || e.key === 'x')) {
      e.preventDefault();
      return false;
    }
  });
}); 