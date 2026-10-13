const fs = require('fs');
const path = require('path');

const fonte = 'src';
const arquivos = ['index.html', 'style.css', 'app.js', 'data.js', 'taco.js',
                  'bodymap.js'];
const pastas = ['fonts'];

fs.rmSync('www', { recursive: true, force: true });
fs.mkdirSync('www');
arquivos.forEach(a => fs.copyFileSync(path.join(fonte, a), path.join('www', a)));
pastas.forEach(p => fs.cpSync(path.join(fonte, p), path.join('www', p), { recursive: true }));
console.log('www atualizado');