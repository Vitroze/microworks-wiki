// scraper-advanced.js - Parser optimisé pour agiriko.digital
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

const BASE_URL = 'https://agiriko.digital/docs';
const OUTPUT_DIR = './data';

let STATES = {
  "(Client)": 'client',
  "(Server)": 'server',
  "(Shared)": 'shared'
}

// Parser une fonction depuis les éléments HTML (tableau d'éléments Cheerio)
function parseFunction($, elements, className) {
  const func = {
    name: '',
    className: className,
    realm: 'shared',
    signature: '',
    returnType: null,
    returnDescription: '',
    description: '',
    arguments: [],
    examples: []
  };

  let currentIndex = 0;

  // Vérifier les parents jusqu'à trouver un <code> (children de <p>)
  let codeFound = false;
  let codeText = '';
  while (currentIndex < elements.length) {
    const elem = $(elements[currentIndex]);
    if (elem.is('p')) {
      const codeElem = elem.find('code').first();
      if (codeElem.length > 0) {
        codeText = codeElem.text().trim();
        codeFound = true;
        currentIndex++;
        break;
      }

      // Récupérer la description si pas encore trouvée
      let STATE = elem.text().trim().split('').find(part => Object.keys(STATES).includes(part));
      console.log(`   - Checking paragraph for function ${func.name}: "${elem.text().trim()} - STATE: ${STATE}`);
      if (func.description === '' && STATES[STATE]) {
        func.realm = STATES[STATE];
        func.description = elem.text().trim().replace(STATE, '').trim();

        console.log(`   - Description trouvée pour ${func.name}: ${func.description}`);
      }

    }
    currentIndex++;
  }

  if (codeFound) {
    func.signature = codeText;
    // Extraire le nom de la fonction depuis la signature
    const nameMatch = codeText.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    if (nameMatch) {
      func.name = nameMatch[1];
    }
    console.log(`   - Parsing fonction: ${func.name} - signature: ${func.signature}`);
  }

  return func;
}

// Parser toutes les fonctions d'une page
function parseFunctionsFromPage($, className) {
  const functions = [];
  const body = $('body');
  const children = body.children();
  
  let i = 0;
  console.log("=== Parsing functions for class:", className);
  while (i < children.length) {
    const elem = children.eq(i);
    
    // Collecter les éléments entre les HR
    if (elem.is('hr')) {
      i++;
      continue;
    }
    
    // Collecter les éléments jusqu'au prochain <hr>
    const funcElements = [];
    while (i < children.length && !children.eq(i).is('hr')) {
      funcElements.push(children[i]);
      i++;
      break;
    }
    
    const func = parseFunction($, funcElements, className);
    if (func.name) {
      functions.push(func);
    }
  }
  
  return functions;
}

// Parser la page d'index
async function parseIndex() {
  try {
    console.log('📋 Parsing de l\'index...\n');
    
    const response = await axios.get(BASE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const structure = {};
    
    $('h1').each((i, elem) => {
      const categoryName = $(elem).text().trim();
      
      if (categoryName && categoryName !== 'MicroWorks Scripting Documentation') {
        const items = [];
        
        $(elem).next('ul').find('a').each((j, link) => {
          const href = $(link).attr('href');
          const text = $(link).text().trim();
          
          if (href && text) {
            items.push({
              name: text,
              url: `${BASE_URL}/${href}`,
              slug: href.replace('.html', '')
            });
          }
        });
        
        if (items.length > 0) {
          structure[categoryName.toLowerCase()] = {
            name: categoryName,
            count: items.length,
            items: items
          };
        }
      }
    });
    
    return structure;
  } catch (error) {
    console.error('❌ Erreur parsing index:', error.message);
    return null;
  }
}

// Scrapper une page complète
async function scrapePage(url, name) {
  try {
    console.log(`📥 Scraping: ${name}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    

    const $ = cheerio.load(response.data);
    
    // Extraire la description principale (premier <p> du body)
    const mainDesc = $('body > p').first().text().trim();
    
    // Parser les fonctions
    const functions = parseFunctionsFromPage($, name);
    
    const pageData = {
      name: name,
      url: url,
      description: mainDesc,
      functions: functions,
      rawContent: $('body').text()
    };
    
    console.log(`   ✓ ${functions.length} fonction(s) trouvée(s)`);
    
    return pageData;
    
  } catch (error) {
    console.error(`❌ Erreur scraping ${name}:`, error.message);
    return null;
  }
}

// Scrapper toute la documentation
async function scrapeAllDocs() {
  console.log('🚀 Démarrage du scraping agiriko.digital...\n');
  
  await fs.ensureDir(OUTPUT_DIR);
  
  const structure = await parseIndex();
  if (!structure) {
    console.error('❌ Impossible de parser la structure');
    return;
  }
  
  await fs.writeJson(
    path.join(OUTPUT_DIR, 'structure.json'),
    structure,
    { spaces: 2 }
  );
  
  console.log('📦 Scraping du contenu...\n');
  
  const allData = {
    scrapedAt: new Date().toISOString(),
    categories: {},
    totalFunctions: 0
  };
  
  for (const [categoryKey, category] of Object.entries(structure)) {
    console.log(`\n📁 Catégorie: ${category.name}`);
    
    allData.categories[categoryKey] = {
      name: category.name,
      count: category.count,
      items: []
    };
    
    for (const item of category.items) {
      const pageData = await scrapePage(item.url, item.name);
      
      if (pageData) {
        allData.categories[categoryKey].items.push(pageData);
        allData.totalFunctions += pageData.functions.length;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`✅ ${category.name}: ${allData.categories[categoryKey].items.length}/${category.count} pages récupérées`);
  }
  
  // Sauvegarder
  const outputPath = path.join(OUTPUT_DIR, 'scraped-data-advanced.json');
  await fs.writeJson(outputPath, allData, { spaces: 2 });
  
  // Créer un index des fonctions
  const functionsIndex = [];
  Object.entries(allData.categories).forEach(([catKey, category]) => {
    category.items.forEach(item => {
      item.functions.forEach(func => {
        functionsIndex.push({
          name: func.name,
          className: item.name,
          category: category.name,
          realm: func.realm,
          signature: func.signature,
          url: `/${catKey}/${item.name}/${func.name}`
        });
      });
    });
  });
  
  await fs.writeJson(
    path.join(OUTPUT_DIR, 'functions-index.json'),
    functionsIndex,
    { spaces: 2 }
  );
  
  console.log('\n✅ Scraping terminé !');
  console.log(`📁 Données: ${outputPath}`);
  console.log(`📊 Total: ${allData.totalFunctions} fonctions`);
  
  return allData;
}

// Exports
async function getScrapedData() {
  const dataPath = path.join(OUTPUT_DIR, 'scraped-data-advanced.json');
  if (await fs.pathExists(dataPath)) {
    return await fs.readJson(dataPath);
  }
  return null;
}

if (require.main === module) {
  scrapeAllDocs()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Erreur fatale:', err);
      process.exit(1);
    });
}

module.exports = {
  parseIndex,
  scrapePage,
  scrapeAllDocs,
  getScrapedData
};