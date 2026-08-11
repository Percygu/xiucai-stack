// 防复制代码 - 最直接有效的方法
(function() {
  // 在页面加载完成后执行
  document.addEventListener('DOMContentLoaded', function() {
    initAntiCopy();
  });
  
  // 确保在window.onload也执行一次
  window.onload = function() {
    initAntiCopy();
  };
  
  // 初始化防复制功能
  function initAntiCopy() {
    // 1. 定义代码块选择器
    const CODE_SELECTORS = ['pre', 'code', '.language-', '.code-block', '.code-group', '.vp-code'];
    
    // 2. 检查元素是否在代码块内
    function isInCodeBlock(element) {
      if (!element) return false;
      
      // 如果元素是文本节点，获取其父元素
      if (element.nodeType === 3) {
        element = element.parentNode;
      }
      
      // 检查当前元素及其所有父元素
      let current = element;
      while (current && current !== document.body) {
        // 检查标签名
        if (current.tagName === 'PRE' || current.tagName === 'CODE') {
          return true;
        }
        
        // 检查类名
        if (current.classList) {
          for (let selector of CODE_SELECTORS) {
            if (selector.startsWith('.') && current.classList.contains(selector.substring(1))) {
              return true;
            }
          }
        }
        
        current = current.parentElement;
      }
      
      return false;
    }
    
    // 3. 检查元素是否是复制按钮
    function isCopyButton(element) {
      if (!element) return false;
      
      // 如果元素是文本节点，获取其父元素
      if (element.nodeType === 3) {
        element = element.parentNode;
      }
      
      // 检查当前元素及其所有父元素
      let current = element;
      while (current && current !== document.body) {
        // 检查类名
        if (current.classList && (
          current.classList.contains('copy-code-button') || 
          current.classList.contains('copy-button') ||
          current.classList.contains('vp-copy') ||
          current.classList.contains('vp-code-copy')
        )) {
          return true;
        }
        
        // 检查元素ID和类名是否包含copy
        if ((current.id && current.id.includes('copy')) || 
            (current.className && typeof current.className === 'string' && current.className.includes('copy'))) {
          return true;
        }
        
        current = current.parentElement;
      }
      
      return false;
    }
    
    // 4. 阻止复制事件 - 捕获阶段
    document.addEventListener('copy', function(e) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      const element = range.commonAncestorContainer;
      
      // 允许代码块复制，阻止正文复制
      if (!isInCodeBlock(element) && !isCopyButton(e.target) && !window.copyButtonClicked) {
        e.stopPropagation();
        e.preventDefault();
        return false;
      }
    }, true);
    
    // 5. 阻止剪切事件 - 捕获阶段
    document.addEventListener('cut', function(e) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      const element = range.commonAncestorContainer;
      
      // 允许代码块剪切，阻止正文剪切
      if (!isInCodeBlock(element) && !window.copyButtonClicked) {
        e.stopPropagation();
        e.preventDefault();
        return false;
      }
    }, true);
    
    // 6. 阻止键盘快捷键 - 捕获阶段
    document.addEventListener('keydown', function(e) {
      // 检查是否是复制/剪切快捷键
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'x' || e.keyCode === 67 || e.keyCode === 88)) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const element = range.commonAncestorContainer;
        
        // 允许代码块快捷键，阻止正文快捷键
        if (!isInCodeBlock(element) && !window.copyButtonClicked) {
          e.stopPropagation();
          e.preventDefault();
          return false;
        }
      }
    }, true);
    
    // 7. 阻止右键菜单 - 捕获阶段
    document.addEventListener('contextmenu', function(e) {
      // 允许代码块右键菜单，阻止正文右键菜单
      if (!isInCodeBlock(e.target)) {
        e.preventDefault();
        return false;
      }
    }, true);
    
    // 8. 阻止拖拽 - 捕获阶段
    document.addEventListener('dragstart', function(e) {
      // 允许代码块拖拽，阻止正文拖拽
      if (!isInCodeBlock(e.target) && !window.copyButtonClicked) {
        e.preventDefault();
        return false;
      }
    }, true);
    
    // 9. 处理复制按钮
    function setupCopyButtons() {
      const copyButtons = document.querySelectorAll('.copy-code-button, .copy-button, .vp-copy, .vp-code-copy, [class*="copy"]');
      
      copyButtons.forEach(function(button) {
        // 如果按钮已经处理过，跳过
        if (button.hasAttribute('data-copy-handler')) {
          return;
        }
        
        // 标记按钮已处理
        button.setAttribute('data-copy-handler', 'true');
        
        // 添加点击事件
        button.addEventListener('click', function() {
          // 查找关联的代码块
          let codeBlock = null;
          let parent = this.parentElement;
          
          // 向上查找最近的代码块
          while (parent && !codeBlock) {
            codeBlock = parent.querySelector('pre code') || parent.querySelector('pre');
            if (!codeBlock) {
              parent = parent.parentElement;
            }
          }
          
          if (codeBlock) {
            const codeText = codeBlock.textContent || '';
            
            // 设置标志，表示这是复制按钮触发的复制
            window.copyButtonClicked = true;
            
            try {
              // 尝试使用Clipboard API
              if (navigator.clipboard) {
                navigator.clipboard.writeText(codeText).then(() => {
                  this.classList.add('copied');
                  setTimeout(() => {
                    this.classList.remove('copied');
                    window.copyButtonClicked = false;
                  }, 2000);
                }).catch(() => {
                  // 如果Clipboard API失败，尝试使用execCommand
                  fallbackCopy(this, codeText);
                });
              } else {
                // 如果不支持Clipboard API，使用execCommand
                fallbackCopy(this, codeText);
              }
            } catch (err) {
              console.error('复制失败:', err);
              window.copyButtonClicked = false;
            }
          }
        });
      });
    }
    
    // 复制按钮的备用复制方法
    function fallbackCopy(button, text) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        button.classList.add('copied');
        setTimeout(() => {
          button.classList.remove('copied');
          window.copyButtonClicked = false;
        }, 2000);
      } catch (err) {
        console.error('备用复制失败:', err);
        window.copyButtonClicked = false;
      }
      
      document.body.removeChild(textArea);
    }
    
    // 初始化复制按钮
    setupCopyButtons();
    
    // 定期检查并设置新的复制按钮
    setInterval(setupCopyButtons, 2000);
    
    // 10. 覆盖原生复制函数
    const originalExecCommand = document.execCommand;
    document.execCommand = function(command, showUI, value) {
      if ((command === 'copy' || command === 'cut') && !window.copyButtonClicked) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return false;
        
        const range = selection.getRangeAt(0);
        const element = range.commonAncestorContainer;
        
        // 允许代码块使用execCommand，阻止正文使用
        if (!isInCodeBlock(element)) {
          return false;
        }
      }
      
      return originalExecCommand.apply(this, arguments);
    };
    
    // 11. 覆盖剪贴板API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      const originalWriteText = navigator.clipboard.writeText;
      navigator.clipboard.writeText = function(text) {
        if (!window.copyButtonClicked) {
          const selection = window.getSelection();
          if (!selection.rangeCount) return Promise.reject(new Error('No selection'));
          
          const range = selection.getRangeAt(0);
          const element = range.commonAncestorContainer;
          
          // 允许代码块使用剪贴板API，阻止正文使用
          if (!isInCodeBlock(element)) {
            return Promise.reject(new Error('Copying not allowed'));
          }
        }
        
        return originalWriteText.call(this, text);
      };
    }
    
    // 12. 确保正文可以选中
    function ensureTextSelectable() {
      // 设置body可选中
      document.body.style.userSelect = 'text';
      document.body.style.webkitUserSelect = 'text';
      document.body.style.msUserSelect = 'text';
      document.body.style.mozUserSelect = 'text';
      
      // 设置所有内容元素可选中
      const contentElements = document.querySelectorAll('.theme-hope-content p, .theme-hope-content li, .theme-hope-content h1, .theme-hope-content h2, .theme-hope-content h3, .theme-hope-content h4, .theme-hope-content h5, .theme-hope-content h6, .theme-hope-content table');
      contentElements.forEach(function(element) {
        element.style.userSelect = 'text';
        element.style.webkitUserSelect = 'text';
        element.style.msUserSelect = 'text';
        element.style.mozUserSelect = 'text';
      });
    }
    
    // 初始应用样式
    ensureTextSelectable();
    
    // 定期检查并应用样式
    setInterval(ensureTextSelectable, 1000);
    
    console.log('防复制功能已初始化');
  }
})(); 