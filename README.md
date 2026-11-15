# 苛苛浩的博客

静态博客，发布地址为 <https://zhaobohao-byte.github.io/>。

## 内容与构建

- `site.config.mjs`：站名、简介和正式站点地址。
- `content/posts.json`：文章标题、日期、分类、标签和固定 ID。
- `content/posts/*.html`：文章正文，保留代码、图片和 SVG 数学公式。
- `content/pages/`：生活记录等独立页面。
- `content/routes.json`：需要保留的历史页面地址。
- `assets/`：样式、搜索脚本及本地图片。
- `scripts/build.mjs`：不依赖第三方包的静态生成器，需要 Node.js 18 或更新版本。

构建到仓库外进行预览或检查：

```sh
node scripts/build.mjs --out /tmp/bohao-blog
```

更新文章后，在仓库根目录生成正式发布文件并提交：

```sh
node scripts/build.mjs --out .
git add .
git commit -m "[docs]: update blog articles"
git push origin main
```

GitHub Pages 使用 `main` 分支根目录，`.nojekyll` 使其直接提供静态文件。
原有 `/posts/<id>.html`、归档、分类与标签地址保持可用。
搜索在浏览器中读取本站的索引；页面不依赖旧域名、外部主题 CDN 或评论服务。

## 域名

正式 URL 统一在 `site.config.mjs` 配置。直接使用 `github.io` 时，仓库根目录不应包含 `CNAME`，GitHub Pages 的 Custom domain 也应留空。
