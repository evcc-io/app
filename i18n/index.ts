import { Resource } from "i18next";

const files = require.context(
    '.', // current directory
    false, // search in subdirectories
    /.+\.json$/ // only .json files
);

const translations: Resource = {};

files.keys().forEach((fileName) => {
    translations[fileName.replace('.json', '').replace('./', '')] = {translation: files(fileName)};
});

export default translations;
