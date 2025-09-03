import { defineClientConfig } from "vuepress/client";
import { onMounted } from "vue";

export default defineClientConfig({
  enhance({ app, router, siteData }) {},
  setup() {
    // 在Vue组件挂载后执行
    onMounted(() => {
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
      setInterval(checkDevTools, 3000);
    });
  },
  rootComponents: [],
}); 