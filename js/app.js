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

    el.resultBody.innerHTML = '' +
      '<div class="result-card" style="--p-color:' + p.color + ';--p-soft:' + p.soft + ';--m-color:' + match.color + ';--m-soft:' + match.soft + '">' +
      '  <div class="result-hero">' +
      '    <div class="result-photo-ring">' +
      '      <div class="result-photo"><img src="' + photoURL + '" alt="你的猫咪"></div>' +
      '    </div>' +
      '    <p class="result-label">你家主子的猫格是</p>' +
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
      '    <h2 class="indices-title">相猫经 · 玄学批注</h2>' +
      p.lore.map(function (line) {
        return '<p class="lore-line">' + line + '</p>';
      }).join('') +
      '  </div>' +
      '  <div class="result-indices">' +
      '    <h2 class="indices-title">主子性格四项指标</h2>' +
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
      '    <h2 class="indices-title">猫格基因构成</h2>' +
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
      '    <a class="btn btn-primary-lg" id="btn-save-card" href="#" download="我家主子的猫格-' + p.name + '.png">保存主子档案卡</a>' +
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

    document.title = '我家主子是「' + p.name + '」——AI 猫格鉴定';
    showScreen('result');
  }

  /** 结果卡 PNG：1080×1440，canvas 绘制（照片 + 猫格信息 + 指数条）。 */
  function buildShareCard(result, photoURL) {
    var p = result.persona;
    var W = 1080;
    var H = 1440;
    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = p.soft;
    ctx.fillRect(0, 0, W, H);

    roundRect(ctx, 60, 60, W - 120, H - 120, 64);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 照片圆 + 描边
    var photo = new Image();
    photo.src = photoURL;
    var cx = W / 2;
    var cy = 360;
    var r = 240;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 14, 0, Math.PI * 2);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 12;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    var size = Math.min(photo.width, photo.height);
    ctx.drawImage(photo, (photo.width - size) / 2, (photo.height - size) / 2, size, size, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#a09a8e';
    ctx.font = '600 28px -apple-system, PingFang SC, sans-serif';
    ctx.fillText('你 家 主 子 的 猫 格 是', cx, 706);
    ctx.fillStyle = p.color;
    ctx.font = '800 84px -apple-system, PingFang SC, sans-serif';
    ctx.fillText(p.name, cx, 800);
    ctx.fillStyle = '#33302a';
    ctx.font = '600 34px -apple-system, PingFang SC, sans-serif';
    ctx.fillText('“' + p.slogan + '”', cx, 862);

    // 纹样鉴定徽标
    var patText = '纹样鉴定：' + result.pattern.name;
    ctx.font = '700 30px -apple-system, PingFang SC, sans-serif';
    var patW = ctx.measureText(patText).width + 56;
    roundRect(ctx, cx - patW / 2, 892, patW, 52, 26);
    ctx.fillStyle = p.soft;
    ctx.fill();
    ctx.fillStyle = p.color;
    ctx.fillText(patText, cx, 928);

    // 指数条
    var rows = DATA.indices;
    var startY = 1004;
    var rowH = 78;
    rows.forEach(function (idx, i) {
      var v = result.indices[idx.key];
      var y = startY + i * rowH;
      ctx.textAlign = 'right';
      ctx.fillStyle = '#33302a';
      ctx.font = '700 30px -apple-system, PingFang SC, sans-serif';
      ctx.fillText(idx.name, 330, y + 22);
      roundRect(ctx, 360, y, 470, 22, 11);
      ctx.fillStyle = '#f2ede4';
      ctx.fill();
      roundRect(ctx, 360, y, Math.max(24, 470 * v / 100), 22, 11);
      ctx.fillStyle = p.color;
      if (v >= 75) {
        ctx.fillStyle = '#e2574c';
      }
      ctx.fill();
      ctx.textAlign = 'left';
      ctx.fillStyle = '#6d675d';
      ctx.font = '700 28px -apple-system, PingFang SC, sans-serif';
      ctx.fillText(String(v), 856, y + 22);
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#a09a8e';
    ctx.font = '24px -apple-system, PingFang SC, sans-serif';
    ctx.fillText('拍照测主子性格 · 照片仅本机分析 · @ 铲屎官来战', cx, H - 104);

    return canvas.toDataURL('image/png');
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
