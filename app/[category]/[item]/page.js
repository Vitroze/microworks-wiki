import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { ChevronLeft, ExternalLink } from 'lucide-react';

async function getItemData(category, itemName) {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'scraped-data-advanced.json');
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileContent);
    
    const categoryData = data.categories[category];
    if (!categoryData) return null;
    
    const item = categoryData.items.find(
      i => i.name === decodeURIComponent(itemName)
    );
    
    if (!item) return null;
    
    return { 
      item, 
      categoryName: categoryData.name,
      categoryKey: category 
    };
  } catch (error) {
    console.error('Erreur:', error);
    return null;
  }
}

// Badge Realm
const RealmBadge = ({ realm }) => {
  const colors = {
    server: 'bg-blue-600',
    client: 'bg-orange-600',
    shared: 'bg-gradient-to-r from-blue-600 to-orange-600'
  };
  
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-white text-xs font-semibold ${colors[realm] || colors.shared}`}>
      {realm || 'shared'}
    </span>
  );
};

export default async function ItemPage({ params }) {
  const { category, item: itemName } = await params;
  const data = await getItemData(category, itemName);

  if (!data?.item) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <Link href="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4">
          <ChevronLeft size={20} />
          <span>Retour</span>
        </Link>
        <h1 className="text-4xl font-bold">Page non trouvée</h1>
        <p className="text-gray-400 mt-4">
          L'élément "{itemName}" n'existe pas dans la catégorie "{category}"
        </p>
      </div>
    );
  }

  const { item, categoryName, categoryKey } = data;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold mb-2">{item.name}</h1>
            <div className="text-sm text-gray-400">
            <Link href={`/${categoryKey}`} className="hover:text-blue-400">
                {categoryName}
            </Link>
            </div>
        </div>
        {item.url && (<a
            
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
            <span>Voir la source</span>
            <ExternalLink size={16} />
            </a>
        )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-8">
        {/* Description */}
        {item.description && (
          <div className="mb-8 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
            <p className="text-gray-300 leading-relaxed">{item.description}</p>
          </div>
        )}

        {/* Fonctions */}
        {item.functions && item.functions.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold mb-4">
              Fonctions ({item.functions.length})
            </h2>
            <div className="space-y-3">
              {item.functions.map((func, idx) => (
                <Link 
                  key={idx}
                  href={`/${categoryKey}/${encodeURIComponent(item.name)}/${encodeURIComponent(func.name)}`}
                >
                  <div className="bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-lg p-4 transition cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <code className="text-lg font-semibold text-blue-400">
                          {func.name}
                        </code>
                        <RealmBadge realm={func.realm} />
                      </div>
                    </div>
                    
                    {/* Signature */}
                    {func.signature && (
                      <div className="font-mono text-sm text-gray-400 mb-2">
                        {func.signature}
                      </div>
                    )}
                    
                    {/* Description courte */}
                    {func.description && (
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {func.description}
                      </p>
                    )}
                    
                    {/* Return type */}
                    {func.returnType && (
                      <div className="mt-2 text-xs text-gray-500">
                        Returns: <span className="text-blue-400">{func.returnType}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">Aucune fonction documentée</p>
          </div>
        )}

        {/* Properties (si disponibles) */}
        {item.properties && item.properties.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Properties</h2>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              {item.properties.map((prop, idx) => (
                <div key={idx} className="mb-4 last:mb-0">
                  <pre className="text-gray-300 whitespace-pre-wrap text-sm">{prop}</pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw Content (fallback) */}
        {!item.functions?.length && !item.properties?.length && item.rawContent && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Documentation</h2>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <pre className="text-gray-300 whitespace-pre-wrap text-sm">{item.rawContent}</pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Générer les routes statiques
export async function generateStaticParams() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'scraped-data-advanced.json');
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileContent);
    
    const params = [];
    
    Object.entries(data.categories).forEach(([categoryKey, category]) => {
      category.items.forEach(item => {
        params.push({
          category: categoryKey,
          item: encodeURIComponent(item.name)
        });
      });
    });
    
    return params;
  } catch (error) {
    console.error('Erreur generateStaticParams:', error);
    return [];
  }
}