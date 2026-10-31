const themes = [['黑白','#f8f7f3','#171714'],['暖棕','#eee8da','#332a22'],['灰黑','#dfe1dc','#252825'],['暖黑','#111923','#e9e3d7'],['咖啡','#ead6bd','#5a2923']];
const fonts = {serif:'"Noto Serif SC","Songti SC","STSong",serif',sans:'"Noto Sans SC","PingFang SC","Hiragino Sans GB",sans-serif',light:'"PingFang SC","Noto Sans SC","Hiragino Sans GB","Microsoft YaHei",sans-serif',system:'system-ui,"PingFang SC","Microsoft YaHei",sans-serif'};
const root = document.documentElement;
const panel = document.querySelector('#settingsPanel');
const trigger = document.querySelector('#settingsButton');
const read = key => { try { return localStorage.getItem('shf-reader-' + key); } catch { return null; } };
const save = (key, value) => { try { localStorage.setItem('shf-reader-' + key, value); } catch {} };
const select = (key, value) => document.querySelectorAll('[data-' + key + ']').forEach(button => {
  const active = button.dataset[key] === String(value);
  button.classList.toggle('active', active);
  button.setAttribute('aria-pressed', String(active));
});
function setOpen(open, restoreFocus = false) {
  panel.inert = !open;
  panel.classList.toggle('open', open);
  trigger.setAttribute('aria-expanded', String(open));
  if (open) panel.querySelector('[data-close]').focus();
  else if (restoreFocus) trigger.focus();
}
trigger.onclick = () => setOpen(!panel.classList.contains('open'));
panel.querySelector('[data-close]').onclick = () => setOpen(false, true);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && panel.classList.contains('open')) setOpen(false, true); });
document.addEventListener('click', event => { if (!panel.contains(event.target) && !trigger.contains(event.target)) setOpen(false); });
themes.forEach(([name, bg, ink], index) => {
  const button = document.createElement('button');
  button.className = 'palette';
  button.dataset.theme = index;
  const swatch = document.createElement('span');
  swatch.className = 'swatch';
  swatch.style.setProperty('--a', bg);
  swatch.style.setProperty('--b', ink);
  swatch.setAttribute('aria-hidden', 'true');
  button.append(swatch, name);
  button.onclick = () => {
    root.dataset.theme = String(index);
    root.style.setProperty('--bg', bg);
    root.style.setProperty('--ink', ink);
    select('theme', index);
    save('theme', index);
  };
  document.querySelector('#palettes').append(button);
});
document.querySelectorAll('[data-font]').forEach(button => button.onclick = () => {
  const font = button.dataset.font;
  root.style.setProperty('--body', fonts[font]);
  root.style.setProperty('--weight', font === 'light' ? 300 : 400);
  select('font', font);
  save('font', font);
});
document.querySelectorAll('[data-size]').forEach(button => button.onclick = () => {
  root.style.setProperty('--size', button.dataset.size + 'px');
  select('size', button.dataset.size);
  save('size', button.dataset.size);
});
if (read('defaults-version') !== '2') {
  // Move stored copies of the former defaults to the new defaults once.
  if (read('theme') === null || read('theme') === '1') save('theme', 0);
  if (read('font') === null || read('font') === 'serif') save('font', 'light');
  save('defaults-version', '2');
}
const theme = Number(read('theme') ?? 0);
document.querySelector('[data-theme="' + (Number.isInteger(theme) && themes[theme] ? theme : 0) + '"]').click();
const font = read('font');
document.querySelector('[data-font="' + (Object.hasOwn(fonts, font) ? font : 'light') + '"]').click();
const size = read('size');
document.querySelector('[data-size="' + (['12','14','16','18','20','23'].includes(size) ? size : '16') + '"]').click();

