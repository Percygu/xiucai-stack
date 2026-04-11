import { defineClientConfig } from "vuepress/client";
import { onMounted } from "vue";

export default defineClientConfig({
  enhance({ app, router, siteData }) {},
  setup() {
    // 在Vue组件挂载后执行
    onMounted(() => {
      let tipShown = false;
      let tipEl = null;

      // 显示顶部提示条（非阻塞，只显示一次）
      function showTip() {
        if (tipShown) return;
        tipShown = true;

        tipEl = document.createElement('div');
        tipEl.textContent = '检测到页面异常，如您安装了复制类浏览器插件，请关闭后刷新页面。';
        tipEl.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#ff9800;color:#fff;text-align:center;padding:10px 40px 10px 16px;font-size:14px;line-height:1.5;box-shadow:0 2px 8px rgba(0,0,0,.15);';

        // 关闭按钮
        const closeBtn = document.createElement('span');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = 'position:absolute;right:14px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:16px;';
        closeBtn.addEventListener('click', function() {
          tipEl.remove();
          tipEl = null;
        });

        tipEl.appendChild(closeBtn);
        document.body.appendChild(tipEl);
      }

      // 检测开发者工具或插件导致的窗口异常
      const checkDevTools = () => {
        const threshold = 160;
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;

        if (
          !(heightThreshold && widthThreshold) &&
          ((window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) || widthThreshold || heightThreshold)
        ) {
          showTip();
        }
      };

      // 定期检查
      setInterval(checkDevTools, 3000);
    });
  },
  rootComponents: [],
}); 