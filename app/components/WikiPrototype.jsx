'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Menu, Home, Book, Code, Lightbulb, ChevronRight, 
  ChevronDown, Moon, Sun, Github, Loader, ExternalLink
} from 'lucide-react';
import Link from 'next/link';

const WikiPrototype = ({ scrapedData }) => {
  const [darkMode, setDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Mapper les catégories scrapées
  const categories = useMemo(() => {
    if (!scrapedData?.categories) return [];

    const mapped = [
      { id: 'home', name: 'Accueil', icon: Home }
    ];

    // Convertir les catégories scrapées
    Object.entries(scrapedData.categories).forEach(([key, category]) => {
      mapped.push({
        id: key,
        name: category.name,
        icon: getCategoryIcon(key),
        count: category.count,
        items: category.items || []
      });
    });

    // ✨ Catégorie Tutoriels avec liens externes
    mapped.push({
      id: 'tutorials',
      name: 'Tutoriels',
      icon: Lightbulb,
      count: 3,
      isExpandable: true,
      externalLinks: [
        {
          id: 'modding-pt1',
          name: 'Modding Pt.1: Custom Microgames',
          url: 'https://agiriko.digital/docs/CustomLevelManager.html'
        },
        {
          id: 'modding-pt2',
          name: 'Modding Pt.2: Custom Boss Stages',
          url: 'https://agiriko.digital/docs/CustomLevelManager.html'
        },
        {
          id: 'modding-pt3',
          name: 'Modding Pt.3: Custom Scenes',
          url: 'https://agiriko.digital/docs/CustomLevelManager.html'
        }
      ]
    });

    return mapped;
  }, [scrapedData]);

  // Fonction pour obtenir l'icône selon la catégorie
  function getCategoryIcon(categoryKey) {
    const icons = {
      general: Home,
      types: Code,
      resources: Book,
      wrappers: Code,
      events: Lightbulb
    };
    return icons[categoryKey] || Book;
  }

  const toggleCategory = (catId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Recherche dans toutes les fonctions
  const searchResults = useMemo(() => {
    if (!searchQuery || !scrapedData?.categories) return [];

    const results = [];
    
    Object.entries(scrapedData.categories).forEach(([catKey, category]) => {
      category.items.forEach(item => {
        // Chercher dans les fonctions
        if (item.functions && item.functions.length > 0) {
          item.functions.forEach(func => {
            const matchName = func.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchDesc = func.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchSignature = func.signature?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchReturn = func.returnDescription?.toLowerCase().includes(searchQuery.toLowerCase());
            
            if (matchName || matchDesc || matchSignature || matchReturn) {
              results.push({
                type: 'function',
                name: func.name,
                signature: func.signature,
                description: func.description,
                returnType: func.returnType,
                realm: func.realm,
                className: item.name,
                category: category.name,
                categoryKey: catKey,
                url: `/${catKey}/${encodeURIComponent(item.name)}/${encodeURIComponent(func.name)}`
              });
            }
          });
        }
      });
    });

    return results;
  }, [searchQuery, scrapedData]);

  // Contenu actuel
  const currentContent = useMemo(() => {
    if (selectedCategory === 'home') {
      return {
        type: 'home',
        title: 'MicroWorks Scripting Documentation',
        description: 'Documentation complète pour le scripting dans MicroWorks',
        stats: scrapedData ? {
          total: Object.values(scrapedData.categories).reduce((sum, cat) => sum + cat.count, 0),
          categories: Object.keys(scrapedData.categories).length,
          lastUpdate: scrapedData.scrapedAt
        } : null
      };
    }

    const category = scrapedData?.categories?.[selectedCategory];
    if (category) {
      return {
        type: 'category',
        category: category
      };
    }

    return null;
  }, [selectedCategory, scrapedData]);

  if (!scrapedData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4" size={48} />
          <p>Chargement de la documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-700 rounded"
            >
              <Menu size={20} />
            </button>
            <Link href="/">
              <h1 className="text-xl font-bold cursor-pointer hover:text-blue-400">agiriko.wiki</h1>
            </Link>
          </div>

          <div className="flex-1 max-w-2xl mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher dans la documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-gray-700 rounded"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <a href="https://agiriko.digital/docs" target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-700 rounded">
              <Github size={20} />
            </a>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className={`w-64 min-h-screen ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-r p-4`}>
            <nav className="space-y-1">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isExpanded = expandedCategories[cat.id];
                const hasItems = cat.items && cat.items.length > 0;
                const hasExternalLinks = cat.externalLinks && cat.externalLinks.length > 0;
                
                return (
                  <div key={cat.id}>
                    <button
                      onClick={() => {
                        if (hasItems || hasExternalLinks) {
                          toggleCategory(cat.id);
                        }
                        if (!hasItems && !hasExternalLinks) {
                          setSelectedCategory(cat.id);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === cat.id && !hasItems && !hasExternalLinks
                          ? 'bg-blue-600 text-white'
                          : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} />
                        <span>{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {cat.count && (
                          <span className="text-xs opacity-70">{cat.count}</span>
                        )}
                        {(hasItems || hasExternalLinks) && (
                          isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                        )}
                      </div>
                    </button>
                    
                    {/* Liens externes (Tutoriels) */}
                    {hasExternalLinks && isExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {cat.externalLinks.map((link) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200'
                            }`}
                          >
                            <span>{link.name}</span>
                            <ExternalLink size={14} className="opacity-50" />
                          </a>
                        ))}
                      </div>
                    )}
                    
                    {/* Items de la catégorie (données scrapées) */}
                    {hasItems && isExpanded && (
                      <div className="ml-4 mt-1 space-y-1 max-h-96 overflow-y-auto">
                        {cat.items.slice(0, 20).map((item, idx) => (
                          <Link 
                            key={idx}
                            href={`/${cat.id}/${encodeURIComponent(item.name)}`}
                            className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200'
                            }`}
                          >
                            {item.name}
                          </Link>
                        ))}
                        {cat.items.length > 20 && (
                          <p className="text-xs text-gray-500 px-3 py-1">
                            +{cat.items.length - 20} autres...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className={`mt-6 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <p className="text-xs opacity-60 mb-2">SYNCHRONISATION</p>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs">À jour</span>
              </div>
              {scrapedData.scrapedAt && (
                <p className="text-xs opacity-50 mt-1">
                  {new Date(scrapedData.scrapedAt).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Résultats de recherche */}
          {searchQuery && searchResults.length > 0 ? (
            <div>
              <h2 className="text-2xl font-bold mb-4">
                Résultats pour "{searchQuery}" ({searchResults.length})
              </h2>
              <div className="space-y-3">
                {searchResults.map((result, idx) => (
                  <Link 
                    key={idx}
                    href={result.url}
                  >
                    <div className={`p-4 rounded-lg border ${
                      darkMode ? 'bg-gray-800 border-gray-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-400'
                    } transition-colors cursor-pointer`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Nom de la fonction */}
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-mono font-semibold text-blue-400">
                              {result.name}
                            </h3>
                            {/* Badge Realm */}
                            <span className={`inline-block px-2 py-0.5 rounded text-white text-xs font-semibold ${
                              result.realm === 'server' ? 'bg-blue-600' :
                              result.realm === 'client' ? 'bg-orange-600' :
                              'bg-gradient-to-r from-blue-600 to-orange-600'
                            }`}>
                              {result.realm || 'shared'}
                            </span>
                          </div>
                          
                          {/* Signature */}
                          {result.signature && (
                            <p className={`text-xs font-mono mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                              {result.signature}
                            </p>
                          )}
                          
                          {/* Description */}
                          {result.description && (
                            <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {result.description}
                            </p>
                          )}
                          
                          {/* Breadcrumb */}
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                            <span>{result.category}</span>
                            <span>›</span>
                            <span>{result.className}</span>
                          </div>
                        </div>
                        <ChevronRight className="opacity-50 flex-shrink-0" size={20} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : searchQuery ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Aucune fonction trouvée pour "{searchQuery}"</p>
            </div>
          ) : currentContent?.type === 'home' ? (
            <div>
              <h1 className="text-4xl font-bold mb-4">{currentContent.title}</h1>
              <p className={`text-lg mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {currentContent.description}
              </p>

              {currentContent.stats && (
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-3xl font-bold text-blue-400">{currentContent.stats.total}</h3>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Pages de documentation</p>
                  </div>
                  <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-3xl font-bold text-blue-400">{currentContent.stats.categories}</h3>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Catégories</p>
                  </div>
                  <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-3xl font-bold text-green-400">✓</h3>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Synchronisé</p>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {categories.slice(1).map((cat, idx) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-6 rounded-lg border text-left ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      } hover:border-blue-500 transition-colors`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Icon size={24} className="text-blue-400" />
                        <h3 className="text-xl font-semibold">{cat.name}</h3>
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {cat.count} éléments disponibles
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : currentContent?.type === 'category' && currentContent.category ? (
            <div>
              <h1 className="text-3xl font-bold mb-6">{currentContent.category.name}</h1>
              <p className="text-gray-400 mb-6">{currentContent.category.count} éléments</p>

              <div className="space-y-3">
                {currentContent.category.items.map((item, idx) => (
                  <Link 
                    key={idx}
                    href={`/${selectedCategory}/${encodeURIComponent(item.name)}`}
                  >
                    <div className={`p-4 rounded-lg border ${
                      darkMode ? 'bg-gray-800 border-gray-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-400'
                    } transition-colors cursor-pointer`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-blue-400 mb-1">
                            {item.name}
                          </h3>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {item.description || 'Cliquez pour voir les détails'}
                          </p>
                        </div>
                        <ChevronRight className="opacity-50" size={20} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default WikiPrototype;