<script setup>
import groupQr from "../../assets/icon/秀才小号微信二维码.png";
import officialQr from "../../assets/icon/IT_yangxiucai.jpg";

const promoCards = [
  {
    type: "qr",
    title: "学习交流群",
    label: ["交流群"],
    desc: "添加秀才微信，备注「加群」，加入后端/AI学习交流群。",
    image: groupQr,
    icon: "fa-solid fa-users",
    iconColor: "#1677ff",
    alt: "学习交流群二维码",
  },
  {
    type: "qr",
    title: "公众号",
    label: ["公众号"],
    desc: "关注 IT杨秀才，获取文章更新和学习资料。",
    image: officialQr,
    icon: "fa-brands fa-weixin",
    iconColor: "#07c160",
    alt: "公众号二维码",
  },
  {
    type: "link",
    title: "AI项目：模拟面试官",
    label: ["AI项目", "智能面试助手"],
    desc: "Go + Java 双语言多 Agent 面试项目，覆盖 RAG、MCP、记忆系统。",
    href: "/projects/interview-agent.html",
    icon: "fa-solid fa-robot",
    iconColor: "#f97316",
    action: "查看项目",
  },
  {
    type: "link",
    title: "AI项目：智能客服",
    label: ["AI项目", "智能客服系统"],
    desc: "Python + FastAPI + LangGraph 智能客服项目，适合生产级 Agent 实战。",
    href: "/projects/dev-support.html",
    icon: "fa-solid fa-headset",
    iconColor: "#8b5cf6",
    action: "查看项目",
  },
];
</script>

<template>
  <aside class="right-promo-bar" aria-label="站点联系入口">
    <div
      v-for="card in promoCards"
      :key="card.title"
      class="right-promo-item"
      tabindex="0"
    >
      <a
        v-if="card.type === 'link'"
        class="right-promo-trigger"
        :href="card.href"
        :aria-label="card.title"
      >
        <span
          class="right-promo-icon"
          :style="{ color: card.iconColor }"
          aria-hidden="true"
        >
          <i :class="card.icon"></i>
        </span>
        <span class="right-promo-label">
          <span
            v-for="line in card.label"
            :key="line"
            class="right-promo-label-line"
          >
            {{ line }}
          </span>
        </span>
      </a>

      <button
        v-else
        class="right-promo-trigger"
        type="button"
        :aria-label="card.title"
      >
        <span
          class="right-promo-icon"
          :style="{ color: card.iconColor }"
          aria-hidden="true"
        >
          <i :class="card.icon"></i>
        </span>
        <span class="right-promo-label">
          <span
            v-for="line in card.label"
            :key="line"
            class="right-promo-label-line"
          >
            {{ line }}
          </span>
        </span>
      </button>

      <div class="right-promo-panel">
        <p class="right-promo-title">{{ card.title }}</p>
        <p class="right-promo-desc">{{ card.desc }}</p>
        <template v-if="card.type === 'qr'">
          <img class="right-promo-qr" :src="card.image" :alt="card.alt" />
          <span class="right-promo-hint">微信扫码查看</span>
        </template>
        <a
          v-else
          class="right-promo-link-card"
          :href="card.href"
          :aria-label="card.title"
        >
          {{ card.action }}
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  </aside>
</template>
