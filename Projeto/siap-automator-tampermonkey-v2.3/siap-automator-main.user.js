// ==UserScript==
// @name         SIAP Automator - Main Controller
// @namespace    http://tampermonkey.net/
// @version      2.2.1
// @description  Controlador principal para o SIAP Automator, gerencia configurações e orquestra módulos.
// @author       Manus AI
// @match        https://*.siap.com.br/*
// @match        https://*.siapnet.com.br/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// @require      file:///home/ubuntu/siap-automator-automation.js
// @require      file:///home/ubuntu/siap-automator-sidebar.js
// @require      file:///home/ubuntu/siap-automator-slow-fill.js
// ==/UserScript==

(function() {
    'use strict';

    // Garante que o objeto global SiapAutomator existe para comunicação entre scripts
    window.SiapAutomator = window.SiapAutomator || {};

    // --- Configurações Iniciais (via GM_setValue/GM_getValue) ---
    const SETTINGS_KEY = 'siapAutomatorSettings';
    let settings = GM_getValue(SETTINGS_KEY, {
        n8nWebhookUrl: '',
        selectors: {
            metodologia: '#cphFuncionalidade_cphCampos_txtMetodologia',
            avaliacao: '#cphFuncionalidade_cphCampos_txtAvaliacao',
            habilidades: '#cphFuncionalidade_cphCampos_txtHabilidades',
            objetivos: '#cphFuncionalidade_cphCampos_txtObjetivos',
            recursos: '#cphFuncionalidade_cphCampos_txtRecursos',
            diarioConteudo: '#cphFuncionalidade_cphCampos_txtConteudo',
            // Adicione outros seletores aqui conforme necessário
        }
    });

    function saveSettings() {
        GM_setValue(SETTINGS_KEY, settings);
        // Notificar outros scripts ou a sidebar sobre a mudança de configurações
        if (window.SiapAutomator.Sidebar && window.SiapAutomator.Sidebar.updateStatus) {
            window.SiapAutomator.Sidebar.updateStatus('Configurações salvas!', 'success');
        }
    }

    function openSettingsDialog() {
        let newWebhookUrl = prompt('Insira a URL do Webhook do n8n:', settings.n8nWebhookUrl);
        if (newWebhookUrl !== null) {
            settings.n8nWebhookUrl = newWebhookUrl;
            saveSettings();
            alert('URL do Webhook atualizada para: ' + settings.n8nWebhookUrl);
        }
        // Poderíamos expandir para permitir editar seletores aqui também com um modal mais complexo
    }

    // Registra o comando no menu do Tampermonkey
    GM_registerMenuCommand('Configurar SIAP Automator', openSettingsDialog);

    // Expõe as configurações e funções de gerenciamento para outros scripts
    window.SiapAutomator.getSettings = () => settings;
    window.SiapAutomator.updateSettings = (newSettings) => {
        settings = { ...settings, ...newSettings };
        saveSettings();
    };
    window.SiapAutomator.openSettingsDialog = openSettingsDialog; // Para ser chamado pela sidebar

    // Injeta a sidebar quando o DOM estiver pronto
    document.addEventListener("DOMContentLoaded", () => {
        if (window.SiapAutomator.injectSidebar) {
            window.SiapAutomator.injectSidebar();
        }
    });

})();
