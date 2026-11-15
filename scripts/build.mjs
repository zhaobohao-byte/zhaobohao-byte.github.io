import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import site from '../site.config.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const outFlag = process.argv.indexOf('--out');
if (outFlag < 0 || !process.argv[outFlag + 1]) {
  throw new Error('Specify an output directory: node scripts/build.mjs --out /tmp/blog-site');
}
const output = path.resolve(process.argv[outFlag + 1]);
const read = (name) => readFile(path.join(root, name), 'utf8');
const posts = JSON.parse(await read('content/posts.json')).sort((a, b) => b.created.localeCompare(a.created));
const pages = JSON.parse(await read('content/pages.json'));
const legacyRoutes = JSON.parse(await read('content/routes.json'));
const escape = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[c]);
const date = (value) => value.slice(0, 10).replaceAll('-', '.');
const link = (href, label, attributes = '') => `<a href="${escape(href)}"${attributes}>${escape(label)}</a>`;
const postURL = (post) => `/posts/${post.slug}.html`;
const routeURL = (route) => '/' + route.replace(/index\.html$/, '');
const absolute = (url) => new URL(url, site.url).href;
const generated = new Set();

async function emit(filename, content) {
  if (filename.startsWith('/') || filename.split('/').includes('..')) {
    throw new Error(`Invalid output route: ${filename}`);
  }
  const target = path.join(output, filename);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content);
  generated.add(filename);
}