document.querySelectorAll('.toc-dropdown').forEach(details=>{
  details.addEventListener('toggle',()=>{
    if(!details.open)return;
    document.querySelectorAll('.toc-dropdown').forEach(other=>{if(other!==details)other.open=false;});
    const menu=details.querySelector('.toc-menu');
    const current=menu.querySelector('[aria-current="page"]');
    if(current)menu.scrollTop=Math.max(0,current.offsetTop-menu.offsetTop-menu.clientHeight/2);
  });
});
document.addEventListener('click',event=>document.querySelectorAll('.toc-dropdown[open]').forEach(menu=>{if(!menu.contains(event.target))menu.open=false;}));
document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.toc-dropdown[open]').forEach(menu=>{menu.open=false;menu.querySelector('summary').focus();});});

// Forum thread headings use a board badge; explanatory prose after a comma
// and image placeholders are not headings. Keep all source text intact.
const forumTitlePattern = /^\s*【(?:😼|🐶|📢)\uFE0F?】(?![，,])/u;
document.querySelectorAll('.chapter-body .prose-line').forEach(line => {
  if (!forumTitlePattern.test(line.textContent) || line.querySelector('.forum-title')) return;
  const title = document.createElement('strong');
  title.className = 'forum-title';
  title.append(...line.childNodes);
  line.append(title);
});

