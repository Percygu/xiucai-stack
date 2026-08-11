export const READMORE_CONFIG = Object.freeze({
  apiBase: "/xiucai-plugin",
  contentSelector: "div[vp-content]",
  keyword: "验证码",
  previewHeight: 1600,
  qrcode: "/assets/icon/IT_yangxiucai.jpg",
  tokenStorageKey: "XiucaiReadMoreToken",
});

// The former plugin used `reverse: true`, so only these matching routes lock.
const LOCKED_PATH_PREFIXES = Object.freeze([
  "/backend_series/advanced_interview/",
  "/backend_series/distributed_interview/",
  "/backend_series/go_interview/",
  "/backend_series/llm_interview/",
  "/backend_series/mq_interview/",
  "/backend_series/mysql_interview/",
  "/backend_series/redis_interview/",
  "/go_series/go_interview/",
  "/vibe_coding_series/",
  "/面试题/",
]);

const LOCKED_GO_AGENT_PATH =
  /^\/go_agent_series\/(?!introduction\.html$|eino_basic\/eino_overview\.html$).+/;

const normalizePath = (rawPath) => {
  const path = String(rawPath || "/").split(/[?#]/u, 1)[0];

  try {
    return decodeURI(path);
  } catch {
    return path;
  }
};

export const shouldLockReadmorePath = (rawPath) => {
  const path = normalizePath(rawPath);

  return (
    LOCKED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix)) ||
    LOCKED_GO_AGENT_PATH.test(path)
  );
};
