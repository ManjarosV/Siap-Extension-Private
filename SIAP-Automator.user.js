// ==UserScript==
// @name         SIAP Automator - V12.0 (Two-Step Logic)
// @namespace    http://tampermonkey.net/
// @version      12.0.0
// @description  Dois passos: seleciona itens e depois gera texto coeso com a habilidade.
// @updateURL    https://vercel.app
// @downloadURL  https://vercel.app
// @match        https://siap.educacao.go.gov.br/*
// @match        https://*.siap.com.br/*
// @match        https://*.siapnet.com.br/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      pc-do-gon.tailaa9b6a.ts.net
// @connect      localhost
// @connect      127.0.0.1
// @connect      *
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    if (window.SiapAutomatorV12 && window.SiapAutomatorV12.isInitialized) return;
    window.SiapAutomatorV12 = { isInitialized: true, settings: null };

    // ── Estilos ───────────────────────────────────────────────────────────────
    GM_addStyle([
        ':root { --siap-bg:#121218; --siap-card:#1e1e26; --siap-success:#10b981; --siap-error:#ef4444; --siap-text:#f3f4f6; --siap-text-dim:#9ca3af; --siap-border:#334155; }',
        '#siap-sidebar { position:fixed; top:0; right:0; width:320px; height:100vh; background:var(--siap-bg) !important; color:var(--siap-text) !important; z-index:100000; display:flex; flex-direction:column; font-family:"Inter","Segoe UI",sans-serif !important; box-shadow:-10px 0 30px rgba(0,0,0,0.5); border-left:1px solid var(--siap-border) !important; }',
        '.siap-header { background:linear-gradient(135deg,#1e3a8a,#1e40af); padding:16px 20px; font-weight:bold; display:flex; justify-content:space-between; align-items:center; flex-shrink:0; }',
        '.siap-content { padding:20px; flex:1; display:flex; flex-direction:column; gap:12px; overflow-y:auto; }',
        '.siap-label { font-size:11px; font-weight:600; color:var(--siap-text-dim); text-transform:uppercase; margin-bottom:2px; }',
        '.siap-input, .siap-textarea { width:100% !important; padding:10px !important; background:var(--siap-card) !important; color:var(--siap-text) !important; border:1px solid var(--siap-border) !important; border-radius:8px !important; font-size:13px !important; box-sizing:border-box !important; }',
        '.siap-btn-group { display:flex; gap:10px; margin-top:5px; }',
        '.siap-btn { flex:1; padding:12px; border:none !important; border-radius:8px !important; cursor:pointer; font-weight:bold; font-size:13px; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.2s; color:white !important; }',
        '#siap-start { background:var(--siap-success) !important; }',
        '#siap-stop { background:var(--siap-error) !important; }',
        '#siap-config { background:transparent !important; border:none !important; color:white !important; cursor:pointer; font-size:18px; }',
        '#siap-log-output { background:#09090b !important; padding:12px !important; flex:1; overflow-y:auto; font-family:"Consolas",monospace !important; font-size:10px !important; border-radius:8px !important; border:1px solid var(--siap-border) !important; }',
        '#siap-log-output p { margin:2px 0; border-bottom:1px solid rgba(255,255,255,0.02); }',
        '.siap-badge { display:inline-block; background:#3b82f6; color:white; border-radius:4px; padding:1px 6px; font-size:9px; font-weight:bold; margin-right:4px; }'
    ].join('\n'));

    // ── Estado ────────────────────────────────────────────────────────────────
    var SETTINGS_KEY = 'siap_automator_settings';
    var settings = GM_getValue(SETTINGS_KEY, {
        webhookUrl: 'https://pc-do-gon.tailaa9b6a.ts.net/webhook/siap-automator',
        authToken: ''
    });
    // Compartilha token via localStorage para o script companheiro ler
    try { localStorage.setItem('siap_token', settings.authToken); } catch(_) {}

    var STORAGE_KEY = 'siap_automator_state';
    var stopRequested = false;
    var isRunning = false;

    function saveState(data) {
        var existing = GM_getValue(STORAGE_KEY, {});
        var merged = {};
        for (var k in existing) merged[k] = existing[k];
        for (var k in data) merged[k] = data[k];
        merged.lastUpdate = Date.now();
        GM_setValue(STORAGE_KEY, merged);
    }
    function loadState() { return GM_getValue(STORAGE_KEY, {}); }
    function clearState() { GM_setValue(STORAGE_KEY, {}); }

    // ── Log ───────────────────────────────────────────────────────────────────
    function logToSidebar(msg, type, step) {
        type = type || 'info';
        var el = document.getElementById('siap-log-output');
        if (!el) return;
        var p = document.createElement('p');
        var colors = { error: '#ff8888', warn: '#ffaa00', success: '#00ff88', info: '#00ccff' };
        p.style.color = colors[type] || colors.info;
        var badge = step ? '<span class="siap-badge">P' + step + '</span>' : '';
        p.innerHTML = '[' + new Date().toLocaleTimeString() + '] ' + badge + msg;
        el.appendChild(p);
        el.scrollTop = el.scrollHeight;
    }

    // Trata erros de forma centralizada — erros de auth recebem destaque visual
    function handleErr(etapa, err) {
        isRunning = false;
        var btnStart = document.getElementById('siap-start');
        var btnStop  = document.getElementById('siap-stop');
        if (btnStart) btnStart.disabled = false;
        if (btnStop)  btnStop.disabled  = true;

        var msg = err.message || String(err);
        var isAuth = msg.indexOf('__AUTH__') === 0;

        if (isAuth) {
            var textoAuth = msg.replace('__AUTH__', '');
            // Linha em destaque vermelho mais vivo no log
            logToSidebar('', 'error');
            logToSidebar('*** ' + textoAuth + ' ***', 'error');
            logToSidebar('', 'error');
            // Caixa de alerta flutuante acima do log
            var log = document.getElementById('siap-log-output');
            if (log) {
                var alerta = document.createElement('div');
                alerta.style.cssText = 'background:#7f1d1d;border:2px solid #ef4444;color:#fecaca;padding:10px 14px;border-radius:6px;font-size:11px;margin-bottom:8px;font-weight:600;line-height:1.5;position:relative';
                alerta.innerHTML = '<span style="font-size:14px">&#128274;</span> ' + textoAuth
                    + '<span onclick="this.parentNode.remove()" style="position:absolute;top:6px;right:8px;cursor:pointer;opacity:0.7;font-size:14px">&times;</span>';
                log.parentNode.insertBefore(alerta, log);
            }
        } else {
            logToSidebar('Erro ' + etapa + ': ' + msg, 'error');
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    function wait(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

    function fireEvent(target, eventName) {
        try { target.dispatchEvent(new MouseEvent(eventName, { bubbles: true, cancelable: true })); } catch (_) {}
    }

    function robustClick(el) {
        if (stopRequested) return Promise.resolve();
        var target = el.querySelector('input') || (el.tagName === 'INPUT' ? el : null);
        if (!target && el.parentElement) target = el.parentElement.querySelector('input');
        var finalTarget = target || el;
        finalTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
        var oldOutline = finalTarget.style.outline;
        finalTarget.style.outline = '4px solid #a855f7';
        return wait(600).then(function() {
            ['mousedown', 'mouseup', 'click'].forEach(function(name) { fireEvent(finalTarget, name); });
            if (finalTarget.tagName === 'INPUT') {
                finalTarget.checked = true;
                finalTarget.dispatchEvent(new Event('change', { bubbles: true }));
            }
            return wait(400);
        }).then(function() { finalTarget.style.outline = oldOutline; });
    }

    function typeIntoTextarea(el, text) {
        if (stopRequested) return Promise.resolve();
        el.focus();
        return wait(400).then(function() {
            var desc = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
            var nativeSetter = desc && desc.set;
            if (nativeSetter) nativeSetter.call(el, text); else el.value = text;
            ['input', 'change', 'blur'].forEach(function(name) { el.dispatchEvent(new Event(name, { bubbles: true })); });
        });
    }

    function normalizeText(text) { return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

    // ── Mapa de textareas ─────────────────────────────────────────────────────
    function detectSecao(text) {
        var t = text.toLowerCase();
        if (t.indexOf('metodologia') !== -1) return 'metodologias';
        if (t.indexOf('avalia') !== -1) return 'avaliacoes';
        return null;
    }

    function getSectionHeaders() {
        var tags = ['div','td','th','span','label','b','strong','h2','h3','h4','legend'];
        var els = [];
        tags.forEach(function(tag) {
            Array.from(document.querySelectorAll(tag)).forEach(function(el) {
                var t = el.textContent.trim();
                var sec = detectSecao(t);
                if (t.length > 3 && t.length < 80 && sec && el.offsetParent !== null)
                    els.push({ el: el, secao: sec, y: el.getBoundingClientRect().top + window.scrollY });
            });
        });
        return els.sort(function(a, b) { return a.y - b.y; });
    }

    function buildTextareaMap() {
        var headers = getSectionHeaders();
        var textareas = Array.from(document.querySelectorAll('textarea'))
            .filter(function(ta) { return ta.offsetParent !== null; })
            .map(function(ta) { return { el: ta, y: ta.getBoundingClientRect().top + window.scrollY }; })
            .sort(function(a, b) { return a.y - b.y; });
        var map = {};
        textareas.forEach(function(ta) {
            var closest = null;
            headers.forEach(function(h) { if (h.y < ta.y) closest = h; });
            if (closest && !map[closest.secao]) map[closest.secao] = ta.el;
        });
        return map;
    }

    // ── Coleta de itens ───────────────────────────────────────────────────────
    function getItemsFromDoc(doc) {
        var items = [];
        Array.from(doc.querySelectorAll('div[id*="Nodes"]')).forEach(function(container) {
            Array.from(container.querySelectorAll('span, label, a')).forEach(function(el) {
                var text = el.textContent.trim();
                if (text.length > 5) items.push({ text: text, el: el });
            });
        });
        return items;
    }

    function collectItems() {
        logToSidebar('Buscando itens na pagina...', 'info');
        return wait(2000).then(function() {
            var all = getItemsFromDoc(document);
            document.querySelectorAll('iframe').forEach(function(iframe) {
                try { var fd = iframe.contentDocument || iframe.contentWindow.document; all = all.concat(getItemsFromDoc(fd)); } catch (_) {}
            });
            var seen = new Set();
            all = all.filter(function(it) { if (seen.has(it.text)) return false; seen.add(it.text); return true; });
            all.forEach(function(it) { it.el.style.outline = '1px solid rgba(59,130,246,0.3)'; });
            logToSidebar(all.length + ' itens encontrados.', 'success');
            return all;
        });
    }

    // ── Webhook ───────────────────────────────────────────────────────────────
    function callWebhook(data) {
        return new Promise(function(resolve, reject) {
            GM_xmlhttpRequest({
                method: 'POST', url: settings.webhookUrl, data: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + settings.authToken },
                onload: function(res) {
                    var status = Number(res.status);
                    var parsed = null;
                    try { parsed = JSON.parse(res.responseText); } catch(_) {}

                    // Detecta 401/403 tanto pelo status HTTP quanto pelo corpo da resposta
                    var ehNaoAutorizado = (status === 401 || status === 403)
                        || (parsed && parsed.error && (
                            parsed.error.indexOf('autorizado') !== -1 ||
                            parsed.error.indexOf('uthorized') !== -1
                        ));

                    if (ehNaoAutorizado) {
                        var motivo = (parsed && parsed.motivo) ? parsed.motivo : '';
                        var msg = motivo === 'Token ausente'
                            ? 'TOKEN AUSENTE — configure seu token no icone de engrenagem.'
                            : 'TOKEN INVALIDO: "' + settings.authToken + '" nao foi reconhecido. Abra as definicoes (engrenagem) e corrija.';
                        reject(new Error('__AUTH__' + msg));
                        return;
                    }
                    if (status === 0 || status >= 500) {
                        reject(new Error('Servidor indisponivel (HTTP ' + status + '). Tente novamente.'));
                        return;
                    }
                    if (!parsed) { reject(new Error('Resposta invalida do webhook')); return; }
                    resolve(parsed);
                },
                onerror: function() { reject(new Error('Sem conexao com o servidor. Verifique se o Tailscale esta ativo.')); },
                ontimeout: function() { reject(new Error('O servidor demorou demais para responder (timeout).')); }
            });
        });
    }

    // Tenta extrair um objeto JSON de dentro de um texto livre (ex: markdown do modelo)
    function extrairJson(texto) {
        if (!texto || typeof texto !== 'string') return null;
        // Remove blocos de markdown ```json ... ``` ou ``` ... ```
        var limpo = texto.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
        // Localiza o primeiro { e o ultimo } para isolar o objeto
        var ini = limpo.indexOf('{');
        var fim = limpo.lastIndexOf('}');
        if (ini === -1 || fim === -1 || fim <= ini) return null;
        try { return JSON.parse(limpo.substring(ini, fim + 1)); } catch (e) { return null; }
    }

    // ── Automacao principal ───────────────────────────────────────────────────
    function runAutomation(isAutoStart) {
        if (isRunning) return;
        stopRequested = false;
        isRunning = true;

        var btnStart = document.getElementById('siap-start');
        var btnStop  = document.getElementById('siap-stop');
        var contextInput = (document.getElementById('siap-context').value || '').trim() || 'Aleatorio';
        var qtdTotal = parseInt(document.getElementById('siap-qtd').value) || 1;

        var saved = loadState();
        if (isAutoStart && saved.totalAulas) { qtdTotal = saved.totalAulas; document.getElementById('siap-qtd').value = qtdTotal; }

        var aulaAtual = saved.currentAula || 1;
        if (aulaAtual > qtdTotal) {
            logToSidebar('Todas as aulas concluidas!', 'success');
            isRunning = false; btnStart.disabled = false; btnStop.disabled = true; clearState(); return;
        }

        btnStart.disabled = true; btnStop.disabled = false;
        logToSidebar('Iniciando aula ' + aulaAtual + ' de ' + qtdTotal, 'info');

        var blacklist = ['aula','avalia','projet','grup','tecnolog','debate','estudo','seminar','pesquis','contac','ludic','roda','convers','brinc','jog','teatr','pati'];

        function processarAula(aula) {
            if (aula > qtdTotal || stopRequested) {
                logToSidebar('Finalizado.', 'success');
                isRunning = false; btnStart.disabled = false; btnStop.disabled = true; return;
            }

            collectItems().then(function(items) {
                if (stopRequested) { isRunning = false; btnStart.disabled = false; btnStop.disabled = true; return; }
                if (items.length === 0) { logToSidebar('Nenhum item encontrado.', 'error'); isRunning = false; btnStart.disabled = false; btnStop.disabled = true; return; }

                var taMap = buildTextareaMap();
                var habs = items.filter(function(it) { return it.text.indexOf('(') !== -1; });
                var objs = items.filter(function(it) {
                    if (it.text.indexOf('(') !== -1) return false;
                    var norm = normalizeText(it.text);
                    return !blacklist.some(function(r) { return norm.indexOf(r) !== -1; });
                });

                logToSidebar('Habilidades: ' + habs.length + ' | Conteudos: ' + objs.length, 'info');
                if (habs.length === 0 || objs.length < 2) { logToSidebar('Itens insuficientes.', 'error'); isRunning = false; btnStart.disabled = false; btnStop.disabled = true; return; }

                // PASSO 1: Selecionar indices
                logToSidebar('Solicitando selecao de itens...', 'info', 1);
                var seed = Math.floor(Math.random() * 999999);
                var listaHabs = habs.map(function(it, idx) { return 'H' + idx + ': ' + it.text; }).join('\n');
                var listaObjs = objs.map(function(it, idx) { return 'C' + idx + ': ' + it.text; }).join('\n');

                var prompt1 = '[SEED:' + seed + '] Use este seed para variar sua escolha a cada chamada.\n\n'
                    + 'Voce e um professor especialista. Cada aula deve ser DIFERENTE das anteriores.\n\n'
                    + 'HABILIDADES (escolha EXATAMENTE 1 - varie a escolha, nao repita sempre a mesma):\n' + listaHabs + '\n\n'
                    + 'CONTEUDOS (escolha EXATAMENTE 2 diferentes - varie a combinacao a cada aula):\n' + listaObjs + '\n\n'
                    + 'Contexto: ' + contextInput + '\n\n'
                    + 'Responda APENAS em JSON valido:\n{ "hab_idx": <numero>, "obj_indices": [<numero>, <numero>] }';

                callWebhook({ prompt: prompt1 }).then(function(selecao) {
                    if (stopRequested) { isRunning = false; btnStart.disabled = false; btnStop.disabled = true; return; }
                    if (selecao.hab_idx === undefined || !Array.isArray(selecao.obj_indices) || selecao.obj_indices.length < 2) {
                        logToSidebar('Selecao invalida da IA.', 'error'); isRunning = false; btnStart.disabled = false; btnStop.disabled = true; return;
                    }

                    var habSelecionada = habs[selecao.hab_idx];
                    var objSelecionados = selecao.obj_indices.map(function(i) { return objs[i]; }).filter(Boolean);
                    if (!habSelecionada || objSelecionados.length < 2) {
                        logToSidebar('Indices fora do intervalo.', 'error'); isRunning = false; btnStart.disabled = false; btnStop.disabled = true; return;
                    }

                    logToSidebar('Habilidade: ' + habSelecionada.text.substring(0, 50), 'warn', 1);
                    objSelecionados.forEach(function(o) { logToSidebar('Conteudo: ' + o.text.substring(0, 50), 'warn', 1); });

                    // PASSO 2: Gerar texto coeso
                    logToSidebar('Gerando metodologia e avaliacao...', 'info', 2);

                    var abordagens = [
                        'atividade pratica em grupos pequenos com material concreto',
                        'resolucao de problemas reais do cotidiano dos alunos',
                        'jogo educativo ou dinamica ludica',
                        'debate e discussao orientada com perguntas provocadoras',
                        'producao textual ou registro individual dos alunos',
                        'uso de imagens, mapas ou infograficos como ponto de partida',
                        'experimentacao ou manipulacao de objetos concretos',
                        'sequencia de exercicios progressivos (do simples ao complexo)',
                        'estudo de caso com situacao-problema contextualizada',
                        'atividade de investigacao guiada com perguntas e hipoteses'
                    ];
                    var abordagemEscolhida = abordagens[seed % abordagens.length];
                    logToSidebar('Abordagem: ' + abordagemEscolhida, 'info', 2);

                    var prompt2 = '[SEED:' + seed + ']\n\n'
                        + 'Voce e uma professora especialista criando um plano de aula UNICO e ORIGINAL.\n\n'
                        + 'HABILIDADE que sera trabalhada:\n"' + habSelecionada.text + '"\n\n'
                        + 'CONTEUDOS que serao abordados:\n- "' + objSelecionados[0].text + '"\n- "' + objSelecionados[1].text + '"\n\n'
                        + 'Contexto da turma: ' + contextInput + '\n\n'
                        + 'ABORDAGEM OBRIGATORIA para esta aula: ' + abordagemEscolhida + '\n'
                        + '(Use esta abordagem como estrategia central da metodologia. Nao use outra.)\n\n'
                        + 'Com base NA HABILIDADE e NA ABORDAGEM acima, escreva:\n'
                        + '1. METODOLOGIA (3 a 5 frases): descreva a aula usando A ABORDAGEM INDICADA para ensinar '
                        + 'a habilidade "' + habSelecionada.text.substring(0, 60) + '". '
                        + 'Seja especifico: o que o professor faz, o que os alunos fazem, qual recurso e usado.\n'
                        + '2. AVALIACAO (2 a 3 frases): descreva como verificar se os alunos desenvolveram a habilidade, '
                        + 'de forma coerente com a abordagem usada.\n\n'
                        + 'Responda APENAS em JSON valido:\n{ "metodologia": "<texto>", "avaliacao": "<texto>" }';

                    callWebhook({ prompt: prompt2 }).then(function(textos) {
                        if (stopRequested) { isRunning = false; btnStart.disabled = false; btnStop.disabled = true; return; }

                        // Fallback: workflow nao conseguiu fazer JSON.parse (modelo devolveu markdown ou texto livre)
                        if ((!textos.metodologia || !textos.avaliacao) && textos.raw) {
                            logToSidebar('Resposta bruta do modelo, tentando extrair JSON...', 'warn', 2);
                            var extraido = extrairJson(textos.raw);
                            if (extraido && extraido.metodologia && extraido.avaliacao) {
                                textos = extraido;
                            }
                        }

                        if (!textos.metodologia || !textos.avaliacao) {
                            var detalhe = textos.error ? (' (' + textos.error + ')') : '';
                            logToSidebar('Textos invalidos da IA.' + detalhe, 'error');
                            isRunning = false; btnStart.disabled = false; btnStop.disabled = true; return;
                        }

                        logToSidebar('Metodologia gerada (' + textos.metodologia.length + ' chars)', 'success', 2);
                        logToSidebar('Avaliacao gerada (' + textos.avaliacao.length + ' chars)', 'success', 2);

                        // PASSO 3: Preencher formulario
                        logToSidebar('Preenchendo formulario...', 'info', 3);

                        robustClick(habSelecionada.el).then(function() {
                            return wait(1200);
                        }).then(function() {
                            return objSelecionados.reduce(function(chain, obj) {
                                return chain.then(function() {
                                    if (stopRequested) return;
                                    return robustClick(obj.el).then(function() { return wait(1200); });
                                });
                            }, Promise.resolve());
                        }).then(function() {
                            if (stopRequested) { isRunning = false; btnStart.disabled = false; btnStop.disabled = true; return; }
                            var p = Promise.resolve();
                            if (taMap['metodologias'] && textos.metodologia)
                                p = p.then(function() { return typeIntoTextarea(taMap['metodologias'], textos.metodologia); }).then(function() { return wait(600); });
                            if (taMap['avaliacoes'] && textos.avaliacao)
                                p = p.then(function() { return typeIntoTextarea(taMap['avaliacoes'], textos.avaliacao); }).then(function() { return wait(600); });
                            return p;
                        }).then(function() {
                            if (stopRequested) { isRunning = false; btnStart.disabled = false; btnStop.disabled = true; return; }
                            logToSidebar('Aguardando para salvar...', 'warn');
                            return wait(4000);
                        }).then(function() {
                            if (stopRequested) { isRunning = false; btnStart.disabled = false; btnStop.disabled = true; return; }
                            if (aula < qtdTotal) saveState({ currentAula: aula + 1, context: contextInput, totalAulas: qtdTotal, isAutoStart: true });
                            else clearState();

                            var botoes = Array.from(document.querySelectorAll('input[type="submit"], button'));
                            var btnSalvar = null;
                            for (var i = 0; i < botoes.length; i++) {
                                var b = botoes[i];
                                if (b.id && b.id.indexOf('SalvarProximo') !== -1) { btnSalvar = b; break; }
                                if (b.value && (b.value.indexOf('Salvar') !== -1 || b.value.indexOf('Pr') !== -1)) { btnSalvar = b; break; }
                            }
                            if (btnSalvar && !stopRequested) { logToSidebar('Salvando...', 'success', 3); return robustClick(btnSalvar); }
                            else { logToSidebar('Concluido.', 'info'); isRunning = false; btnStart.disabled = false; btnStop.disabled = true; }
                        }).catch(function(err) { logToSidebar('Erro P3: ' + err.message, 'error'); isRunning = false; btnStart.disabled = false; btnStop.disabled = true; });

                    }).catch(function(err) { handleErr('P2', err); });
                }).catch(function(err) { handleErr('P1', err); });
            }).catch(function(err) { handleErr('coleta', err); });
        }

        processarAula(aulaAtual);
    }

    // ── Sidebar ───────────────────────────────────────────────────────────────
    function initSidebar() {
        if (document.getElementById('siap-sidebar')) return;

        var saved = loadState();
        var resumeHint = saved.currentAula ? ' (Aula ' + saved.currentAula + ')' : '';

        var sidebar = document.createElement('div');
        sidebar.id = 'siap-sidebar';
        sidebar.innerHTML = [
            '<div class="siap-header">',
            '  <span>SIAP Automator V12</span>',
            '  <button id="siap-config">&#9881;</button>',
            '</div>',
            '<div class="siap-content">',
            '  <label class="siap-label">Contexto da turma</label>',
            '  <textarea id="siap-context" class="siap-textarea" rows="3">' + (saved.context || '') + '</textarea>',
            '  <label class="siap-label">Quantidade de aulas</label>',
            '  <input type="number" id="siap-qtd" class="siap-input" value="' + (saved.totalAulas || 1) + '" min="1">',
            '  <div class="siap-btn-group">',
            '    <button id="siap-start" class="siap-btn">Iniciar' + resumeHint + '</button>',
            '    <button id="siap-stop" class="siap-btn" disabled>Parar</button>',
            '  </div>',
            '  <div id="siap-log-output"></div>',
            '</div>'
        ].join('');
        document.body.appendChild(sidebar);

        document.getElementById('siap-start').addEventListener('click', function() { runAutomation(false); });
        document.getElementById('siap-stop').addEventListener('click', function() {
            stopRequested = true; saveState({ isAutoStart: false }); logToSidebar('Parando...', 'error');
        });
        document.getElementById('siap-config').addEventListener('click', function() {
            var url   = prompt('URL do Webhook:', settings.webhookUrl);
            var token = prompt('Token:', settings.authToken);
            if (url && token) { settings.webhookUrl = url; settings.authToken = token; GM_setValue(SETTINGS_KEY, settings); try { localStorage.setItem('siap_token', token); localStorage.setItem('siap_webhook', url); } catch(_) {} location.reload(); }
        });

        if (saved.isAutoStart && saved.currentAula && saved.currentAula <= saved.totalAulas) {
            logToSidebar('Retomando aula ' + saved.currentAula + ' de ' + saved.totalAulas + '...', 'info');
            setTimeout(function() { runAutomation(true); }, 3000);
        } else {
            logToSidebar('Sistema pronto. V12.0', 'success');
        }
    }

    initSidebar();

})();
