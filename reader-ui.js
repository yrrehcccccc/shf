/* Opt-in only: processes data-rt-donation and data-rt-user markers. */
(() => {
  'use strict';
  const officialNames = new Set(['master','blackhand','gemini','chatgpt','gpt','楼宝','🎂']);

  function init(container = document) {
    container.querySelectorAll('[data-rt-user]').forEach(user => {
      const name = user.textContent.trim();
      const code = (user.getAttribute('data-rt-code') || '').trim();
      // A nonempty ID must exactly match the displayed name.
      const official = code ? name === code : officialNames.has(name.toLowerCase());
      user.classList.toggle('rt-official', official);
    });

    container.querySelectorAll('[data-rt-donation]').forEach(row => {
      const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(node => {
        if (node.parentElement.closest('.rt-count')) return;
        const value = node.textContent;
        const pattern = /等(\d[\d,，]*)(?=位)/gu;
        const matches = [...value.matchAll(pattern)];
        if (!matches.length) return;
        const fragment = document.createDocumentFragment();
        let offset = 0;
        for (const match of matches) {
          fragment.append(document.createTextNode(value.slice(offset, match.index) + '等'));
          const count = document.createElement('u');
          count.className = 'rt-count';
          count.textContent = match[1];
          fragment.append(count);
          offset = match.index + match[0].length;
        }
        fragment.append(document.createTextNode(value.slice(offset)));
        node.replaceWith(fragment);
      });
    });
  }

  window.ReaderUITemplate = Object.freeze({ init });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(), { once:true });
  } else init();
})();
