// State Management
const STATE_KEY = 'tattoo_platform_state';

const defaultState = {
    clients: [
        { id: '1', name: 'Ana Oliveira', phone: '11988887777', instagram: '@ana_tattoo', allergies: 'Níquel', notes: 'Prefere traços finos.' },
        { id: '2', name: 'Carlos Silva', phone: '11977776666', instagram: '@carlos_s', allergies: 'Nenhuma', notes: 'Primeira tatuagem.' }
    ],
    inventory: [
        { id: '1', name: 'Preto Dynamic Union Black', category: 'Tintas', quantity: 2, minThreshold: 1, unit: 'unid' },
        { id: '2', name: 'Preto Dynamic Triple Black', category: 'Tintas', quantity: 1, minThreshold: 1, unit: 'unid' },
        { id: '3', name: 'Agulha 03RL 0.30mm', category: 'Agulhas', quantity: 15, minThreshold: 10, unit: 'unid' },
        { id: '4', name: 'Diluente Electric Ink', category: 'Tintas', quantity: 3, minThreshold: 1, unit: 'ml' }
    ],
    schedule: [
        { id: '1', clientId: '1', date: new Date().toISOString().split('T')[0], time: '14:00', totalValue: 500, deposit: 100, status: 'Confirmada', description: 'Leão no braço - Blackwork' },
        { id: '2', clientId: '2', date: '2026-02-19', time: '10:00', totalValue: 300, deposit: 50, status: 'Pendente', description: 'Escrita no pulso - Fine Line' }
    ],
    customColors: [],
    settings: {
        budgetHourlyRate: 200,
        budgetCm2Rate: 15,
        budgetMinSession: 250
    }
};

let state = JSON.parse(localStorage.getItem(STATE_KEY)) || defaultState;

function saveState() {
    try {
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
        updateGlobalAlerts();
    } catch (e) {
        console.error('Erro ao salvar estado:', e);
        showToast('Erro ao salvar dados no navegador!', 'danger');
    }
}

// Safe icon creation helper
function createIcons() {
    try {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        } else if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    } catch (e) {
        console.error('Erro ao carregar ícones:', e);
    }
}

// Polyfill for lucide to prevent reference errors
window.lucide = window.lucide || { createIcons: () => { } };

// Router Logic
const views = {
    mixer: {
        title: 'Misturador de Tintas',
        render: renderMixer
    },
    study: {
        title: 'Estudo das Cores',
        render: renderStudy
    },
    budget: {
        title: 'Calculador de Orçamentos',
        render: renderBudget
    },
    clients: {
        title: 'Gestão de Clientes',
        render: renderClients
    },
    inventory: {
        title: 'Controle de Estoque',
        render: renderInventory
    },
    schedule: {
        title: 'Minha Agenda',
        render: renderSchedule
    }
};

function navigate(viewName) {
    const view = views[viewName] || views.mixer;
    document.getElementById('page-title').textContent = view.title;

    const appView = document.getElementById('app-view');
    appView.innerHTML = '';
    view.render(appView);

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === viewName);
    });

    // Re-highlight icons
    lucide.createIcons();
}

