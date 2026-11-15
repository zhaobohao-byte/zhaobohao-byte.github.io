const results = document.querySelector('#search-results');

if (results) {
  const input = document.querySelector('#query');
  const status = document.querySelector('#search-status');
  const form = input.form;
  let index;
  let request;
  let timer;

  function row(post) {
    const li = document.createElement('li');
    li.className = 'post-row';
    const time = document.createElement('time');
    time.dateTime = post.date;
    time.textContent = post.date.replaceAll('-', '.');
    const main = document.createElement('div');
    main.className = 'post-row-main';
    const link = document.createElement('a');
    link.href = post.url;
    link.textContent = post.title;
    main.append(link);
    if (post.category) {
      const topic = document.createElement('span');
      topic.className = 'row-topic';
      topic.textContent = post.category;
      main.append(topic);
    }
    li.append(time, main);
    return li;
  }

  async function search() {
    const query = input.value.trim();
    const url = new URL(location.href);
    if (query) url.searchParams.set('q', query);
    else url.searchParams.delete('q');
    history.replaceState(null, '', url);
    try {
      request ??= fetch('/assets/search-index.json').then((response) => {
        if (!response.ok) throw new Error('Search index could not be loaded.');
        return response.json();
      });
      index ??= await request;
      if (query !== input.value.trim()) return;
      const words = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
      const matches = index.filter((post) => {
        const text = `${post.title} ${post.category} ${post.tags.join(' ')} ${post.text}`.toLocaleLowerCase();
        return words.every((word) => text.includes(word));
      });
      const list = document.createElement('ul');
      list.className = 'post-list';
      list.append(...matches.map(row));
      results.replaceChildren(list);
      status.textContent = query ? `找到 ${matches.length} 篇文章` : `共 ${matches.length} 篇文章`;
      if (!matches.length) status.textContent = '没有找到相关文章，试试其他关键词。';
    } catch {
      request = undefined;
      status.textContent = '搜索暂不可用，可以浏览下方的全部文章。';
    }
  }

  form.addEventListener('submit', (event) => { event.preventDefault(); clearTimeout(timer); search(); });
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(search, 150); });
  input.value = new URLSearchParams(location.search).get('q') || '';
  if (input.value) search();
}
