/**
 * 猫格鉴定流程：上传 → 扫描动效 → 结果展示 + 结果卡生成。
 */
(function () {
  'use strict';

  var DATA = window.CAT_DATA;
  var ANALYSIS = window.CAT_ANALYSIS;
  var ART = window.CAT_ART;

  var el = {
    home: document.getElementById('screen-home'),
    scan: document.getElementById('screen-scan'),
    result: document.getElementById('screen-result'),
    photoInput: document.getElementById('photo-input'),
    heroTrio: document.getElementById('hero-trio'),
    scanPhoto: document.getElementById('scan-photo'),
    scanFill: document.getElementById('scan-fill'),
    resultBody: document.getElementById('result-body')
  };

  var scanTimers = [];
  var lastPhotoURL = null;

  function showScreen(name) {
    el.home.hidden = name !== 'home';
    el.scan.hidden = name !== 'scan';
    el.result.hidden = name !== 'result';
    window.scrollTo(0, 0);
  }

  /** 压缩到最长边 900px，控制内存并用于结果卡绘制。 */
  function downscale(img) {
    var max = 900;
    var scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    var w = Math.max(1, Math.round(img.naturalWidth * scale));
    var h = Math.max(1, Math.round(img.naturalHeight * scale));
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.88);
  }

  function clearScanTimers() {
    scanTimers.forEach(function (t) { window.clearTimeout(t); });
    scanTimers = [];
  }

  /** 扫描动效：步骤文案 + 进度条，最后进入结果页。 */
  function playScan(result, photoURL) {
    var stepNodes = DATA.scanSteps.map(function (_, i) {
      return document.getElementById('scan-step-' + i);
    });
    stepNodes.forEach(function (node) { node.classList.remove('is-active'); });
    stepNodes[0].classList.add('is-active');
    el.scanFill.style.width = '12%';

    var progresses = [42, 68, 88, 100];
    DATA.scanSteps.forEach(function (_, i) {
      scanTimers.push(window.setTimeout(function () {
        stepNodes.forEach(function (node, j) {
          node.classList.toggle('is-active', j === i);
        });
        el.scanFill.style.width = progresses[i] + '%';
      }, 900 + i * 1000));
    });

    scanTimers.push(window.setTimeout(function () {
      renderResult(result, photoURL);
    }, 900 + DATA.scanSteps.length * 1000 + 300));
  }

  function findPersona(key) {
    return DATA.personas.filter(function (p) { return p.key === key; })[0];
  }

  function renderResult(result, photoURL) {
    var p = result.persona;
    var match = findPersona(p.match);
    var indices = DATA.indices;
    getBadgeImage(p); // 预载猫格徽章，保证保存卡片时可用

    el.resultBody.innerHTML = '' +
      '<div class="result-card" style="--p-color:' + p.color + ';--p-soft:' + p.soft + ';--m-color:' + match.color + ';--m-soft:' + match.soft + '">' +
      '  <div class="result-hero">' +
      '    <div class="result-photo-ring">' +
      '      <div class="result-photo"><img src="' + photoURL + '" alt="你的猫咪"></div>' +
      '    </div>' +
      '    <p class="result-label">你家猫咪的猫格是</p>' +
      '    <h1 class="result-name">' + p.name + '</h1>' +
      '    <p class="result-slogan">“' + p.slogan + '”</p>' +
      '    <div class="result-tags">' + p.tags.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div>' +
      '  </div>' +
      '  <div class="result-detail">' +
      '    <p class="result-desc">' + p.desc + '</p>' +
      '    <p class="result-banger">' + p.banger + '</p>' +
      '  </div>' +
      '  <div class="result-pattern">' +
      '    <h2 class="indices-title">毛色纹样鉴定</h2>' +
      '    <div class="pattern-card">' +
      '      <span class="pattern-name">' + result.pattern.name + '</span>' +
      '      <span class="pattern-note">' + result.pattern.note + '</span>' +
      '    </div>' +
      '  </div>' +
      '  <div class="result-lore">' +
      '    <h2 class="indices-title">养猫小贴士</h2>' +
      p.care.map(function (line) {
        return '<p class="lore-line">' + line + '</p>';
      }).join('') +
      '  </div>' +
      '  <div class="result-indices">' +
      '    <h2 class="indices-title">猫咪性格四项指标</h2>' +
      indices.map(function (idx) {
        var v = result.indices[idx.key];
        return '' +
          '<div class="index-row">' +
          '  <span class="index-name">' + idx.name + '</span>' +
          '  <span class="index-bar"><span class="index-fill' + (v >= 75 ? ' is-hot' : '') + '" style="width:' + v + '%"></span></span>' +
          '  <span class="index-pct">' + v + '</span>' +
          '</div>';
      }).join('') +
      '  </div>' +
      '  <div class="result-mix">' +
      '    <h2 class="indices-title">猫格构成</h2>' +
      result.mix.map(function (row, i) {
        return '' +
          '<div class="mix-row' + (i === 0 ? ' is-top' : '') + '" style="--m-color:' + row.persona.color + '">' +
          '  <span class="mix-face">' + ART.personaFace(row.persona.face) + '</span>' +
          '  <span class="mix-name">' + row.persona.name + '</span>' +
          '  <span class="mix-bar"><span class="mix-fill" style="width:' + row.percent + '%"></span></span>' +
          '  <span class="index-pct">' + row.percent + '%</span>' +
          '</div>';
      }).join('') +
      '  </div>' +
      '  <div class="result-match">' +
      '    <span class="match-face">' + ART.personaFace(match.face) + '</span>' +
      '    <span><span class="m-name">猫格速配：<b>' + match.name + '</b></span>' +
      '    <span class="m-desc">' + p.matchDesc + '</span></span>' +
      '  </div>' +
      '  <div class="result-actions">' +
      '    <a class="btn btn-primary-lg" id="btn-save-card" href="#" download="我家主子的猫格-' + p.name + '.png">保存猫咪性格卡</a>' +
      '    <button type="button" class="btn btn-secondary-lg" id="btn-retake">再测一只猫</button>' +
      '    <p class="result-share-hint">把档案卡发到猫友群，看看谁家主子最像</p>' +
      '  </div>' +
      '</div>';

    var saveBtn = document.getElementById('btn-save-card');
    saveBtn.addEventListener('click', function (event) {
      event.preventDefault();
      var url = buildShareCard(result, photoURL);
      saveBtn.setAttribute('href', url);
      // 已设置 href 后允许本次默认下载行为在下次点击生效；这里直接触发下载
      var a = document.createElement('a');
      a.href = url;
      a.download = '我家主子的猫格-' + p.name + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });

    document.getElementById('btn-retake').addEventListener('click', function () {
      el.photoInput.value = '';
      showScreen('home');
    });

    // 调试钩子：控制台可重新生成结果卡（也用于自动化验证）
    window.__catCard = function () { return buildShareCard(result, photoURL); };

    document.title = '我家猫咪是「' + p.name + '」——猫咪性格测试';
    showScreen('result');
  }

  /** 结果卡 PNG：1080×1440，canvas 绘制（主题色 + 猫爪印 + 徽章设计）。 */
  function buildShareCard(result, photoURL) {
    var p = result.persona;
    var W = 1080;
    var H = 1440;
    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');
    var cx = W / 2;

    // 1、主题色背景 + 装饰（猫爪印 / 圆点）
    ctx.fillStyle = p.soft;
    ctx.fillRect(0, 0, W, H);
    drawPaw(ctx, 120, 150, 46, p.color, 0.14);
    drawPaw(ctx, 950, 110, 38, p.color, 0.12);
    drawPaw(ctx, 1000, 620, 42, p.color, 0.10);
    drawPaw(ctx, 90, 700, 36, p.color, 0.10);
    drawPaw(ctx, 960, 1250, 44, p.color, 0.12);
    drawPaw(ctx, 130, 1150, 34, p.color, 0.10);

    // 2、白色主体卡
    roundRect(ctx, 56, 96, W - 112, H - 224, 56);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 3、猫咪照片（大圆角方形 + 主题色描边 + 猫格徽章）
    var photo = new Image();
    photo.src = photoURL;
    var size = Math.min(photo.width, photo.height);
    roundRect(ctx, 190, 148, 700, 700, 48);
    ctx.save();
    ctx.clip();
    ctx.drawImage(photo, (photo.width - size) / 2, (photo.height - size) / 2, size, size, 190, 148, 700, 700);
    ctx.restore();
    roundRect(ctx, 190, 148, 700, 700, 48);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 10;
    ctx.stroke();

    // 猫格小猫头徽章（SVG 光栅化后贴在照片右下角）
    drawFaceBadge(ctx, p, 760, 742);

    // 4、猫格名称徽章
    ctx.textAlign = 'center';
    roundRect(ctx, cx - 300, 902, 600, 88, 44);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 46px -apple-system, PingFang SC, sans-serif';
    ctx.fillText(p.name, cx, 962);

    // 5、宣言 + 纹样徽章
    ctx.fillStyle = '#33302a';
    ctx.font = '600 33px -apple-system, PingFang SC, sans-serif';
    ctx.fillText('“' + p.slogan + '”', cx, 1036);

    var patText = '纹样鉴定 · ' + result.pattern.name;
    ctx.font = '700 28px -apple-system, PingFang SC, sans-serif';
    var patW = ctx.measureText(patText).width + 96;
    roundRect(ctx, cx - patW / 2, 1064, patW, 56, 28);
    ctx.fillStyle = p.soft;
    ctx.fill();
    ctx.fillStyle = p.color;
    ctx.fillText(patText, cx, 1102);

    // 6、四项指标（圆角条 + 数值）
    var rows = DATA.indices;
    var startY = 1176;
    var rowH = 62;
    rows.forEach(function (idx, i) {
      var y = startY + i * rowH;
      ctx.textAlign = 'right';
      ctx.fillStyle = '#33302a';
      ctx.font = '700 29px -apple-system, PingFang SC, sans-serif';
      ctx.fillText(idx.name, 310, y + 21);
      roundRect(ctx, 340, y, 420, 20, 10);
      ctx.fillStyle = '#f2ede4';
      ctx.fill();
      roundRect(ctx, 340, y, Math.max(22, 420 * result.indices[idx.key] / 100), 20, 10);
      ctx.fillStyle = result.indices[idx.key] >= 75 ? '#e2574c' : p.color;
      ctx.fill();
      ctx.textAlign = 'left';
      ctx.fillStyle = '#6d675d';
      ctx.font = '700 27px -apple-system, PingFang SC, sans-serif';
      ctx.fillText(String(result.indices[idx.key]), 782, y + 21);
    });

    // 7、页脚
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a09a8e';
    ctx.font = '24px -apple-system, PingFang SC, sans-serif';
    ctx.fillText('拍张照测主子性格 · 照片仅本机分析 · @ 铲屎官来战', cx, H - 68);

    return canvas.toDataURL('image/png');
  }

  /** 猫爪印：一个肉垫 + 三根指头。 */
  function drawPaw(ctx, x, y, r, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.62, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    [-1, 0, 1].forEach(function (k) {
      ctx.beginPath();
      ctx.ellipse(x + k * r * 0.42, y - r * 0.55, r * 0.16, r * 0.22, k * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  /** 猫格小猫头徽章：SVG 预载缓存（渲染结果页时开始加载，保存卡片时已就绪）。 */
  var badgeCache = {};
  function getBadgeImage(persona) {
    if (!badgeCache[persona.key]) {
      var img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(window.CAT_ART.personaFace(persona.face));
      badgeCache[persona.key] = img;
    }
    return badgeCache[persona.key];
  }

  function drawFaceBadge(ctx, persona, x, y) {
    ctx.beginPath();
    ctx.arc(x + 66, y + 66, 66, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = persona.color;
    ctx.lineWidth = 5;
    ctx.stroke();
    var img = getBadgeImage(persona);
    if (!img.complete || !img.naturalWidth) {
      return;
    }
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + 66, y + 66, 62, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x + 8, y + 14, 116, 100);
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  el.photoInput.addEventListener('change', function () {
    var file = el.photoInput.files && el.photoInput.files[0];
    if (!file) {
      return;
    }
    clearScanTimers();
    ANALYSIS.loadImageFile(file)
      .then(function (img) {
        var photoURL = downscale(img);
        lastPhotoURL = photoURL;
        var result = ANALYSIS.analyzeImage(img);
        el.scanPhoto.src = photoURL;
        showScreen('scan');
        playScan(result, photoURL);
      })
      .catch(function (err) {
        window.alert(err.message || '图片读取失败，换一张试试');
        el.photoInput.value = '';
      });
  });

  el.heroTrio.innerHTML = ART.heroTrio();
  showScreen('home');
})();
