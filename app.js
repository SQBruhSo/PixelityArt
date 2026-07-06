// Data simulada del sistema (Simula una base de datos/API)
const APP_DATA = {
    dashboard: {
        title: "Panel General",
        content: `
            <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                <div class="card" style="border: 2px solid var(--border-color); padding: 20px;">
                    <h3>Usuarios Activos</h3>
                    <p style="font-size: 24px; color: var(--accent); font-weight: bold; margin-top: 10px;">1,240</p>
                </div>
                <div class="card" style="border: 2px solid var(--border-color); padding: 20px;">
                    <h3>Rendimiento</h3>
                    <p style="font-size: 24px; color: #48cfad; font-weight: bold; margin-top: 10px;">98.4%</p>
                </div>
            </div>
        `
    },
    analytics: {
        title: "Métricas Avanzadas",
        content: `
            <div class="card" style="border: 2px solid var(--border-color); padding: 20px;">
                <h3>Reporte de Operaciones</h3>
                <table style="width: 100%; margin-top: 15px; border-collapse: collapse; text-align: left;">
                    <tr style="border-bottom: 2px solid var(--border-color); color: var(--text-muted);">
                        <th style="padding: 8px;">ID</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                    </tr>
                    <tr>
                        <td style="padding: 8px;">#0024</td>
                        <td style="color: #48cfad;">EXITOSO</td>
                        <td>06/07/2026</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;">#0023</td>
                        <td style="color: #f6bb42;">PENDIENTE</td>
                        <td>05/07/2026</td>
                    </tr>
                </table>
            </div>
        `
    },
    settings: {
        title: "Configuración del Sistema",
        content: `
            <div class="card" style="border: 2px solid var(--border-color); padding: 20px; display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px;">Nombre del Nodo</label>
                    <input type="text" value="Pixel_Server_01" style="background: var(--bg-primary); border: 2px solid var(--border-color); color: white; padding: 8px; width: 100%;">
                </div>
                <button style="background: var(--accent); border: none; color: white; padding: 10px; cursor: pointer; font-weight: bold;">GUARDAR CAMBIOS</button>
            </div>
        `
    }
};

// Clase Controladora de la Aplicación
class PixelApp {
    constructor() {
        this.navItems = document.querySelectorAll('.nav-item');
        this.viewContainer = document.getElementById('view-container');
        this.pageTitle = document.getElementById('page-title');
        
        this.init();
    }

    init() {
        // Añadir manejadores de eventos a la navegación
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.currentTarget.getAttribute('data-target');
                this.navigateTo(target);
                
                // Actualizar clase activa visual
                this.navItems.forEach(i => i.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // Cargar vista inicial por defecto
        this.navigateTo('dashboard');
    }

    navigateTo(viewKey) {
        const view = APP_DATA[viewKey];
        if (view) {
            this.pageTitle.textContent = view.title;
            this.viewContainer.innerHTML = view.content;
        } else {
            this.viewContainer.innerHTML = `<p>Error 404: Vista no encontrada.</p>`;
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.App = new PixelApp();
});
