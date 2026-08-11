<template>
  <Teleport v-if="gateMount" :to="gateMount">
    <section class="official-account-gate" aria-label="文章阅读限制">
      <p class="official-account-gate__hint">本文后续内容需要验证码解锁</p>
      <button
        class="official-account-gate__button"
        type="button"
        aria-haspopup="dialog"
        @click="openModal"
      >
        阅读全文
      </button>
    </section>
  </Teleport>

  <Teleport v-if="modalOpen" to="body">
    <div
      class="official-account-modal"
      role="presentation"
      @click.self="closeModal"
      @keydown="handleDialogKeydown"
    >
      <section
        ref="dialogElement"
        class="official-account-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="official-account-modal-title"
        aria-describedby="official-account-modal-description"
      >
        <button
          class="official-account-modal__close"
          type="button"
          aria-label="关闭验证码窗口"
          @click="closeModal"
        >
          <span aria-hidden="true">×</span>
        </button>

        <h2 id="official-account-modal-title">关注公众号，阅读全文</h2>
        <p id="official-account-modal-description" class="official-account-modal__description">
          微信扫码关注公众号「IT杨秀才」，回复
          <strong>{{ config.keyword }}</strong>
          获取验证码。
        </p>

        <img
          class="official-account-modal__qrcode"
          :src="config.qrcode"
          alt="IT杨秀才公众号二维码"
          width="188"
          height="188"
        />

        <form class="official-account-modal__form" @submit.prevent="submitCode">
          <label for="official-account-code">请输入验证码</label>
          <div class="official-account-modal__controls">
            <input
              id="official-account-code"
              ref="codeInput"
              v-model="verificationCode"
              name="verification-code"
              type="text"
              inputmode="numeric"
              maxlength="6"
              pattern="[0-9]{6}"
              autocomplete="one-time-code"
              :aria-invalid="Boolean(formError)"
              :aria-describedby="formError ? 'official-account-code-error' : undefined"
              :disabled="submitting"
              placeholder="公众号回复中的验证码"
              required
            />
            <button type="submit" :disabled="submitting || !verificationCode.trim()">
              {{ submitting ? "验证中…" : "验证并阅读" }}
            </button>
          </div>
          <p
            v-if="formError"
            id="official-account-code-error"
            class="official-account-modal__error"
            role="alert"
          >
            {{ formError }}
          </p>
        </form>

        <p class="official-account-modal__privacy">验证通过后，本浏览器将自动记住阅读权限。</p>
      </section>
    </div>
  </Teleport>

  <div v-if="notice" class="official-account-notice" role="status" aria-live="polite">
    {{ notice }}
  </div>
</template>

<script setup>
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import { useRoute } from "vuepress/client";

import {
  READMORE_CONFIG,
  shouldLockReadmorePath,
} from "../readmore-config.js";

const config = READMORE_CONFIG;
const route = useRoute();

const gateMount = shallowRef(null);
const modalOpen = ref(false);
const submitting = ref(false);
const verificationCode = ref("");
const formError = ref("");
const notice = ref("");
const codeInput = ref(null);
const dialogElement = ref(null);

let lockedContent = null;
let routeController = null;
let submitController = null;
let stopRouteWatch = null;
let evaluationId = 0;
let noticeTimer = null;
let previousFocus = null;
let previousBodyOverflow = "";
let previousPreviewHeight = "";

const getStoredToken = () => {
  try {
    return localStorage.getItem(config.tokenStorageKey) || "";
  } catch {
    return "";
  }
};

const storeToken = (token) => {
  try {
    localStorage.setItem(config.tokenStorageKey, token);
  } catch {
    // Storage can be unavailable in privacy mode; the current page still unlocks.
  }
};

const removeStoredToken = () => {
  try {
    localStorage.removeItem(config.tokenStorageKey);
  } catch {
    // A blocked storage API should never block article access.
  }
};

