# SIAP Automator - Guia de Instalação e Uso (Tampermonkey)

Este guia detalha como instalar e configurar o SIAP Automator como um conjunto de Userscripts para o Tampermonkey, permitindo a automação do sistema SIAP com integração de IA via n8n e Ollama.

## 1. Pré-requisitos

Antes de começar, certifique-se de ter:

*   **Navegador Compatível**: Google Chrome, Microsoft Edge, Firefox ou outro navegador que suporte extensões de Userscript.
*   **Tampermonkey**: Extensão do navegador instalada. Você pode baixá-la na loja de extensões do seu navegador (ex: [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)).
*   **n8n e Ollama Configurados**: Conforme o guia anterior (`n8n_ollama_setup_guide.md`), seu ambiente n8n com Ollama deve estar rodando e acessível via um webhook.

## 2. Estrutura dos Scripts

O SIAP Automator agora é composto por três Userscripts principais, que serão carregados pelo Tampermonkey:

1.  **`siap-automator-main.user.js`**: O script principal que gerencia as configurações globais, a comunicação entre os módulos e a injeção da barra lateral. Ele contém os metadados do Tampermonkey.
2.  **`siap-automator-automation.js`**: Contém a lógica de interação com o sistema SIAP (preenchimento de campos, cliques) e a comunicação com o webhook do n8n.
3.  **`siap-automator-sidebar.js`**: Responsável pela interface da barra lateral (UI) e seus eventos.
4.  **`siap-automator-slow-fill.js`**: Contém a lógica para o preenchimento lento de campos, útil para evitar erros de servidor.

## 3. Instalação dos Userscripts

Para instalar os scripts, siga os passos abaixo:

1.  **Abra o Painel do Tampermonkey**: Clique no ícone do Tampermonkey no seu navegador e selecione "Painel".
2.  **Crie um Novo Script**: No painel do Tampermonkey, clique no ícone "+" para criar um novo script.
3.  **Cole o Conteúdo do `siap-automator-main.user.js`**: Apague todo o conteúdo padrão do novo script e cole o conteúdo do arquivo `siap-automator-main.user.js` (que você recebeu no pacote).
4.  **Salve o Script Principal**: Clique em "Arquivo" > "Salvar" (ou use `Ctrl+S`/`Cmd+S`).
5.  **Repita para os Outros Scripts**: Embora o `main.user.js` use `@require` para carregar os outros scripts, para que o Tampermonkey os reconheça e os gerencie corretamente, é uma boa prática adicioná-los também como scripts separados (sem os metadados `// ==UserScript==` e `// ==/UserScript==` nos arquivos `automation.js`, `sidebar.js` e `slow-fill.js`).
    *   Crie um novo script para `siap-automator-automation.js`.
    *   Crie um novo script para `siap-automator-sidebar.js`.
    *   Crie um novo script para `siap-automator-slow-fill.js`.
    *   **Importante**: Certifique-se de que os nomes dos arquivos no `@require` do `main.user.js` correspondem aos nomes dos scripts que você está criando no Tampermonkey.

## 4. Configuração Inicial

Após a instalação, você precisará configurar a URL do webhook do n8n e, opcionalmente, os seletores personalizados:

1.  **Acesse uma Página do SIAP**: Navegue para qualquer página do sistema SIAP onde a extensão deve funcionar (ex: `https://siap.educacao.go.gov.br/PlanejamentoProfessorPlanejamentoAulaEdicao.aspx`).
2.  **Abra a Barra Lateral**: A barra lateral do SIAP Automator deve aparecer no lado direito da tela. Se não aparecer, recarregue a página.
3.  **Configure o Webhook do n8n**: Clique no botão "⚙️ Configurar n8n" na barra lateral. Uma caixa de diálogo será exibida solicitando a URL do seu webhook do n8n. Insira a URL completa e clique em "OK".
4.  **Seletores Personalizados (Opcional)**: Se os campos de texto no seu SIAP tiverem IDs diferentes dos padrões, você pode usar o script `siap_selector_extractor.js` (fornecido no pacote anterior) no console do navegador para encontrar os IDs corretos. Em seguida, você pode editar o script `siap-automator-main.user.js` diretamente no Tampermonkey para atualizar o objeto `settings.selectors` com os IDs corretos.

## 5. Uso da Extensão

Com a extensão configurada, você pode começar a automatizar o preenchimento de planejamentos:

1.  **Geração com IA**: Na barra lateral, insira a "Quantidade de aulas" e "Orientações extras" (se necessário). Clique em "⚡ Gerar Planejamento". A extensão enviará os dados para o n8n, que usará o Ollama para gerar o conteúdo.
2.  **Preenchimento Lento**: Após a geração, se você tiver problemas de servidor (erro 500) ao aplicar o planejamento, use o botão "🐢 Preenchimento Lento". Ele preencherá os campos um por um, com pausas, para evitar sobrecarregar o servidor.
3.  **Aplicar Planejamento**: Após a geração, o conteúdo será exibido na área de pré-visualização. Você pode então usar os botões "→ Próxima aula" ou "⟳ Aplicar todas" (se implementados) para preencher os campos do SIAP.

## 6. Solução de Problemas

*   **Sidebar não aparece**: Verifique se o script `siap-automator-main.user.js` está ativo no Tampermonkey e se você está em uma URL que corresponde aos `@match` definidos no script.
*   **Erro de Webhook**: Certifique-se de que a URL do n8n está correta e que seu workflow do n8n está ativo e escutando.
*   **Campos não preenchidos**: Verifique os seletores no `siap-automator-main.user.js` e use o `siap_selector_extractor.js` para confirmar os IDs corretos dos campos no seu SIAP.
*   **Erro 500 no servidor**: Use a funcionalidade de "Preenchimento Lento" para evitar sobrecarga no servidor do SIAP.

---

**Autor**: Manus AI
**Versão**: 2.3.0