// Global Alert System
function updateGlobalAlerts() {
    const lowStockItems = state.inventory.filter(item => item.quantity <= item.minThreshold).length;
    const badge = document.getElementById('low-stock-badge');
    if (lowStockItems > 0) {
        badge.textContent = lowStockItems;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast glass ${type}`;

    let icon = 'info';
    if (type === 'success') icon = 'check-circle';
    if (type === 'warning') icon = 'alert-triangle';
    if (type === 'danger') icon = 'x-circle';

    toast.innerHTML = `
        <i data-lucide="${icon}"></i>
        <div class="toast-content">${message}</div>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function showConfirm(title, message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('confirm-title');
    const messageEl = document.getElementById('confirm-message');
    const okBtn = document.getElementById('confirm-ok');
    const cancelBtn = document.getElementById('confirm-cancel');

    titleEl.textContent = title;
    messageEl.textContent = message;
    modal.classList.remove('hidden');

    const close = () => modal.classList.add('hidden');

    okBtn.onclick = () => {
        onConfirm();
        close();
    };
    cancelBtn.onclick = close;
    modal.onclick = (e) => { if (e.target === modal) close(); };
}

// Helper to mix colors based on drops
function mixColors(drops) {
    let r = 0, g = 0, b = 0, totalDrops = 0;

    const colors = {
        white: [255, 255, 255],
        black: [0, 0, 0],
        red: [255, 0, 0],
        blue: [0, 0, 255],
        yellow: [255, 255, 0],
        green: [0, 255, 0]
    };

    for (const [color, count] of Object.entries(drops)) {
        if (count > 0) {
            r += colors[color][0] * count;
            g += colors[color][1] * count;
            b += colors[color][2] * count;
            totalDrops += count;
        }
    }

    if (totalDrops === 0) return 'rgb(255, 255, 255)';

    return `rgb(${Math.round(r / totalDrops)}, ${Math.round(g / totalDrops)}, ${Math.round(b / totalDrops)})`;
}

function rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    const [r, g, b] = rgb.match(/\d+/g).map(Number);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function renderMixer(container) {
    const colorLabels = {
        white: 'Branco',
        black: 'Preto',
        red: 'Vermelho',
        blue: 'Azul',
        yellow: 'Amarelo',
        green: 'Verde'
    };

    let currentDrops = { white: 0, black: 0, red: 0, blue: 0, yellow: 0, green: 0 };

    function updatePreview() {
        const preview = document.getElementById('mixer-preview');
        const hexLabel = document.getElementById('mixer-hex');
        const recipeList = document.getElementById('mixer-recipe');
        const mixedColor = mixColors(currentDrops);

        preview.style.backgroundColor = mixedColor;
        hexLabel.textContent = rgbToHex(mixedColor);

        let total = Object.values(currentDrops).reduce((a, b) => a + b, 0);
        recipeList.innerHTML = total === 0 ? '0 gotas' : `
            <strong>Total: ${total} gotas</strong><br>
            <div style="margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${Object.entries(currentDrops).filter(([_, v]) => v > 0).map(([k, v]) => `
                    <span class="recipe-tag">${colorLabels[k]}: ${v} g (${((v / total) * 100).toFixed(0)}%)</span>
                `).join('')}
            </div>
        `;
    }

    container.innerHTML = `
        <div class="mixer-layout">
            <div class="card glass mixer-controls">
                <h3>Conta-gotas</h3>
                <div class="drops-grid">
                    ${Object.keys(currentDrops).map(color => `
                        <div class="drop-control">
                            <div class="drop-swatch ${color}" style="background-color: ${color === 'white' ? '#fff' : color === 'black' ? '#000' : color === 'red' ? '#f00' : color === 'blue' ? '#00f' : color === 'yellow' ? '#ff0' : color === 'green' ? '#0f0' : ''}"></div>
                            <span class="drop-name">${colorLabels[color]}</span>
                            <div class="qty-control">
                                <button class="btn-qty minus" data-color="${color}">-</button>
                                <span class="qty-val" id="qty-${color}">0</span>
                                <button class="btn-qty plus" data-color="${color}">+</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn-primary w-100" id="reset-mixer" style="margin-top: 1rem;">
                    <i data-lucide="rotate-ccw"></i> Resetar Tudo
                </button>
            </div>

            <div class="card glass mixer-preview-section">
                <div id="mixer-preview" class="color-preview-large"></div>
                
                <div class="preview-info-v2">
                    <div id="mixer-recipe" class="recipe-container">0 gotas</div>
                    
                    <div class="save-actions" style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
                        <div class="input-with-label">
                            <label>Nome da Mistura (Ex: Sombra Fria)</label>
                            <input type="text" id="new-color-name" placeholder="Dê um nome a esta cor..." class="glass-input">
                        </div>
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <span id="mixer-hex" class="hex-badge">#FFFFFF</span>
                            <button class="btn-primary" id="save-color" style="flex: 1;">
                                <i data-lucide="save"></i> Salvar na Minha Paleta
                            </button>
                        </div>
                    </div>
                </div>

                <div class="my-colors-list">
                    <h4>Minha Paleta Personalizada</h4>
                    <div id="saved-colors-grid" class="vertical-grid">
                        ${state.customColors.length === 0 ? '<p class="text-muted" style="padding: 1rem; text-align: center;">Nenhuma cor salva ainda.</p>' : ''}
                        ${state.customColors.map((c) => `
                            <div class="saved-color-card" data-id="${c.id}">
                                <div class="load-mixture" data-id="${c.id}" style="display: flex; align-items: center; gap: 1rem; flex: 1; cursor: pointer;">
                                    <div class="swatch-medium" style="background-color: ${c.hex}"></div>
                                    <div class="color-meta">
                                        <strong>${c.name}</strong>
                                        <span class="text-muted">${c.hex}</span>
                                    </div>
                                </div>
                                <button class="btn-icon delete-color" data-id="${c.id}" title="Excluir">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Event Listeners
    container.querySelectorAll('.btn-qty').forEach(btn => {
        btn.addEventListener('click', () => {
            const color = btn.dataset.color;
            if (btn.classList.contains('plus')) {
                currentDrops[color]++;
            } else if (currentDrops[color] > 0) {
                currentDrops[color]--;
            }
            document.getElementById(`qty-${color}`).textContent = currentDrops[color];
            updatePreview();
        });
    });

    container.querySelector('#reset-mixer').addEventListener('click', () => {
        currentDrops = { white: 0, black: 0, red: 0, blue: 0, yellow: 0, green: 0 };
        Object.keys(currentDrops).forEach(color => {
            const el = document.getElementById(`qty-${color}`);
            if (el) el.textContent = 0;
        });
        updatePreview();
    });

    container.querySelector('#save-color').addEventListener('click', () => {
        const hex = document.getElementById('mixer-hex').textContent;
        const nameInput = document.getElementById('new-color-name');
        const name = nameInput.value.trim() || `Mistura #${state.customColors.length + 1}`;

        state.customColors.unshift({
            id: Date.now().toString(),
            name: name,
            hex,
            drops: { ...currentDrops }
        });
        saveState();
        showToast(`Cor salva: ${name}`, 'success');
        renderMixer(container); // Refresh view
    });

    // Color action events
    container.querySelector('#saved-colors-grid').addEventListener('click', (e) => {
        const loadBtn = e.target.closest('.load-mixture');
        const deleteBtn = e.target.closest('.delete-color');

        if (loadBtn) {
            const id = loadBtn.dataset.id;
            const saved = state.customColors.find(c => c.id === id);
            if (saved && saved.drops) {
                currentDrops = { ...saved.drops };
                Object.entries(currentDrops).forEach(([color, qty]) => {
                    const el = document.getElementById(`qty-${color}`);
                    if (el) el.textContent = qty;
                });
                updatePreview();
                const nameInput = document.getElementById('new-color-name');
                if (nameInput) nameInput.value = saved.name;
                showToast(`Carregado: ${saved.name}`, 'info');
            }
        }

        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            showConfirm('Excluir Cor', 'Tem certeza que deseja remover esta cor do seu histórico?', () => {
                state.customColors = state.customColors.filter(c => c.id !== id);
                saveState();
                renderMixer(container);
                showToast('Cor removida do histórico.', 'info');
            });
        }
    });

    // Check for incoming study results
    if (window.studyResult) {
        currentDrops = { ...window.studyResult.drops };
        showToast(`Receita de ${window.studyResult.name} aplicada!`, 'success');
        delete window.studyResult;
        updatePreview();
    }

    createIcons();
}

function renderStudy(container) {
    let selectedIndex = 0;
    let currentHarmonyType = 'complementary';

    const wheelColors = [
        { name: 'Vermelho', hex: '#ff0000', drops: { red: 10 } },
        { name: 'Laranja', hex: '#ff8000', drops: { red: 6, yellow: 4 } },
        { name: 'Amarelo', hex: '#ffff00', drops: { yellow: 10 } },
        { name: 'Lima', hex: '#80ff00', drops: { yellow: 7, green: 3 } },
        { name: 'Verde', hex: '#00ff00', drops: { green: 10 } },
        { name: 'Turquesa', hex: '#00ff80', drops: { green: 6, blue: 4 } },
        { name: 'Ciano', hex: '#00ffff', drops: { blue: 5, green: 5 } },
        { name: 'Azul Celeste', hex: '#0080ff', drops: { blue: 8, white: 2 } },
        { name: 'Azul', hex: '#0000ff', drops: { blue: 10 } },
        { name: 'Violeta', hex: '#8000ff', drops: { blue: 6, red: 4 } },
        { name: 'Magenta', hex: '#ff00ff', drops: { red: 6, blue: 4 } },
        { name: 'Carmim', hex: '#ff0080', drops: { red: 8, blue: 2 } }
    ];

    const harmonyConfigs = {
        complementary: {
            label: 'Complementar',
            indices: [0, 6],
            tips: 'Use cores complementares para criar alto impacto e contraste. Ideal para detalhes que precisam "pular" da pele.',
            visualDesc: '<strong>Referência Pinterest:</strong> Uma tatuagem de dragão em tons profundos de Azul Celeste, com chamas intensas em Laranja. O contraste faz com que o fogo pareça emitir radiação real sobre a pele.',
            icon: 'contrast'
        },
        analogous: {
            label: 'Análoga',
            indices: [0, 1, 11],
            tips: 'Cores vizinhas criam transições suaves e naturais. Perfeito para sobreposições de cores e realismo colorido.',
            visualDesc: '<strong>Referência Pinterest:</strong> Um pôr do sol ou pétalas de flor com degradês de Vermelho para Magenta e Roxo. Cria uma sensação de profundidade e volume sem choques visuais.',
            icon: 'palette'
        },
        triadic: {
            label: 'Triádica',
            indices: [0, 4, 8],
            tips: 'Equilíbrio visual com três cores contrastantes. Oferece uma paleta rica e vibrante sem ser agressiva.',
            visualDesc: '<strong>Referência Pinterest:</strong> Tatuagens estilo New School ou Pop Art usando Vermelho, Amarelo e Azul de forma equilibrada. Traz uma estética de "quadrinhos" muito moderna.',
            icon: 'layout-grid'
        }
    };

    function updateStudyView() {
        const wheelContainer = document.getElementById('interactive-wheel-root');
        if (!wheelContainer) return;

        const size = 300;
        const center = size / 2;
        const radius = 120;
        const innerRadius = 50;

        // Generate segments
        let segments = '';
        wheelColors.forEach((color, i) => {
            const startAngle = (i * 30 - 105) * (Math.PI / 180);
            const endAngle = ((i + 1) * 30 - 105) * (Math.PI / 180);

            const x1 = center + radius * Math.cos(startAngle);
            const y1 = center + radius * Math.sin(startAngle);
            const x2 = center + radius * Math.cos(endAngle);
            const y2 = center + radius * Math.sin(endAngle);

            const x3 = center + innerRadius * Math.cos(endAngle);
            const y3 = center + innerRadius * Math.sin(endAngle);
            const x4 = center + innerRadius * Math.cos(startAngle);
            const y4 = center + innerRadius * Math.sin(startAngle);

            const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 0 0 ${x4} ${y4} Z`;

            segments += `<path d="${pathData}" fill="${color.hex}" class="segment-path ${selectedIndex === i ? 'active' : ''}" data-index="${i}"></path>`;
        });

        // Generate Harmony Lines
        let harmonyVisuals = '';
        const offset = harmonyConfigs[currentHarmonyType].indices;
        const points = offset.map(o => {
            const idx = (selectedIndex + o) % 12;
            const angle = (idx * 30 - 90) * (Math.PI / 180);
            return {
                x: center + radius * 0.8 * Math.cos(angle),
                y: center + radius * 0.8 * Math.sin(angle),
                color: wheelColors[idx].hex
            };
        });

        if (currentHarmonyType === 'complementary') {
            harmonyVisuals += `<line x1="${points[0].x}" y1="${points[0].y}" x2="${points[1].x}" y2="${points[1].y}" class="harmony-line" />`;
        } else {
            let polyline = `M ${points[0].x} ${points[0].y}`;
            points.forEach(p => polyline += ` L ${p.x} ${p.y}`);
            polyline += ' Z';
            harmonyVisuals += `<path d="${polyline}" fill="none" class="harmony-line" />`;
        }

        points.forEach(p => {
            harmonyVisuals += `<circle cx="${p.x}" cy="${p.y}" r="5" class="harmony-marker" />`;
        });

        wheelContainer.innerHTML = `
            <svg viewBox="0 0 ${size} ${size}" class="color-wheel-svg">
                ${segments}
                ${harmonyVisuals}
            </svg>
        `;

        // Update Info Card
        const selectedColor = wheelColors[selectedIndex];
        const infoRoot = document.getElementById('study-info-root');
        const dropsHtml = Object.entries(selectedColor.drops)
            .map(([color, qty]) => `
                <div class="drop-item-mini">
                    <div class="swatch-mini" style="background-color: var(--${color})"></div>
                    <span>${qty} ${color === 'white' ? 'B' : color === 'black' ? 'P' : qty > 1 ? 'gotas' : 'gota'}</span>
                </div>
            `).join('');

        infoRoot.innerHTML = `
            <div class="card glass selected-info-card fade-in">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: ${selectedColor.hex}; border: 2px solid white;"></div>
                    <div>
                        <h3 style="margin: 0;">${selectedColor.name}</h3>
                        <span class="text-muted">${selectedColor.hex}</span>
                    </div>
                </div>
                
                <div class="harmony-selector">
                    ${Object.entries(harmonyConfigs).map(([key, cfg]) => `
                        <button class="btn-secondary btn-tab-small ${currentHarmonyType === key ? 'active' : ''}" data-type="${key}">
                            ${cfg.label}
                        </button>
                    `).join('')}
                </div>

                <div class="tips-panel">
                    <h4><i data-lucide="lightbulb"></i> Teoria na Prática</h4>
                    <p>${harmonyConfigs[currentHarmonyType].tips}</p>
                </div>

                <div class="visual-example-card" style="margin-top: 1rem;">
                    <div class="visual-placeholder">
                        <i data-lucide="${harmonyConfigs[currentHarmonyType].icon}"></i>
                        <span>Exemplo Visual (Estilo Pinterest)</span>
                    </div>
                    <div class="visual-description">
                        ${harmonyConfigs[currentHarmonyType].visualDesc}
                    </div>
                </div>

                <div class="recipe-preview">
                    <strong>Receita sugerida:</strong>
                    <div class="recipe-drops-list">${dropsHtml}</div>
                    <button class="btn-primary" id="apply-study-color" style="width: 100%; margin-top: 1rem; background: var(--secondary);">
                        <i data-lucide="wand-2"></i> Usar esta cor no Misturador
                    </button>
                </div>
            </div>
        `;
        lucide.createIcons();
    }

    container.innerHTML = `
        <div class="study-layout">
            <header style="text-align: center; margin-bottom: 1rem;">
                <p class="text-muted">Explore cores e harmonias para elevar o nível da sua arte.</p>
            </header>
            
            <div class="color-wheel-container">
                <div class="wheel-graphic" id="interactive-wheel-root"></div>
                <div class="study-info" id="study-info-root"></div>
            </div>
        </div>
    `;

    updateStudyView();

    // Event Delegation
    container.addEventListener('click', (e) => {
        const segment = e.target.closest('.segment-path');
        const harmonyTab = e.target.closest('.btn-tab-small');
        const applyBtn = e.target.closest('#apply-study-color');

        if (segment) {
            selectedIndex = parseInt(segment.dataset.index);
            updateStudyView();
        }

        if (harmonyTab) {
            currentHarmonyType = harmonyTab.dataset.type;
            updateStudyView();
        }

        if (applyBtn) {
            const color = wheelColors[selectedIndex];
            // Simulate navigation and injection
            window.location.hash = 'mixer';
            // We need a way to pass data to the mixer. Since we use hash, let's use a temporary global or shared state extension.
            window.studyResult = { name: color.name, drops: color.drops };
            showToast(`Receita de ${color.name} enviada para o mixer!`, 'success');
        }
    });
}

function renderBudget(container) {
    let type = 'size'; // 'size' or 'time'

    function calculate() {
        const val1 = parseFloat(document.getElementById('input-1').value) || 0;
        const val2 = parseFloat(document.getElementById('input-2').value) || 0;
        const resultEl = document.getElementById('budget-result');

        let total = 0;
        if (type === 'size') {
            const area = Math.abs(val1 * val2); // ensure positive
            total = area * state.settings.budgetCm2Rate;
        } else {
            total = Math.abs(val1) * state.settings.budgetHourlyRate;
        }

        total = Math.max(total, state.settings.budgetMinSession);
        resultEl.textContent = `R$ ${total.toFixed(2)}`;
    }

    function updateUI() {
        const brief = container.querySelector('.settings-brief ul');
        if (brief) {
            brief.innerHTML = `
                <li>R$ ${state.settings.budgetCm2Rate}/cm²</li>
                <li>R$ ${state.settings.budgetHourlyRate}/hora</li>
                <li>Mínimo R$ ${state.settings.budgetMinSession}</li>
            `;
        }
    }

    container.innerHTML = `
        <div class="budget-layout">
            <div class="card glass budget-form">
                <div class="budget-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h3 style="margin: 0;">Calculadora</h3>
                    <button class="btn-secondary" id="toggle-settings" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem;">
                        <i data-lucide="settings" size="18"></i> Configurações
                    </button>
                </div>

                <div id="settings-area" class="hidden">
                    <div class="settings-panel">
                        <h4><i data-lucide="sliders-horizontal"></i> Ajustar Valores</h4>
                        <div class="form-row">
                            <div class="settings-field">
                                <label>Valor cm²</label>
                                <div class="settings-input-group">
                                    <span>R$</span>
                                    <input type="number" id="set-cm2" value="${state.settings.budgetCm2Rate}" step="0.5">
                                </div>
                            </div>
                            <div class="settings-field">
                                <label>Valor Hora</label>
                                <div class="settings-input-group">
                                    <span>R$</span>
                                    <input type="number" id="set-hour" value="${state.settings.budgetHourlyRate}" step="5">
                                </div>
                            </div>
                        </div>
                        <div class="settings-field">
                            <label>Mínimo Praticado (Mín. por Sessão)</label>
                            <div class="settings-input-group">
                                <span>R$</span>
                                <input type="number" id="set-min" value="${state.settings.budgetMinSession}" step="10">
                            </div>
                        </div>
                        <button class="btn-primary w-100" id="save-settings-btn" style="background: var(--secondary);">
                            Salvar Configurações
                        </button>
                    </div>
                </div>

                <div class="type-toggle glass">
                    <button class="btn-toggle active" data-type="size">Por Tamanho (cm²)</button>
                    <button class="btn-toggle" data-type="time">Por Hora</button>
                </div>
                
                <div id="dynamic-inputs" style="margin-top: 1.5rem;">
                    <!-- Inputs change here -->
                </div>

                <div class="settings-brief glass">
                    <p><i data-lucide="info" size="14"></i> Valores configurados:</p>
                    <ul>
                        <li>R$ ${state.settings.budgetCm2Rate}/cm²</li>
                        <li>R$ ${state.settings.budgetHourlyRate}/hora</li>
                        <li>Mínimo Praticado: R$ ${state.settings.budgetMinSession}</li>
                    </ul>
                </div>
            </div>

            <div class="card glass budget-result-section">
                <h3>Estimativa de Valor</h3>
                <div class="result-display">
                    <span id="budget-result">R$ 0.00</span>
                </div>
                <button class="btn-primary w-100" id="export-budget">
                    <i data-lucide="share-2"></i> Exportar Orçamento
                </button>
            </div>
        </div>
    `;

    function updateInputs() {
        const inputContainer = document.getElementById('dynamic-inputs');
        if (type === 'size') {
            inputContainer.innerHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label>Largura (cm)</label>
                        <input type="number" id="input-1" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label>Altura (cm)</label>
                        <input type="number" id="input-2" placeholder="0">
                    </div>
                </div>
            `;
        } else {
            inputContainer.innerHTML = `
                <div class="form-group">
                    <label>Horas Estimadas</label>
                    <input type="number" id="input-1" placeholder="0">
                    <input type="hidden" id="input-2" value="0">
                </div>
            `;
        }

        // Attach calc events to new inputs
        document.querySelectorAll('#dynamic-inputs input').forEach(input => {
            input.addEventListener('input', calculate);
        });
    }

    updateInputs();

    // Toggle events
    container.querySelectorAll('.btn-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            type = btn.dataset.type;
            container.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateInputs();
            calculate();
        });
    });

    container.querySelector('#export-budget').addEventListener('click', async () => {
        const total = document.getElementById('budget-result').textContent;
        const inputs = type === 'size' ?
            `${document.getElementById('input-1').value}x${document.getElementById('input-2').value}cm` :
            `${document.getElementById('input-1').value} horas`;

        const msg = `🎨 *Orçamento Tattoo Pro*\n\n` +
            `📍 *Tipo:* ${type === 'size' ? 'Tamanho' : 'Tempo'}\n` +
            `📏 *Detalhes:* ${inputs}\n` +
            `💰 *Valor Estimado:* ${total}\n\n` +
            `*Nota:* Este é um valor inicial estimado baseado nas configurações do estúdio.`;

        try {
            await navigator.clipboard.writeText(msg);
            showToast('Orçamento copiado para o clipboard!', 'success');
        } catch (err) {
            console.error('Erro ao copiar:', err);
            alert('Texto para copiar:\n\n' + msg);
        }
    });

    lucide.createIcons();

    // Settings Toggle
    const toggleBtn = container.querySelector('#toggle-settings');
    const settingsArea = container.querySelector('#settings-area');
    toggleBtn.addEventListener('click', () => {
        settingsArea.classList.toggle('hidden');
    });

    // Save Settings
    container.querySelector('#save-settings-btn').addEventListener('click', () => {
        const cm2 = parseFloat(document.getElementById('set-cm2').value) || 0;
        const hour = parseFloat(document.getElementById('set-hour').value) || 0;
        const min = parseFloat(document.getElementById('set-min').value) || 0;

        state.settings.budgetCm2Rate = cm2;
        state.settings.budgetHourlyRate = hour;
        state.settings.budgetMinSession = min;

        saveState();
        updateUI();
        calculate();
        settingsArea.classList.add('hidden');
        showToast('Configurações salvas!', 'success');
    });
}

