(function() {
    'use strict';

    // --- Configurações ---
    let settings = window.SiapAutomator.getSettings();
    window.SiapAutomator.onSettingsChange = (newSettings) => { settings = newSettings; };

    // --- SIAP API (Adaptado de siap-api.js) ---
    const SiapAPI = (() => {
        function waitForElement(selector, timeout = 5000) {
            return new Promise((resolve, reject) => {
                const el = document.querySelector(selector);
                if (el) return resolve(el);

                const observer = new MutationObserver(() => {
                    const found = document.querySelector(selector);
                    if (found) {
                        observer.disconnect();
                        resolve(found);
                    }
                });

                observer.observe(document.body, { childList: true, subtree: true });
                setTimeout(() => {
                    observer.disconnect();
                    reject(new Error(`Elemento não encontrado: ${selector}`));
                }, timeout);
            });
        }

        function typeInField(element, value) {
            element.focus();
            element.value = value;
            element.dispatchEvent(new Event('input',  { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.blur();
        }

        async function clickAndWait(selector, waitMs = 500) {
            const btn = document.querySelector(selector);
            if (!btn) throw new Error(`Botão não encontrado: ${selector}`);
            btn.click();
            await new Promise(r => setTimeout(r, waitMs));
            return btn;
        }

        function selectOption(selector, value) {
            const select = document.querySelector(selector);
            if (!select) throw new Error(`Select não encontrado: ${selector}`);
            select.value = value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
        }

        function getCurrentLessonData() {
            return {
                anoLetivo:          document.querySelector('#cphFuncionalidade_cphCampos_txtAnoLetivo, [name="ano_letivo"], #ano_letivo')?.value || '',
                composicaoEnsino:   document.querySelector('#cphFuncionalidade_cphCampos_txtComposicaoEnsino, [name="composicao_ensino"]')?.value || '',
                serie:              document.querySelector('#cphFuncionalidade_cphCampos_txtSerie, [name="serie"]')?.value || '',
                turno:              document.querySelector('#cphFuncionalidade_cphCampos_txtTurno, [name="turno"]')?.value || '',
                componenteCurricular: document.querySelector('#cphFuncionalidade_cphCampos_txtComponenteCurricular, [name="componente_curricular"]')?.value || '',
                turma:              document.querySelector('#cphFuncionalidade_cphCampos_txtTurma, [name="turma"]')?.value || '',
                numeroAula:         document.querySelector('#cphFuncionalidade_cphCampos_txtNumeroAula, [name="numero_aula"], #numero_aula')?.value || '',
            };
        }

        function getHabilidades() {
            const habilidadesTextarea = document.querySelector(settings.selectors.habilidades);
            if (habilidadesTextarea && habilidadesTextarea.value) {
                return habilidadesTextarea.value.split(/\n|\r\n/g).map(h => h.trim()).filter(h => h.length > 0);
            }
            const items = document.querySelectorAll('.habilidades-list li, [data-habilidade]');
            return Array.from(items).map(el => el.textContent.trim());
        }

        function isPlanejamentoPreenchido() {
            settings = window.SiapAutomator.getSettings();
            const campos = [
                document.querySelector(settings.selectors.habilidades),
                document.querySelector(settings.selectors.objetivos),
                document.querySelector(settings.selectors.metodologia),
            ];
            return campos.every(el => el && el.value && el.value.trim().length > 0);
        }

        function fillPlanejamento({ habilidades, objetivos, metodologias, avaliacao, recursos }) {
            settings = window.SiapAutomator.getSettings();
            const fields = {
                [settings.selectors.habilidades]: habilidades,
                [settings.selectors.objetivos]: objetivos,
                [settings.selectors.metodologia]: metodologias,
                [settings.selectors.avaliacao]: avaliacao,
                [settings.selectors.recursos]: recursos,
            };

            for (const [selector, value] of Object.entries(fields)) {
                if (!value) continue;
                const el = document.querySelector(selector);
                if (el) { typeInField(el, value); }
            }
        }

        function fillDiarioConteudo(conteudo) {
            settings = window.SiapAutomator.getSettings();
            const el = document.querySelector(settings.selectors.diarioConteudo);
            if (!el) throw new Error('Campo de conteúdo do diário não encontrado');
            typeInField(el, conteudo);
        }

        async function salvar() {
            const selectors = [
              'button[type="submit"]',
              'input[type="submit"]',
              '#btn-salvar',
              'button:contains("Salvar")',
            ];
            for (const sel of selectors) {
              const btn = document.querySelector(sel);
              if (btn) { btn.click(); await new Promise(r => setTimeout(r, 1000)); return true; }
            }
            throw new Error('Botão de salvar não encontrado');
        }

        function getCurrentPage() {
            const url = window.location.href;
            if (url.includes('planejamento')) return 'planejamento';
            if (url.includes('diario'))       return 'diario';
            if (url.includes('frequencia'))   return 'frequencia';
            return 'unknown';
        }

        return {
            waitForElement,
            typeInField,
            clickAndWait,
            selectOption,
            getCurrentLessonData,
            getHabilidades,
            isPlanejamentoPreenchido,
            fillPlanejamento,
            fillDiarioConteudo,
            salvar,
            getCurrentPage,
        };
    })();

    // --- Integração com n8n ---
    async function callN8nWebhook(action, payload) {
        settings = window.SiapAutomator.getSettings();
        if (!settings.n8nWebhookUrl) {
            throw new Error('URL do Webhook do n8n não configurada. Configure nas opções do Tampermonkey.');
        }

        try {
            const response = await fetch(settings.n8nWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action, payload })
            });
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            throw new Error(`Erro na requisição ao n8n: ${error.message}`);
        }
    }

    window.SiapAutomator = window.SiapAutomator || {};
    window.SiapAutomator.SiapAPI = SiapAPI;
    window.SiapAutomator.callN8nWebhook = callN8nWebhook;

})();
