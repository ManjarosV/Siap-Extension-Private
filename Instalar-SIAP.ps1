<#
.SYNOPSIS
Installer automático para SIAP Automator - Baixa do repositório privado e configura o Tampermonkey.
.DESCRIPTION
Este script baixa o arquivo de configuração do SIAP Automator do seu repositório privado no GitHub
e o instala no Tampermonkey. Ele também configura a extensão Tampermonkey no Edge caso não esteja instalada.
.NOTES
Autor: ManjarosV
Versão: 1.0
#>

[CmdletBinding()]
param()

# Configurações do Repositório
$githubUser = "ManjarosV"
$repoName = "Siap-Extension-Private"
$filePath = "SIAP-Automator.json"
$branch = "main"
$token = "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"

# Configurações do Tampermonkey
$tampermonkeyID = "dhdgffkkebhmkfjojejmpbldmpobfkfo"

# Caminhos
$tempDir = "$env:TEMP\SIAP_Installer"
$jsonFile = "$tempDir\$filePath"
$userJsFile = "$tempDir\SIAP-Automator.user.js"

Write-Host "🚀 Iniciando instalação do SIAP Automator..." -ForegroundColor Cyan

# Criar diretório temporário se não existir
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    Write-Host "📁 Criado diretório temporário: $tempDir" -ForegroundColor Cyan
}

# 1. Baixar script do GitHub privado
Write-Host "📥 Baixando script do repositório privado..." -ForegroundColor Yellow

# Usar API do GitHub com token para acessar repositório privado
$apiUrl = "https://api.github.com/repos/$githubUser/$repoName/contents/$filePath?ref=$branch"
$authHeader = @{ Authorization = "token $token" }

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Headers $authHeader -ErrorAction Stop
    $content = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($response.content))
    Set-Content -Path $jsonFile -Value $content -Encoding UTF8
    Write-Host "✅ Script baixado com sucesso!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erro ao baixar o script: $_" -ForegroundColor Red
    Write-Host "Verifique se o token ainda é válido e se o arquivo existe no repositório." -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

# 2. Converter .json para .user.js (se necessário)
Write-Host "🔄 Convertendo arquivo para formato .user.js..." -ForegroundColor Yellow

# Verificar se o arquivo .json tem a estrutura esperada de exportação do Tampermonkey
$jsonContent = Get-Content $jsonFile -Raw | ConvertFrom-Json

if ($jsonContent.'@meta' -or $jsonContent.scripts) {
    # É um arquivo de backup do Tampermonkey (formato de exportação)
    Write-Host "📦 Detectado formato de exportação do Tampermonkey." -ForegroundColor Cyan
    
    # Extrair o primeiro script do backup
    $scriptObj = $null
    if ($jsonContent.scripts -and $jsonContent.scripts[0]) {
        $scriptObj = $jsonContent.scripts[0]
    } elseif ($jsonContent.'@meta') {
        # Formato alternativo
        $scriptObj = $jsonContent
    }
    
    if ($scriptObj) {
        # Criar cabeçalho .user.js
        $userJsContent = "// ==UserScript==`n"
        foreach ($prop in $scriptObj.PSObject.Properties) {
            if ($prop.Name -ne "script") {
                $userJsContent += "// @$($prop.Name) $($prop.Value)`n"
            }
        }
        $userJsContent += "// ==/UserScript==`n`n"
        $userJsContent += $scriptObj.script
        
        Set-Content -Path $userJsFile -Value $userJsContent -Encoding UTF8
        Write-Host "✅ Script convertido para .user.js" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Não foi possível extrair script do arquivo .json, usando o arquivo original." -ForegroundColor Yellow
        Copy-Item -Path $jsonFile -Destination $userJsFile -Force
    }
} else {
    # Já é um .user.js ou formato diferente
    Copy-Item -Path $jsonFile -Destination $userJsFile -Force
    Write-Host "✅ Arquivo copiado como .user.js" -ForegroundColor Green
}

# 3. Configurar Tampermonkey (instalar a extensão no Edge)
Write-Host "🔧 Verificando/Instalando extensão Tampermonkey no Edge..." -ForegroundColor Yellow

$edgePath = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
$edgeExists = Test-Path $edgePath

if (-not $edgeExists) {
    Write-Host "❌ Microsoft Edge não encontrado no sistema." -ForegroundColor Red
    Write-Host "Por favor, instale o Microsoft Edge para continuar." -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Método 1: Registrar política para forçar instalação (Requer Admin)
try {
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
    if ($isAdmin) {
        Write-Host "👑 Modo administrador detectado, instalando extensão via política..." -ForegroundColor Cyan
        
        # Configurar políticas para forçar instalação da extensão
        $regPath = "HKLM:\SOFTWARE\Policies\Microsoft\Edge\ExtensionInstallForcelist"
        
        if (-not (Test-Path $regPath)) {
            New-Item -Path $regPath -Force | Out-Null
        }
        
        # ID do Tampermonkey no Edge Store
        $extensionID = "iikmkjmpaadaobahmlepeloendndfphd"
        $updateURL = "https://edge.microsoft.com/extensionwebstorebase/v1/crx"
        Set-ItemProperty -Path $regPath -Name "1" -Value "$extensionID;$updateURL" -Force
        
        Write-Host "✅ Extensão configurada para instalação forçada no Edge." -ForegroundColor Green
        Write-Host "⚠️ A extensão será instalada quando o Edge for reiniciado." -ForegroundColor Yellow
    } else {
        Write-Host "⚠️ Modo administrador não detectado. Não foi possível configurar a instalação automática." -ForegroundColor Yellow
        Write-Host "Por favor, instale o Tampermonkey manualmente pela loja de extensões do Edge:" -ForegroundColor Cyan
        Write-Host "🔗 https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd" -ForegroundColor Yellow
        Read-Host "Após instalar, pressione Enter para continuar"
    }
}
catch {
    Write-Host "⚠️ Erro ao configurar política de extensão: $_" -ForegroundColor Yellow
    Write-Host "Por favor, instale o Tampermonkey manualmente." -ForegroundColor Cyan
    Read-Host "Pressione Enter após instalar"
}

# 4. Instalar o script no Tampermonkey
Write-Host "📝 Instalando script no Tampermonkey..." -ForegroundColor Yellow

# Método: Abrir Edge com o arquivo .user.js (Tampermonkey reconhece e pergunta se quer instalar)
Write-Host "Abrindo Microsoft Edge para instalar o script..." -ForegroundColor Cyan
Start-Process $edgePath -ArgumentList $userJsFile

Write-Host @"
==================================================
✅ INSTALAÇÃO INICIADA!

📌 Próximos passos:
1. O Tampermonkey abrirá com a tela de instalação do script.
2. Clique em "Instalar" para finalizar.
3. Verifique se a extensão está ativa no Edge.

🔗 Se necessário, acesse: edge://extensions/ e verifique se o Tampermonkey está habilitado.

🚀 Script instalado em: $userJsFile
==================================================
"@ -ForegroundColor Green

Write-Host "🎉 Instalação concluída! Pressione qualquer tecla para sair." -ForegroundColor Cyan
Read-Host