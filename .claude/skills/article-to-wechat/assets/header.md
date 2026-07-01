<!-- 文章开头固定头部：网站头图 + 引导链接。每篇自动插到正文最前面。
     {banner} 会被 publish.py 替换为 assets/images/header-banner.png 的绝对路径并上传微信。
     头图不存在时本段自动跳过。
     引导链接刻意用内联 HTML（而非 markdown 链接）写死样式：右对齐 + 深蓝 #003a8c + 14px，
     以压过 doocs 默认的 16px/经典蓝/左对齐。要调样式就改下面那行 <p>/<a> 的 style。 -->

![]({banner})

<p style="text-align: right; margin: 12px 8px;"><a href="https://mp.weixin.qq.com/s?__biz=Mzk0MTYxNDgyNA==&mid=2247490756&idx=2&sn=9184e5267199d7dddd71c52a63b894ae&scene=21#wechat_redirect" style="color: #003a8c; font-size: 14px;">📖 秀才的学习网站：https://golangstar.cn/</a></p>
