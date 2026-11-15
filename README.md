# 苛苛浩的博客

发布地址：<https://zhaobohao-byte.github.io/>。

本站保留原有 Hexo / 安知鱼（AnZhiYu）主题、文章和页面布局。
GitHub Pages 直接发布 `main` 分支根目录下的静态文件。

- 保持 Pages 的 Custom domain 留空，根目录不放置 `CNAME`。
- 主题脚本、图标字体与可恢复的博客图片放在 `assets/`，避免依赖原域名和失效 CDN。
- 搜索沿用主题原生的本地搜索界面，索引为 `assets/search.json`。
- 原 Hexo 源工程位于 Windows 的 `H:\Blog\Blog`；当前仓库保存的是已生成的静态网站。

从 Hexo 源工程重新生成时，应将其 `url` 配置为 `https://zhaobohao-byte.github.io`，并移除 `source/CNAME`；不要使用此前重新设计版本的生成器覆盖原主题。
