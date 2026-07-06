// CONTROLADOR DE LA APP (PIXELCRAFT SINGLE PAGE)
const AppState = {
    currentView: 'home',
    currentTool: 'P', 
    currentColor: '#007aff',
    isDrawing: false,
    engineInstance: null,
    
    // Proyectos precargados de demostración local
    projects: [
        { id: 1, title: "Icono de Espada", width: 16, height: 16, bg: "transparent" },
        { id: 2, title: "Escenario de Fondo", width: 64, height: 32, bg: "#000000" }
    ],

    // Mapeo dinámico y temporizadores para shortcuts repetidos
    toolNames: {
        'P': 'Pincel (P)', 'E': 'Borrador (E)', 'F': 'Paint Bucket (F)', 
        'K': 'Color Picker (K)', 'Z': 'Zoom (Z)',
        'RectSelect': 'Rectangle Select (S)', 'LassoSelect': 'Lasso Select (S,S)', 'EllipseSelect': 'Ellipse Select (S,S,S)',
        'MovePixels': 'Move Selected Pixels (M)', 'MoveSelection': 'Move Selection (M,M)',
        'LineCurve': 'Line / Curve (O)', 'Shapes': 'Shapes (O,O)'
    },
    shortcutGroups: {
        'S': ['RectSelect', 'LassoSelect', 'EllipseSelect'],
        'M': ['MovePixels', 'MoveSelection'],
        'O': ['LineCurve', 'Shapes']
    },
    groupIndices: { 'S': 0, 'M': 0, 'O': 0 },
    lastClickTime: { 'S': 0, 'M': 0, 'O': 0 }
};

// MOTOR DE LIENZO (CANVAS DE PIXELES)
class PixelEngine {
    constructor(canvas, width, height, bgColor) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = width;
        this.height = height;
        this.bgColor = bgColor;

        // Auto-escalado según viewport físico para que encaje perfectamente
        this.scaleFactor = Math.floor(Math.min(500 / width, 500 / height));
        if (this.scaleFactor < 2) this.scaleFactor = 2;

        this.canvas.width = this.width * this.scaleFactor;
        this.canvas.height = this.height * this.scaleFactor;

        // Matriz bidimensional interna
        this.matrix = Array(this.width).fill(null).map(() => Array(this.height).fill('transparent'));

        this.clearAndBuildBg();
    }

    clearAndBuildBg() {
        if (this.bgColor === 'transparent') {
            this.drawCheckerboard();
        } else {
            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    this.matrix[x][y] = this.bgColor;
                }
            }
        }
    }

    drawCheckerboard() {
        const size = this.scaleFactor;
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.ctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#e1e1e4';
                this.ctx.fillRect(x * size, y * size, size, size);
            }
        }
    }

    getCoordinates(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((clientX - rect.left) / this.scaleFactor);
        const y = Math.floor((clientY - rect.top) / this.scaleFactor);

        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return { x, y };
        }
        return null;
    }

    updatePixel(x, y, color) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.matrix[x][y] = color;
            const size = this.scaleFactor;
            
            if (color === 'transparent') {
                this.ctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#e1e1e4';
            } else {
                this.ctx.fillStyle = color;
            }
            this.ctx.fillRect(x * size, y * size, size, size);
        }
    }

    // Algoritmo Flood Fill rápido para el bote de pintura
    fillBucket(startX, startY, targetColor, replacementColor) {
        if (targetColor === replacementColor) return;
        if (this.matrix[startX][startY] !== targetColor) return;

        const queue = [{ x: startX, y: startY }];
        while (queue.length > 0) {
            const { x, y } = queue.shift();

            if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;
            if (this.matrix[x][y] === targetColor) {
                this.updatePixel(x, y, replacementColor);

                queue.push({ x: x + 1, y: y });
                queue.push({ x: x - 1, y: y });
                queue.push({ x: x, y: y + 1 });
                queue.push({ x: x, y: y - 1 });
            }
        }
    }
}

// ROUTING DE SECCIONES (SPA)
function navigateTo(viewName) {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

    const activeView = document.getElementById(`view-${viewName}`);
    if (activeView) activeView.classList.add('active');

    const activeLink = document.querySelector(`.nav-link[data-view="${viewName}"]`);
    if (activeLink) activeLink.classList.add('active');

    AppState.currentView = viewName;
}

// LOGICA MULTI-SHORTCUT (S, M, O)
function executeShortcut(key) {
    const cleanKey = key.toUpperCase();

    // Comprobación de herramientas normales directas
    if (['P', 'E', 'F', 'K', 'Z'].includes(cleanKey)) {
        changeTool(cleanKey);
        return;
    }

    // Comprobación de secuencias encadenadas (S, M, O)
    if (AppState.shortcutGroups[cleanKey]) {
        const timeNow = Date.now();
        const delay = timeNow - AppState.lastClickTime[cleanKey];
        
        if (delay < 700) {
            // Siguiente herramienta del grupo si es rápido
            AppState.groupIndices[cleanKey] = (AppState.groupIndices[cleanKey] + 1) % AppState.shortcutGroups[cleanKey].length;
        } else {
            // Reiniciar índice si se tarda en pulsar
            AppState.groupIndices[cleanKey] = 0;
        }

        AppState.lastClickTime[cleanKey] = timeNow;
        const subToolCode = AppState.shortcutGroups[cleanKey][AppState.groupIndices[cleanKey]];
        changeTool(cleanKey, subToolCode);
    }
}