function shell({ title = '', url = '/', description = site.description, active = '', body, article }) {
  const navigation = [['/', '文章'], ['/archives/', '归档'], ['/categories/', '分类'], ['/about/', '关于']];
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>${escape(title ? `${title} | ${site.name}` : `${site.author} | ${site.name}`)}</title>
  <meta name="author" content="${escape(site.author)}">
  <meta name="description" content="${escape(description)}">
  <link rel="canonical" href="${escape(absolute(url))}">
  <meta property="og:title" content="${escape(title || site.author)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:url" content="${escape(absolute(url))}">
  <meta property="og:site_name" content="${escape(site.name)}">
  <meta property="og:type" content="${article ? 'article' : 'website'}">
  <meta property="og:locale" content="zh_CN">
${article ? `<meta property="article:published_time" content="${escape(article.created)}"><meta property="article:modified_time" content="${escape(article.updated)}">` : ''}
  <link rel="icon" href="/favicon.ico">
  <link rel="alternate" type="application/atom+xml" title="${escape(site.name)}" href="/atom.xml">
  <link rel="stylesheet" href="/assets/site.css">
  <script src="/assets/site.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">跳至正文</a>
  <header class="site-header">
    ${link('/', site.name, ' class="brand"')}
    <nav aria-label="主导航">${navigation.map(([href, label]) => link(href, label, active === href ? ' aria-current="page"' : '')).join('')}</nav>
  </header>
  <main id="main">${body}</main>
  <footer class="site-footer"><span>© 2025–${new Date().getUTCFullYear()} ${escape(site.author)}</span><div>${link('/atom.xml', 'RSS')}${link(site.github, 'GitHub')}</div></footer>
</body>
</html>
`;
}

function rows(items) {
  return `<ul class="post-list">${items.map((post) => `<li class="post-row"><time datetime="${post.created.slice(0, 10)}">${date(post.created)}</time><div class="post-row-main">${link(postURL(post), post.title)}${post.categories.length ? `<span class="row-topic">${escape(post.categories[0].name)}</span>` : ''}</div></li>`).join('')}</ul>`;
}

function searchForm(query = '') {
  return `<form class="search-form" action="/search/" role="search"><label class="sr-only" for="query">搜索文章</label><input id="query" type="search" name="q" value="${escape(query)}" placeholder="搜索文章、命令或关键词" autocomplete="off"><button type="submit">搜索</button></form>`;
}

function pageHeading(title, description = '') {
  return `<header class="page-heading"><h1>${escape(title)}</h1>${description ? `<p>${escape(description)}</p>` : ''}</header>`;
}

function pagination(current, total, prefix = '') {
  if (total <= 1) return '';
  const target = (n) => n === 1 ? `${prefix || ''}/` : `${prefix}/page/${n}/`;
  return `<nav class="pagination" aria-label="文章分页">${current > 1 ? link(target(current - 1), '上一页') : '<span></span>'}<span>${current} / ${total}</span>${current < total ? link(target(current + 1), '下一页') : '<span></span>'}</nav>`;
}

await mkdir(output, { recursive: true });
if (output !== path.resolve(root)) {
  await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
  await cp(path.join(root, 'img'), path.join(output, 'img'), { recursive: true });
  await cp(path.join(root, 'favicon.ico'), path.join(output, 'favicon.ico'));
}

const pageCount = Math.ceil(posts.length / site.pageSize);
for (let n = 1; n <= pageCount; n++) {
  const url = n === 1 ? '/' : `/page/${n}/`;
  const body = `${n === 1 ? `<section class="intro"><h1>${escape(site.author)}</h1><p>${escape(site.description)}</p></section>${searchForm()}<div class="section-heading"><h2>最近文章</h2>${link('/archives/', '全部文章')}</div>` : pageHeading('文章', `第 ${n} 页`)}${rows(posts.slice((n - 1) * site.pageSize, n * site.pageSize))}${pagination(n, pageCount)}`;
  await emit(n === 1 ? 'index.html' : `page/${n}/index.html`, shell({ url, active: '/', body }));
}

function groupedArchive(items) {
  const years = [...new Set(items.map((p) => p.created.slice(0, 4)))];
  return years.map((year) => `<section class="archive-year"><h2>${year}</h2>${rows(items.filter((p) => p.created.startsWith(year)))}</section>`).join('');
}

await emit('archives/index.html', shell({ title: '归档', url: '/archives/', active: '/archives/', body: pageHeading('文章归档', `${posts.length} 篇笔记。`) + groupedArchive(posts) }));

for (const kind of ['categories', 'tags']) {
  const groups = new Map();
  for (const post of posts) {
    for (const item of post[kind]) {
      if (!groups.has(item.path)) groups.set(item.path, { ...item, posts: [] });
      groups.get(item.path).posts.push(post);
    }
  }
  const label = kind === 'categories' ? '分类' : '标签';
  const ordered = [...groups.values()].sort((a, b) => b.posts.length - a.posts.length);
  await emit(`${kind}/index.html`, shell({ title: label, url: `/${kind}/`, active: kind === 'categories' ? '/categories/' : '', body: pageHeading(`文章${label}`) + `<ul class="topic-list">${ordered.map((group) => `<li><a href="${escape(group.path)}"><span>${escape(group.name)}</span><span class="muted">${group.posts.length} 篇</span></a></li>`).join('')}</ul>${kind === 'categories' ? `<p class="index-note">${link('/tags/', '按标签浏览')}</p>` : ''}` }));
  for (const group of ordered) {
    const filename = decodeURIComponent(group.path).replace(/^\//, '') + 'index.html';
    await emit(filename, shell({ title: group.name, url: group.path, active: kind === 'categories' ? '/categories/' : '', body: `<p class="breadcrumb">${link(`/${kind}/`, label)}</p>${pageHeading(group.name, `${group.posts.length} 篇笔记。`)}${rows(group.posts)}` }));
  }
}

for (let i = 0; i < posts.length; i++) {
  const post = posts[i];
  const content = await read(`content/posts/${post.slug}.html`);
  const headings = [...content.matchAll(/<h([23])\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g)];
  const toc = headings.length < 3 ? '' : `<details class="toc"><summary>目录</summary><ul>${headings.map(([, level, id, title]) => `<li class="toc-level-${level}"><a href="#${escape(id)}">${title.replace(/<[^>]+>/g, '')}</a></li>`).join('')}</ul></details>`;
  const metadata = `<div class="post-meta"><time datetime="${post.created}">${date(post.created)}</time>${post.updated.slice(0, 10) !== post.created.slice(0, 10) ? `<span>更新于 <time datetime="${post.updated}">${date(post.updated)}</time></span>` : ''}${post.categories.map((c) => link(c.path, c.name)).join('')}</div>`;
  const newer = posts[i - 1];
  const older = posts[i + 1];
  const body = `<article><header class="article-heading"><p class="breadcrumb">${link('/archives/', '全部文章')}</p><h1>${escape(post.title)}</h1>${metadata}</header>${toc}<div class="prose">${content}</div>${post.tags.length ? `<div class="post-tags">${post.tags.map((tag) => link(tag.path, `#${tag.name}`)).join('')}</div>` : ''}</article><nav class="post-navigation" aria-label="相邻文章">${newer ? `<div><span>较新</span>${link(postURL(newer), newer.title)}</div>` : '<div></div>'}${older ? `<div><span>较早</span>${link(postURL(older), older.title)}</div>` : '<div></div>'}</nav>`;
  await emit(`posts/${post.slug}.html`, shell({ title: post.title, url: postURL(post), description: post.excerpt, body, article: post }));
}

await emit('about/index.html', shell({ title: '关于', url: '/about/', active: '/about/', body: `${pageHeading('关于')}<div class="prose"><p>我是 Bohao Zhao，也叫苛苛浩。</p><p>关注人形机器人的运动学习、动作重定向与物理仿真。这里记录学习笔记、工程实践，以及日常遇到的问题。</p><p>${link(site.github, '在 GitHub 找到我')}</p><h2>文章之外</h2><ul>${pages.map((page) => `<li>${link(`/${page.slug}/`, page.title)}</li>`).join('')}</ul></div>` }));

for (const page of pages) {
  await emit(`${page.slug}/index.html`, shell({ title: page.title, url: `/${page.slug}/`, body: `${pageHeading(page.title)}<div class="prose legacy-content">${await read(`content/pages/${page.slug}.html`)}</div>` }));
}

await emit('search/index.html', shell({ title: '搜索', url: '/search/', body: `${pageHeading('搜索文章')}${searchForm()}<p id="search-status" class="search-status" aria-live="polite">共 ${posts.length} 篇文章</p><div id="search-results">${rows(posts)}</div>` }));
await emit('404.html', shell({ title: '页面未找到', url: '/404.html', body: `${pageHeading('页面未找到', '这个地址没有对应的页面。')}<p>${link('/', '返回首页')}，或${link('/archives/', '浏览全部文章')}。</p>${searchForm()}` }));

// Keep historical year/month archives and paginated taxonomy URLs usable.
for (const route of legacyRoutes) {
  if (generated.has(route)) continue;
  let items;
  let title;
  if (route.startsWith('archives/')) {
    const match = route.match(/^archives\/(\d{4})(?:\/(\d{2}))?/);
    const prefix = match ? `${match[1]}${match[2] ? '-' + match[2] : ''}` : '';
    items = posts.filter((p) => p.created.startsWith(prefix));
    title = prefix || '归档';
  } else if (route.startsWith('categories/') || route.startsWith('tags/')) {
    const [kind, slug] = route.split('/');
    items = posts.filter((p) => p[kind].some((item) => decodeURIComponent(item.path).split('/')[2] === slug));
    title = slug;
  } else {
    throw new Error(`Historical route has not been migrated: ${route}`);
  }
  const current = Number(route.match(/\/page\/(\d+)\//)?.[1] || 1);
  const selected = route.includes('/page/') ? items.slice((current - 1) * site.pageSize, current * site.pageSize) : items;
  await emit(route, shell({ title, url: routeURL(route), active: '/archives/', body: pageHeading(title) + rows(selected) + `<p class="index-note">${link('/archives/', '浏览全部文章')}</p>` }));
}

function plainText(html) {
  return html.replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}
const searchIndex = await Promise.all(posts.map(async (post) => ({
  title: post.title, url: postURL(post), date: post.created.slice(0, 10),
  category: post.categories[0]?.name || '',
  tags: post.tags.map((t) => t.name),
  text: plainText(await read(`content/posts/${post.slug}.html`)),
})));
await emit('assets/search-index.json', JSON.stringify(searchIndex));
const updated = posts.reduce((max, post) => post.updated > max ? post.updated : max, posts[0].updated);
await emit('atom.xml', `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"><title>${escape(site.name)}</title><id>${site.url}/</id><link href="${site.url}/"/><link href="${site.url}/atom.xml" rel="self"/><updated>${updated}</updated><author><name>${escape(site.author)}</name></author>${posts.map((p) => `<entry><title>${escape(p.title)}</title><id>${absolute(postURL(p))}</id><link href="${absolute(postURL(p))}"/><published>${p.created}</published><updated>${p.updated}</updated><summary>${escape(p.excerpt)}</summary></entry>`).join('')}</feed>`);
const urls = [...generated].filter((f) => f.endsWith('.html') && f !== '404.html').map((f) => absolute(routeURL(f)));
const sitemap = `<?xml version="1.0" encoding="utf-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${escape(u)}</loc></url>`).join('')}</urlset>`;
await emit('sitemap.xml', sitemap);
await emit('baidusitemap.xml', sitemap);
await emit('baidu_urls.txt', urls.join('\n') + '\n');
await emit('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
await emit('search.xml', `<?xml version="1.0" encoding="utf-8"?><search>${searchIndex.map((p) => `<entry><title>${escape(p.title)}</title><url>${escape(p.url)}</url><content>${escape(p.text)}</content></entry>`).join('')}</search>`);
await emit('.nojekyll', '');
console.log(`Built ${posts.length} articles and ${[...generated].filter((p) => p.endsWith('.html')).length} HTML pages to ${output}`);
