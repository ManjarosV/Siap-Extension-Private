// ==UserScript==
// @name         SIAP UI Companion
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Adiciona minimizar, badge de plano e indicador online ao SIAP Automator.
// @match        https://siap.educacao.go.gov.br/*
// @match        https://*.siap.com.br/*
// @match        https://*.siapnet.com.br/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      pc-do-gon.tailaa9b6a.ts.net
// @connect      *
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // Aguarda o sidebar do automator principal aparecer antes de agir
    function waitForSidebar(callback, tries) {
        tries = tries || 0;
        var sidebar = document.getElementById('siap-sidebar');
        if (sidebar) {
            callback(sidebar);
        } else if (tries < 40) {
            setTimeout(function() { waitForSidebar(callback, tries + 1); }, 300);
        }
    }

    function getWebhookUrl() {
        var stored = GM_getValue('siap_automator_settings', null);
        if (stored && stored.webhookUrl) return stored.webhookUrl;
        return 'https://pc-do-gon.tailaa9b6a.ts.net/webhook/siap-automator';
    }

    function getToken() {
        var stored = GM_getValue('siap_automator_settings', null);
        if (stored && stored.authToken) return stored.authToken;
        return '';
    }

    function detectPlan(token) {
        var t = (token || '').toLowerCase();
        if (t.indexOf('admin') === 0)  return { label: 'Admin',  bg: '#7c3aed' };
        if (t.indexOf('basico') === 0) return { label: 'Basico', bg: '#059669' };
        return { label: 'Padrao', bg: '#475569' };
    }

    function pingOnline(dot) {
        var url = getWebhookUrl();
        // Tenta a raiz do servidor para checar conectividade
        var pingUrl = url.split('/webhook')[0] + '/favicon.ico';
        GM_xmlhttpRequest({
            method: 'GET',
            url: pingUrl,
            timeout: 5000,
            onload: function() {
                dot.style.background = '#10b981';
                dot.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.3)';
                dot.title = 'Online';
            },
            onerror: function() {
                dot.style.background = '#ef4444';
                dot.style.boxShadow = 'none';
                dot.title = 'Offline';
            },
            ontimeout: function() {
                dot.style.background = '#f59e0b';
                dot.style.boxShadow = 'none';
                dot.title = 'Timeout';
            }
        });
    }

    function buildUI(sidebar) {
        // Encontra o header existente
        var header = sidebar.querySelector('.siap-header');
        if (!header) return;

        var token = getToken();
        var plan  = detectPlan(token);
        var isMinimized = GM_getValue('siap_ui_minimized', false);

        // ── Bloco de info (title + badge + dot) ──────────────────────────────
        // Pega o span de titulo existente e ajusta
        var titleSpan = header.querySelector('span');
        if (titleSpan) {
            titleSpan.style.cssText = 'font-size:12px;font-weight:700;color:#fff;white-space:nowrap';
        }

        // Badge de plano
        var badge = document.createElement('span');
        badge.textContent = plan.label;
        badge.style.cssText = [
            'font-size:9px', 'font-weight:700', 'padding:2px 8px',
            'border-radius:20px', 'text-transform:uppercase', 'letter-spacing:0.5px',
            'color:#fff', 'background:' + plan.bg,
            'margin-left:8px', 'vertical-align:middle', 'white-space:nowrap'
        ].join(';');

        // Ponto online
        var dot = document.createElement('span');
        dot.id = 'siap-online-dot';
        dot.title = 'Verificando...';
        dot.style.cssText = [
            'width:9px', 'height:9px', 'border-radius:50%',
            'background:#ef4444', 'display:inline-block',
            'margin-left:8px', 'vertical-align:middle',
            'flex-shrink:0', 'transition:background 0.4s'
        ].join(';');

        // Insere badge e dot após o titulo
        if (titleSpan) {
            titleSpan.after(badge);
            badge.after(dot);
        } else {
            header.appendChild(badge);
            header.appendChild(dot);
        }

        // ── Botão minimizar ───────────────────────────────────────────────────
        var btnMin = document.createElement('button');
        btnMin.id = 'siap-ui-minimize';
        btnMin.title = isMinimized ? 'Expandir' : 'Minimizar';
        btnMin.innerHTML = isMinimized ? '&#9654;' : '&#9664;';
        btnMin.style.cssText = [
            'background:transparent', 'border:none',
            'color:rgba(255,255,255,0.85)', 'cursor:pointer',
            'font-size:14px', 'padding:2px 5px', 'line-height:1',
            'margin-left:4px', 'flex-shrink:0'
        ].join(';');

        // Insere o botão de minimizar antes do botão de config existente
        var btnConfig = header.querySelector('#siap-config');
        if (btnConfig) {
            header.insertBefore(btnMin, btnConfig);
        } else {
            header.appendChild(btnMin);
        }

        // Aplica estado inicial
        var content = sidebar.querySelector('.siap-content');
        if (isMinimized && content) {
            sidebar.style.width = '42px';
            sidebar.style.overflow = 'hidden';
            content.style.display = 'none';
            badge.style.display = 'none';
            dot.style.display = 'none';
            if (btnConfig) btnConfig.style.display = 'none';
            if (titleSpan) titleSpan.style.display = 'none';
        }

        // Toggle minimizar
        btnMin.addEventListener('click', function() {
            var minimized = sidebar.style.width === '42px';
            if (minimized) {
                sidebar.style.width = '320px';
                if (content) content.style.display = '';
                badge.style.display = '';
                dot.style.display = 'inline-block';
                if (btnConfig) btnConfig.style.display = '';
                if (titleSpan) titleSpan.style.display = '';
                btnMin.innerHTML = '&#9664;';
                btnMin.title = 'Minimizar';
                GM_setValue('siap_ui_minimized', false);
            } else {
                sidebar.style.width = '42px';
                if (content) content.style.display = 'none';
                badge.style.display = 'none';
                dot.style.display = 'none';
                if (btnConfig) btnConfig.style.display = 'none';
                if (titleSpan) titleSpan.style.display = 'none';
                btnMin.innerHTML = '&#9654;';
                btnMin.title = 'Expandir';
                GM_setValue('siap_ui_minimized', true);
            }
        });

        // Transição suave na sidebar
        sidebar.style.transition = 'width 0.25s ease';
        sidebar.style.overflow = 'hidden';

        // ── Ping online ───────────────────────────────────────────────────────
        pingOnline(dot);
        setInterval(function() { pingOnline(dot); }, 30000);
    }

    waitForSidebar(function(sidebar) {
        buildUI(sidebar);
    });

})();