// Presentation of metadata and explicitly approved, non-explicit excerpts.
(() => {
  const article = document.querySelector('.chapter-body');
  if (!article || article.dataset.sfEnhanced) return;
  article.dataset.sfEnhanced = 'true';
  const rowSelector = '.prose-line,.blank-line,p,.rt-title';
  const lines = [...article.querySelectorAll(rowSelector)].filter(line =>
    !line.querySelector(rowSelector) && !line.closest('details,.sf-chat,.rt-chat,.sf-review,.rt-review')
  );
  const values = lines.map(line => line.textContent.trim());
  const text = i => values[i] ?? '';
  const blank = i => !text(i);
  const nextText = start => { let i = start; while (i < lines.length && blank(i)) i++; return i; };
  const trimEnd = (start, end) => { while (end > start && blank(end)) end--; return end; };
  const post = i => /^#\d+\s+.+[|｜].*[|｜]/u.test(text(i));
  const divider = i => /^-{5,}$/u.test(text(i));
  const gate = i => /^>{2,}\s*需要\[.+\]查看\s*<{2,}$/u.test(text(i));

  lines.forEach(line => {
    const value = line.textContent;
    const meta = value.match(/^(#\d+\s+)(.+?)(\s*[|｜]\s*.+?\s*[|｜])(.*)$/u);
    const impersonator = /^#173\s+BLACKHAND\s*[|｜]\s*07\/24\s+21:09\s*[|｜]\s*$/u.test(value.trim());
    if (impersonator) {
      line.querySelectorAll('strong,b,[data-rt-user],.sf-official,.rt-official').forEach(user => {
        if (user.textContent.trim() === 'BLACKHAND') user.replaceWith(document.createTextNode(user.textContent));
      });
    }
    if (meta && !line.children.length) {
      const name = meta[2].trim();
      const code = meta[4].trim().split(/[▲▼]/u)[0].trim();
      const known = /^(?:MASTER|BLACKHAND|Gemini|ChatGPT|GPT|楼宝|🎂)$/iu.test(name);
      const official = !impersonator && (code ? name === code : known);
      const premium = name === 'NONONO';
      if (official || premium) {
        const user = document.createElement('strong');
        user.className = premium ? 'sf-premium' : 'sf-official';
        user.textContent = meta[2];
        line.replaceChildren(document.createTextNode(meta[1]), user, document.createTextNode(meta[3] + meta[4]));
      }
    }
    if (/^@NONONO\b/u.test(value) && !line.children.length) {
      const user = document.createElement('strong');
      user.className = 'sf-premium';
      user.textContent = 'NONONO';
      line.replaceChildren(document.createTextNode('@'), user, document.createTextNode(value.slice(7)));
    }
    if (!/^(?:🙏|感谢)/u.test(value.trim()) || !/等\d[\d,，]*位善人/u.test(value)) return;
    line.classList.add('sf-donation-row');
    const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (node.parentElement.closest('.sf-donation-count')) return;
      const pattern = /等(\d[\d,，]*)(?=位善人)/gu;
      const matches = [...node.textContent.matchAll(pattern)];
      if (!matches.length) return;
      const fragment = document.createDocumentFragment();
      let offset = 0;
      matches.forEach(match => {
        fragment.append(document.createTextNode(node.textContent.slice(offset, match.index) + '等'));
        const count = document.createElement('u');
        count.className = 'sf-donation-count';
        count.textContent = match[1];
        fragment.append(count);
        offset = match.index + match[0].length;
      });
      fragment.append(document.createTextNode(node.textContent.slice(offset)));
      node.replaceWith(fragment);
    });
  });

  const approved = {"forum":["11e1a14bb1a9283cf9b0b94438b7a4df8eb75e3d338ec2ab0fd021bc97c1f786"],"timeline":["8f7665f32c7bbf60b684d40c72cd60061a6c062c8e6967fb0e7fbd7146bfd785"],"price":["32d08393b85044c381a778fdee820ba477b55e30e589e05639755aa5a52f7d06"],"review":["56068b14a9c80521c089890199f3e546425969a821250f597b178422e776670f","fce22137d428fcc725aceb522c674cca186d2c7299b1c086f242e39100f7b48d","0a011b1d70ac60c6ae669ebd52e562d6624bab0137dc02a414da641a5ee1bb11","12ef6b02e055fd59f02e87a552450b0cd7c0f5502bc6d11759de69519258a827"],"fold":["2bb9fbc21d2e28275661ce5656c87ca0d5dc91764e23255d94fa313ad0c85670","921d5affc743fc457899e37797e2bcaae3b20a9c978bbb8f8948ca5d188293e1","fba5374f57f69f0f277cbea48f3f3725d676215be9052786a1d27c9da1230319","33eb5d91eea2a7b642a97c372528329b85e1897ad588ddaa325a7134129516f1","177876c1bcce6d377575f1132136d5eacb338a0ff4bc0a82ba7b25c9993fb18d","f5507a66a65e62a107249a8fd9a8bf21685fc8f9fceeb6fdaa1d338dd2175880","b1f6745f69793c2c4b8c3ba50e7adff03063ba64639962797195eace575af699","3d98af0de29e16d6e0c149b7b9d401ab26fa7f8d034b46ef1dfaa324f497b012","c07be9bd24d4e95ef51b7d4465d1222673743434783987c69407578339f4cfb6"]};
  const candidates = [];
  const add = (kind, start, end, displayEnd = end) => candidates.push({ kind, start, end:trimEnd(start,end), displayEnd });
  lines.forEach((line, i) => {
    if (forumTitlePattern.test(text(i))) {
      for (let j = i + 1; j < Math.min(lines.length, i + 80); j++) {
        if (divider(j)) { add('forum',i,j); break; }
        if (blank(j) && blank(j + 1)) break;
      }
    }
    if (text(i).includes('时间线如下：')) {
      const start = nextText(i + 1);
      let end = start;
      for (let j = start; j < lines.length; j++) {
        if (blank(j)) continue;
        // Source spacing is allowed inside a timeline; narrative ends it.
        if (!/^(?:◎|【.+】[。.]?$)/u.test(text(j))) break;
        end = j;
      }
      add('timeline',start,end);
    }
    if (text(i).includes('写着价目表：')) {
      const start = nextText(i + 1);
      let end = start;
      for (let j = start; j < lines.length; j++) {
        if (blank(j) || /^【(?:人力|自助)】/u.test(text(j)) || /——\s*\d+円\//u.test(text(j))) end = j;
        else break;
      }
      add('price',start,end);
    }
    if (/^.+的感想[·・•]评价$/u.test(text(i))) {
      for (let j = i + 1; j < Math.min(lines.length, i + 25); j++) {
        if (/^❤\uFE0F?\s*\d+$/u.test(text(j))) {
          const displayEnd = /^[—─－-]{4,}$/u.test(text(j + 1)) ? j + 1 : j;
          add('review',i,j,displayEnd);
          break;
        }
      }
    }
    if (gate(i) && text(nextText(i + 1)) === '[以下内容开启防泄密保护]') {
      let end = i;
      for (let j = i + 1; j < lines.length; j++) {
        if (gate(j) || divider(j) || post(j) || /^跟踪的心得到此|^⑦只建议K佬购买/u.test(text(j))) break;
        if (blank(j) && blank(j + 1)) break;
        end = j;
      }
      add('fold',i,end,trimEnd(i,end));
    }
  });

  const allowedMessages = new Set(['🤬','这个是什么意思在😡旁边','？','不理我']);
  const chat = i => /^：/u.test(text(i)) && allowedMessages.has(text(i).slice(1).replace(/\s/gu,''));
  const chatRanges = [];
  for (let i = 0; i < lines.length; i++) {
    if (!chat(i)) continue;
    const start = i;
    let end = i;
    while (end + 1 < lines.length) {
      const next = nextText(end + 1);
      if (next - end > 2 || !chat(next)) break;
      end = next;
    }
    chatRanges.push({ kind:'chat',start,end,displayEnd:end });
    i = end;
  }

  const normalize = list => list.map(value => value.trim()).filter(Boolean).join('\n');
  const digest = async value => {
    const bytes = await window.crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
    return [...new Uint8Array(bytes)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
  };
  async function finish() {
    const accepted = window.crypto?.subtle ? (await Promise.all(candidates.map(async range => {
      const signature = await digest(normalize(values.slice(range.start,range.end + 1)));
      return approved[range.kind]?.includes(signature) ? range : null;
    }))).filter(Boolean) : [];
    accepted.push(...chatRanges);
    // Build outer excerpts first so inner disclosures can remain nested.
    accepted.sort((a,b)=>a.start-b.start || b.displayEnd-a.displayEnd).forEach(range => {
      const selected = lines.slice(range.start,range.displayEnd + 1);
      const parent = selected[0]?.parentElement;
      if (!parent || !article.contains(parent) || selected.some(line=>line.parentElement !== parent)) return;
      if (range.kind === 'forum' && selected[0].closest('.sf-forum,.rt-forum')) return;
      const block = document.createElement(range.kind === 'fold' ? 'details' : 'section');
      block.className = range.kind === 'chat' ? 'sf-chat' : 'sf-excerpt sf-' + range.kind;
      selected[0].before(block);
      block.append(...selected);
      if (range.kind === 'forum') selected.forEach(line=>{
        if (/^-{5,}$/u.test(line.textContent.trim())) { line.classList.add('sf-divider'); line.setAttribute('aria-hidden','true'); }
      });
      if (range.kind === 'fold') {
        const summary = document.createElement('summary');
        const label = document.createElement('span');
        label.className = 'sf-gate-label';
        label.append(...selected[0].childNodes);
        summary.append(label);
        const body = document.createElement('div');
        body.className = 'sf-fold-body';
        body.append(...selected.slice(1));
        selected[0].remove();
        block.append(summary,body);
      }
      if (range.kind === 'review') {
        const header = document.createElement('header');
        header.className = 'sf-review-head';
        const avatar = document.createElement('span');
        avatar.className = 'sf-review-avatar';
        avatar.setAttribute('aria-hidden','true');
        const info = document.createElement('div');
        header.append(avatar,info);
        block.prepend(header);
        selected.slice(0,3).forEach((line,i)=>{line.classList.add(['sf-review-name','sf-review-date','sf-review-rating'][i]);info.append(line);});
        selected.forEach(line=>{
          if (/^❤\uFE0F?\s*\d+$/u.test(line.textContent.trim())) line.classList.add('sf-review-likes');
          if (/^[—─－-]{4,}$/u.test(line.textContent.trim())) line.classList.add('sf-review-divider');
        });
      }
      if (range.kind === 'chat') selected.forEach(line=>{
        const match = line.textContent.match(/^(\s*：)([\s\S]*)$/u);
        if (!match) return;
        const prefix = document.createElement('span');
        prefix.className = 'sf-chat-prefix';
        prefix.textContent = match[1];
        line.replaceChildren(prefix,document.createTextNode(match[2]));
        line.classList.add('sf-bubble');
      });
    });
    article.dataset.sfReady = 'true';
  }
  finish().catch(error=>console.warn('Reader presentation:',error));
})();
