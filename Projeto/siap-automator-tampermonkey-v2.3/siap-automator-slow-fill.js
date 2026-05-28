(function() {
    'use strict';

    // Certifica-se de que o objeto global SiapAutomator existe
    window.SiapAutomator = window.SiapAutomator || {};

    // --- CONFIGURAÇÃO DE VELOCIDADE ---
    // Aumente este valor se continuar dando erro 500. 
    // 1500ms = 1.5 segundos por aluno (Recomendado para evitar bloqueio do servidor)
    const TEMPO_ESPERA_SERVIDOR = 1000; 
    
    const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    async function resetarEPreencherComCalma() {
        // Busca os inputs pela classe específica
        let inputs = document.querySelectorAll(".itens input.seeTextField");
    
        // Fallback caso não ache pela classe
        if (inputs.length === 0) inputs = document.querySelectorAll(".listaDeNotas input[type='text']");
    
        if (inputs.length === 0) {
            alert("Nenhum campo encontrado. Verifique se a aba 'Notas' está aberta.");
            return;
        }
    
        // --- CRIAR O PAINEL DE AVISO (Para você acompanhar) ---
        let painel = document.createElement("div");
        painel.id = "painelProcessamento";
        painel.style.position = "fixed";
        painel.style.top = "10px";
        painel.style.right = "10px";
        painel.style.backgroundColor = "#333";
        painel.style.color = "#fff";
        painel.style.padding = "15px";
        painel.style.borderRadius = "8px";
        painel.style.zIndex = "10000";
        painel.style.fontFamily = "Arial, sans-serif";
        painel.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
        painel.innerHTML = `<strong>Processando...</strong><br>Não feche a aba.<br><span id='progressoTxt'>Iniciando...</span>`;
        
        // Botão de abortar caso precise parar
        let btnParar = document.createElement("button");
        btnParar.innerText = "PARAR";
        btnParar.style.marginTop = "10px";
        btnParar.style.backgroundColor = "red";
        btnParar.style.color = "white";
        btnParar.style.border = "none";
        btnParar.style.padding = "5px 10px";
        btnParar.style.cursor = "pointer";
        btnParar.onclick = function() { window.pararScript = true; painel.remove(); };
        painel.appendChild(btnParar);
        
        document.body.appendChild(painel);
        window.pararScript = false;
    
        console.log(`Iniciando processo lento em ${inputs.length} campos...`);
    
        for (let i = 0; i < inputs.length; i++) {
            if (window.pararScript) break;
    
            let input = inputs[i];
            // O script original usa jQuery, vamos tentar um fallback ou assumir que jQuery está disponível
            // Se jQuery não estiver disponível, estas linhas precisarão ser adaptadas.
            let $input = typeof jQuery !== 'undefined' ? jQuery(input) : null;
    
            // Pula campos bloqueados/invisíveis
            if (input.disabled || input.style.display === 'none') continue;
    
            let valorOriginal = input.value;
            // Pula vazios
            if (!valorOriginal || valorOriginal.trim() === "") continue;
    
            // Atualiza o texto do painel
            document.getElementById('progressoTxt').innerText = `Aluno ${i + 1} de ${inputs.length}`;
    
            // Visual: Amarelo = Processando
            input.style.backgroundColor = "#ffffcc";
            input.scrollIntoView({behavior: "smooth", block: "center"}); // Rola a tela até o aluno
    
            try {
                // --- PASSO 1: LIMPAR ---
                input.value = ""; 
                input.dispatchEvent(new Event('input', { bubbles: true }));
                if ($input) $input.trigger('change').trigger('blur');
                else {
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.dispatchEvent(new Event('blur', { bubbles: true }));
                }
                
                // Pequena pausa para o UI limpar
                await esperar(100);
    
                // --- PASSO 2: REESCREVER ---
                input.value = valorOriginal;
                
                // Dispara eventos cruciais
                input.dispatchEvent(new Event('input', { bubbles: true })); // Lógica de divisão do site
                if ($input) $input.trigger('keydown'); 
                
                // Simula Enter (muito importante para alguns validadores ASP.NET)
                if ($input) {
                    let enterEvent = jQuery.Event("keyup");
                    enterEvent.which = 13; 
                    $input.trigger(enterEvent);
                }
                
                if ($input) $input.trigger('change');
                else input.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Dispara BLUR (Geralmente aqui que o servidor é chamado)
                input.dispatchEvent(new Event('blur', { bubbles: true }));
                if ($input) $input.trigger('blur');
    
                input.style.backgroundColor = "#ccffcc"; // Verde = OK
    
                // --- PASSO 3: ESPERA LONGA (O SEGREDO) ---
                // Espera o servidor responder (evita o erro 500)
                await esperar(TEMPO_ESPERA_SERVIDOR); 
                
                // Remove a cor
                input.style.backgroundColor = "";
    
            } catch (erro) {
                console.error(`Erro no aluno ${i}:`, erro);
                input.style.backgroundColor = "red"; // Marca erro visualmente
            }
        }
    
        // --- FINALIZAÇÃO ---
        if (!window.pararScript) {
            document.getElementById('progressoTxt').innerText = "Recalculando totais finais...";
            
            try {
                if (typeof ViewTotalDeNotas !== 'undefined') {
                    let viewTotal = new ViewTotalDeNotas();
                    let container = document.querySelector(".listaDeTotais.totalDeNotas");
                    if (container) {
                        viewTotal.carregaDoHTML(container);
                        viewTotal.atualizaTotalParaTodosOsAlunos();
                    }
                }
            } catch (e) { console.error(e); }
    
            painel.style.backgroundColor = "green";
            painel.innerHTML = "<strong>SUCESSO!</strong><br>Todos os alunos processados.";
            setTimeout(() => { if(painel) painel.remove(); }, 4000);
        }
    }

    // Expor a função para o script principal
    window.SiapAutomator.resetarEPreencherComCalma = resetarEPreencherComCalma;

})();
