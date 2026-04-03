#!/bin/bash
# 通过 IndexNow API 批量提交 URL 到 Bing 搜索引擎
# 使用批量提交接口，一次请求提交所有 URL

KEY="3276867ac5154ec787e7dec775ff5997"
HOST="golangstar.cn"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
URL_FILE="${SCRIPT_DIR}/bing_urls.txt"

# 读取所有 URL，构建 JSON 数组
urls_json=""
while IFS= read -r url || [[ -n "$url" ]]; do
    url=$(echo "$url" | tr -d '\r' | xargs)  # 去除空白和回车
    [[ -z "$url" ]] && continue
    if [[ -z "$urls_json" ]]; then
        urls_json="\"$url\""
    else
        urls_json="$urls_json,\"$url\""
    fi
done < "$URL_FILE"

# 构建请求体
body=$(cat <<EOF
{
    "host": "$HOST",
    "key": "$KEY",
    "keyLocation": "https://$HOST/$KEY.txt",
    "urlList": [$urls_json]
}
EOF
)

echo "准备提交 $(echo "$urls_json" | tr ',' '\n' | wc -l) 个 URL..."
echo ""

# 发送批量提交请求
response=$(curl -s -w "\n%{http_code}" -X POST "https://api.indexnow.org/indexnow" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d "$body")

http_code=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')

echo "HTTP 状态码: $http_code"

case $http_code in
    200) echo "提交成功！所有 URL 已被接受。" ;;
    202) echo "提交成功！URL 已被接受，等待处理。" ;;
    400) echo "错误：请求格式无效。" ;;
    403) echo "错误：key 不合法（key 与 keyLocation 中的 key 不匹配）。" ;;
    422) echo "错误：URL 不合规（URL 不属于指定的 host）。" ;;
    429) echo "错误：请求过于频繁，请稍后再试。" ;;
    *)   echo "未知响应: $body_response" ;;
esac
