/* Opt-in only: processes data-rt-donation and data-rt-user markers. */
(() => {
  'use strict';
  const officialNames = new Set(['master','blackhand','gemini','chatgpt','gpt','楼宝','🎂']);

  function clearKnownImpersonator(container) {
    container.querySelectorAll('.prose-line,p,.rt-meta').forEach(row => {
      if (!/^#173\s+BLACKHAND\s*[|｜]\s*07\/24\s+21:09\s*[|｜]\s*$/u.test(row.textContent.trim())) return;
      row.classList.add('sf-impersonator');
      row.style.fontWeight = 'var(--weight,400)';
      row.querySelectorAll('.sf-official,.rt-official').forEach(user => user.classList.remove('sf-official','rt-official'));
      row.querySelectorAll('strong,b').forEach(user => user.replaceWith(...user.childNodes));
      row.querySelectorAll('[data-rt-user]').forEach(user => { user.style.fontWeight = 'inherit'; });
    });
  }


  function decorateChats(container = document) {
    if (window.ReaderChatLayout) return window.ReaderChatLayout.decorate(container);
    const bubbleSelector = '.rt-bubble,.sf-bubble';
    const chatSelector = '.rt-chat,.sf-chat';
    const isSpacer = node => node.nodeType === Node.ELEMENT_NODE && (
      node.matches('br,.blank-line') || (node.matches('p,.prose-line') && !node.textContent.trim() &&
        !node.querySelector('img,svg,video,audio,iframe,input,button'))
    );
    function previousContent(element) {
      const spacers = [];
      let node = element.previousSibling;
      while (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.textContent.trim()) return null;
        } else if (isSpacer(node)) spacers.push(node);
        else if (node.nodeType === Node.ELEMENT_NODE) return { node, spacers };
        node = node.previousSibling;
      }
      return { node:null, spacers };
    }
    function timestampBefore(bubble,row,chat) {
      if (row?.querySelector(':scope > .reader-chat-meta')) return null;
      let previous = previousContent(row || bubble);
      if (previous && !previous.node && chat.querySelector(bubbleSelector) === bubble) previous = previousContent(chat);
      const node = previous?.node;
      if (!node || !node.matches('p,.prose-line,[data-chat-time]') || node.matches(bubbleSelector)) return null;
      const label = node.textContent.trim();
      if (!/^(?:[^，。！？!?：:|｜\n]{1,32}[ \t\u3000]+)?(?:[01]?\d|2[0-3])[:：][0-5]\d$/u.test(label)) return null;
      return previous;
    }
    function removeTextRange(element,start,end) {
      const walker = document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
      const nodes = [];
      let offset = 0;
      while (walker.nextNode()) {
        const node = walker.currentNode;
        nodes.push({ node,start:offset,end:offset + node.data.length });
        offset += node.data.length;
      }
      nodes.forEach(record=>{
        const from = Math.max(start,record.start) - record.start;
        const to = Math.min(end,record.end) - record.start;
        if (to > from) record.node.deleteData(from,to - from);
      });
    }
    container.querySelectorAll(bubbleSelector).forEach(bubble=>{
      const chat = bubble.closest(chatSelector);
      if (!chat) return;
      let row = bubble.parentElement?.classList.contains('reader-message') ? bubble.parentElement : null;
      const value = bubble.textContent;
      const read = /\s*[（(]\s*已读\s*[）)]\s*$/u.exec(value);
      const canMoveRead = read && (value.slice(0,read.index).trim() || bubble.querySelector('img,svg,video'));
      const stamp = timestampBefore(bubble,row,chat);
      if (!row && !canMoveRead && !stamp) return;
      if (!row) {
        row = document.createElement('div');
        row.className = 'reader-message';
        bubble.before(row);
        row.append(bubble);
      }
      row.dataset.chatLayout = 'line';
      row.classList.toggle('reader-message-self',bubble.matches('.rt-self,.sf-self'));
      if (canMoveRead) {
        removeTextRange(bubble,read.index,value.length);
        if (!row.querySelector(':scope > .reader-chat-read')) {
          const label = document.createElement('span');
          label.className = 'reader-chat-read';
          label.textContent = '已读';
          row.append(label);
        }
      }
      row.classList.toggle('reader-message-read',!!row.querySelector(':scope > .reader-chat-read'));
      if (stamp) {
        stamp.node.classList.add('reader-chat-meta');
        row.prepend(stamp.node);
        stamp.spacers.forEach(node=>node.remove());
      }
    });
  }

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
    clearKnownImpersonator(container);
    decorateChats(container);
  }

  window.ReaderUITemplate = Object.freeze({ init, decorateChats });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(), { once:true });
  } else init();
})();