function renderClients(container) {
    let searchTerm = '';

    function filterClients() {
        return state.clients.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm)
        );
    }

    function updateList() {
        const listContainer = document.getElementById('clients-list');
        const filtered = filterClients();

        listContainer.innerHTML = filtered.length === 0 ? '<p class="text-muted">Nenhum cliente encontrado.</p>' :
            filtered.map(c => `
                <div class="card glass client-card">
                    <div class="client-info">
                        <strong>${c.name}</strong>
                        <div class="client-meta">
                            <span><i data-lucide="phone" size="14"></i> ${c.phone}</span>
                            <span><i data-lucide="instagram" size="14"></i> ${c.instagram}</span>
                        </div>
                    </div>
                    ${c.allergies && c.allergies !== 'Nenhuma' ? `
                        <div class="health-alert">
                            <i data-lucide="alert-circle"></i> ${c.allergies}
                        </div>
                    ` : ''}
                    <div class="client-actions">
                        <button class="btn-icon view-client" data-id="${c.id}" title="Ver detalhes"><i data-lucide="eye"></i></button>
                        <button class="btn-icon edit-client" data-id="${c.id}" title="Editar"><i data-lucide="edit-3"></i></button>
                        <button class="btn-icon delete-client delete" data-id="${c.id}" title="Excluir"><i data-lucide="trash-2"></i></button>
                    </div>
                </div>
            `).join('');
        lucide.createIcons();
    }

    container.innerHTML = `
        <div class="crm-layout">
            <div class="top-actions">
                <div class="search-bar glass">
                    <i data-lucide="search"></i>
                    <input type="text" id="client-search" placeholder="Buscar por nome ou WhatsApp...">
                </div>
                <button class="btn-primary" id="add-client-btn">
                    <i data-lucide="plus"></i> Novo Cliente
                </button>
            </div>
            
            <div id="clients-list" class="clients-grid">
                <!-- Clients will render here -->
            </div>
        </div>

        <div id="client-modal" class="modal hidden">
            <div class="modal-content glass">
                <div class="modal-header">
                    <h3>Novo Cliente</h3>
                    <button class="btn-close" id="close-modal-x"><i data-lucide="x"></i></button>
                </div>
                <form id="add-client-form">
                    <div class="form-group">
                        <label>Nome Completo</label>
                        <input type="text" name="name" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>WhatsApp</label>
                            <input type="text" name="phone" placeholder="(00) 00000-0000" required>
                        </div>
                        <div class="form-group">
                            <label>Instagram</label>
                            <input type="text" name="instagram" placeholder="@usuario">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Alergias / Restrições</label>
                        <input type="text" name="allergies" placeholder="Ex: Níquel, látex..." class="danger-input">
                    </div>
                    <div class="form-group">
                        <label>Observações Técnicas</label>
                        <textarea name="notes" rows="3"></textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" id="close-modal">Cancelar</button>
                        <button type="submit" class="btn-primary">Salvar Cliente</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    updateList();

    // Search event
    container.querySelector('#client-search').addEventListener('input', (e) => {
        searchTerm = e.target.value;
        updateList();
    });

    // Modal events
    const modal = container.querySelector('#client-modal');
    const form = container.querySelector('#add-client-form');

    const closeModal = () => {
        modal.classList.add('hidden');
        form.reset();
        delete modal.dataset.editId;
        modal.querySelector('h3').textContent = 'Novo Cliente';
    };

    container.querySelector('#add-client-btn').addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    container.querySelector('#close-modal').addEventListener('click', closeModal);
    container.querySelector('#close-modal-x').addEventListener('click', closeModal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const clientId = modal.dataset.editId;

        const name = formData.get('name').trim();
        if (!name) return;

        const clientData = {
            name,
            phone: formData.get('phone'),
            instagram: formData.get('instagram'),
            allergies: formData.get('allergies') || 'Nenhuma',
            notes: formData.get('notes')
        };

        if (clientId) {
            const index = state.clients.findIndex(c => c.id === clientId);
            state.clients[index] = { ...state.clients[index], ...clientData };
            showToast('Dados do cliente atualizados!', 'success');
        } else {
            state.clients.unshift({ id: Date.now().toString(), ...clientData });
            showToast('Cliente adicionado!', 'success');
        }

        saveState();
        closeModal();
        updateList();
    });

    // Client action events
    container.querySelector('#clients-list').addEventListener('click', (e) => {
        const viewBtn = e.target.closest('.view-client');
        const editBtn = e.target.closest('.edit-client');
        const deleteBtn = e.target.closest('.delete-client');

        if (viewBtn) {
            const id = viewBtn.dataset.id;
            const client = state.clients.find(c => c.id === id);
            // Replace alert with toast or details modal logic
            showToast(`Ficha: ${client.name} - ${client.allergies}`, 'info');
            console.log('Detalhes do cliente:', client);
        }

        if (editBtn) {
            const id = editBtn.dataset.id;
            const client = state.clients.find(c => c.id === id);
            modal.dataset.editId = id;
            modal.querySelector('h3').textContent = 'Editar Cliente';
            form.querySelector('[name="name"]').value = client.name;
            form.querySelector('[name="phone"]').value = client.phone;
            form.querySelector('[name="instagram"]').value = client.instagram;
            form.querySelector('[name="allergies"]').value = client.allergies;
            form.querySelector('[name="notes"]').value = client.notes || '';
            modal.classList.remove('hidden');
        }

        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            showConfirm('Excluir Cliente', 'Esta ação não pode ser desfeita. Deseja realmente remover este cliente?', () => {
                state.clients = state.clients.filter(c => c.id !== id);
                saveState();
                updateList();
                showToast('Cliente removido.', 'info');
            });
        }
    });

    createIcons();
}

function renderInventory(container) {
    let searchTerm = '';
    let categoryFilter = 'Todas';
    const categories = ['Todas', 'Tintas', 'Agulhas', 'Cartuchos', 'Descartáveis', 'Outros'];

    function filterItems() {
        return state.inventory.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'Todas' || item.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }

    function updateInventoryList() {
        const listContainer = document.getElementById('inventory-list');
        const filtered = filterItems();

        listContainer.innerHTML = filtered.length === 0 ? '<p class="text-muted">Nenhum item encontrado.</p>' :
            filtered.map(item => `
                <div class="card glass inventory-item ${item.quantity <= item.minThreshold ? 'low-stock' : ''}">
                    <div class="item-main">
                        <div class="item-info">
                            <strong>${item.name}</strong>
                            <span class="category-tag">${item.category}</span>
                        </div>
                        <div class="item-stock">
                            <button class="btn-qty-stock minus" data-id="${item.id}">-</button>
                            <div class="stock-display">
                                <span class="current-qty">${item.quantity}</span>
                                <span class="unit">${item.unit}</span>
                            </div>
                            <button class="btn-qty-stock plus" data-id="${item.id}">+</button>
                        </div>
                    </div>
                    ${item.quantity <= item.minThreshold ? `
                        <div class="stock-warning">
                            <i data-lucide="alert-triangle"></i> Estoque baixo (Min: ${item.minThreshold})
                            <div class="buy-actions" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                <a href="https://www.electricink.com.br/busca?q=${encodeURIComponent(item.name.toLowerCase())}" target="_blank" class="buy-link electric-ink">
                                    <i data-lucide="shopping-cart"></i> Repor na Electric Ink
                                </a>
                                <a href="https://www.google.com/search?q=${encodeURIComponent(item.name)}&tbm=shop" target="_blank" class="buy-link google-search">
                                    <i data-lucide="search"></i> Buscar Ofertas
                                </a>
                            </div>
                        </div>
                    ` : ''}
                    <div class="item-actions" style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem;">
                        <button class="btn-icon edit-item" data-id="${item.id}" title="Editar"><i data-lucide="edit-3"></i></button>
                        <button class="btn-icon delete-item" data-id="${item.id}" title="Excluir"><i data-lucide="trash-2"></i></button>
                    </div>
                </div>
            `).join('');
        lucide.createIcons();
    }

    container.innerHTML = `
        <div class="inventory-layout">
            <div class="top-actions">
                <div class="search-bar glass">
                    <i data-lucide="search"></i>
                    <input type="text" id="inventory-search" placeholder="Buscar material...">
                </div>
                <select id="category-filter" class="glass-select">
                    ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
                <button class="btn-primary" id="add-item-btn">
                    <i data-lucide="plus"></i> Novo Item
                </button>
            </div>
            
            <div id="inventory-list" class="inventory-grid">
                <!-- Items will render here -->
            </div>
        </div>

        <!-- Add Item Modal -->
        <div id="item-modal" class="modal hidden">
            <div class="modal-content glass">
                <div class="modal-header">
                    <h3>Novo Material</h3>
                    <button class="btn-close" id="close-item-modal-x"><i data-lucide="x"></i></button>
                </div>
                <form id="add-item-form">
                    <div class="form-group">
                        <label>Nome do Material</label>
                        <input type="text" name="name" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Categoria</label>
                            <select name="category" required>
                                ${categories.filter(c => c !== 'Todas').map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Unidade</label>
                            <input type="text" name="unit" placeholder="unid, ml, kit" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Qtd. Atual</label>
                            <input type="number" name="quantity" value="0" min="0" step="1" required>
                        </div>
                        <div class="form-group">
                            <label>Limite Mínimo</label>
                            <input type="number" name="minThreshold" value="5" min="0" step="1" required>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" id="close-item-modal">Cancelar</button>
                        <button type="submit" class="btn-primary">Adicionar ao Estoque</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    updateInventoryList();

    // Events
    container.querySelector('#inventory-search').addEventListener('input', (e) => {
        searchTerm = e.target.value;
        updateInventoryList();
    });

    container.querySelector('#category-filter').addEventListener('change', (e) => {
        categoryFilter = e.target.value;
        updateInventoryList();
    });

    // Stock adjustment events
    container.querySelector('#inventory-list').addEventListener('click', (e) => {
        const plusBtn = e.target.closest('.plus');
        const minusBtn = e.target.closest('.minus');

        if (plusBtn || minusBtn) {
            const id = (plusBtn || minusBtn).dataset.id;
            const item = state.inventory.find(i => i.id === id);

            if (plusBtn) {
                item.quantity++;
            } else if (item.quantity > 0) {
                item.quantity--;
                if (item.quantity === item.minThreshold) {
                    showToast(`Atenção: ${item.name} atingiu o limite mínimo!`, 'warning');
                }
            }

            saveState();
            updateInventoryList();
        }
    });

    // Modal events
    const itemModal = container.querySelector('#item-modal');
    const itemForm = container.querySelector('#add-item-form');

    const closeItemModal = () => {
        itemModal.classList.add('hidden');
        itemForm.reset();
        delete itemModal.dataset.editId;
        itemModal.querySelector('h3').textContent = 'Novo Material';
    };

    container.querySelector('#add-item-btn').addEventListener('click', () => {
        itemModal.classList.remove('hidden');
    });

    container.querySelector('#close-item-modal').addEventListener('click', closeItemModal);
    container.querySelector('#close-item-modal-x').addEventListener('click', closeItemModal);

    itemModal.addEventListener('click', (e) => {
        if (e.target === itemModal) closeItemModal();
    });

    itemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const itemId = itemModal.dataset.editId;

        const itemData = {
            name: formData.get('name'),
            category: formData.get('category'),
            unit: formData.get('unit'),
            quantity: parseInt(formData.get('quantity')),
            minThreshold: parseInt(formData.get('minThreshold'))
        };

        if (itemId) {
            const index = state.inventory.findIndex(i => i.id === itemId);
            state.inventory[index] = { ...state.inventory[index], ...itemData };
            showToast('Material atualizado!', 'success');
        } else {
            state.inventory.unshift({ id: Date.now().toString(), ...itemData });
            showToast('Material cadastrado!', 'success');
        }

        saveState();
        closeItemModal();
        updateInventoryList();
    });

    // New item events (delegation)
    container.querySelector('#inventory-list').addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-item');
        const deleteBtn = e.target.closest('.delete-item');

        if (editBtn) {
            const id = editBtn.dataset.id;
            const item = state.inventory.find(i => i.id === id);
            itemModal.dataset.editId = id;
            itemModal.querySelector('h3').textContent = 'Editar Material';
            itemForm.querySelector('[name="name"]').value = item.name;
            itemForm.querySelector('[name="category"]').value = item.category;
            itemForm.querySelector('[name="unit"]').value = item.unit;
            itemForm.querySelector('[name="quantity"]').value = item.quantity;
            itemForm.querySelector('[name="minThreshold"]').value = item.minThreshold;
            itemModal.classList.remove('hidden');
        }

        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            showConfirm('Remover Item', 'Tem certeza que deseja excluir este material do seu estoque?', () => {
                state.inventory = state.inventory.filter(i => i.id !== id);
                saveState();
                updateInventoryList();
                showToast('Item removido.', 'info');
            });
        }
    });

    createIcons();
}

