import fs from 'fs';
import path from 'path';

const i18nFolder = "./i18n";
const files = fs.readdirSync(i18nFolder);
const jsonFiles = files.filter(file => file.endsWith('.json')).map(file => path.basename(file, '.json'));


const imports = `import { Resource } from "i18next";\n\n` + jsonFiles.map(lang => `import ${lang} from "./${lang}.json";`).join('\n');

const translationsObject = `const translations: Resource = {
  ${jsonFiles.map(lang => `${lang}: { translation: ${lang} }`).join(',\n  ')}
};

export default translations;
`;


const outputPath = "./i18n/index.ts";
const content = `${imports}\n\n${translationsObject}`;

fs.writeFileSync(outputPath, content, 'utf-8');
console.log('Finished loading translations.');
