document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('grafica');
    const ctx = canvas.getContext('2d');
    
    let chart;
    let functions = [];
    let editIndex = null;

    const colors = ['#6a7dfe', '#ff708f', '#ffc107', '#28a745', '#17a2b8', '#fd7e14'];
    const view = { xMin: -10, xMax: 10, yMin: -10, yMax: 10, isPanning: false, lastPanX: 0, lastPanY: 0 };

    function evaluateFunction(fn, x) {
        try {
            if (fn.trim() === '') return NaN;
            const scope = {
                x: x, sin: Math.sin, cos: Math.cos, tan: Math.tan,
                log: Math.log, sqrt: Math.sqrt, abs: Math.abs,
                PI: Math.PI, E: Math.E,
            };
            const evil = new Function('scope', `with(scope) { return ${fn.replace(/\^/g, '**')} }`);
            const result = evil(scope);
            return isFinite(result) ? result : NaN;
        } catch (e) {
            return "error";
        }
    }
    
    function calculateDerivative(fn, x) {
        const h = 0.0001;
        const f_x_plus_h = evaluateFunction(fn, x + h);
        const f_x_minus_h = evaluateFunction(fn, x - h);
        if (typeof f_x_plus_h !== 'number' || typeof f_x_minus_h !== 'number') return NaN;
        return (f_x_plus_h - f_x_minus_h) / (2 * h);
    }
    
    function findPointsOfInterest(fn) {
        const roots = [];
        const extrema = [];
        const step = (view.xMax - view.xMin) / 1000;
        let prevY = evaluateFunction(fn, view.xMin);
        let prevDeriv = calculateDerivative(fn, view.xMin);

        for (let x = view.xMin + step; x <= view.xMax; x += step) {
            const currentY = evaluateFunction(fn, x);
            const currentDeriv = calculateDerivative(fn, x);

            if (prevY * currentY < 0) {
                roots.push({ x: x - step / 2, y: 0 });
            }
            if (prevDeriv * currentDeriv < 0) {
                 extrema.push({ x: x - step / 2, y: evaluateFunction(fn, x - step/2) });
            }
            
            prevY = currentY;
            prevDeriv = currentDeriv;
        }
        return { roots, extrema };
    }

    function parseDerivative(expression) {
        const regex = /derivative\((.*)\)/;
        const match = expression.match(regex);
        return match ? match[1].trim() : null;
    }

    function calculateIntegral(fn, lower, upper, steps = 1000) {
        const h = (upper - lower) / steps;
        let sum = 0.5 * (evaluateFunction(fn, lower) + evaluateFunction(fn, upper));
        for (let i = 1; i < steps; i++) {
            sum += evaluateFunction(fn, lower + i * h);
        }
        return h * sum;
    }

    function parseIntegral(expression) {
        const regex = /integrate\((.*),\s*(-?\d*\.?\d+),\s*(-?\d*\.?\d+)\)/;
        const match = expression.match(regex);
        if (match) {
            return {
                fn: match[1].trim(),
                lower: parseFloat(match[2]),
                upper: parseFloat(match[3])
            };
        }
        return null;
    }
    
    function generateDatasets() {
        const datasets = [];
        const step = (view.xMax - view.xMin) / 500;

        functions.filter(f => f.visible).forEach(func => {
            let expressionToGraph = func.expression;
            if (func.isIntegral) expressionToGraph = func.integralData.fn;
            if (func.isDerivative) expressionToGraph = func.derivativeOf;

            const lineData = [];
            for (let x = view.xMin; x <= view.xMax; x += step) {
                const y = func.isDerivative 
                    ? calculateDerivative(expressionToGraph, x)
                    : evaluateFunction(expressionToGraph, x);
                lineData.push({ x, y: typeof y === 'number' ? y : null });
            }

            const lineStyle = func.style;
            let borderDash = [];
            if(lineStyle.style === 'dashed') borderDash = [5, 5];
            if(lineStyle.style === 'dotted') borderDash = [2, 5];

            datasets.push({
                label: func.expression, data: lineData, borderColor: lineStyle.color,
                borderWidth: lineStyle.thickness, borderDash: borderDash,
                pointRadius: 0, tension: 0.1, fill: false
            });

            if (func.isIntegral) {
                 const { fn, lower, upper } = func.integralData;
                 const areaData = [];
                 for (let x = lower; x <= upper; x += (upper-lower)/200) { areaData.push({ x, y: evaluateFunction(fn, x) }); }
                 datasets.push({
                    type: 'line', label: `Area`, data: areaData,
                    backgroundColor: lineStyle.color + '4D',
                    borderColor: 'transparent', pointRadius: 0, fill: 'origin'
                 });
            } else if (!func.isDerivative) {
                const { roots, extrema } = func.pointsOfInterest;
                datasets.push({ type: 'scatter', data: roots, label: 'Raíces', backgroundColor: '#ff6384', pointRadius: 5 });
                datasets.push({ type: 'scatter', data: extrema, label: 'Extremos', backgroundColor: '#36a2eb', pointRadius: 5 });
            }
        });
        return datasets;
    }
    
    const geoGebraPlanePlugin = {
        id: 'geoGebraPlane',
        afterDraw: (chart) => {
            const { ctx, chartArea: { left, right, top, bottom }, scales: { x, y } } = chart;
            ctx.save();
            const getGridSpacing = (range) => {
                const exp = Math.floor(Math.log10(range));
                const mag = Math.pow(10, exp);
                const res = range / mag;
                if (res < 2) return mag / 5;
                if (res < 5) return mag / 2;
                return mag;
            };
            const xSpacing = getGridSpacing(x.max - x.min);
            const ySpacing = getGridSpacing(y.max - y.min);

            const drawGridLines = (spacing, isMajor, axis) => {
                const color = getComputedStyle(document.body).getPropertyValue(isMajor ? '--grid-color-major' : '--grid-color-minor');
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                const start = Math.floor((axis === 'x' ? x.min : y.min) / spacing) * spacing;
                const end = axis === 'x' ? x.max : y.max;
                for (let i = start; i <= end; i += spacing) {
                    const pos = axis === 'x' ? x.getPixelForValue(i) : y.getPixelForValue(i);
                    ctx.beginPath();
                    if (axis === 'x') { ctx.moveTo(pos, top); ctx.lineTo(pos, bottom); }
                    else { ctx.moveTo(left, pos); ctx.lineTo(right, pos); }
                    ctx.stroke();
                }
            };
            
            drawGridLines(xSpacing / 5, false, 'x');
            drawGridLines(ySpacing / 5, false, 'y');
            drawGridLines(xSpacing, true, 'x');
            drawGridLines(ySpacing, true, 'y');

            ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--axis-color');
            ctx.lineWidth = 1.5;
            if (x.min <= 0 && x.max >= 0) {
                const x0 = x.getPixelForValue(0);
                ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(x0, bottom); ctx.stroke();
            }
            if (y.min <= 0 && y.max >= 0) {
                const y0 = y.getPixelForValue(0);
                ctx.beginPath(); ctx.moveTo(left, y0); ctx.lineTo(right, y0); ctx.stroke();
            }
            
            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-color-light');
            ctx.font = '12px Poppins';
            const formatNumber = (num) => Number(num.toPrecision(3)).toString();
            
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            for (let i = Math.floor(x.min / xSpacing) * xSpacing; i <= x.max; i += xSpacing) {
                if (Math.abs(i) > 1e-9) ctx.fillText(formatNumber(i), x.getPixelForValue(i), y.getPixelForValue(0) + 8);
            }
            
            ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            for (let i = Math.floor(y.min / ySpacing) * ySpacing; i <= y.max; i += ySpacing) {
                if (Math.abs(i) > 1e-9) ctx.fillText(formatNumber(i), x.getPixelForValue(0) - 8, y.getPixelForValue(i));
            }
            if(x.min <= 0 && x.max >= 0 && y.min <= 0 && y.max >= 0) {
              ctx.fillText('0', x.getPixelForValue(0) - 8, y.getPixelForValue(0) + 15);
            }

            ctx.font = '14px Poppins';
            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
            let yPos = top + 20;
            functions.forEach(func => {
                if (func.isIntegral && func.visible) {
                    const resultText = `∫(${func.integralData.fn}) dx ≈ ${func.integralData.result.toFixed(4)}`;
                    ctx.fillText(resultText, left + 20, yPos);
                    yPos += 20;
                }
            });

            ctx.restore();
        }
    };

    function createOrUpdateChart() {
        if (chart) {
            chart.data.datasets = generateDatasets();
            Object.assign(chart.options.scales.x, { min: view.xMin, max: view.xMax });
            Object.assign(chart.options.scales.y, { min: view.yMin, max: view.yMax });
            chart.update('none');
        } else {
            chart = new Chart(ctx, {
                type: 'line',
                data: { datasets: generateDatasets() },
                plugins: [geoGebraPlanePlugin],
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        x: { type: 'linear', min: view.xMin, max: view.xMax, grid: { display: false }, ticks: { display: false } },
                        y: { type: 'linear', min: view.yMin, max: view.yMax, grid: { display: false }, ticks: { display: false } }
                    },
                    plugins: { legend: { display: false }, tooltip: { enabled: true, mode: 'index', intersect: false } }
                }
            });
        }
    }
    
    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        const { left, top } = canvas.getBoundingClientRect();
        const [xVal, yVal] = [chart.scales.x.getValueForPixel(e.clientX - left), chart.scales.y.getValueForPixel(e.clientY - top)];
        const zoomFactor = e.deltaY < 0 ? 0.85 : 1.15;
        view.xMin = xVal - (xVal - view.xMin) * zoomFactor;
        view.xMax = xVal + (view.xMax - xVal) * zoomFactor;
        view.yMin = yVal - (yVal - view.yMin) * zoomFactor;
        view.yMax = yVal + (view.yMax - yVal) * zoomFactor;
        createOrUpdateChart();
    });

    canvas.addEventListener('mousedown', e => { view.isPanning = true; view.lastPanX = e.clientX; view.lastPanY = e.clientY; });
    canvas.addEventListener('mousemove', e => {
        if (view.isPanning) {
            const dx = (e.clientX - view.lastPanX) * (view.xMax - view.xMin) / canvas.width;
            const dy = (e.clientY - view.lastPanY) * (view.yMax - view.yMin) / canvas.height;
            view.xMin -= dx; view.xMax -= dx;
            view.yMin += dy; view.yMax += dy;
            view.lastPanX = e.clientX; view.lastPanY = e.clientY;
            createOrUpdateChart();
        }
    });
    window.addEventListener('mouseup', () => { view.isPanning = false; });
    canvas.addEventListener('mouseleave', () => { view.isPanning = false; });

    const functionList = document.getElementById('function-list');
    const functionInput = document.getElementById('function-input');
    const addFunctionBtn = document.getElementById('add-function-btn');
    const errorMessage = document.getElementById('error-message');

    function renderFunctionList() {
        functionList.innerHTML = '';
        functions.forEach((func, index) => {
            const item = document.createElement('div');
            item.className = `function-item ${!func.visible ? 'hidden-func' : ''}`;
            
            let expr = func.expression;
            if (func.isIntegral) expr = `∫(${func.integralData.fn})dx from ${func.integralData.lower} to ${func.integralData.upper}`;
            if (func.isDerivative) expr = `d/dx(${func.derivativeOf})`;

            item.innerHTML = `
                <div class="function-item-header">
                    <div class="function-color" data-index="${index}" style="background-color: ${func.style.color};"></div>
                    <div class="function-expression" data-index="${index}">${func.isDerivative ? "f'(x)" : "f(x)"} = ${expr}</div>
                    <div class="function-item-controls">
                        <button class="settings-btn" data-index="${index}">⚙️</button>
                        <button class="delete-function-btn" data-index="${index}">&times;</button>
                    </div>
                </div>
                <div class="function-settings" id="settings-${index}">
                    <div class="setting-row">
                        <label for="color-${index}">Color</label>
                        <input type="color" id="color-${index}" value="${func.style.color}" data-index="${index}" data-prop="color">
                    </div>
                    <div class="setting-row">
                        <label for="thickness-${index}">Grosor</label>
                        <input type="number" id="thickness-${index}" min="1" max="10" step="0.5" value="${func.style.thickness}" data-index="${index}" data-prop="thickness">
                    </div>
                     <div class="setting-row">
                        <label for="style-${index}">Estilo</label>
                        <select id="style-${index}" data-index="${index}" data-prop="style">
                            <option value="solid" ${func.style.style === 'solid' ? 'selected' : ''}>Continua</option>
                            <option value="dashed" ${func.style.style === 'dashed' ? 'selected' : ''}>Discontinua</option>
                            <option value="dotted" ${func.style.style === 'dotted' ? 'selected' : ''}>Punteada</option>
                        </select>
                    </div>
                </div>`;
            functionList.appendChild(item);
        });
        
        document.querySelectorAll('.delete-function-btn').forEach(btn => btn.addEventListener('click', deleteFunction));
        document.querySelectorAll('.function-color').forEach(div => div.addEventListener('click', toggleVisibility));
        document.querySelectorAll('.function-expression').forEach(div => div.addEventListener('click', prepareEditFunction));
        document.querySelectorAll('.settings-btn').forEach(btn => btn.addEventListener('click', toggleSettings));
        document.querySelectorAll('.function-settings input, .function-settings select').forEach(input => input.addEventListener('input', updateStyle));
    }

    function addOrUpdateFunction() {
        let expression = functionInput.value.trim().toLowerCase();
        
        // *** LÍNEA AÑADIDA PARA CORREGIR EL ERROR ***
        expression = expression.replace(/f\(x\)\s*=\s*/, ''); // Limpia la entrada "f(x)="
        
        if (!expression) return;
        
        const integralData = parseIntegral(expression);
        const derivativeOf = parseDerivative(expression);
        const expressionToValidate = integralData?.fn || derivativeOf || expression;
        
        if (evaluateFunction(expressionToValidate, 1) === "error") {
            errorMessage.textContent = 'Error de sintaxis.';
            return;
        }
        errorMessage.textContent = '';
        
        const funcData = {
            expression,
            style: editIndex !== null ? functions[editIndex].style : {
                color: colors[functions.length % colors.length],
                thickness: 2.5,
                style: 'solid'
            },
            visible: true,
            isIntegral: !!integralData,
            isDerivative: !!derivativeOf,
            derivativeOf,
            integralData: integralData ? { ...integralData, result: calculateIntegral(integralData.fn, integralData.lower, integralData.upper) } : null,
            pointsOfInterest: (integralData || derivativeOf) ? { roots: [], extrema: [] } : findPointsOfInterest(expression),
        };

        if (editIndex !== null) { functions[editIndex] = funcData; } 
        else { functions.push(funcData); }
        
        resetInputMode();
        renderFunctionList();
        createOrUpdateChart();
    }
    
    function deleteFunction(e) {
        functions.splice(parseInt(e.target.dataset.index), 1);
        if (editIndex !== null) resetInputMode();
        renderFunctionList();
        createOrUpdateChart();
    }
    
    function toggleVisibility(e) {
        const index = parseInt(e.target.dataset.index);
        functions[index].visible = !functions[index].visible;
        renderFunctionList();
        createOrUpdateChart();
    }

    function prepareEditFunction(e) {
        const index = parseInt(e.target.dataset.index);
        functionInput.value = functions[index].expression;
        editIndex = index;
        addFunctionBtn.textContent = '✓';
        addFunctionBtn.classList.add('edit-mode');
        functionInput.focus();
    }

    function resetInputMode() {
        functionInput.value = '';
        editIndex = null;
        addFunctionBtn.textContent = '+';
        addFunctionBtn.classList.remove('edit-mode');
        errorMessage.textContent = '';
    }

    function toggleSettings(e) {
        const index = e.target.dataset.index;
        const settingsPanel = document.getElementById(`settings-${index}`);
        settingsPanel.classList.toggle('open');
    }

    function updateStyle(e) {
        const { index, prop } = e.target.dataset;
        functions[index].style[prop] = e.target.value;
        renderFunctionList();
        createOrUpdateChart();
    }

    addFunctionBtn.addEventListener('click', addOrUpdateFunction);
    functionInput.addEventListener('keypress', e => { if (e.key === 'Enter') addOrUpdateFunction(); });
    
    const themeToggle = document.getElementById('theme-toggle');
    const exportBtn = document.getElementById('export-btn');

    themeToggle.addEventListener('change', () => {
        const theme = themeToggle.checked ? 'light' : 'dark';
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        createOrUpdateChart();
    });

    if (localStorage.getItem('theme') === 'light') {
        themeToggle.checked = true;
        document.body.setAttribute('data-theme', 'light');
    }

    exportBtn.addEventListener('click', () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        const theme = localStorage.getItem('theme') || 'dark';
        tempCtx.fillStyle = theme === 'light' ? '#ffffff' : '#1e1e2f';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);

        const imageURL = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imageURL;
        link.download = 'grafica.png';
        link.click();
    });

    const zoom = (factor) => {
        const [xCenter, yCenter] = [(view.xMin + view.xMax) / 2, (view.yMin + view.yMax) / 2];
        view.xMin = xCenter - (xCenter - view.xMin) * factor; view.xMax = xCenter + (view.xMax - xCenter) * factor;
        view.yMin = yCenter - (yCenter - view.yMin) * factor; view.yMax = yCenter + (view.yMax - yCenter) * factor;
        createOrUpdateChart();
    };
    document.getElementById('zoom-in-btn').addEventListener('click', () => zoom(0.8));
    document.getElementById('zoom-out-btn').addEventListener('click', () => zoom(1.2));
    document.getElementById('reset-view-btn').addEventListener('click', () => {
        Object.assign(view, { xMin: -10, xMax: 10, yMin: -10, yMax: 10 });
        createOrUpdateChart();
    });

    const keyboardContainer = document.getElementById('virtual-keyboard');
    const toggleKeyboardButton = document.getElementById('toggle-keyboard-btn');
    let currentKeyboardMode = '123';
    const keyLayouts = {
        '123': [['7', '8', '9', '(', ')'], ['4', '5', '6', '*', '/'], ['1', '2', '3', '+', '-'], ['0', '.', '^', ',', 'x']],
        'f(x)': [['sin(', 'cos(', 'tan('], ['log(', 'sqrt(', 'abs('], ['PI', 'E', '∫', 'd/dx']],
        'SYM': [['←', '→', 'Borrar'], ['Limpiar']]
    };

    function renderKeyboard() {
        keyboardContainer.innerHTML = '';
        const modeRow = document.createElement('div');
        modeRow.className = 'keyboard-row';
        modeRow.style.gridTemplateColumns = `repeat(${Object.keys(keyLayouts).length}, 1fr)`;
        Object.keys(keyLayouts).forEach(mode => {
            const btn = document.createElement('button');
            btn.textContent = mode;
            btn.className = `keyboard-button ${currentKeyboardMode === mode ? 'active-mode' : ''}`;
            btn.addEventListener('click', () => { currentKeyboardMode = mode; renderKeyboard(); });
            modeRow.appendChild(btn);
        });
        keyboardContainer.appendChild(modeRow);

        keyLayouts[currentKeyboardMode].forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';
            rowDiv.style.gridTemplateColumns = `repeat(${row.length}, 1fr)`;
            row.forEach(key => {
                const btn = document.createElement('button');
                btn.textContent = key;
                btn.className = 'keyboard-button';
                if (['Limpiar','Borrar'].includes(key)) btn.classList.add('wide');
                btn.addEventListener('click', () => handleKeyPress(key));
                rowDiv.appendChild(btn);
            });
            keyboardContainer.appendChild(rowDiv);
        });
    }

    function handleKeyPress(key) {
        let { value, selectionStart: pos } = functionInput;
        const insert = (text, cursorPos = 0) => {
             functionInput.value = value.slice(0, pos) + text + value.slice(pos);
             functionInput.selectionStart = functionInput.selectionEnd = pos + text.length + cursorPos;
        }
        switch (key) {
            case 'Borrar':
                if (pos > 0) {
                    functionInput.value = value.slice(0, pos - 1) + value.slice(pos);
                    functionInput.selectionStart = functionInput.selectionEnd = pos - 1;
                }
                break;
            case 'Limpiar': functionInput.value = ''; break;
            case '←': if (pos > 0) functionInput.selectionStart = functionInput.selectionEnd = pos - 1; break;
            case '→': if (pos < value.length) functionInput.selectionStart = functionInput.selectionEnd = pos + 1; break;
            case '∫': insert('integrate( , , )', -4); break;
            case 'd/dx': insert('derivative( )', -1); break;
            default: insert(key);
        }
        functionInput.focus();
    }
    
    toggleKeyboardButton.addEventListener('click', () => {
        keyboardContainer.classList.toggle('hidden');
        if (!keyboardContainer.classList.contains('hidden')) renderKeyboard();
    });
    
    createOrUpdateChart();
    renderFunctionList();
});