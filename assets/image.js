/* 图片处理：HEIC 兜底、EXIF 方向校正、压缩到接口能接受的体积 */
window.App = window.App || {};

(function (App) {
  'use strict';

  const MAX_INPUT = 25 * 1024 * 1024;
  const MAX_EDGE = 1600;
  const TARGET_BYTES = 1.1 * 1024 * 1024;

  function friendlyError(err) {
    const e = new Error(
      '这张图片无法解码。iPhone 的 HEIC/实况照片常出现这种情况：请在相册里改成「兼容性最佳」格式，或先截图再上传。'
    );
    e.cause = err;
    return e;
  }

  function decode(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: 'from-image' })
        .catch(function () {
          return createImageBitmap(file).catch(function () { throw friendlyError(); });
        });
    }
    return new Promise(function (resolve, reject) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(friendlyError()); };
      img.src = url;
    });
  }

  function drawToDataURL(source, quality) {
    const w = source.width;
    const h = source.height;
    if (!w || !h) throw friendlyError();
    const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
    const cw = Math.round(w * scale);
    const ch = Math.round(h * scale);
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(source, 0, 0, cw, ch);
    return { dataURL: canvas.toDataURL('image/jpeg', quality), width: cw, height: ch };
  }

  async function prepare(file) {
    if (!file) throw new Error('没有选择图片。');
    if (file.size > MAX_INPUT) {
      throw new Error('图片超过 25MB，请压缩或截取作文区域后重传。');
    }
    const bitmap = await decode(file);
    let quality = 0.82;
    let out = drawToDataURL(bitmap, quality);
    while (out.dataURL.length * 0.75 > TARGET_BYTES && quality > 0.4) {
      quality -= 0.1;
      out = drawToDataURL(bitmap, quality);
    }
    if (bitmap.close) bitmap.close();
    return {
      dataURL: out.dataURL,
      width: out.width,
      height: out.height,
      kb: Math.round((out.dataURL.length * 0.75) / 1024)
    };
  }

  /* 按归一化矩形（0–1）裁出作文区域，再走同一套压缩参数 */
  function loadImage(dataURL) {
    return new Promise(function (resolve, reject) {
      const img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('裁剪失败，重新选一张图片试试。')); };
      img.src = dataURL;
    });
  }

  function drawRegion(img, rect, quality) {
    const nw = img.naturalWidth || img.width;
    const nh = img.naturalHeight || img.height;
    let sx = Math.round(rect.x * nw);
    let sy = Math.round(rect.y * nh);
    let sw = Math.round(rect.w * nw);
    let sh = Math.round(rect.h * nh);
    sx = Math.max(0, Math.min(nw - 2, sx));
    sy = Math.max(0, Math.min(nh - 2, sy));
    sw = Math.max(2, Math.min(nw - sx, sw));
    sh = Math.max(2, Math.min(nh - sy, sh));
    const scale = Math.min(1, MAX_EDGE / Math.max(sw, sh));
    const cw = Math.max(1, Math.round(sw * scale));
    const ch = Math.max(1, Math.round(sh * scale));
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    return { dataURL: canvas.toDataURL('image/jpeg', quality), width: cw, height: ch };
  }

  async function crop(dataURL, rect) {
    const img = await loadImage(dataURL);
    let quality = 0.85;
    let out = drawRegion(img, rect, quality);
    while (out.dataURL.length * 0.75 > TARGET_BYTES && quality > 0.4) {
      quality -= 0.1;
      out = drawRegion(img, rect, quality);
    }
    return {
      dataURL: out.dataURL,
      width: out.width,
      height: out.height,
      kb: Math.round((out.dataURL.length * 0.75) / 1024)
    };
  }

  App.image = { prepare: prepare, crop: crop };
})(window.App);
