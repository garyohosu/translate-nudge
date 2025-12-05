(function() {
  'use strict';

  const CONFIG = {
    debounceDelay: 800,      // デバウンス遅延（ミリ秒）
    scrollThreshold: 150,    // スクロール検知の閾値（ピクセル）
    toggleInterval: 50,      // 言語切り替えの間隔（ミリ秒）
    cooldown: 2000,          // 再トリガー後のクールダウン（ミリ秒）
  };

  let debounceTimer = null;
  let lastScrollY = window.scrollY;
  let isToggling = false;
  let lastTriggerTime = 0;

  /**
   * Google翻訳を再トリガーする
   * 言語属性を一時的に切り替えることで翻訳エンジンを再起動
   */
  function retriggerTranslation() {
    const now = Date.now();

    // クールダウン中またはトグル中はスキップ
    if (isToggling || (now - lastTriggerTime) < CONFIG.cooldown) {
      return;
    }

    isToggling = true;
    lastTriggerTime = now;

    const html = document.documentElement;
    const originalLang = html.getAttribute('lang') || 'en';

    // 方法1: lang属性を切り替え
    html.setAttribute('lang', originalLang === 'ja' ? 'en' : 'ja');

    setTimeout(() => {
      html.setAttribute('lang', originalLang);

      // 方法2: 翻訳対象のダミー要素を追加・削除
      const trigger = document.createElement('span');
      trigger.textContent = ' ';
      trigger.style.cssText = 'position:absolute;opacity:0;pointer-events:none;';
      document.body.appendChild(trigger);

      setTimeout(() => {
        trigger.remove();
        isToggling = false;
      }, CONFIG.toggleInterval);

    }, CONFIG.toggleInterval);
  }

  /**
   * デバウンス付きで再トリガーをスケジュール
   */
  function scheduleRetrigger() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(retriggerTranslation, CONFIG.debounceDelay);
  }

  // スクロールイベント監視
  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    const scrollDelta = Math.abs(currentScrollY - lastScrollY);

    if (scrollDelta > CONFIG.scrollThreshold) {
      lastScrollY = currentScrollY;
      scheduleRetrigger();
    }
  }, { passive: true });

  // DOM変更監視（新しいコンテンツ読み込み検知）
  const observer = new MutationObserver((mutations) => {
    // 追加されたノードがある場合のみ
    const hasNewContent = mutations.some(m =>
      m.addedNodes.length > 0 &&
      [...m.addedNodes].some(n => n.nodeType === Node.ELEMENT_NODE)
    );

    if (hasNewContent) {
      scheduleRetrigger();
    }
  });

  // bodyが存在したら監視開始
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }

  // コンソールに起動メッセージ
  console.log('[Translation Retrigger] Active');
})();
