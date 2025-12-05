# translate-nudge

動的サイト（X/Twitter等）でGoogle翻訳が追従しない問題を解決するChrome拡張機能。

## 問題

Xのような動的JavaScriptサイトでは、Chromeのページ翻訳機能が新しく読み込まれたコンテンツを翻訳しない。手動で言語を切り替えると翻訳されるが、毎回やるのは面倒。

## 解決策

スクロールやDOM変更を検知して、自動的に翻訳を再トリガーする。

## インストール

1. このリポジトリをクローン
   ```bash
   git clone https://github.com/garyohosu/translate-nudge.git
   ```

2. Chromeで `chrome://extensions` を開く

3. 右上の「デベロッパーモード」をON

4. 「パッケージ化されていない拡張機能を読み込む」をクリック

5. クローンしたフォルダを選択

## 使い方

1. 翻訳したいサイト（X等）を開く
2. Chromeの翻訳機能を有効にする（アドレスバー右の翻訳アイコン）
3. スクロールすると自動で新コンテンツが翻訳される

## 設定

`content.js` 内の `CONFIG` で調整可能：

```javascript
const CONFIG = {
  debounceDelay: 800,      // デバウンス遅延（ミリ秒）
  scrollThreshold: 150,    // スクロール検知の閾値（ピクセル）
  toggleInterval: 50,      // 言語切り替えの間隔（ミリ秒）
  cooldown: 2000,          // 再トリガー後のクールダウン（ミリ秒）
};
```

## License

MIT
