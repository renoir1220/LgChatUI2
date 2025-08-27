生产环境热补丁：欢迎页只保留“使用说明”按钮（无需重新构建）

使用方式
- 编辑线上可访问的前端运行时配置文件：`/config.js`（构建时来自 `frontend/public/config.js`）。
- 将 `window.APP_CONFIG.VERSION` 改成一个新值（例如从 `1.1.0` 改成 `1.1.1`），确保浏览器一定拉到新版 config。
- 然后把下方脚本整段“追加”到 `config.js` 文件最后一行的右花括号之后（即 `window.APP_CONFIG = { ... }` 之后）。

脚本（复制整段追加到 config.js 末尾）

```html
<script>
(function () {
  function onReady(fn) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(fn, 0);
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function queryButtonsByText(root, texts) {
    var list = Array.prototype.slice.call(root.querySelectorAll('button, a, [role="button"]'));
    return list.filter(function (el) {
      var t = (el.innerText || el.textContent || '').trim();
      return texts.some(function (x) { return t.indexOf(x) !== -1; });
    });
  }

  function openInfoFeed() {
    // 直接找“信息流/消息流”入口并点击
    var candidates = queryButtonsByText(document, ['信息流', '消息流']);
    if (candidates.length) {
      candidates[0].click();
      return true;
    }
    return false;
  }

  onReady(function () {
    // 1) 删除欢迎页上不需要的按钮（按文案匹配；按你的实际文案调整下面数组）
    var toRemove = ['功能演示', '更多示例', '快速开始', '了解更多'];
    queryButtonsByText(document, toRemove).forEach(function (n) {
      if (n && n.parentElement) n.parentElement.removeChild(n);
    });

    // 2) 插入“使用说明”按钮（右上角悬浮，不依赖具体容器）
    if (!document.getElementById('runtime-usage-btn')) {
      var btn = document.createElement('button');
      btn.id = 'runtime-usage-btn';
      btn.textContent = '使用说明';
      btn.style.cssText =
        'position:fixed;top:16px;right:16px;z-index:9999;padding:8px 12px;'
        + 'background:#111;color:#fff;border-radius:8px;border:none;cursor:pointer;'
        + 'box-shadow:0 2px 8px rgba(0,0,0,0.15)';
      btn.onclick = function () {
        if (openInfoFeed()) return;
        // 如果当下页面没有入口，跳到首页并轮询查找入口后点击
        if (location.pathname !== '/') {
          location.href = '/';
        }
        var tries = 0;
        var timer = setInterval(function () {
          tries++;
          if (openInfoFeed() || tries > 60) { // 最多 15 秒
            clearInterval(timer);
          }
        }, 250);
      };
      document.body.appendChild(btn);
    }
  });
})();
</script>
```

可选：配套一次性“强制刷新”脚本
- 如果发布后仍有用户命中旧缓存（例如 SW 未及时更新），可在上面的脚本后再追加下面这一段；以后每次只要改 `window.APP_CONFIG.VERSION`，都会自动清理缓存并刷新一次。

```html
<script>
(function () {
  try {
    var KEY = 'APP_VERSION_LgChatUI2';
    var curr = (window.APP_CONFIG && window.APP_CONFIG.VERSION) || '';
    var prev = localStorage.getItem(KEY);
    if (curr && prev && prev !== curr) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function (regs) {
          regs.forEach(function (r) { r.unregister(); });
        });
      }
      if (window.caches && caches.keys) {
        caches.keys().then(function (keys) { keys.forEach(function (k) { caches.delete(k); }); });
      }
      localStorage.setItem(KEY, curr);
      setTimeout(function () { location.reload(true); }, 100);
    } else if (curr && !prev) {
      localStorage.setItem(KEY, curr);
    }
  } catch (e) {}
})();
</script>
```

撤销热补丁
- 想恢复到构建产物的原始样式，只需从 `config.js` 中删掉上述 `<script>…</script>` 片段，并（可选）把 VERSION 改回即可。

