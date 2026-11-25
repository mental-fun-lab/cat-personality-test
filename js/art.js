/**
 * 猫咪插画（圆滚滚奶猫风）：胖脸、软圆耳、低置大眼、白肚兜、粗尾。
 * 全部由内联 SVG 绘制，不依赖外部图片。
 */
(function () {
  'use strict';

  var INK = '#4a3f45';
  var WHITE = '#ffffff';
  var PINK = '#f7a8b8';
  var DEEP = '#e58a9d';

  function mixDark(hex, t) {
    var a = parseInt(hex.slice(1), 16);
    var r = Math.round(((a >> 16) & 255) * (1 - t));
    var g = Math.round(((a >> 8) & 255) * (1 - t));
    var b = Math.round((a & 255) * (1 - t));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function mixLight(hex, t) {
    var a = parseInt(hex.slice(1), 16);
    var r = Math.round(((a >> 16) & 255) * (1 - t) + 255 * t);
    var g = Math.round(((a >> 8) & 255) * (1 - t) + 255 * t);
    var b = Math.round((a & 255) * (1 - t) + 255 * t);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /** 软圆耳：画在头后面，只露出圆角耳尖。 */
  function ears(fill, line) {
    var s = line ? ' stroke="' + mixDark(fill, 0.16) + '" stroke-width="2.5"' : '';
    return '' +
      '<path d="M58 62 Q36 8 80 22 Q84 30 86 40 Z" fill="' + fill + '"' + s + '/>' +
      '<path d="M142 62 Q164 8 120 22 Q116 30 114 40 Z" fill="' + fill + '"' + s + '/>' +
      '<path d="M56 50 Q46 18 70 25 Q75 30 76 36 Z" fill="' + PINK + '"/>' +
      '<path d="M144 50 Q154 18 130 25 Q125 30 124 36 Z" fill="' + PINK + '"/>';
  }

  /** 水汪汪大眼（两颗高光）。 */
  function bigEyes(eyeDot, eyes) {
    if (eyes === 'closed') {
      return '<path d="M66 92 Q78 102 90 92 M110 92 Q122 102 134 92" stroke="' + eyeDot + '" stroke-width="4" stroke-linecap="round" fill="none"/>';
    }
    if (eyes === 'sleepy') {
      return '<path d="M68 93 Q78 100 88 93 M112 93 Q122 100 132 93" stroke="' + eyeDot + '" stroke-width="4" stroke-linecap="round" fill="none"/>' +
        '<circle cx="78" cy="94" r="1.8" fill="' + eyeDot + '"/><circle cx="122" cy="94" r="1.8" fill="' + eyeDot + '"/>';
    }
    return '' +
      '<ellipse cx="74" cy="92" rx="7.5" ry="9.5" fill="' + eyeDot + '"/>' +
      '<ellipse cx="126" cy="92" rx="7.5" ry="9.5" fill="' + eyeDot + '"/>' +
      '<circle cx="71.5" cy="88.5" r="3" fill="' + WHITE + '"/>' +
      '<circle cx="123.5" cy="88.5" r="3" fill="' + WHITE + '"/>' +
      '<circle cx="77" cy="95.5" r="1.6" fill="' + WHITE + '" opacity=".9"/>' +
      '<circle cx="129" cy="95.5" r="1.6" fill="' + WHITE + '" opacity=".9"/>';
  }

  /** 鼻子 + ω 嘴 + 腮红。 */
  function muzzle(noBlush) {
    return '' +
      '<path d="M96 106 Q100 103.5 104 106 Q100 111.5 96 106 Z" fill="' + DEEP + '"/>' +
      '<path d="M92.5 114 Q96 118.5 100 114 Q104 118.5 107.5 114" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round" fill="none"/>' +
      (noBlush ? '' :
        '<ellipse cx="62" cy="105" rx="8" ry="4.5" fill="' + PINK + '" opacity=".55"/>' +
        '<ellipse cx="138" cy="105" rx="8" ry="4.5" fill="' + PINK + '" opacity=".55"/>');
  }

  function whiskers(fill) {
    var c = mixDark(fill, 0.32);
    return '' +
      '<path d="M24 96 Q36 93 45 95 M24 107 Q36 105 44 106" stroke="' + c + '" stroke-width="2" stroke-linecap="round" fill="none"/>' +
      '<path d="M176 96 Q164 93 155 95 M176 107 Q164 105 156 106" stroke="' + c + '" stroke-width="2" stroke-linecap="round" fill="none"/>';
  }

  function foreheadStripes(fill) {
    var c = mixDark(fill, 0.22);
    return '<path d="M82 34 Q84 44 82 52 M100 30 Q102 42 100 52 M118 34 Q120 44 118 52" stroke="' + c + '" stroke-width="6" stroke-linecap="round" fill="none"/>';
  }

  /**
   * 小猫头（viewBox 0 0 200 150）。
   * opts: fill / line(浅毛加描边) / eyes(open|closed|sleepy) / eyeDot /
   *       stripes / patches / earPatches / mark / noBlush
   */
  function catHead(fill, opts) {
    opts = opts || {};
    var outline = opts.line ? ' stroke="' + mixDark(fill, 0.16) + '" stroke-width="2.5"' : '';
    var eyeDot = opts.eyeDot || INK;
    return '' +
      '<svg viewBox="0 0 200 150" role="img">' +
      (opts.earPatches || ears(fill, opts.line)) +
      '<ellipse cx="100" cy="84" rx="62" ry="54" fill="' + fill + '"' + outline + '/>' +
      (opts.patches || '') +
      (opts.stripes ? foreheadStripes(fill) : '') +
      (opts.mark || '') +
      bigEyes(eyeDot, opts.eyes) +
      muzzle(opts.noBlush) +
      whiskers(fill) +
      '</svg>';
  }

  var FACE_CONFIG = {
    orange: { fill: '#f6b26b', stripes: true },
    black: { fill: '#57505e', eyeDot: '#ffd97a' },
    white: { fill: '#faf6ee', line: true, eyeDot: '#8d8577' },
    gray: { fill: '#a9b6c5' },
    cow: {
      fill: '#faf6ee', line: true, eyeDot: '#5f594d',
      earPatches: '<path d="M58 62 Q36 8 80 22 Q84 30 86 40 Z" fill="#57505e"/>' +
        '<path d="M56 50 Q46 18 70 25 Q75 30 76 36 Z" fill="' + PINK + '"/>' +
        '<path d="M142 62 Q164 8 120 22 Q116 30 114 40 Z" fill="#57505e" opacity=".25"/>',
      patches: '<path d="M42 66 Q34 92 48 118 Q60 138 84 138 Q70 112 64 88 Q58 72 42 66 Z" fill="#57505e" opacity=".85"/>'
    },
    calico: {
      fill: '#faf6ee', line: true, eyeDot: '#6d6455',
      earPatches: '<path d="M142 62 Q164 8 120 22 Q116 30 114 40 Z" fill="#ef9d4e"/>' +
        '<path d="M144 50 Q154 18 130 25 Q125 30 124 36 Z" fill="' + PINK + '"/>' +
        '<path d="M58 62 Q36 8 80 22 Q84 30 86 40 Z" fill="#57505e"/>',
      patches: '<path d="M120 38 Q152 44 154 72 Q152 94 132 98 Q124 72 120 46 Z" fill="#ef9d4e"/>' +
        '<path d="M44 70 Q36 94 50 118 Q62 136 82 138 Q70 112 64 90 Q58 76 44 70 Z" fill="#57505e" opacity=".82"/>'
    },
    tabby: { fill: '#c39a6b', stripes: true },
    energy: {
      fill: '#f2a58e',
      mark: '<path d="M100 34 L107 48 L99 49 L108 62 L95 51 L103 50 Z" fill="#ffd35c" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/>'
    },
    sleepy: { fill: '#a5c3d5', eyes: 'sleepy' },
    thinker: { fill: '#9d92c9', eyeDot: '#453c66' }
  };

  function personaFace(faceKey) {
    var cfg = FACE_CONFIG[faceKey] || FACE_CONFIG.gray;
    return catHead(cfg.fill, cfg);
  }

  /**
   * 坐姿奶猫（viewBox 0 0 200 196）：大头小身、白肚兜、短粗爪、粗尾巴。
   * opts: fill / soft / stripes / eyeDot / line / tilt
   */
  function sittingCat(opts) {
    opts = opts || {};
    var fill = opts.fill || '#f6b26b';
    var soft = opts.soft || '#fff3e2';
    var eyeDot = opts.eyeDot || INK;
    var line = !!opts.line;
    var bodyLine = line ? ' stroke="' + mixDark(fill, 0.16) + '" stroke-width="2.5"' : '';
    var tilt = opts.tilt ? ' transform="rotate(' + opts.tilt + ' 100 120)"' : '';

    return '' +
      '<svg viewBox="0 0 200 196" role="img">' +
      '<ellipse cx="100" cy="188" rx="56" ry="6" fill="#000" opacity=".07"/>' +
      '<g' + tilt + '>' +
      // 尾巴（粗圆，画在身体后）
      '<path d="M136 168 Q176 160 170 128 Q166 108 146 104" fill="none" stroke="' + mixDark(fill, 0.16) + '" stroke-width="15" stroke-linecap="round"/>' +
      // 身体（豆形）
      '<path d="M66 184 C58 140 76 118 100 118 C124 118 142 140 134 184 Z" fill="' + fill + '"' + bodyLine + '/>' +
      '<path d="M100 118 C124 118 142 140 134 184 L100 184 Z" fill="#000" opacity=".06"/>' +
      // 白肚兜
      '<ellipse cx="100" cy="154" rx="23" ry="26" fill="' + soft + '"/>' +
      // 前爪（短粗 + 脚趾线）
      '<ellipse cx="81" cy="181" rx="14" ry="9" fill="' + mixLight(fill, 0.3) + '"/>' +
      '<ellipse cx="119" cy="181" rx="14" ry="9" fill="' + mixLight(fill, 0.3) + '"/>' +
      '<path d="M77 177 V184 M85 177 V184 M115 177 V184 M123 177 V184" stroke="' + mixDark(fill, 0.14) + '" stroke-width="1.8" stroke-linecap="round"/>' +
      // 大头
      '<g transform="translate(0 -6)">' +
      (opts.earPatches || ears(fill, line)) +
      '<ellipse cx="100" cy="84" rx="62" ry="54" fill="' + fill + '"' + (line ? ' stroke="' + mixDark(fill, 0.16) + '" stroke-width="2.5"' : '') + '/>' +
      (opts.patches || '') +
      (opts.stripes ? foreheadStripes(fill) : '') +
      // 围兜
      '<path d="M80 116 Q100 134 120 116 Q100 126 80 116 Z" fill="' + soft + '"/>' +
      bigEyes(eyeDot, opts.eyes) +
      muzzle() +
      whiskers(fill) +
      '</g>' +
      '</g>' +
      '</svg>';
  }

  /** 首页三只迎宾猫：橘猫 / 蓝灰猫 / 白猫，两侧微倾。 */
  function heroTrio() {
    return '' +
      '<span class="trio-cat">' + sittingCat({ fill: '#f6b26b', soft: '#fff3e2', stripes: true, tilt: -5 }) + '</span>' +
      '<span class="trio-cat trio-mid">' + sittingCat({ fill: '#a9b6c5', soft: '#eef2f6' }) + '</span>' +
      '<span class="trio-cat">' + sittingCat({ fill: '#faf6ee', soft: '#fdf9f0', eyeDot: '#8d8577', line: true, tilt: 5 }) + '</span>';
  }

  window.CAT_ART = { personaFace: personaFace, sittingCat: sittingCat, heroTrio: heroTrio };
})();