const fetchWithTimeout = async (path, options = {}, parentSignal = null) => {
  const controller = new AbortController();
  const abortRequest = () => controller.abort();
  const timeout = window.setTimeout(abortRequest, 5000);

  if (parentSignal?.aborted) abortRequest();
  parentSignal?.addEventListener("abort", abortRequest, { once: true });

  try {
    return await fetch(`${config.apiBase}${path}`, {
      ...options,
      credentials: "same-origin",
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
    parentSignal?.removeEventListener("abort", abortRequest);
  }
};

const readJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const isVerifiedResponse = (response, payload) =>
  response.ok && payload?.code === 200 && payload?.data?.verified === true;

const isHealthyResponse = (response, payload) =>
  response.ok && payload?.code === 200 && payload?.data?.status === "ok";

const isInvalidCredentialResponse = (response, payload) =>
  response.status === 401 &&
  payload?.code === 401 &&
  payload?.data?.verified === false;

const showNotice = (message) => {
  notice.value = message;
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => {
    notice.value = "";
  }, 4500);
};

const restoreContent = () => {
  if (lockedContent) {
    lockedContent.classList.remove("xiucai-readmore-locked");
    if (previousPreviewHeight) {
      lockedContent.style.setProperty(
        "--xiucai-readmore-preview-height",
        previousPreviewHeight,
      );
    } else {
      lockedContent.style.removeProperty("--xiucai-readmore-preview-height");
    }
  }

  const mount = gateMount.value;
  gateMount.value = null;
  mount?.remove();
  lockedContent = null;
  previousPreviewHeight = "";
};

const lockContent = (content) => {
  if (!content?.isConnected) return;

  restoreContent();

  const mount = document.createElement("div");
  mount.className = "xiucai-readmore-gate-mount";
  previousPreviewHeight = content.style.getPropertyValue(
    "--xiucai-readmore-preview-height",
  );
  content.style.setProperty(
    "--xiucai-readmore-preview-height",
    `${config.previewHeight}px`,
  );
  content.append(mount);
  content.classList.add("xiucai-readmore-locked");

  lockedContent = content;
  gateMount.value = mount;
};

const waitForContent = async (currentEvaluation, staleContent = null) => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await nextTick();

    if (currentEvaluation !== evaluationId) return null;

    const content = document.querySelector(config.contentSelector);
    if (content?.isConnected && content !== staleContent) return content;

    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }

  return null;
};

const closeModal = () => {
  modalOpen.value = false;
  formError.value = "";
};

const openModal = () => {
  previousFocus = document.activeElement;
  verificationCode.value = "";
  formError.value = "";
  modalOpen.value = true;
};

const failOpenAfterSubmit = () => {
  restoreContent();
  closeModal();
  showNotice("验证码服务暂时不可用，已为你放开全文阅读。");
};

const submitCode = async () => {
  const code = verificationCode.value.trim();
  if (!code || submitting.value) return;

  submitController?.abort();
  const currentController = new AbortController();
  const currentEvaluation = evaluationId;
  submitController = currentController;
  submitting.value = true;
  formError.value = "";

  try {
    const response = await fetchWithTimeout(
      "/api/verification/verify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      },
      currentController.signal,
    );
    const payload = await readJson(response);

    if (
      currentController.signal.aborted ||
      submitController !== currentController ||
      currentEvaluation !== evaluationId
    ) {
      return;
    }

    if (isInvalidCredentialResponse(response, payload)) {
      formError.value = "验证码不正确或已失效，请重新获取后再试。";
      return;
    }

    if (!isVerifiedResponse(response, payload)) {
      failOpenAfterSubmit();
      return;
    }

    const token = payload?.data?.token;
    if (typeof token !== "string" || !token) {
      failOpenAfterSubmit();
      return;
    }

    storeToken(token);

    restoreContent();
    closeModal();
    showNotice("验证成功，已为你展开全文。");
  } catch {
    // A route change/unmount intentionally aborts this request. A timeout only
    // aborts the inner request, so it still reaches the fail-open path.
    if (
      !currentController.signal.aborted &&
      submitController === currentController &&
      currentEvaluation === evaluationId
    ) {
      failOpenAfterSubmit();
    }
  } finally {
    if (submitController === currentController) submitting.value = false;
  }
};

