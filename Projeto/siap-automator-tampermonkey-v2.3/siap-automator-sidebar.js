(function() {
    'use strict';

    // Certifica-se de que o objeto global SiapAutomator existe
    window.SiapAutomator = window.SiapAutomator || {};

    const SidebarInjector = (() => {
        let sidebarElement = null;
        let isMinimized = false;

        function injectSidebar() {
            if (document.getElementById('siap-automator-sidebar')) {
                console.log('[SIAP Automator] Sidebar já existe na página');
                return;
            }

            const sidebar = document.createElement('div');
            sidebar.id = 'siap-automator-sidebar';
            sidebar.innerHTML = `
                <div class="sidebar-header">
                    <div class="sidebar-title">
                        <span>Planejamento com IA</span>
                    </div>
                    <button id="sidebar-minimize" class="sidebar-btn-minimize" title="Minimizar">−</button>
                </div>

                <div class="sidebar-content">
                    <div class="sidebar-section">
                        <h3>📋 Configuração</h3>
                        <label>
                            <span>Quantidade de aulas:</span>
                            <input type="number" id="sidebar-qtd-aulas" value="2" min="1" max="20">
                        </label>
                        <label>
                            <span>Orientações extras:</span>
                            <textarea id="sidebar-conteudo-extra" placeholder="Tema, observações, recursos..." rows="2"></textarea>
                        </label>
                        <button id="sidebar-btn-config-n8n" class="sidebar-btn sidebar-btn-secondary">⚙️ Configurar n8n</button>
                    </div>

                    <div class="sidebar-section">
                        <h3>🤖 Geração com IA</h3>
                        <button id="sidebar-btn-gerar" class="sidebar-btn sidebar-btn-primary">⚡ Gerar Planejamento</button>
                        <div id="sidebar-preview" class="sidebar-preview" style="display: none;">
                            <p><strong>Planejamento gerado!</strong></p>
                            <div id="sidebar-preview-content"></div>
                        </div>
                    </div>

                    <div class="sidebar-section">
                        <h3>✅ Aplicar</h3>
                        <button id="sidebar-btn-proxima" class="sidebar-btn sidebar-btn-secondary">→ Próxima aula</button>
                        <button id="sidebar-btn-todas" class="sidebar-btn sidebar-btn-secondary">⟳ Aplicar todas</button>
                        <button id="sidebar-btn-reaprov" class="sidebar-btn sidebar-btn-secondary">♻️ Reaproveitar salvas</button>
                        <button id="sidebar-btn-slow-fill" class="sidebar-btn sidebar-btn-secondary">🐢 Preenchimento Lento</button>
                    </div>

                    <div class="sidebar-section">
                        <h3>📊 Status</h3>
                        <div id="sidebar-status" class="sidebar-status">
                            <p>Aguardando ação...</p>
                        </div>
                    </div>

                    <div class="sidebar-footer">
                        <span id="sidebar-version">v2.2.1</span>
                    </div>
                </div>
            `;

            injectSidebarStyles();
            document.body.appendChild(sidebar);
            sidebarElement = sidebar;
            attachSidebarEventListeners();

            console.log('[SIAP Automator] Sidebar injetada com sucesso');
        }

        function injectSidebarStyles() {
            const style = document.createElement('style');
            style.textContent = `
                #siap-automator-sidebar {
                    position: fixed;
                    right: 0;
                    top: 0;
                    width: 360px;
                    height: 100vh;
                    background: white;
                    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    overflow-y: auto;
                    animation: slideIn 0.3s ease-out;
                }

                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }

                #siap-automator-sidebar.minimized {
                    width: 50px;
                }

                #siap-automator-sidebar.minimized .sidebar-content,
                #siap-automator-sidebar.minimized .sidebar-footer {
                    display: none;
                }

                .sidebar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-bottom: 1px solid #eee;
                }

                .sidebar-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 600;
                    font-size: 14px;
                }

                .sidebar-btn-minimize {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 30px;
                    height: 30px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 18px;
                    transition: background 0.2s;
                }

                .sidebar-btn-minimize:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                .sidebar-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 15px;
                }

                .sidebar-section {
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #eee;
                }

                .sidebar-section:last-child {
                    border-bottom: none;
                }

                .sidebar-section h3 {
                    font-size: 13px;
                    color: #667eea;
                    margin-bottom: 10px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .sidebar-section label {
                    display: block;
                    margin-bottom: 10px;
                    font-size: 12px;
                    color: #333;
                }

                .sidebar-section label span {
                    display: block;
                    margin-bottom: 4px;
                    font-weight: 500;
                }

                .sidebar-section input[type="number"],
                .sidebar-section textarea {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 12px;
                    font-family: inherit;
                    transition: border-color 0.2s;
                }

                .sidebar-section input[type="number"]:focus,
                .sidebar-section textarea:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
                }

                .sidebar-btn {
                    width: 100%;
                    padding: 10px;
                    border: none;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-bottom: 8px;
                }

                .sidebar-btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .sidebar-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                }

                .sidebar-btn-primary:active {
                    transform: translateY(0);
                }

                .sidebar-btn-secondary {
                    background: #f0f0f0;
                    color: #333;
                }

                .sidebar-btn-secondary:hover {
                    background: #e0e0e0;
                }

                .sidebar-preview {
                    background: #f9f9f9;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    padding: 10px;
                    margin-top: 10px;
                    font-size: 12px;
                    color: #666;
                    max-height: 150px;
                    overflow-y: auto;
                }

                .sidebar-preview p {
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #333;
                }

                .sidebar-preview-content {
                    font-size: 11px;
                    line-height: 1.4;
                }

                .sidebar-status {
                    background: #f0f7ff;
                    border-left: 3px solid #667eea;
                    padding: 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    color: #333;
                }

                .sidebar-status p {
                    margin: 0;
                }

                .sidebar-footer {
                    padding: 15px;
                    border-top: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 11px;
                    color: #999;
                }

                .sidebar-footer a {
                    color: #667eea;
                    text-decoration: none;
                    font-weight: 600;
                    cursor: pointer;
                }

                .sidebar-footer a:hover {
                    text-decoration: underline;
                }

                /* Scrollbar customizado */
                #siap-automator-sidebar::-webkit-scrollbar {
                    width: 6px;
                }

                #siap-automator-sidebar::-webkit-scrollbar-track {
                    background: transparent;
                }

                #siap-automator-sidebar::-webkit-scrollbar-thumb {
                    background: #ddd;
                    border-radius: 3px;
                }

                #siap-automator-sidebar::-webkit-scrollbar-thumb:hover {
                    background: #bbb;
                }
            `;
            document.head.appendChild(style);
        }

        function attachSidebarEventListeners() {
            document.getElementById('sidebar-minimize').addEventListener('click', () => {
                sidebarElement.classList.toggle('minimized');
                isMinimized = !isMinimized;
            });

            document.getElementById('sidebar-btn-config-n8n').addEventListener('click', () => {
                if (window.SiapAutomator && window.SiapAutomator.openSettingsDialog) {
                    window.SiapAutomator.openSettingsDialog();
                } else {
                    updateStatus('Erro: Script principal não carregado ou função de configuração ausente.', 'error');
                }
            });

            document.getElementById('sidebar-btn-gerar').addEventListener('click', async () => {
                if (!window.SiapAutomator.SiapAPI || !window.SiapAutomator.callN8nWebhook) {
                    updateStatus('Dependências não carregadas. Recarregue a página ou verifique os scripts.', 'error');
                    return;
                }

                const qtd = parseInt(document.getElementById('sidebar-qtd-aulas').value);
                const extra = document.getElementById('sidebar-conteudo-extra').value;
                updateStatus('⏳ Gerando planejamento...', 'loading');

                try {
                    const habilidades = window.SiapAutomator.SiapAPI.getHabilidades();
                    const lessonData = window.SiapAutomator.SiapAPI.getCurrentLessonData();

                    const response = await window.SiapAutomator.callN8nWebhook('planejamento:gerarIA', {
                        quantidadeAulas: qtd,
                        conteudoExtra: extra,
                        habilidades: habilidades,
                        lessonData: lessonData
                    });

                    if (response?.success) {
                        updateStatus('✅ Planejamento gerado!', 'success');
                        showPreview(response.data);
                        window.SiapAutomator.SiapAPI.fillPlanejamento(response.data);
                    } else {
                        updateStatus('❌ Erro: ' + (response?.error || 'Erro desconhecido'), 'error');
                    }
                } catch (error) {
                    updateStatus('❌ Erro: ' + error.message, 'error');
                }
            });

            // TODO: Implementar lógica para 'Próxima aula', 'Aplicar todas', 'Reaproveitar salvas'
            document.getElementById('sidebar-btn-proxima').addEventListener('click', () => {
                updateStatus('Funcionalidade ainda não implementada.', 'info');
            });
            document.getElementById('sidebar-btn-todas').addEventListener('click', () => {
                updateStatus('Funcionalidade ainda não implementada.', 'info');
            });
            document.getElementById('sidebar-btn-reaprov').addEventListener('click', () => {
                updateStatus('Funcionalidade ainda não implementada.', 'info');
            });

            document.getElementById('sidebar-btn-slow-fill').addEventListener('click', async () => {
                if (window.SiapAutomator && window.SiapAutomator.resetarEPreencherComCalma) {
                    updateStatus('🐢 Iniciando preenchimento lento...', 'loading');
                    try {
                        await window.SiapAutomator.resetarEPreencherComCalma();
                        updateStatus('✅ Preenchimento lento concluído!', 'success');
                    } catch (error) {
                        updateStatus(`❌ Erro no preenchimento lento: ${error.message}`, 'error');
                    }
                } else {
                    updateStatus('Erro: Função de preenchimento lento não carregada.', 'error');
                }
            });
        }

        function updateStatus(message, type = 'info') {
            const statusEl = document.getElementById('sidebar-status');
            if (statusEl) {
                statusEl.innerHTML = `<p>${message}</p>`;
                statusEl.className = `sidebar-status sidebar-status-${type}`;
            }
        }

        function showPreview(data) {
            const previewEl = document.getElementById('sidebar-preview');
            const previewContentEl = document.getElementById('sidebar-preview-content');
            if (previewEl && previewContentEl) {
                previewContentEl.innerHTML = `
                    <strong>Habilidades:</strong> ${data.habilidades ? data.habilidades.join(', ') : 'N/A'}<br>
                    <strong>Objetivos:</strong> ${data.objetivos || 'N/A'}<br>
                    <strong>Metodologia:</strong> ${data.metodologias || 'N/A'}<br>
                    <strong>Avaliação:</strong> ${data.avaliacao || 'N/A'}<br>
                    <strong>Recursos:</strong> ${data.recursos || 'N/A'}
                `;
                previewEl.style.display = 'block';
            }
        }

        // Expor a função de injeção para o script principal
        window.SiapAutomator.injectSidebar = injectSidebar;
        window.SiapAutomator.updateSidebarStatus = updateStatus;

    })();

})();
