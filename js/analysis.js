/**
 * 本地图像分析：把猫咪照片的毛色 / 明暗 / 细节特征映射为猫格人设。
 *
 * 全部计算在本机 canvas 中完成，照片不会上传到任何服务器。
 * 同一张照片永远得到同一结果（含哈希稳定去重），不同毛色的猫
 * 会稳定命中不同人设。
 */
(function () {
  'use strict';

  var PERSONAS = window.CAT_DATA.personas;
  var KEYS = PERSONAS.map(function (p) { return p.key; });

  var SAMPLE_SIZE = 160;

  /** FNV-1a 哈希：对采样像素求值，用于确定性的微扰与平分决胜。 */
  function hashPixels(data) {
    var h = 0x811c9dc5;
    for (var i = 0; i < data.length; i += 97) {
      h ^= data[i];
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  function rgbToHue(r, g, b, max, min) {
    if (max === min) {
      return 0;
    }
    var d = max - min;
    if (max === r) {
      return ((g - b) / d + (g < b ? 6 : 0)) * 60;
    }
    if (max === g) {
      return ((b - r) / d + 2) * 60;
    }
    return ((r - g) / d + 4) * 60;
  }

  function clamp(v, lo, hi) {
    return Math.min(Math.max(v, lo), hi);
  }

  /** 把图片按中心裁方后缩放到采样尺寸，返回 {data, w, h}。 */
  function samplePixels(img) {
    var side = Math.min(img.naturalWidth, img.naturalHeight);
    var sx = (img.naturalWidth - side) / 2;
    var sy = (img.naturalHeight - side) / 2;
    var canvas = document.createElement('canvas');
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, sx, sy, side, side, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    return ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  }

  /** 统计毛色构成、明暗与细节密度（中心高斯加权 + 背景色抑制）。 */
  function extractFeatures(imageData) {
    var d = imageData.data;
    var n = SAMPLE_SIZE * SAMPLE_SIZE;
    var counts = { orange: 0, cream: 0, tabby: 0, white: 0, black: 0, gray: 0, other: 0 };
    // 上 / 下半身分区统计，用于推断相猫纹样（如乌云盖雪：背黑腹白）
    var top = { orange: 0, white: 0, black: 0, total: 0 };
    var bottom = { orange: 0, white: 0, black: 0, total: 0 };
    var sumBright = 0;
    var sumSat = 0;
    var sumWarm = 0;
    var brightSq = 0;
    var totalW = 0;
    var i, r, g, b, w, x, y;

    // 第一遍：采样外围边框（外圈 10%）估计背景色
    var ring = SAMPLE_SIZE * 0.1;
    var bgR = 0;
    var bgG = 0;
    var bgB = 0;
    var bgN = 0;
    for (y = 0; y < SAMPLE_SIZE; y += 2) {
      for (x = 0; x < SAMPLE_SIZE; x += 2) {
        if (x < ring || x >= SAMPLE_SIZE - ring || y < ring || y >= SAMPLE_SIZE - ring) {
          i = (y * SAMPLE_SIZE + x) * 4;
          bgR += d[i];
          bgG += d[i + 1];
          bgB += d[i + 2];
          bgN++;
        }
      }
    }
    bgR /= bgN;
    bgG /= bgN;
    bgB /= bgN;

    // 中心高斯权重：猫通常在画面中心，背景（墙 / 床单）权重衰减
    var sigma = SAMPLE_SIZE * 0.36;
    var c = SAMPLE_SIZE / 2;

    for (y = 0; y < SAMPLE_SIZE; y++) {
      for (x = 0; x < SAMPLE_SIZE; x++) {
        i = y * SAMPLE_SIZE + x;
        r = d[i * 4];
        g = d[i * 4 + 1];
        b = d[i * 4 + 2];
        var dx = x - c;
        var dy = y - c;
        w = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma)) + 0.08;

        // 背景色抑制：与外圈颜色接近的像素大幅降权（墙、床单、地板）
        var bd = (r - bgR) * (r - bgR) + (g - bgG) * (g - bgG) + (b - bgB) * (b - bgB);
        if (bd < 42 * 42) {
          w *= 0.28;
        }

        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var sat = max === 0 ? 0 : (max - min) / max;
        var bright = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        sumBright += bright * w;
        brightSq += bright * bright * w;
        sumSat += sat * w;
        sumWarm += ((r - b) / 255) * w;
        totalW += w;

        var hue = rgbToHue(r, g, b, max, min);
        var zone = y < SAMPLE_SIZE * 0.55 ? top : bottom;
        zone.total += w;
        if (bright > 0.72 && sat < 0.18) {
          counts.white += w;
          zone.white += w;
        } else if (bright < 0.28 && sat < 0.4) {
          counts.black += w;
          zone.black += w;
        } else if (sat < 0.18) {
          counts.gray += w;
        } else if (hue >= 15 && hue < 48) {
          if (sat >= 0.42 && bright > 0.35) {
            counts.orange += w;
            zone.orange += w;
          } else if (bright > 0.55) {
            counts.cream += w;
            zone.orange += w * 0.5;
          } else {
            counts.tabby += w;
            zone.orange += w * 0.5;
          }
        } else if (hue >= 48 && hue < 70 && bright > 0.5) {
          counts.cream += w;
        } else {
          counts.other += w;
        }
      }
    }

    // 细节密度：灰度网格上的邻差均值（中心加权），反映条纹、斑点纹理
    var edgeSum = 0;
    var edgeW = 0;
    var grayAt = function (px, py) {
      var j = (py * SAMPLE_SIZE + px) * 4;
      return 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2];
    };
    for (y = 2; y < SAMPLE_SIZE - 2; y += 4) {
      for (x = 2; x < SAMPLE_SIZE - 2; x += 4) {
        var ddx = x - c;
        var ddy = y - c;
        var ew = Math.exp(-(ddx * ddx + ddy * ddy) / (2 * sigma * sigma)) + 0.12;
        edgeSum += Math.abs(grayAt(x + 2, y) - grayAt(x - 2, y)) * ew;
        edgeSum += Math.abs(grayAt(x, y + 2) - grayAt(x, y - 2)) * ew;
        edgeW += 2 * ew;
      }
    }

    var brightAvg = sumBright / totalW;
    return {
      orange: counts.orange / totalW,
      cream: counts.cream / totalW,
      tabby: counts.tabby / totalW,
      white: counts.white / totalW,
      black: counts.black / totalW,
      gray: counts.gray / totalW,
      other: counts.other / totalW,
      top: { orange: top.orange / (top.total || 1), white: top.white / (top.total || 1), black: top.black / (top.total || 1) },
      bottom: { orange: bottom.orange / (bottom.total || 1), white: bottom.white / (bottom.total || 1), black: bottom.black / (bottom.total || 1) },
      bright: brightAvg,
      contrast: Math.sqrt(Math.max(0, brightSq / totalW - brightAvg * brightAvg)),
      sat: sumSat / totalW,
      warm: sumWarm / totalW,
      edge: edgeSum / edgeW / 255
    };
  }

  /**
   * 相猫纹样鉴定：依据毛色的整体构成与上下分布，推断古称纹样。
   * 名称为民间流传的毛色纹样叫法，仅作趣味展示。
   */
  function detectPattern(f) {
    var o = f.orange + f.cream * 0.6 + f.tabby * 0.7;
    if (f.black > 0.12 && f.white > 0.14 && f.black + f.white > 0.45) {
      if (f.top.black > f.bottom.black + 0.12 && f.bottom.white > f.top.white) {
        return { name: '乌云盖雪', note: '背黑腹白，经典奶牛配色，性格普遍活泼亲人。' };
      }
      return { name: '奶牛踏雪', note: '黑白花配白色爪尖，活泽数值拉满的配置。' };
    }
    if (o > 0.12 && f.black > 0.12 && f.white > 0.12) {
      return { name: '三花聚顶', note: '黄白黑三色集齐，基本都是小姑娘，聪明戏多。' };
    }
    if (o > 0.3 && f.white > 0.18) {
      return { name: '金被银床', note: '黄背白肚，橘白经典款，性格普遍亲人。' };
    }
    if (f.white > 0.62) {
      return { name: '雪玉通被', note: '通体纯白，优雅挂的，多数有点小洁癖。' };
    }
    if (f.black > 0.5) {
      return { name: '玄猫镇宅', note: '通体纯黑，老一辈喜欢的吉祥配色。' };
    }
    if (f.gray > 0.45) {
      return { name: '蓝金血统', note: '灰蓝毛色，气质挂，性格普遍稳重。' };
    }
    if (o > 0.5) {
      return { name: '十橘九胖', note: '橘色主导，干饭天赋点满的配置。' };
    }
    if (f.tabby > 0.3) {
      return { name: '狸花战纹', note: '棕色虎斑条纹，本土经典款，皮实好养。' };
    }
    return { name: '天然限定款', note: '花色混搭独特，全球限量款。' };
  }

  /** 特征 → 人设得分；毛色是主信号，纹理 / 明暗只做辅助与兜底。 */
  function scorePersonas(f, hash) {
    var warm = Math.max(0, f.warm);
    var s = {
      chanzu: (f.orange * 2.4 + f.cream * 1.0) + warm * 0.6 + 0.2,
      tabby: (f.tabby * 2.6 + f.orange * 0.5) + f.edge * 0.5 + 0.2,
      midnight: f.black * 2.8 + (1 - f.bright) * 0.3 + 0.2,
      noble: f.white * 2.8 + 0.2,
      blueboss: f.gray * 2.8 + 0.2,
      cow: Math.min(f.white, f.black) * 6.0 + (f.white + f.black) * 0.2 + 0.2,
      calico: Math.min(f.orange + f.cream * 0.5 + f.tabby * 0.5, f.white, f.black) * 6.5 + 0.2,
      commando: f.edge * 1.8 + f.contrast * 0.8 + f.sat * 0.5 + 0.2,
      sleeper: (1 - f.edge) * 0.7 + (1 - f.contrast) * 0.5 + 0.2,
      philosopher: f.black * 0.5 + (1 - f.bright) * 0.6 + (1 - f.sat) * 0.8 + 0.2
    };
    // 哈希微扰（±0.005），打破平分且保持确定性
    KEYS.forEach(function (key, i) {
      s[key] += ((hash >>> (i * 3)) % 10) / 2000;
    });
    return s;
  }

  /** 特征 + 哈希 → 四大性格指数（0-100）。 */
  function computeIndices(f, hash) {
    var jitter = function (shift) {
      return ((hash >>> shift) % 17) - 8;
    };
    return {
      food: Math.round(clamp(40 + (f.orange + f.cream * 0.5) * 52 + Math.max(0, f.warm) * 14 + jitter(5), 22, 98)),
      clingy: Math.round(clamp(34 + Math.max(0, f.warm) * 24 + f.bright * 16 + (1 - f.edge) * 12 + jitter(9), 15, 98)),
      chaos: Math.round(clamp(26 + f.edge * 160 + f.sat * 18 + jitter(13), 12, 98)),
      sleep: Math.round(clamp(96 - f.edge * 130 - f.sat * 10 + jitter(17), 25, 99))
    };
  }

  /**
   * 分析一张猫咪图片。
   * resolve：{ persona, mix, indices, features, hash }
   */
  function analyzeImage(img) {
    var imageData = samplePixels(img);
    var hash = hashPixels(imageData.data);
    var features = extractFeatures(imageData);
    var scores = scorePersonas(features, hash);

    var ranked = PERSONAS.map(function (p) {
      return { persona: p, score: scores[p.key] };
    }).sort(function (a, b) { return b.score - a.score; });

    var top = Math.max(ranked[0].score, 0.0001);
    var mix = ranked.slice(0, 3).map(function (row) {
      return {
        persona: row.persona,
        percent: Math.max(Math.round(row.score / top * 100), 3)
      };
    });

    return {
      persona: ranked[0].persona,
      mix: mix,
      indices: computeIndices(features, hash),
      pattern: detectPattern(features),
      features: features,
      hash: hash
    };
  }

  /** 读取用户选择的文件为 Image（不上传）。 */
  function loadImageFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file || file.type.indexOf('image/') !== 0) {
        reject(new Error('请选择一张图片'));
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = function () { reject(new Error('图片读取失败，换一张试试')); };
        img.src = reader.result;
      };
      reader.onerror = function () { reject(new Error('图片读取失败，换一张试试')); };
      reader.readAsDataURL(file);
    });
  }

  window.CAT_ANALYSIS = {
    loadImageFile: loadImageFile,
    analyzeImage: analyzeImage
  };
})();
