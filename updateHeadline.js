import chalk from 'chalk';
import fetch from 'node-fetch';
import { createRequire } from "module";
import dotenv from 'dotenv'
import * as fs from 'fs';
dotenv.config()

// All language codes: https://cloud.google.com/translate/docs/languages
console.log(chalk.green('Getting updated headline with data from UNHCR...'));

// Import data
const require = createRequire(import.meta.url);
const sourceJSON = require("./static/languages/en.json");
const languages = require("./static/languages/languages.json");

// Imports the Google Cloud client library
const { Translate } = require('@google-cloud/translate').v2;

// Instantiates a client
const googleClient = new Translate({ key: process.env.API_KEY });

// console.log(chalk.yellow(`Getting translations from Google API for the following ${languages.languages.length} languages:`));
// languages.languages.forEach((lang,i) => {
//   console.log(chalk.yellow(i + 1, lang.label))
// })

// Get updated headline for translation with up-to-date refugee count
const response = await fetch('https://data2.unhcr.org/population/?widget_id=294522&sv_id=54&population_group=5460');
const res = await response.json();
const totalRefugees = await res.data[0].individuals;
// const headingLatest = `More than ${toFixed(totalRefugees / 1000000, 1)} million refugees have already fled from Ukraine`;

const headingLatest = `More than 000 million refugees have already fled from Ukraine`;

console.log(chalk.green(`New headline: ${headingLatest}` ));


// Translate updated headline into 24 languages
async function translateText(text, target) {
  let result;
  let [translations] = await googleClient.translate(text, target);
  translations = Array.isArray(translations) ? translations : [translations];
  translations.forEach((translation, i) => {
    result = translation;
  });
  return result;
}

// Change headline in each language json file, i.e. en, de, etc.
languages.languages.forEach((item) => {
  // Load all language files
  const filePath = `./static/languages/${item.value}.json`;
  const langJSON = require(filePath);

  // Translate heading for all 24 languages
  translateText(headingLatest, item.value).then(translation => {
    // console.log(chalk.yellow(`New headline in ${item.value}: ${translation}` ));
    // Write tranlated heading to new json
    langJSON.heading = translation;
    writeJSONToFile(langJSON, filePath, item.value)
  })

})


// Write translation result to JSON files
function writeJSONToFile(jsonObj, filePath, target) {
  const data = JSON.stringify(jsonObj, null, 2);

  // write JSON string to a file
  fs.writeFile(filePath, data, (err) => {
    if (err) {
      console.log(chalk.red("Something went wrong!", err))
    }
    console.log(chalk.green(`Success! Headline updated in ${target}.json`))
  });
}


function toFixed(num, fixed) {
    var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
    return num.toString().match(re)[0];
}