const evaluateRoute = async (path, staleContent = null) => {
  const currentEvaluation = ++evaluationId;
  routeController?.abort();
  routeController = new AbortController();

  submitController?.abort();
  submitting.value = false;
  closeModal();
  restoreContent();

  if (!shouldLockReadmorePath(path)) return;

  const content = await waitForContent(currentEvaluation, staleContent);
  if (!content || currentEvaluation !== evaluationId) return;

  try {
    const healthResponse = await fetchWithTimeout(
      "/healthz",
      { method: "GET", cache: "no-store" },
      routeController.signal,
    );
    const healthPayload = await readJson(healthResponse);

    if (
      !isHealthyResponse(healthResponse, healthPayload) ||
      currentEvaluation !== evaluationId
    ) {
      return;
    }

    const token = getStoredToken();
    if (!token) {
      lockContent(content);
      return;
    }

    const verificationResponse = await fetchWithTimeout(
      "/api/verification",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
      routeController.signal,
    );
    const payload = await readJson(verificationResponse);

    if (currentEvaluation !== evaluationId) return;

    if (isVerifiedResponse(verificationResponse, payload)) return;

    // Only a well-formed 401 is a definitive expired credential. Rate limits,
    // proxy errors and malformed responses all deliberately fail open.
    if (!isInvalidCredentialResponse(verificationResponse, payload)) return;

    removeStoredToken();
    lockContent(content);
  } catch {
    // Health and credential-check errors deliberately fail open.
  }
};

const handleDialogKeydown = (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeModal();
    return;
  }

  if (event.key !== "Tab") return;

  const focusable = dialogElement.value?.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
  );
  if (!focusable?.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

watch(modalOpen, async (isOpen) => {
  if (isOpen) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    await nextTick();
    codeInput.value?.focus();
    return;
  }

  document.body.style.overflow = previousBodyOverflow;
  if (previousFocus?.isConnected) previousFocus.focus();
  previousFocus = null;
});

onMounted(() => {
  stopRouteWatch = watch(
    () => route.path,
    (path, previousPath) => {
      // Theme Hope replaces the keyed page after an out-in transition. Capture
      // the current article before rendering starts so we never attach the gate
      // to the old page while it is leaving.
      const staleContent = previousPath === undefined
        ? null
        : document.querySelector(config.contentSelector);
      void evaluateRoute(path, staleContent);
    },
    { immediate: true, flush: "sync" },
  );
});

onBeforeUnmount(() => {
  evaluationId += 1;
  stopRouteWatch?.();
  routeController?.abort();
  submitController?.abort();
  window.clearTimeout(noticeTimer);
  closeModal();
  document.body.style.overflow = previousBodyOverflow;
  restoreContent();
});
</script>

<style scoped>
:global(.xiucai-readmore-locked) {
  position: relative !important;
  max-height: var(--xiucai-readmore-preview-height, 1600px) !important;
  overflow: hidden !important;
}

:global(.xiucai-readmore-gate-mount) {
  position: absolute;
  z-index: 8;
  right: 0;
  bottom: 0;
  left: 0;
  height: 340px;
  pointer-events: none;
}

.official-account-gate {
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  height: 100%;
  padding: 5rem 1rem 2.25rem;
  background: linear-gradient(to bottom, transparent 0%, var(--vp-c-bg) 62%);
  color: var(--vp-c-text);
  pointer-events: none;
}

.official-account-gate__hint {
  margin: 0 0 0.85rem;
  color: var(--vp-c-text-mute);
  font-size: 0.92rem;
}

