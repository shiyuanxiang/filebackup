(function (global) {
    function escapeXml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeLines(source) {
        if (!source) return [];
        if (Array.isArray(source)) {
            return source.map(line => String(line).trim()).filter(Boolean);
        }
        return String(source)
            .split(/\r?\n|\|/)
            .map(line => line.trim())
            .filter(Boolean);
    }

    function buildMask(lines, metrics) {
        const width = Math.max(metrics.width, 1);
        const lineHeight = metrics.lineHeight || (metrics.fontSize * 1.4);
        const height = metrics.height || Math.max(lineHeight * lines.length, lineHeight);
        const startY = Math.max((height - lineHeight * (lines.length - 1)) / 2, lineHeight * 0.6);
        const anchor = metrics.textAlign === 'right' ? 'end' : metrics.textAlign === 'center' ? 'middle' : 'start';
        const xPosition = anchor === 'middle'
            ? width / 2
            : anchor === 'end'
                ? Math.max(width - (metrics.paddingRight || 0), 0)
                : Math.max(metrics.paddingLeft || 0, 0);

        const tspans = lines.map((line, idx) => {
            const y = startY + idx * lineHeight;
            return `<tspan x="${xPosition}" y="${y}">${escapeXml(line)}</tspan>`;
        }).join('');

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

    function getMetrics(element) {
        const computed = window.getComputedStyle(element);
        const fontSize = parseFloat(computed.fontSize) || 16;
        let lineHeight = computed.lineHeight;
        lineHeight = lineHeight === 'normal' ? fontSize * 1.4 : parseFloat(lineHeight);
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

    function measureContext(font) {
        const canvas = measureContext.canvas || (measureContext.canvas = document.createElement('canvas'));
        const ctx = canvas.getContext('2d');
        ctx.font = font;
        return ctx;
    }

    function wrapLines(text, metrics) {
        const rawLines = String(text).split(/\r?\n/);
        const horizontalPadding = (metrics.paddingLeft || 0) + (metrics.paddingRight || 0);
        const maxWidth = Math.max(metrics.width - horizontalPadding - 4, 1);
        const ctx = measureContext(`${metrics.fontWeight} ${metrics.fontSize}px ${metrics.fontFamily}`);
        const result = [];

        rawLines.forEach(rawLine => {
            if (rawLine === '') {
                result.push('');
                return;
            }
            const tokens = /\s/.test(rawLine) ? rawLine.split(/(\s+)/) : Array.from(rawLine);
            let current = '';
            tokens.forEach(token => {
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

        return result.filter(line => line.length || rawLines.includes(''));
    }
    function generateTextSVG(text) {
        const maxCharsPerLine = 30;
        const lines = [];

        // Split text into lines
        for (let i = 0; i < text.length; i += maxCharsPerLine) {
            lines.push(text.substring(i, i + maxCharsPerLine));
        }

        const longestLine = lines.reduce((m, l) => Math.max(m, l.length), 0);

        // Calculate font size - adjusted for better scaling with more padding
        const fontSizeByHeight = 900 / (lines.length * 1.5);
        const charWidthFactor = 0.65;
        const fontSizeByWidth = (1600 * 0.65) / (longestLine * charWidthFactor); // Reduced to 0.65 for much more padding
        let fontSize = Math.floor(Math.min(fontSizeByHeight, fontSizeByWidth, 120));
        fontSize = Math.max(fontSize, 25);

        // Generate tspan elements
        const firstDy = `-${((lines.length - 1) * 0.6).toFixed(2)}em`;
        const tspanElements = lines.map((line, idx) => {
            const dy = idx === 0 ? firstDy : '1.2em';
            const escapedLine = escapeHtml(line);
            return `<tspan x="800" dy="${dy}">${escapedLine}</tspan>`;
        }).join('');

        const svgText = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -50 1800 1000" preserveAspectRatio="xMidYMid meet">
                    <style>
                        .text-content {
                            font-family: 'Arial Black', 'Microsoft YaHei', 'SimHei', sans-serif;
                            font-size: ${fontSize}px;
                            font-weight: 900;
                            fill: white;
                        }
                    </style>
                    <text text-anchor="middle" dominant-baseline="middle" class="text-content" x="800" y="450">
                        ${tspanElements}
                    </text>
                </svg>
            `;

        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
    }
    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function apply(options = {}) {
        const containerId = options.containerId || 'bright-container';
        const contentId = options.contentId || 'bright-content';
        const container = document.getElementById(containerId);
        const content = document.getElementById(contentId);

        if (!container || !content) {
            console.warn('[BrightMode] container or content not found');
            return;
        }

        if (content.tagName === 'TABLE' && options.applyToCells !== false) {
            const cells = content.querySelectorAll('th, td');
            if (!cells.length) {
                console.warn('[BrightMode] table has no cells to mask');
                return;
            }
            cells.forEach(cell => {
                if (!(cell.innerText || cell.textContent || '').trim()) {
                    return;
                }
                const cellOptions = {
                    ...options,
                    textLines: options.textLines || cell.innerText || cell.textContent || ''
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
                console.warn('[BrightMode] no text provided');
                return;
            }
            lines = wrapLines(sourceText, metrics);
        }

        if (!lines.length) {
            console.warn('[BrightMode] no text derived for mask');
            return;
        }

        if (content.tagName === 'CANVAS') {
            renderCanvas(content, metricsTarget, lines, metrics, options);
            return;
        }

        const { dataUrl, width, height } = buildMask(lines, {
            ...metrics,
            height: metrics.height || metrics.lineHeight * Math.max(lines.length, 1) + metrics.lineHeight,
        });

        content.style.backgroundImage = "url('white_hdr_3000nits.avif')";
        content.classList.add('bright-mask-text');
        content.style.mask = `url("${dataUrl}")`;
        content.style.webkitMask = `url("${dataUrl}")`;
        content.style.maskSize = `${width}px ${height}px`;
        content.style.webkitMaskSize = `${width}px ${height}px`;
        content.style.maskRepeat = 'no-repeat';
        content.style.webkitMaskRepeat = 'no-repeat';
        content.style.maskPosition = 'center';
        content.style.webkitMaskPosition = 'center';
        content.style.opacity = '1';
    }

    function renderCanvas(canvas, hostElement, lines, metrics) {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.warn('[BrightMode] canvas context not available');
            return;
        }

        const rect = hostElement.getBoundingClientRect();
        const width = Math.max(rect.width || hostElement.clientWidth || canvas.clientWidth || 320, 1);
        const targetHeight = metrics.height || metrics.lineHeight * Math.max(lines.length, 1) + metrics.lineHeight;
        const height = Math.max(rect.height || hostElement.clientHeight || canvas.clientHeight || targetHeight, 1);
        const dpr = window.devicePixelRatio || 1;

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        const baseGradient = ctx.createLinearGradient(0, 0, width, height);
        baseGradient.addColorStop(0, 'rgba(248, 250, 252, 0.95)');
        baseGradient.addColorStop(1, 'rgba(241, 245, 249, 0.7)');
        ctx.fillStyle = baseGradient;
        ctx.fillRect(0, 0, width, height);

        const glowGradient = ctx.createRadialGradient(
            width / 2,
            height / 2,
            Math.max(Math.min(width, height) * 0.2, 20),
            width / 2,
            height / 2,
            Math.max(width, height)
        );
        glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
        glowGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.15)');
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';

        ctx.font = `${metrics.fontWeight} ${metrics.fontSize}px ${metrics.fontFamily}`;
        ctx.textAlign = metrics.textAlign;
        ctx.textBaseline = 'middle';

        const x = metrics.textAlign === 'center'
            ? width / 2
            : metrics.textAlign === 'right'
                ? width - (metrics.paddingRight || 0) - 4
                : (metrics.paddingLeft || 0) + 4;
        const startY = Math.max((height - metrics.lineHeight * (lines.length - 1)) / 2, metrics.lineHeight * 0.6);

        lines.forEach((line, idx) => {
            const y = startY + idx * metrics.lineHeight;
            const textGradient = ctx.createLinearGradient(0, y - metrics.fontSize, width, y + metrics.fontSize);
            textGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            textGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
            textGradient.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
            ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
            ctx.shadowBlur = 18;
            ctx.fillStyle = textGradient;
            ctx.fillText(line, x, y);
        });

        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'soft-light';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';

        ctx.restore();
    }

    global.BrightMode = { apply };

    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('bright-container') && document.getElementById('bright-content')) {
            apply();
        }
    });
})(window);
