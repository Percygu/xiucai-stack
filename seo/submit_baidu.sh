#!/bin/bash
# 通过百度站长平台 API 批量推送 URL

SITE="https://golangstar.cn"
TOKEN="LETkmLRMdPkN6fkG"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
URL_FILE="${SCRIPT_DIR}/bing_urls.txt"

echo "准备推送 URL 到百度站长平台..."

# 通过管道方式提交，绕开代理直连百度API，--data-binary 保留换行符
response=$(tr -d '\r' < "$URL_FILE" | grep -v '^$' | curl -s --noproxy '*' -H 'Content-Type:text/plain' \
    --data-binary @- \
    "http://data.zz.baidu.com/urls?site=${SITE}&token=${TOKEN}")

echo "百度返回结果："
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