function changeTool(toolCode, subToolCode = null) {
    AppState.currentTool = subToolCode ? subToolCode : toolCode;
    
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    
    // Activa visualmente el botón base de la barra lateral
    const physicalBtn = document.querySelector(`.tool-btn[data-tool="${toolCode}"]`);
    if (physicalBtn) physicalBtn.classList.add('active');

    // Cambia el panel de estado a la derecha con el nombre completo
    const readableName = AppState.toolNames[AppState.currentTool] || AppState.toolNames[toolCode];
    document.getElementById('status-tool').innerText = readableName;
}

// INICIALIZADOR Y GESTIÓN DE PROYECTOS DEL HOME
function displayProjects() {
    const container = document.getElementById('projects-grid');
    container.innerHTML = '';

    AppState.projects.forEach(p => {
        const card = document.createElement('div');
        card.className = 'project-card glass';
        card.innerHTML = `
            <div class="project-icon">🎨</div>
            <h3>${p.title}</h3>
            <p class="project-meta">${p.width} x ${p.height} px • Fondo: ${p.bg === 'transparent' ? 'Transparente' : 'Sólido'}</p>
        `;
        card.addEventListener('click', () => launchStudio(p));
        container.appendChild(card);
    });
}

function launchStudio(project) {
    navigateTo('studio');
    const canvas = document.getElementById('pixel-canvas');
    AppState.engineInstance = new PixelEngine(canvas, project.width, project.height, project.bg);
    bindCanvasDrawingEvents();
}

// EVENTOS DE MANIPULACIÓN DEL LIENZO
function bindCanvasDrawingEvents() {
    const canvas = document.getElementById('pixel-canvas');

    const triggerAction = (e) => {
        if (!AppState.engineInstance) return;
        const cell = AppState.engineInstance.getCoordinates(e.clientX, e.clientY);
        if (!cell) return;

        // Comportamientos de herramientas reactivas
        if (AppState.currentTool === 'P') {
            AppState.engineInstance.updatePixel(cell.x, cell.y, AppState.currentColor);
        } else if (AppState.currentTool === 'E') {
            AppState.engineInstance.updatePixel(cell.x, cell.y, 'transparent');
        } else if (AppState.currentTool === 'F') {
            const initialColor = AppState.engineInstance.matrix[cell.x][cell.y];
            AppState.engineInstance.fillBucket(cell.x, cell.y, initialColor, AppState.currentColor);
        } else if (AppState.currentTool === 'K') {
            const pickedColor = AppState.engineInstance.matrix[cell.x][cell.y];
            if (pickedColor && pickedColor !== 'transparent') {
                AppState.currentColor = pickedColor;
                document.getElementById('color-input').value = pickedColor;
            }
        }
    };

    canvas.onmousedown = (e) => {
        AppState.isDrawing = true;
        triggerAction(e);
    };

    canvas.onmousemove = (e) => {
        if (AppState.isDrawing) triggerAction(e);
    };

    window.onmouseup = () => {
        AppState.isDrawing = false;
    };
}

// FLUJO DE INTERACCIÓN GENERAL
document.addEventListener('DOMContentLoaded', () => {
    displayProjects();

    // Eventos del Enrutador
    document.querySelectorAll('[data-view]').forEach(trigger => {
        trigger.onclick = (e) => navigateTo(e.target.dataset.view);
    });

    // Control del Modal de Ajuste de Lienzo
    const modal = document.getElementById('new-canvas-modal');
    document.getElementById('btn-open-modal').onclick = () => modal.classList.add('active');
    document.getElementById('btn-close-modal').onclick = () => modal.classList.remove('active');

    document.getElementById('form-create-canvas').onsubmit = (e) => {
        e.preventDefault();
        const title = document.getElementById('input-title').value;
        const width = parseInt(document.getElementById('input-width').value);
        const height = parseInt(document.getElementById('input-height').value);
        const bg = document.getElementById('select-bg').value;

        const customProject = { id: Date.now(), title, width, height, bg };
        AppState.projects.unshift(customProject); // Poner primero en lista
        
        modal.classList.remove('active');
        displayProjects();
        launchStudio(customProject);
    };

    // Escuchador de paleta de colores cromática
    document.getElementById('color-input').oninput = (e) => {
        AppState.currentColor = e.target.value;
    };

    // Click sobre iconos físicos de barra lateral
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.onclick = () => {
            const code = btn.dataset.tool;
            executeShortcut(code);
        };
    });

    // Capturador global de teclado físico (Shortcuts del usuario)
    window.onkeydown = (e) => {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') return;
        executeShortcut(e.key);
    };
});
