(function (global) {
  const MASK_CLASS = 'svg-mask-text';

  function escapeXml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeLines(source) {
    if (!source) return [];
    if (Array.isArray(source)) {
      return source.map((line) => String(line).trim()).filter(Boolean);
    }
    return String(source)
      .split(/\r?\n|\|/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function getMetrics(element) {
    const computed = window.getComputedStyle(element);
    const fontSize = parseFloat(computed.fontSize) || 16;
    const lineHeightRaw = computed.lineHeight;
    const lineHeight =
      lineHeightRaw === 'normal'
        ? fontSize * 1.4
        : parseFloat(lineHeightRaw) || fontSize * 1.4;
    const textAlign = computed.textAlign || 'left';
    const paddingLeft = parseFloat(computed.paddingLeft) || 0;
    const paddingRight = parseFloat(computed.paddingRight) || 0;

    const rect = element.getBoundingClientRect();
    return {
      fontSize,
      lineHeight,
      fontFamily: computed.fontFamily || "'Arial Black', sans-serif",
      fontWeight: computed.fontWeight || '600',
      width: rect.width || element.offsetWidth || 800,
      height: rect.height || element.offsetHeight || lineHeight * 2,
      textAlign,
      paddingLeft,
      paddingRight,
    };
  }

  function wrapLines(text, metrics) {
    const rawLines = String(text).split(/\r?\n/);
    const horizontalPadding = (metrics.paddingLeft || 0) + (metrics.paddingRight || 0);
    const maxWidth = Math.max(metrics.width - horizontalPadding - 4, 1);
    const canvas = wrapLines.canvas || (wrapLines.canvas = document.createElement('canvas'));
    const ctx = canvas.getContext('2d');
    ctx.font = `${metrics.fontWeight} ${metrics.fontSize}px ${metrics.fontFamily}`;
    const result = [];

    rawLines.forEach((rawLine) => {
      if (rawLine === '') {
        result.push('');
        return;
      }
      const tokens = /\s/.test(rawLine) ? rawLine.split(/(\s+)/) : Array.from(rawLine);
      let current = '';
      tokens.forEach((token) => {
        if (!token) return;
        const tentative = current + token;
        if (ctx.measureText(tentative).width > maxWidth && current.trim().length > 0) {
          result.push(current);
          current = token.trimStart();
        } else {
          current = tentative;
        }
      });
      result.push(current);
    });

    return result.filter((line) => line.length || rawLines.includes(''));
  }

  function buildMask(lines, metrics) {
    const width = Math.max(metrics.width, 1);
    const lineHeight = metrics.lineHeight || metrics.fontSize * 1.4;
    const height = metrics.height || Math.max(lineHeight * lines.length, lineHeight);
    const startY = Math.max((height - lineHeight * (lines.length - 1)) / 2, lineHeight * 0.6);
    const anchor =
      metrics.textAlign === 'right'
        ? 'end'
        : metrics.textAlign === 'center'
        ? 'middle'
        : 'start';
    const xPosition =
      anchor === 'middle'
        ? width / 2
        : anchor === 'end'
        ? Math.max(width - (metrics.paddingRight || 0), 0)
        : Math.max(metrics.paddingLeft || 0, 0);

    const tspans = lines
      .map((line, idx) => {
        const y = startY + idx * lineHeight;
        return `<tspan x="${xPosition}" y="${y}">${escapeXml(line)}</tspan>`;
      })
      .join('');

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
        <style>
          text {
            font-family: ${metrics.fontFamily};
            font-size: ${metrics.fontSize}px;
            font-weight: ${metrics.fontWeight};
            fill: white;
          }
        </style>
        <text text-anchor="${anchor}">${tspans}</text>
      </svg>
    `;
    return {
      dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      width,
      height,
    };
  }

  function apply(options = {}) {
    const containerId = options.containerId || 'bright-container';
    const contentId = options.contentId || 'bright-content';
    const container = document.getElementById(containerId);
    const content = document.getElementById(contentId);

    if (!container || !content) {
      console.warn('[SvgMask] container or content not found');
      return;
    }

    if (content.tagName === 'TABLE' && options.applyToCells !== false) {
      const cells = content.querySelectorAll('th, td');
      if (!cells.length) {
        console.warn('[SvgMask] table has no cells to mask');
        return;
      }
      cells.forEach((cell) => {
        if (!(cell.innerText || cell.textContent || '').trim()) {
          return;
        }
        const cellOptions = {
          ...options,
          textLines: options.textLines || cell.innerText || cell.textContent || '',
        };
        applyToElement(cellOptions, cell);
      });
      return;
    }

    applyToElement(options, content, container);
  }

  function applyToElement(options, content, container = content) {
    const metricsTarget = content.tagName === 'CANVAS' && container ? container : content;
    const metrics = getMetrics(metricsTarget);

    let lines = normalizeLines(options.textLines);
    if (!lines.length) {
      let sourceText = '';
      if (content.dataset.brightText) {
        sourceText = content.dataset.brightText;
      } else if (container && container !== content && container.dataset.brightText) {
        sourceText = container.dataset.brightText;
      } else {
        sourceText = content.innerText || content.textContent || '';
      }
      sourceText = sourceText.trim();
      if (!sourceText) {
        console.warn('[SvgMask] no text provided');
        return;
      }
      lines = wrapLines(sourceText, metrics);
    }

    if (!lines.length) {
      console.warn('[SvgMask] no text derived for mask');
      return;
    }

    const { dataUrl, width, height } = buildMask(lines, {
      ...metrics,
      height: metrics.height || metrics.lineHeight * Math.max(lines.length, 1) + metrics.lineHeight,
    });

    content.classList.add(MASK_CLASS);
    content.textContent = '';
    content.style.backgroundImage =
      options.background ||
      'linear-gradient(135deg, rgba(59, 130, 246, 0.7), rgba(16, 185, 129, 0.8))';
    content.style.maskImage = `url("${dataUrl}")`;
    content.style.webkitMaskImage = `url("${dataUrl}")`;
    content.style.maskSize = `${width}px ${height}px`;
    content.style.webkitMaskSize = `${width}px ${height}px`;
    content.style.maskRepeat = 'no-repeat';
    content.style.webkitMaskRepeat = 'no-repeat';
    content.style.maskPosition = 'center';
    content.style.webkitMaskPosition = 'center';
    content.style.display = options.display || 'block';
    if (!content.style.height) {
      content.style.minHeight = `${Math.max(height, metrics.lineHeight)}px`;
    }
  }

  function renderText(target, textLines, options = {}) {
    if (!target) {
      return;
    }
    let element = typeof target === 'string' ? document.getElementById(target) : target;
    if (!element) {
      return;
    }
    if (element.tagName === 'CANVAS') {
      const replacement = document.createElement('div');
      Array.from(element.attributes).forEach((attr) => {
        replacement.setAttribute(attr.name, attr.value);
      });
      replacement.className = element.className;
      element.replaceWith(replacement);
      element = replacement;
    }
    const payload = Array.isArray(textLines) ? textLines.join('\n') : String(textLines || '');
    element.textContent = payload;
    apply({
      containerId: element.id,
      contentId: element.id,
      textLines: payload,
      ...options,
    });
    element.textContent = '';
  }

  global.SvgMask = { apply, renderText };
})(window);
