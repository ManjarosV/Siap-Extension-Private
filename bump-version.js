const fs = require('fs');
const path = require('path');

// Altere para o nome exato do seu arquivo script
const scriptPath = path.join(__dirname, 'SIAP-Automator.user.js'); 

let content = fs.readFileSync(scriptPath, 'utf8');

// Regex para capturar a versão (ex: 12.0.1)
const versionRegex = /(\/\/ @version\s+)(\d+)\.(\d+)\.(\d+)/;
const match = content.match(versionRegex);

if (match) {
    const prefix = match[1];
    const major = match[2];
    const minor = match[3];
    const patch = parseInt(match[4], 10) + 1; // Incrementa o patch

    const newVersion = `${major}.${minor}.${patch}`;
    content = content.replace(versionRegex, `${prefix}${newVersion}`);
    
    fs.writeFileSync(scriptPath, content, 'utf8');
    console.log(`Versão atualizada para: ${newVersion}`);
} else {
    console.error('Tag @version não encontrada no script.');
    process.exit(1);
}
