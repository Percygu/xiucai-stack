from googleapiclient.discovery import build
from google.oauth2 import service_account

# 1. 钥匙文件的名字（确保这个文件和脚本在同一个文件夹下）
JSON_KEY_FILE = 'animated-rope-491816-c8-26f7335c5f3d.json'

# 2. 你要抓取的 URL 列表
urls = [
    "https://golangstar.cn/go_agent_series/llm_base/llm_overview.html",
    "https://golangstar.cn/go_agent_series/llm_base/llm_core_concepts.html",
    "https://golangstar.cn/go_agent_series/llm_base/prompt_engineering.html",
    "https://golangstar.cn/go_agent_series/llm_base/llm_api_practice.html",
]

# 核心推送逻辑
def push_to_google():
    scopes = ["https://www.googleapis.com/auth/indexing"]
    credentials = service_account.Credentials.from_service_account_file(JSON_KEY_FILE, scopes=scopes)
    service = build("indexing", "v3", credentials=credentials)

    success_count = 0
    fail_count = 0
    failed_urls = []

    for i, url in enumerate(urls, 1):
        body = {"url": url, "type": "URL_UPDATED"}
        try:
            res = service.urlNotifications().publish(body=body).execute()
            success_count += 1
            print(f"[{i}/{len(urls)}] 成功提交: {url}")
        except Exception as e:
            fail_count += 1
            failed_urls.append(url)
            print(f"[{i}/{len(urls)}] 提交失败 {url}: {e}")

    print(f"\n========== 推送结果统计 ==========")
    print(f"总计: {len(urls)} 个 URL")
    print(f"成功: {success_count} 个")
    print(f"失败: {fail_count} 个")
    if failed_urls:
        print(f"\n失败的 URL 列表:")
        for url in failed_urls:
            print(f"  - {url}")

if __name__ == "__main__":
    push_to_google()