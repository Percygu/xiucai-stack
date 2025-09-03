import { defineClientConfig } from "vuepress/client";
import { onMounted } from "vue";

export default defineClientConfig({
  enhance({ app, router, siteData }) {},
  setup() {
    // 在Vue组件挂载后执行
    onMounted(() => {
      // 禁用右键菜单，但允许代码块的右键菜单
      document.addEventListener('contextmenu', (e) => {
        // 检查点击的元素或其父元素是否是代码块
        let target = e.target;
        let isCodeElement = false;
        
        // 向上查找父元素，检查是否是代码相关元素
        for (let i = 0; i < 5 && target; i++) {
          if (target.tagName === 'PRE' || 
              target.tagName === 'CODE' || 
              (target.classList && (
                target.classList.contains('language-') || 
                target.classList.contains('code-block') ||
                target.classList.contains('code')
              ))) {
            isCodeElement = true;
            break;
          }
          target = target.parentElement;
        }
        
        // 如果不是代码元素，则禁用右键菜单
        if (!isCodeElement) {
          e.preventDefault();
          return false;
        }
      });
      
      // 监测开发者工具的打开
      const devtools = {
        isOpen: false,
        orientation: undefined
      };
      
      // 检测开发者工具是否打开
      const checkDevTools = () => {
        const threshold = 160;
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (
          !(heightThreshold && widthThreshold) &&
          ((window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) || widthThreshold || heightThreshold)
        ) {
          if (!devtools.isOpen) {
            devtools.isOpen = true;
            alert('请不要尝试使用开发者工具查看或复制内容！');
          }
        } else {
          devtools.isOpen = false;
        }
      };
      
      // 定期检查开发者工具状态
      setInterval(checkDevTools, 1000);
    });
  },
  rootComponents: [],
}); 