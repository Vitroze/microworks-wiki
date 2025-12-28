// FunctionDetailPage.jsx - Page de détail d'une fonction style Facepunch
'use client';

import React from 'react';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

// Composant Badge Realm
const RealmBadge = ({ realm }) => {
  const colors = {
    server: 'bg-blue-600',
    client: 'bg-orange-600',
    shared: 'bg-gradient-to-r from-blue-600 to-orange-600'
  };
  
  const labels = {
    server: 'Server',
    client: 'Client',
    shared: 'Shared'
  };
  
  return (
    <span className={`inline-block px-3 py-1 rounded text-white text-sm font-semibold ${colors[realm] || colors.shared}`}>
      {labels[realm] || 'Shared'}
    </span>
  );
};

// Composant Signature de fonction
const FunctionSignature = ({ func }) => {
  const parts = [];
  
  if (func.returnType) {
    parts.push(
      <span key="return" className="text-blue-400 font-semibold">{func.returnType}</span>
    );
    parts.push(<span key="space1" className="text-gray-400"> </span>);
  }
  
  parts.push(
    <span key="name" className="text-white font-bold">{func.name}</span>
  );
  
  parts.push(<span key="paren1" className="text-gray-400">(</span>);
  console.log(func)
  if (func.arguments && func.arguments.length > 0) {
    func.arguments.forEach((arg, idx) => {
      if (idx > 0) {
        parts.push(<span key={`comma${idx}`} className="text-gray-400">, </span>);
      }
      parts.push(
        <span key={`arg${idx}`}>
          <span className="text-blue-400">{arg.type}</span>
          <span className="text-gray-400"> </span>
          <span className="text-orange-400">{arg.name}</span>
        </span>
      );
    });
  }
  
  parts.push(<span key="paren2" className="text-gray-400">)</span>);
  
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-lg overflow-x-auto">
      {parts}
    </div>
  );
};

// Composant Arguments
const ArgumentsSection = ({ args }) => {
  if (!args || args.length === 0) return null;
  
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-white">Arguments</h2>
      <div className="space-y-3">
        {args.map((arg, idx) => (
          <div key={idx} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-gray-400 text-sm">{idx + 1}</span>
              <span className="text-blue-400 font-mono font-semibold">{arg.type}</span>
              <span className="text-orange-400 font-mono">{arg.name}</span>
            </div>
            {arg.description && (
              <p className="text-gray-300 text-sm mt-2 ml-6">{arg.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Composant Return
const ReturnSection = ({ returnType, returnDescription }) => {
  if (!returnType) return null;
  
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-white">Returns</h2>
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-gray-400 text-sm">1</span>
          <span className="text-blue-400 font-mono font-semibold">{returnType}</span>
        </div>
        {returnDescription && (
          <p className="text-gray-300 text-sm mt-2 ml-6">{returnDescription}</p>
        )}
      </div>
    </div>
  );
};

// Composant principal
const FunctionDetailPage = ({ func, className, categoryName, categoryKey }) => {
  if (!func) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-4xl font-bold">Fonction non trouvée</h1>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-3 transition">
            <ChevronLeft size={20} />
            <span>Retour</span>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{func.name}</h1>
                <RealmBadge realm={func.realm} />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Link href={`/${categoryKey}`} className="hover:text-blue-400 transition">
                  {categoryName}
                </Link>
                <span>/</span>
                <Link href={`/${categoryKey}/${encodeURIComponent(className)}`} className="hover:text-blue-400 transition">
                  {className}
                </Link>
              </div>
            </div>
            
            {func.url && (
              <a
                href={func.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm"
              >
                <span>Source</span>
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-8">
        {/* Signature */}
        <div className="mb-8">
          <FunctionSignature func={func} />
        </div>

        {/* Description */}
        {func.description && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">Description</h2>
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
              <p className="text-gray-300 leading-relaxed">{func.description}</p>
            </div>
          </div>
        )}

        {/* Arguments */}
        <ArgumentsSection args={func.arguments} />

        {/* Returns */}
        <ReturnSection 
          returnType={func.returnType} 
          returnDescription={func.returnDescription} 
        />

        {/* Examples */}
        {func.examples && func.examples.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">Example</h2>
            {func.examples.map((example, idx) => (
              <div key={idx} className="mb-4">
                {example.title && (
                  <p className="text-gray-400 text-sm mb-2">{example.title}</p>
                )}
                <pre className="bg-gray-800 border border-gray-700 rounded-lg p-4 overflow-x-auto">
                  <code className="text-green-400 text-sm">{example.code || example}</code>
                </pre>
              </div>
            ))}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-12 pt-8 border-t border-gray-700 text-sm text-gray-400">
          <div className="flex items-center justify-between">
            <div>
              <p>Documentation for {className}</p>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href={func.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition"
              >
                View Source
              </a>
              <span>•</span>
              <Link href={`/${categoryKey}`} className="hover:text-blue-400 transition">
                Browse {categoryName}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FunctionDetailPage;