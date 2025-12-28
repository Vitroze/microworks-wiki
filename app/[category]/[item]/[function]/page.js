import FunctionDetailPage from '@/app/components/FunctionDetailPage';
import fs from 'fs';
import path from 'path';

async function getFunctionData(category, itemName, functionName) {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'scraped-data-advanced.json');
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileContent);
    
    const categoryData = data.categories[category];
    if (!categoryData) return null;
    
    const item = categoryData.items.find(i => i.name === decodeURIComponent(itemName));
    if (!item) return null;
    
    const func = item.functions.find(f => f.name === decodeURIComponent(functionName));
    if (!func) return null;
    
    return {
      func,
      className: item.name,
      categoryName: categoryData.name,
      categoryKey: category
    };
  } catch (error) {
    return null;
  }
}

export default async function FunctionPage({ params }) {
  const { category, item, function: functionName } = await params;
  const data = await getFunctionData(category, item, functionName);

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-4xl font-bold">Fonction non trouvée</h1>
      </div>
    );
  }

  return <FunctionDetailPage {...data} />;
}

export async function generateStaticParams() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'scraped-data-advanced.json');
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileContent);
    
    const params = [];
    
    Object.entries(data.categories).forEach(([categoryKey, category]) => {
      category.items.forEach(item => {
        item.functions.forEach(func => {
          params.push({
            category: categoryKey,
            item: encodeURIComponent(item.name),
            function: encodeURIComponent(func.name)
          });
        });
      });
    });
    
    return params;
  } catch (error) {
    return [];
  }
}