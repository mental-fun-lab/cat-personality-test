/**
 * 猫咪插画（Q 版奶猫风）：大头小身、圆耳、大眼、ω 嘴、腮红。
 * 全部由内联 SVG 绘制，不依赖外部图片。
 */
(function () {
  'use strict';

  var INK = '#3a3440';
  var WHITE = '#ffffff';
  var PINK = '#f6a5b5';
  var DEEP_PINK = '#e97f96';

  function mixDark(hex, t) {
    var a = parseInt(hex.slice(1), 16);
    var r = Math.round(((a >> 16) & 255) * (1 - t));
    var g = Math.round(((a >> 8) & 255) * (1 - t));
    var b = Math.round((a & 255) * (1 - t));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /** 水汪汪大眼 + 高光。 */
  function bigEyes(cx1, cx2, cy, eyeDot) {
    return '' +
      '<ellipse cx="' + cx1 + '" cy="' + cy + '" rx="7.5" ry="8.5" fill="' + eyeDot + '"/>' +
      '<ellipse cx="' + cx2 + '" cy="' + cy + '" rx="7.5" ry="8.5" fill="' + eyeDot + '"/>' +
      '<circle cx="' + (cx1 - 2.2) + '" cy="' + (cy - 2.8) + '" r="2.8" fill="' + WHITE + '"/>' +
      '<circle cx="' + (cx2 - 2.2) + '" cy="' + (cy - 2.8) + '" r="2.8" fill="' + WHITE + '"/>' +
      '<circle cx="' + (cx1 + 2.6) + '" cy="' + (cy + 3) + '" r="1.3" fill="' + WHITE + '" opacity=".85"/>' +
      '<circle cx="' + (cx2 + 2.6) + '" cy="' + (cy + 3) + '" r="1.3" fill="' + WHITE + '" opacity=".85"/>';
  }

  /** ω 猫嘴 + 小鼻子 + 腮红。 */
  function muzzle(cx, cy, noBlush) {
    return '' +
      '<path d="M' + (cx - 7) + ' ' + cy + ' Q' + (cx - 3.5) + ' ' + (cy + 4) + ' ' + cx + ' ' + cy + ' Q' + (cx + 3.5) + ' ' + (cy + 4) + ' ' + (cx + 7) + ' ' + cy + '" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round" fill="none"/>' +
      '<path d="M' + (cx - 3.4) + ' ' + (cy - 5.5) + ' L' + (cx + 3.4) + ' ' + (cy - 5.5) + ' L' + cx + ' ' + (cy - 1.5) + ' Z" fill="' + DEEP_PINK + '"/>' +
      (noBlush ? '' :
        '<ellipse cx="' + (cx - 17) + '" cy="' + (cy - 3) + '" rx="5" ry="3" fill="' + PINK + '" opacity=".55"/>' +
        '<ellipse cx="' + (cx + 17) + '" cy="' + (cy - 3) + '" rx="5" ry="3" fill="' + PINK + '" opacity=".55"/>');
  }

  /** 圆耳（曲线耳尖，更软萌）。 */
  function roundEars(fill, line) {
    var s = line ? ' stroke="' + mixDark(fill, 0.22) + '" stroke-width="2"' : '';
    return '' +
      '<path d="M26 46 Q13 8 44 28 Q36 40 26 46 Z" fill="' + fill + '"' + s + '/>' +
      '<path d="M174 46 Q187 8 156 28 Q164 40 174 46 Z" fill="' + fill + '"' + s + '/>' +
      '<path d="M28 40 Q21 17 40 30 Q34 36 28 40 Z" fill="' + PINK + '"/>' +
      '<path d="M172 40 Q179 17 160 30 Q166 36 172 40 Z" fill="' + PINK + '"/>';
  }

  /**
   * Q 版小猫头（viewBox 0 0 200 170）。
   * opts: fill / line(浅色毛需要描边) / eyes(open|closed|sleepy) / eyeDot /
   *       stripes / patches / earPatches / mark
   */
  function catHead(fill, opts) {
    opts = opts || {};
    var line = opts.line || 'none';
    var outline = line === 'always' ? ' stroke="' + mixDark(fill, 0.2) + '" stroke-width="2.5"' : '';
    var eyeDot = opts.eyeDot || INK;

    var eyeSvg;
    if (opts.eyes === 'closed') {
      eyeSvg = '<path d="M66 86 Q78 97 90 86 M110 86 Q122 97 134 86" stroke="' + eyeDot + '" stroke-width="3.5" stroke-linecap="round" fill="none"/>';
    } else if (opts.eyes === 'sleepy') {
      eyeSvg = '<path d="M68 88 Q78 95 88 88 M112 88 Q122 95 132 88" stroke="' + eyeDot + '" stroke-width="3.5" stroke-linecap="round" fill="none"/>' +
        '<circle cx="78" cy="89" r="1.6" fill="' + eyeDot + '"/><circle cx="122" cy="89" r="1.6" fill="' + eyeDot + '"/>';
    } else {
      eyeSvg = bigEyes(78, 122, 86, eyeDot);
    }

    return '' +
      '<svg viewBox="0 0 200 170" role="img">' +
      roundEars(fill, line === 'always') +
      (opts.earPatches || '') +
      '<circle cx="100" cy="98" r="62" fill="' + fill + '"' + outline + '/>' +
      (opts.patches || '') +
      (opts.stripes
        ? '<path d="M74 44 Q77 56 74 66 M100 40 Q103 54 100 66 M126 44 Q129 56 126 66" stroke="' + mixDark(fill, 0.28) + '" stroke-width="5" stroke-linecap="round" fill="none"/>'
        : '') +
      (opts.mark || '') +
      eyeSvg +
      muzzle(100, 112) +
      '<path d="M18 100 Q34 96 44 99 M18 114 Q33 111 43 113 M182 100 Q166 96 156 99 M182 114 Q167 111 157 113" stroke="' + mixDark(fill, 0.3) + '" stroke-width="2.2" stroke-linecap="round" fill="none"/>' +
      '</svg>';
  }

  var FACE_CONFIG = {
    orange: { fill: '#f4a85f', stripes: true },
    black: { fill: '#4a4553', eyeDot: '#ffd97a' },
    white: { fill: '#f8f3e9', line: 'always', eyeDot: '#8d8577' },
    gray: { fill: '#a3b1c2' },
    cow: {
      fill: '#f8f3e9', line: 'always', eyeDot: '#5f594d',
      earPatches: '<path d="M26 46 Q13 8 44 28 Q36 40 26 46 Z" fill="#4a4553"/>',
      patches: '<path d="M46 52 Q34 76 48 108 Q60 138 88 142 Q72 116 66 88 Q60 62 46 52 Z" fill="#4a4553" opacity=".88"/>'
    },
    calico: {
      fill: '#f8f3e9', line: 'always', eyeDot: '#6d6455',
      earPatches: '<path d="M174 46 Q187 8 156 28 Q164 40 174 46 Z" fill="#e8963c"/><path d="M26 46 Q13 8 44 28 Q36 40 26 46 Z" fill="#4a4553"/>',
      patches: '<path d="M128 40 Q156 46 158 72 Q156 96 136 100 Q128 72 124 48 Z" fill="#e8963c"/>' +
        '<path d="M50 58 Q38 82 52 112 Q62 136 84 140 Q70 112 64 88 Q58 66 50 58 Z" fill="#4a4553" opacity=".82"/>'
    },
    tabby: { fill: '#ba8a55', stripes: true },
    energy: {
      fill: '#ec9d86',
      mark: '<path d="M100 38 L107 52 L99 53 L108 68 L95 55 L103 54 Z" fill="#ffd35c" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/>'
    },
    sleepy: { fill: '#a4c1d3', eyes: 'sleepy' },
    thinker: { fill: '#978bc4', eyeDot: '#453c66' }
  };

  function personaFace(faceKey) {
    var cfg = FACE_CONFIG[faceKey] || FACE_CONFIG.gray;
    return catHead(cfg.fill, cfg);
  }

  /**
   * Q 版坐姿奶猫（viewBox 0 0 200 200）：大头小身，尾巴绕前。
   * opts: fill / soft / stripes / eyeDot
   */
  function sittingCat(opts) {
    opts = opts || {};
    var fill = opts.fill || '#f4a85f';
    var soft = opts.soft || '#fff3e2';
    var eyeDot = opts.eyeDot || INK;
    var line = opts.line ? opts.line : null;
    var outline = opts.line === 'always' ? ' stroke="' + mixDark(fill, 0.2) + '" stroke-width="2.5"' : '';
    var bodyOutline = opts.line === 'always' ? ' stroke="' + mixDark(fill, 0.2) + '" stroke-width="2.5"' : '';

    return '' +
      '<svg viewBox="0 0 200 200" role="img">' +
      '<ellipse cx="100" cy="192" rx="58" ry="6.5" fill="#000" opacity=".07"/>' +
      // 尾巴（胖尾巴绕到前面）
      '<path d="M142 158 Q176 152 172 122 Q170 104 154 104 Q166 118 158 134 Q150 148 132 148 Z" fill="' + mixDark(fill, 0.18) + '"/>' +
      // 身体（小圆身）
      '<path d="M64 184 C58 148 72 120 100 120 C128 120 142 148 136 184 Z" fill="' + fill + '"' + bodyOutline + '/>' +
      // 前爪
      '<ellipse cx="85" cy="183" rx="14" ry="8" fill="' + mixDark(fill, 0.08) + '"/>' +
      '<ellipse cx="115" cy="183" rx="14" ry="8" fill="' + mixDark(fill, 0.08) + '"/>' +
      // 大头
      '<g transform="translate(0 -16)">' +
      roundEars(fill, opts.line === 'always') +
      '<circle cx="100" cy="92" r="56" fill="' + fill + '"' + outline + '/>' +
      (opts.stripes
        ? '<path d="M76 42 Q79 54 76 63 M100 38 Q103 52 100 64 M124 42 Q127 54 124 63" stroke="' + mixDark(fill, 0.28) + '" stroke-width="4.6" stroke-linecap="round" fill="none"/>'
        : '') +
      // 围兜
      '<path d="M78 118 Q100 140 122 118 Q100 130 78 118 Z" fill="' + soft + '"/>' +
      bigEyes(80, 120, 80, eyeDot) +
      muzzle(100, 106) +
      '<path d="M26 84 Q40 80 50 83 M26 98 Q39 95 49 97 M174 84 Q160 80 150 83 M174 98 Q161 95 151 97" stroke="' + mixDark(fill, 0.3) + '" stroke-width="2" stroke-linecap="round" fill="none"/>' +
      '</g>' +
      '</svg>';
  }

  /** 首页三只迎宾猫：橘猫 / 蓝灰猫 / 白猫。 */
  function heroTrio() {
    return '' +
      '<span class="trio-cat">' + sittingCat({ fill: '#f4a85f', soft: '#fff3e2', stripes: true }) + '</span>' +
      '<span class="trio-cat trio-mid">' + sittingCat({ fill: '#a3b1c2', soft: '#e9edf3' }) + '</span>' +
      '<span class="trio-cat">' + sittingCat({ fill: '#f8f3e9', soft: '#fdf9f0', eyeDot: '#8d8577', line: 'always' }) + '</span>';
  }

  window.CAT_ART = { personaFace: personaFace, sittingCat: sittingCat, heroTrio: heroTrio };
})();
