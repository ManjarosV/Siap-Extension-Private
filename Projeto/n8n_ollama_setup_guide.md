# 🚀 Guia de Configuração: n8n e Ollama para SIAP Automator

Este guia detalha os passos para configurar o n8n e o Ollama localmente, importar o workflow fornecido e prepará-lo para interagir com a extensão SIAP Automator. Com esta configuração, você poderá gerar planejamentos e diários de aula utilizando modelos de linguagem grandes (LLMs) diretamente em sua máquina, garantindo privacidade e controle.

## 1. Instalação do Ollama

O Ollama é a ferramenta que permite rodar LLMs localmente de forma simplificada. Siga os passos abaixo para instalá-lo em seu sistema operacional.

### 1.1. Instalação no Linux

Abra o terminal e execute o seguinte comando:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 1.2. Instalação no macOS

Baixe o instalador `.dmg` do site oficial do Ollama e siga as instruções de instalação:

[Download Ollama para macOS](https://ollama.com/download/mac)

### 1.3. Instalação no Windows

Baixe o instalador `.exe` do site oficial do Ollama e siga as instruções de instalação:

[Download Ollama para Windows](https://ollama.com/download/windows)

## 2. Download dos Modelos de Linguagem (LLMs)

Após instalar o Ollama, você precisará baixar os modelos que serão utilizados. Recomenda-se o `llama3.1` ou `mistral-nemo` para um bom equilíbrio entre desempenho e qualidade em português.

Abra o terminal (ou PowerShell no Windows) e execute os comandos para baixar os modelos:

```bash
ollama pull llama3.1
ollama pull mistral-nemo
```

Você pode verificar os modelos disponíveis e seus tamanhos na [biblioteca do Ollama](https://ollama.com/library).

## 3. Instalação e Configuração do n8n

O n8n pode ser instalado de diversas formas, mas a mais recomendada para uso local é via Docker.

### 3.1. Instalação do Docker

Se você ainda não tem o Docker instalado, siga as instruções oficiais:

*   [Instalar Docker Desktop (Windows/macOS)](https://docs.docker.com/desktop/install/)
*   [Instalar Docker Engine (Linux)](https://docs.docker.com/engine/install/)

### 3.2. Executando o n8n com Docker

Após instalar o Docker, abra o terminal e execute o seguinte comando para iniciar o n8n:

```bash
docker run -it --rm --name n8n -p 5678:5678 -p 11434:11434 -v n8n_data:/home/node/.n8n n8n/n8n
```

**Explicação do comando:**

*   `-it`: Permite interação com o container.
*   `--rm`: Remove o container automaticamente ao parar.
*   `--name n8n`: Define o nome do container como `n8n`.
*   `-p 5678:5678`: Mapeia a porta 5678 do host para a porta 5678 do container (interface web do n8n).
*   `-p 11434:11434`: **Crucial!** Mapeia a porta 11434 do host (onde o Ollama está rodando) para a porta 11434 do container n8n. Isso permite que o nó Ollama dentro do n8n se comunique com o servidor Ollama rodando diretamente no seu host.
*   `-v n8n_data:/home/node/.n8n`: Cria um volume persistente para os dados do n8n, garantindo que seus workflows e configurações não sejam perdidos ao reiniciar o container.
*   `n8n/n8n`: Imagem Docker do n8n.

Após executar o comando, o n8n estará acessível em seu navegador em `http://localhost:5678`.

## 4. Importando o Workflow no n8n

1.  Acesse a interface web do n8n em `http://localhost:5678`.
2.  No painel esquerdo, clique em **Workflows**.
3.  Clique em **New** e, em seguida, em **Import from JSON**.
4.  Copie e cole o conteúdo do arquivo `siap_automator_ollama_workflow.json` (fornecido anteriormente) na caixa de texto e clique em **Import**.
5.  O workflow será carregado. Salve-o e ative-o clicando no botão **Active** no canto superior direito.

## 5. Configuração do Nó Ollama no Workflow

Dentro do workflow importado, você encontrará os nós **"Ollama - Planejamento"** e **"Ollama - Diário"**.

1.  **Edite cada nó Ollama:**
    *   **Model**: Certifique-se de que o modelo selecionado (ex: `llama3.1`) corresponde a um modelo que você baixou com o Ollama.
    *   **Base URL**: Deve ser `http://localhost:11434`. Esta URL permite que o nó n8n se conecte ao seu servidor Ollama local, graças ao mapeamento de porta que fizemos no comando Docker.
    *   **System Message**: Verifique os prompts de sistema para garantir que estão alinhados com suas expectativas de geração de conteúdo.
    *   **Temperature**: Ajuste conforme necessário. Valores entre 0.1 e 0.5 são bons para respostas mais consistentes e menos criativas, ideais para conteúdo educacional.

2.  **Ative o Webhook**: Certifique-se de que o nó **Webhook** no início do workflow está configurado e ativo. Anote a URL do webhook, pois você precisará dela para configurar a extensão.

Com esses passos, seu ambiente n8n com Ollama estará pronto para receber requisições da extensão SIAP Automator e gerar conteúdo educacional de forma inteligente e local.

---

**Referências:**

[1] Ollama. *Download*. Disponível em: <https://ollama.com/download>. Acesso em: 25 mai. 2026.
[2] Ollama. *library*. Disponível em: <https://ollama.com/library>. Acesso em: 25 mai. 2026.
[3] Docker. *Install Docker Desktop*. Disponível em: <https://docs.docker.com/desktop/install/>. Acesso em: 25 mai. 2026.
[4] Docker. *Install Docker Engine*. Disponível em: <https://docs.docker.com/engine/install/>. Acesso em: 25 mai. 2026.
[5] n8n Docs. *Ollama Model node documentation*. Disponível em: <https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmollama/>. Acesso em: 25 mai. 2026.
