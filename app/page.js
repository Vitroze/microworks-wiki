import WikiPrototype from './components/WikiPrototype';
import fs from 'fs';
import path from 'path';

async function getScrapedData() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'scraped-data-advanced.json');
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('❌ Erreur lecture données:', error);
    return null;
  }
}

export default async function Home() {
  const scrapedData = await getScrapedData();
  
  console.log('📊 Données chargées:', scrapedData ? 'OUI' : 'NON');
  
  return <WikiPrototype scrapedData={scrapedData} />;
}
