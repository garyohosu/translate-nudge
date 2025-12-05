/**
 * Translation Retrigger v2 - 動的サイトでGoogle翻訳を強制再トリガー
 * テキストノードを直接操作してGoogle翻訳の検知を促す
 */
(function() {
  'use strict';

  const CONFIG = {
    debounceDelay: 500,
    scrollThreshold: 100,
    cooldown: 1500,
    // X/Twitter のツイートテキストセレクタ
    targetSelectors: [
      '[data-testid="tweetText"]',
      '[lang]:not(html):not(:empty)',
      'article span',
      'div[dir="auto"]'
    ]
  };

  let debounceTimer = null;
  let lastScrollY = window.scrollY;
  let lastTriggerTime = 0;
  let processedNodes = new WeakSet();

  /**
   * テキストノードを操作して翻訳を再トリガー
   */
  function nudgeTranslation() {
    const now = Date.now();
    if ((now - lastTriggerTime) < CONFIG.cooldown) return;
    lastTriggerTime = now;

    // 方法1: 未処理のテキスト要素を見つけて再処理を促す
    const selector = CONFIG.targetSelectors.join(',');
    const elements = document.querySelectorAll(selector);

    elements.forEach(el => {
      if (processedNodes.has(el)) return;

      // 英語テキストっぽいものだけ対象（既に翻訳済みは除く）
      const text = el.textContent || '';
      if (!text.trim() || !/[a-zA-Z]{3,}/.test(text)) return;

      // 方法A: translate属性を明示的に設定
      el.setAttribute('translate', 'yes');

      // 方法B: 空白ノードを追加・削除してMutationを発生
      const marker = document.createTextNode('\u200B'); // ゼロ幅スペース
      el.appendChild(marker);
      requestAnimationFrame(() => {
        marker.remove();
      });

      processedNodes.add(el);
    });

    // 方法2: html要素にクラスを追加してChromeに変更を通知
    const html = document.documentElement;
    html.classList.add('notranslate');
    requestAnimationFrame(() => {
      html.classList.remove('notranslate');
    });

    // 方法3: 翻訳関連のイベントをディスパッチ
    document.dispatchEvent(new Event('DOMContentLoaded'));
    window.dispatchEvent(new Event('load'));

    console.log('[Translation Nudge] Triggered for', elements.length, 'elements');
  }

  /**
   * より強力な再トリガー（スクロール時）
   */
  function forceRetrigger() {
    const now = Date.now();
    if ((now - lastTriggerTime) < CONFIG.cooldown) return;
    lastTriggerTime = now;

    // 未翻訳の要素を探してテキストを一時的に操作
    const tweets = document.querySelectorAll('[data-testid="tweetText"]');

    tweets.forEach(tweet => {
      if (processedNodes.has(tweet)) return;

      const walker = document.createTreeWalker(
        tweet,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.trim()) {
          // テキストを一瞬変更して戻す
          const original = node.textContent;
          node.textContent = original + ' ';
          requestAnimationFrame(() => {
            node.textContent = original;
          });
          break;
        }
      }

      processedNodes.add(tweet);
    });

    console.log('[Translation Nudge] Force triggered');
  }

  function scheduleNudge(force = false) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(
      force ? forceRetrigger : nudgeTranslation,
      CONFIG.debounceDelay
    );
  }

  // スクロール監視
  window.addEventListener('scroll', () => {
    const scrollDelta = Math.abs(window.scrollY - lastScrollY);
    if (scrollDelta > CONFIG.scrollThreshold) {
      lastScrollY = window.scrollY;
      scheduleNudge(true);
    }
  }, { passive: true });

  // DOM変更監視
  const observer = new MutationObserver((mutations) => {
    const hasNewContent = mutations.some(m =>
      m.addedNodes.length > 0 &&
      [...m.addedNodes].some(n =>
        n.nodeType === Node.ELEMENT_NODE &&
        n.textContent?.trim()
      )
    );
    if (hasNewContent) {
      scheduleNudge(false);
    }
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // 初回実行
  setTimeout(nudgeTranslation, 1000);

  console.log('[Translation Nudge v2] Active');
})();
