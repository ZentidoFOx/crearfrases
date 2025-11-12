"use client"

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Componente universal para renderizar Markdown usando react-markdown
 * Con soporte para GitHub Flavored Markdown y HTML raw
 */
export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Encabezados
          h1: ({node, ...props}) => (
            <h1 className="text-4xl font-bold mt-8 mb-6 text-gray-900 leading-tight" {...props} />
          ),
          h2: ({node, ...props}) => (
            <h2 className="text-3xl font-bold mt-8 mb-5 text-gray-900 leading-tight border-b-2 border-gray-200 pb-2" {...props} />
          ),
          h3: ({node, ...props}) => (
            <h3 className="text-2xl font-bold mt-6 mb-4 text-gray-800 leading-snug" {...props} />
          ),
          h4: ({node, ...props}) => (
            <h4 className="text-xl font-semibold mt-5 mb-3 text-gray-700" {...props} />
          ),
          h5: ({node, ...props}) => (
            <h5 className="text-lg font-semibold mt-4 mb-2 text-gray-700" {...props} />
          ),
          h6: ({node, ...props}) => (
            <h6 className="text-base font-semibold mt-3 mb-2 text-gray-600" {...props} />
          ),
          
          // Párrafos
          p: ({node, ...props}) => (
            <p className="mb-5 text-gray-700 leading-relaxed text-lg" {...props} />
          ),
          
          // Listas
          ul: ({node, ...props}) => (
            <ul className="list-disc list-outside ml-6 mb-5 space-y-2" {...props} />
          ),
          ol: ({node, ...props}) => (
            <ol className="list-decimal list-outside ml-6 mb-5 space-y-2" {...props} />
          ),
          li: ({node, ...props}) => (
            <li className="text-gray-700 text-lg leading-relaxed" {...props} />
          ),
          
          // Énfasis
          strong: ({node, ...props}) => (
            <strong className="font-bold text-gray-900" {...props} />
          ),
          em: ({node, ...props}) => (
            <em className="italic text-gray-800" {...props} />
          ),
          
          // Enlaces
          a: ({node, ...props}) => (
            <a 
              className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors" 
              target="_blank"
              rel="noopener noreferrer"
              {...props} 
            />
          ),
          
          // Blockquotes
          blockquote: ({node, ...props}) => (
            <blockquote 
              className="border-l-4 border-blue-500 bg-blue-50 pl-6 pr-4 py-4 italic my-6 text-gray-700 rounded-r-lg" 
              {...props} 
            />
          ),
          
          // Código
          code: ({node, inline, className, children, ...props}: any) => {
            const match = /language-(\w+)/.exec(className || '')
            return inline ? (
              <code 
                className="bg-gray-100 text-pink-600 px-2 py-1 rounded text-sm font-mono" 
                {...props}
              >
                {children}
              </code>
            ) : (
              <code 
                className="block bg-gray-900 text-gray-100 p-5 rounded-lg overflow-x-auto my-6 font-mono text-sm leading-relaxed" 
                {...props}
              >
                {children}
              </code>
            )
          },
          
          // Pre (bloques de código)
          pre: ({node, ...props}) => (
            <pre className="my-6 rounded-lg overflow-hidden" {...props} />
          ),
          
          // Imágenes
          img: ({node, ...props}) => (
            <img 
              className="rounded-lg max-w-full h-auto my-8 shadow-lg mx-auto" 
              loading="lazy"
              {...props} 
            />
          ),
          
          // Tablas (GFM)
          table: ({node, ...props}) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full divide-y divide-gray-300 border border-gray-300" {...props} />
            </div>
          ),
          thead: ({node, ...props}) => (
            <thead className="bg-gray-50" {...props} />
          ),
          tbody: ({node, ...props}) => (
            <tbody className="bg-white divide-y divide-gray-200" {...props} />
          ),
          tr: ({node, ...props}) => (
            <tr {...props} />
          ),
          th: ({node, ...props}) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900" {...props} />
          ),
          td: ({node, ...props}) => (
            <td className="px-4 py-3 text-sm text-gray-700" {...props} />
          ),
          
          // Líneas horizontales
          hr: ({node, ...props}) => (
            <hr className="my-8 border-t-2 border-gray-200" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