.official-account-gate__button,
.official-account-modal__controls button {
  border: 0;
  border-radius: 999px;
  background: var(--vp-c-accent-bg, #0756ab);
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.official-account-gate__button {
  min-width: 180px;
  padding: 0.76rem 1.5rem;
  box-shadow: 0 8px 24px rgb(7 86 171 / 22%);
  pointer-events: auto;
}

.official-account-gate__button:hover,
.official-account-modal__controls button:hover:not(:disabled) {
  background: var(--vp-c-accent-hover, #064785);
  transform: translateY(-1px);
}

.official-account-gate__button:focus-visible,
.official-account-modal button:focus-visible,
.official-account-modal input:focus-visible {
  outline: 3px solid rgb(59 130 246 / 45%);
  outline-offset: 3px;
}

.official-account-modal {
  position: fixed;
  z-index: 2200;
  inset: 0;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  overflow-y: auto;
  padding: 1.25rem;
  background: rgb(15 23 42 / 58%);
  backdrop-filter: blur(3px);
}

.official-account-modal__dialog {
  position: relative;
  box-sizing: border-box;
  width: min(100%, 470px);
  padding: 1.75rem 2rem 1.5rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 18px;
  background: var(--vp-c-bg);
  box-shadow: 0 24px 70px rgb(15 23 42 / 30%);
  color: var(--vp-c-text);
  text-align: center;
}

.official-account-modal__dialog h2 {
  margin: 0 2rem 0.65rem;
  color: var(--vp-c-text);
  font-size: 1.35rem;
  line-height: 1.4;
}

.official-account-modal__close {
  position: absolute;
  top: 0.7rem;
  right: 0.8rem;
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--vp-c-text-mute);
  font: inherit;
  font-size: 1.6rem;
  cursor: pointer;
}

.official-account-modal__close:hover {
  background: var(--vp-c-control);
  color: var(--vp-c-text);
}

.official-account-modal__description {
  margin: 0 auto 1rem;
  color: var(--vp-c-text-mute);
  font-size: 0.94rem;
  line-height: 1.75;
}

.official-account-modal__description strong {
  margin: 0 0.2rem;
  color: #e53e3e;
}

.official-account-modal__qrcode {
  display: block;
  width: 188px;
  height: 188px;
  margin: 0 auto 1rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 10px;
  object-fit: cover;
}

.official-account-modal__form {
  text-align: left;
}

.official-account-modal__form label {
  display: block;
  margin-bottom: 0.45rem;
  color: var(--vp-c-text);
  font-size: 0.9rem;
  font-weight: 600;
}

.official-account-modal__controls {
  display: flex;
  gap: 0.65rem;
}

.official-account-modal__controls input {
  min-width: 0;
  flex: 1;
  box-sizing: border-box;
  height: 2.75rem;
  padding: 0 0.85rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 9px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text);
  font: inherit;
  font-size: 0.92rem;
}

.official-account-modal__controls input::placeholder {
  color: var(--vp-c-text-mute);
}

.official-account-modal__controls button {
  flex: 0 0 auto;
  min-width: 112px;
  padding: 0 1rem;
  border-radius: 9px;
  font-size: 0.9rem;
}

.official-account-modal__controls button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.official-account-modal__error {
  margin: 0.55rem 0 0;
  color: #d9363e;
  font-size: 0.85rem;
  line-height: 1.5;
}

.official-account-modal__privacy {
  margin: 0.85rem 0 0;
  color: var(--vp-c-text-mute);
  font-size: 0.78rem;
}

.official-account-notice {
  position: fixed;
  z-index: 2300;
  top: 5rem;
  left: 50%;
  max-width: min(88vw, 520px);
  box-sizing: border-box;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: rgb(15 23 42 / 92%);
  box-shadow: 0 10px 30px rgb(15 23 42 / 22%);
  color: #fff;
  font-size: 0.9rem;
  text-align: center;
  transform: translateX(-50%);
}

@media (max-width: 600px) {
  .official-account-modal {
    align-items: start;
    padding: 0.75rem;
  }

  .official-account-modal__dialog {
    margin-top: 0.5rem;
    padding: 1.45rem 1rem 1.2rem;
    border-radius: 14px;
  }

  .official-account-modal__qrcode {
    width: 164px;
    height: 164px;
  }

  .official-account-modal__controls {
    flex-direction: column;
  }

  .official-account-modal__controls button {
    min-height: 2.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .official-account-gate__button,
  .official-account-modal__controls button {
    transition: none;
  }
}
</style>