function renderSchedule(container) {
    const today = new Date().toISOString().split('T')[0];

    function getClientName(id) {
        const client = state.clients.find(c => c.id === id);
        return client ? client.name : 'Cliente desconhecido';
    }

    function updateScheduleList() {
        const listContainer = document.getElementById('schedule-list');
        const sorted = [...state.schedule].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

        listContainer.innerHTML = sorted.length === 0 ? '<p class="text-muted">Nenhuma sessão agendada.</p>' :
            sorted.map(s => `
                <div class="card glass schedule-item ${s.date === today ? 'today-highlight' : ''} ${s.status.toLowerCase()}">
                    <div class="schedule-time-meta">
                        <span class="date">${s.date.split('-').reverse().join('/')}</span>
                        <span class="time">${s.time}</span>
                        ${s.date === today ? '<span class="today-badge">HOJE</span>' : ''}
                    </div>
                    <div class="schedule-main">
                        <div class="client-info">
                            <strong>${getClientName(s.clientId)}</strong>
                            <p>${s.description}</p>
                        </div>
                        <div class="financial-brief">
                            <span class="total">R$ ${s.totalValue}</span>
                            <span class="deposit">Sinal: R$ ${s.deposit}</span>
                        </div>
                    </div>
                    <div class="schedule-actions">
                        <span class="status-badge ${s.status.toLowerCase()}">${s.status}</span>
                        <div class="btn-group">
                            <button class="btn-icon edit-session" data-id="${s.id}" title="Editar"><i data-lucide="edit-3"></i></button>
                            <button class="btn-icon status-toggle" data-id="${s.id}" title="Alterar Status"><i data-lucide="refresh-cw"></i></button>
                            <button class="btn-icon delete-session" data-id="${s.id}" title="Excluir"><i data-lucide="trash-2"></i></button>
                        </div>
                    </div>
                </div>
            `).join('');
        lucide.createIcons();
    }

    container.innerHTML = `
        <div class="schedule-layout">
            <div class="top-actions">
                <h2>Agenda de Sessões</h2>
                <button class="btn-primary" id="add-session-btn">
                    <i data-lucide="plus"></i> Novo Agendamento
                </button>
            </div>
            
            <div id="schedule-list" class="schedule-grid">
                <!-- Sessions will render here -->
            </div>
        </div>

        <!-- Add Session Modal -->
        <div id="session-modal" class="modal hidden">
            <div class="modal-content glass">
                <div class="modal-header">
                    <h3>Novo Agendamento</h3>
                    <button class="btn-close" id="close-session-modal-x"><i data-lucide="x"></i></button>
                </div>
                <form id="add-session-form">
                    <div class="form-group">
                        <label>Selecionar Cliente</label>
                        <select name="clientId" required>
                            <option value="">Escolha um cliente...</option>
                            ${state.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Data</label>
                            <input type="date" name="date" value="${today}" required>
                        </div>
                        <div class="form-group">
                            <label>Horário</label>
                            <input type="time" name="time" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Descrição do Trabalho</label>
                        <input type="text" name="description" placeholder="Ex: Tatuagem Realismo 15cm" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Valor Total (R$)</label>
                            <input type="number" name="totalValue" min="0" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label>Sinal / Depósito (R$)</label>
                            <input type="number" name="deposit" min="0" step="0.01" value="0">
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" id="close-session-modal">Cancelar</button>
                        <button type="submit" class="btn-primary">Confirmar Agendamento</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    updateScheduleList();

    // Modal Events
    const sessionModal = container.querySelector('#session-modal');
    const sessionForm = container.querySelector('#add-session-form');

    const closeSessionModal = () => {
        sessionModal.classList.add('hidden');
        sessionForm.reset();
        delete sessionModal.dataset.editId;
        sessionModal.querySelector('h3').textContent = 'Novo Agendamento';
    };

    container.querySelector('#add-session-btn').addEventListener('click', () => {
        sessionModal.classList.remove('hidden');
    });

    container.querySelector('#close-session-modal').addEventListener('click', closeSessionModal);
    container.querySelector('#close-session-modal-x').addEventListener('click', closeSessionModal);

    sessionModal.addEventListener('click', (e) => {
        if (e.target === sessionModal) closeSessionModal();
    });

    sessionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const sessionId = sessionModal.dataset.editId;

        const sessionData = {
            clientId: formData.get('clientId'),
            date: formData.get('date'),
            time: formData.get('time'),
            description: formData.get('description'),
            totalValue: parseFloat(formData.get('totalValue')),
            deposit: parseFloat(formData.get('deposit')),
            status: sessionId ? state.schedule.find(s => s.id === sessionId).status : 'Confirmada'
        };

        if (sessionId) {
            const index = state.schedule.findIndex(s => s.id === sessionId);
            state.schedule[index] = { ...state.schedule[index], ...sessionData };
            showToast('Agendamento atualizado!', 'success');
        } else {
            state.schedule.unshift({ id: Date.now().toString(), ...sessionData });
            showToast('Sessão agendada!', 'success');
        }

        saveState();
        closeSessionModal();
        updateScheduleList();
    });

    // Schedule list events (delegation)
    container.querySelector('#schedule-list').addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.status-toggle');
        const editBtn = e.target.closest('.edit-session');
        const deleteBtn = e.target.closest('.delete-session');

        if (toggleBtn) {
            const id = toggleBtn.dataset.id;
            const session = state.schedule.find(s => s.id === id);
            const statuses = ['Pendente', 'Confirmada', 'Concluída'];
            let nextIndex = (statuses.indexOf(session.status) + 1) % statuses.length;
            session.status = statuses[nextIndex];
            saveState();
            updateScheduleList();
            showToast(`Status alterado para: ${session.status}`, 'info');
        }

        if (editBtn) {
            const id = editBtn.dataset.id;
            const session = state.schedule.find(s => s.id === id);
            sessionModal.dataset.editId = id;
            sessionModal.querySelector('h3').textContent = 'Editar Agendamento';
            sessionForm.querySelector('[name="clientId"]').value = session.clientId;
            sessionForm.querySelector('[name="date"]').value = session.date;
            sessionForm.querySelector('[name="time"]').value = session.time;
            sessionForm.querySelector('[name="description"]').value = session.description;
            sessionForm.querySelector('[name="totalValue"]').value = session.totalValue;
            sessionForm.querySelector('[name="deposit"]').value = session.deposit;
            sessionModal.classList.remove('hidden');
        }

        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            showConfirm('Cancelar Agendamento', 'Deseja realmente excluir esta sessão da sua agenda?', () => {
                state.schedule = state.schedule.filter(s => s.id !== id);
                saveState();
                updateScheduleList();
                showToast('Sessão removida.', 'info');
            });
        }
    });

    createIcons();
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    try {
        createIcons();
        updateGlobalAlerts();

        // Initial navigation based on hash or default
        const currentPath = window.location.hash.slice(1) || 'mixer';
        navigate(currentPath);

        // Nav Item Click Events
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                window.location.hash = page;
            });
        });

        // Handle back/forward buttons
        window.addEventListener('hashchange', () => {
            const page = window.location.hash.slice(1) || 'mixer';
            navigate(page);
        });

    } catch (error) {
        console.error('Critical App Error:', error);
        // Show emergency feedback if possible
        const appView = document.getElementById('app-view');
        if (appView) {
            appView.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: white; background: rgba(255,0,0,0.1); border-radius: 12px; border: 1px solid rgba(255,0,0,0.2);">
                    <h2 style="color: #ff4444;">Ops! Algo deu errado.</h2>
                    <p>Houve um erro técnico ao carregar o aplicativo.</p>
                    <button class="btn-primary" onclick="localStorage.removeItem('${STATE_KEY}'); location.reload();" style="margin-top: 1rem; background: #ff4444;">
                        Limpar Dados e Reiniciar
                    </button>
                    <p style="font-size: 0.8rem; margin-top: 1rem; opacity: 0.7;">Isso pode acontecer se houver dados antigos incompatíveis no seu navegador.</p>
                </div>
            `;
        }
    }
});

// Polyfill already moved to top

export { state, saveState, showToast, navigate };
