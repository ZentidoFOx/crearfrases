"use client"

import { useState, useEffect } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, Heading2, Heading3, Link2, Image as ImageIcon, Search, X, Loader2 } from 'lucide-react'
import { useWebsite } from '@/contexts/website-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { renderToStaticMarkup } from 'react-dom/server'

interface WysiwygEditorProps {
  initialContent?: string
  onChange?: (content: string) => void
  showImagePicker?: boolean
  className?: string
}

export function WysiwygEditor({ 
  initialContent = '', 
  onChange,
  showImagePicker = true,
  className = ''
}: WysiwygEditorProps) {
  const { activeWebsite } = useWebsite()
  const [content, setContent] = useState(initialContent)
  const [showImages, setShowImages] = useState(false)
  const [showToolbar, setShowToolbar] = useState(false)
  const [showLink, setShowLink] = useState(false)
  const [linkType, setLinkType] = useState<'interno' | 'externo'>('externo')
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [images, setImages] = useState<any[]>([])
  const [cachedImages, setCachedImages] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [savedSelection, setSavedSelection] = useState<Range | null>(null)
  const [showCode, setShowCode] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [usedImages, setUsedImages] = useState<Set<number>>(new Set())
  const [searchCache, setSearchCache] = useState<Map<string, any[]>>(new Map())
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastContent, setLastContent] = useState('')
  const [showCursor, setShowCursor] = useState(false)
  const [markdownContent, setMarkdownContent] = useState('')

  // 🔥 Función para convertir Markdown a HTML usando react-markdown
  const markdownToHtml = (markdown: string): string => {
    if (!markdown) return '<p><br></p>'
    
    // Detectar si el contenido YA es HTML (buscar tags HTML comunes)
    const hasHtmlTags = /<(p|h1|h2|h3|h4|div|span|strong|em|ul|ol|li|img|a)[^>]*>/i.test(markdown)
    
    if (hasHtmlTags) {
      // Ya es HTML, retornar tal cual sin procesamiento
      console.log('✅ Contenido detectado como HTML, usando directamente')
      return markdown
    }
    
    // Si tiene sintaxis markdown, convertir a HTML
    const isMarkdown = markdown.includes('##') || markdown.includes('**') || markdown.includes('- ') || markdown.includes('1. ')
    
    if (isMarkdown) {
      try {
        // Convertir markdown a HTML usando react-markdown con plugins
        console.log('🔄 Convirtiendo Markdown a HTML...')
        const html = renderToStaticMarkup(
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]} 
            rehypePlugins={[rehypeRaw]}
          >
            {markdown}
          </ReactMarkdown>
        )
        
        return html
      } catch (error) {
        console.error('Error convirtiendo markdown:', error)
        return markdown
      }
    }
    
    // Si no es ni HTML ni Markdown, envolver en párrafo
    return `<p>${markdown}</p>`
  }

  // 🔥 Efecto de ESCRITURA tipo ChatGPT (typewriter effect)
  useEffect(() => {
    if (initialContent !== content && !isUpdating) {
      // Guardar contenido original (puede ser HTML o Markdown)
      setMarkdownContent(initialContent)
      setIsUpdating(true)
      
      // Mostrar cursor mientras se escribe
      setShowCursor(true)
      
      // Convertir a HTML si es necesario (detecta automáticamente)
      const htmlContent = markdownToHtml(initialContent)
      setContent(htmlContent)
      
      // Usar requestAnimationFrame para sincronizar con el repaint del navegador
      requestAnimationFrame(() => {
        const editorElement = document.getElementById('wysiwyg-editor')
        if (editorElement && htmlContent) {
          const currentHTML = editorElement.innerHTML.replace(/<span class="typing-cursor">.*?<\/span>/g, '')
          const cleanInitialContent = htmlContent.replace(/<span class="typing-cursor">.*?<\/span>/g, '')
          
          // ✍️ EFECTO DE ESCRITURA: Solo actualizar si hay diferencia
          if (currentHTML !== cleanInitialContent) {
            const scrollContainer = editorElement.closest('.overflow-y-auto')
            const wasNearBottom = scrollContainer ? 
              (scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight) < 300 : false
            
            // 🎬 ANIMACIÓN SUAVE de aparición
            if (cleanInitialContent.length > currentHTML.length) {
              // Contenido está creciendo - efecto typewriter
              editorElement.style.transition = 'opacity 0.1s ease-out'
              editorElement.style.opacity = '0.98'
              
              setTimeout(() => {
                // ✍️ Añadir cursor parpadeante al final
                const contentWithCursor = cleanInitialContent + '<span class="typing-cursor" style="display: inline-block; width: 2px; height: 1em; background: #3b82f6; margin-left: 2px; animation: blink 1s infinite;"></span>'
                editorElement.innerHTML = contentWithCursor
                editorElement.style.opacity = '1'
                
                // 🔽 AUTO-SCROLL INTELIGENTE
                if (scrollContainer && wasNearBottom) {
                  setTimeout(() => {
                    scrollContainer.scrollTo({
                      top: scrollContainer.scrollHeight,
                      behavior: 'smooth'
                    })
                  }, 50)
                }
              }, 10)
            } else {
              // Actualización normal (sin animación para updates menores)
              editorElement.innerHTML = cleanInitialContent
              
              if (scrollContainer && wasNearBottom) {
                scrollContainer.scrollTo({
                  top: scrollContainer.scrollHeight,
                  behavior: 'smooth'
                })
              }
            }
            
            setLastContent(cleanInitialContent)
          }
        }
        
        // Permitir siguiente actualización
        setTimeout(() => setIsUpdating(false), 30) // 30ms = ~33fps
      })
    }
  }, [initialContent])

  // Ocultar cursor cuando no hay actualizaciones
  useEffect(() => {
    if (showCursor) {
      const timer = setTimeout(() => {
        setShowCursor(false)
        // Limpiar cursor del DOM
        const editorElement = document.getElementById('wysiwyg-editor')
        if (editorElement) {
          editorElement.innerHTML = editorElement.innerHTML.replace(/<span class="typing-cursor">.*?<\/span>/g, '')
        }
      }, 1000) // Ocultar 1 segundo después de la última actualización
      
      return () => clearTimeout(timer)
    }
  }, [lastContent, showCursor])

  // Notificar cambios al padre (con debounce)
  useEffect(() => {
    if (!onChange) return
    
    const timer = setTimeout(() => {
      onChange(content)
      console.log('🔄 Contenido sincronizado con análisis SEO')
    }, 500) // Debounce de 500ms para no saturar el análisis
    
    return () => clearTimeout(timer)
  }, [content, onChange])

  // Cargar imágenes iniciales
  useEffect(() => {
    if (!activeWebsite?.url || !showImages || cachedImages.length > 0) return
    
    setLoading(true)
    
    const loadInitialImages = async () => {
      try {
        const url = `${activeWebsite.url}/wp-json/wp/v2/media?per_page=30&page=1&media_type=image`
        const res = await fetch(url)
        
        if (res.ok) {
          const data = await res.json()
          const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1')
          
          const formattedImages = data.map((i: any) => ({
            id: i.id,
            url: i.source_url,
            thumb: i.media_details?.sizes?.thumbnail?.source_url || i.source_url,
            title: i.title?.rendered || 'Sin título'
          }))
          
          setCachedImages(formattedImages)
          setImages(formattedImages)
          setHasMore(totalPages > 1)
          setPage(1)
        }
      } catch (e) {
        console.error('Error cargando imágenes:', e)
      } finally {
        setLoading(false)
      }
    }
    
    loadInitialImages()
  }, [showImages, activeWebsite?.url])

  // Manejar búsqueda
  useEffect(() => {
    if (!activeWebsite?.url || !showImages) return
    
    // Si no hay búsqueda, mostrar cache inicial
    if (!search || search.trim() === '') {
      console.log('✅ Mostrando cache inicial')
      setImages(cachedImages)
      setPage(1)
      return
    }
    
    // Verificar si ya tenemos esta búsqueda en cache
    const searchKey = search.trim().toLowerCase()
    if (searchCache.has(searchKey)) {
      console.log('✅ Usando cache de búsqueda:', searchKey)
      setImages(searchCache.get(searchKey) || [])
      setPage(1)
      return
    }
    
    // Si no está en cache, buscar en API
    console.log('🔍 Buscando en API:', search)
    setLoading(true)
    
    const timer = setTimeout(async () => {
      try {
        const url = `${activeWebsite.url}/wp-json/wp/v2/media?per_page=30&page=1&media_type=image&search=${encodeURIComponent(search)}`
        const res = await fetch(url)
        
        if (res.ok) {
          const data = await res.json()
          const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1')
          
          const formattedImages = data.map((i: any) => ({
            id: i.id,
            url: i.source_url,
            thumb: i.media_details?.sizes?.thumbnail?.source_url || i.source_url,
            title: i.title?.rendered || 'Sin título'
          }))
          
          // Guardar en cache de búsqueda
          setSearchCache(prev => new Map(prev).set(searchKey, formattedImages))
          setImages(formattedImages)
          setHasMore(totalPages > 1)
          setPage(1)
          
          console.log('✅ Búsqueda guardada en cache:', searchKey, formattedImages.length, 'imágenes')
        }
      } catch (e) {
        console.error('❌ Error en búsqueda:', e)
      } finally {
        setLoading(false)
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [search, showImages, activeWebsite?.url, cachedImages, searchCache])
  
  // Resetear página al cerrar modal (mantener búsqueda)
  useEffect(() => {
    if (!showImages) {
      setPage(1)
    }
  }, [showImages])

  // Limpiar búsqueda y cache al cambiar de sitio
  useEffect(() => {
    setSearch('')
    setCachedImages([])
    setImages([])
    setUsedImages(new Set())
    setSearchCache(new Map())
    setPage(1)
  }, [activeWebsite?.url])

  // Función para cargar más imágenes
  const loadMoreImages = async () => {
    if (!activeWebsite?.url || loadingMore || !hasMore) return
    
    setLoadingMore(true)
    
    try {
      const nextPage = page + 1
      const url = `${activeWebsite.url}/wp-json/wp/v2/media?per_page=30&page=${nextPage}&media_type=image${search ? `&search=${encodeURIComponent(search)}` : ''}`
      const res = await fetch(url)
      
      if (res.ok) {
        const data = await res.json()
        const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1')
        
        const formattedImages = data.map((i: any) => ({
          id: i.id,
          url: i.source_url,
          thumb: i.media_details?.sizes?.thumbnail?.source_url || i.source_url,
          title: i.title?.rendered || 'Sin título'
        }))
        
        if (search) {
          setImages(prev => [...prev, ...formattedImages])
        } else {
          setCachedImages(prev => [...prev, ...formattedImages])
          setImages(prev => [...prev, ...formattedImages])
        }
        
        setPage(nextPage)
        setHasMore(nextPage < totalPages)
      }
    } catch (e) {
      console.error('Error cargando más imágenes:', e)
    } finally {
      setLoadingMore(false)
    }
  }

  // Sincronizar editor visual
  useEffect(() => {
    if (!showCode) {
      const editor = document.getElementById('wysiwyg-editor')
      if (editor) {
        editor.innerHTML = content || '<p><br></p>'
      }
    }
  }, [showCode])

  // Inicializar editor
  useEffect(() => {
    const editor = document.getElementById('wysiwyg-editor')
    if (!editor) return

    if (!editor.innerHTML || editor.innerHTML === '') {
      editor.innerHTML = '<p><br></p>'
    }

    document.execCommand('defaultParagraphSeparator', false, 'p')
  }, [])

  const cmd = (c: string, v?: string) => {
    document.execCommand(c, false, v)
    const editor = document.getElementById('wysiwyg-editor')
    if (editor) setContent(editor.innerHTML)
  }

  const insertImage = (url: string, imageId: number) => {
    const editor = document.getElementById('wysiwyg-editor')
    if (!editor) return
    
    try {
      editor.focus()
      const success = document.execCommand('insertImage', false, url)
      setContent(editor.innerHTML)
      
      // Marcar imagen como usada
      setUsedImages(prev => new Set(prev).add(imageId))
      
      // Cerrar modal (mantener búsqueda para próxima vez)
      setShowImages(false)
    } catch (error) {
      console.error('Error insertando imagen:', error)
    }
  }

  const onMouseUp = () => {
    setTimeout(() => {
      const sel = window.getSelection()?.toString().trim()
      if (sel && sel.length > 0) {
        const range = window.getSelection()?.getRangeAt(0)
        if (range) {
          const rect = range.getBoundingClientRect()
          setSavedSelection(range.cloneRange())
          setPos({ 
            x: rect.left + rect.width / 2, 
            y: rect.top 
          })
          setShowToolbar(true)
          setShowLink(false)
        }
      } else {
        setShowToolbar(false)
        setShowLink(false)
      }
    }, 10)
  }

  const addLink = (url: string) => {
    if (!url || !savedSelection) return
    
    const fullUrl = linkType === 'externo' ? url : `${activeWebsite?.url || ''}${url}`
    
    if (savedSelection) {
      const sel = window.getSelection()
      if (sel) {
        sel.removeAllRanges()
        sel.addRange(savedSelection)
      }
    }
    
    document.execCommand('createLink', false, fullUrl)
    
    const editor = document.getElementById('wysiwyg-editor')
    if (editor) setContent(editor.innerHTML)
    
    setShowLink(false)
    setShowToolbar(false)
    setSavedSelection(null)
  }

  return (
    <div className={className}>
      {/* Estilos para el editor */}
      <style dangerouslySetInnerHTML={{ __html: `
        #wysiwyg-editor h2 {
          font-size: 2em;
          font-weight: 700;
          margin-top: 1.5em;
          margin-bottom: 0.75em;
          color: #1e293b;
          line-height: 1.3;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 0.3em;
        }
        
        #wysiwyg-editor h3 {
          font-size: 1.5em;
          font-weight: 600;
          margin-top: 1.25em;
          margin-bottom: 0.5em;
          color: #334155;
          line-height: 1.4;
        }
        
        #wysiwyg-editor p {
          margin-top: 1em;
          margin-bottom: 1em;
        }
        
        #wysiwyg-editor strong,
        #wysiwyg-editor b {
          font-weight: 700;
          color: #0f172a;
        }
        
        #wysiwyg-editor em,
        #wysiwyg-editor i {
          font-style: italic;
          color: #475569;
        }
        
        #wysiwyg-editor u {
          text-decoration: underline;
          text-decoration-color: #94a3b8;
        }
        
        #wysiwyg-editor ul {
          list-style-type: disc;
          margin-left: 2em;
          margin-top: 1em;
          margin-bottom: 1em;
          padding-left: 0.5em;
        }
        
        #wysiwyg-editor ol {
          list-style-type: decimal;
          margin-left: 2em;
          margin-top: 1em;
          margin-bottom: 1em;
          padding-left: 0.5em;
        }
        
        #wysiwyg-editor li {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          padding-left: 0.5em;
        }
        
        #wysiwyg-editor a {
          color: #2563eb;
          text-decoration: underline;
          text-decoration-color: #93c5fd;
          font-weight: 500;
        }
        
        #wysiwyg-editor a:hover {
          color: #1d4ed8;
          text-decoration-color: #2563eb;
        }
        
        #wysiwyg-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1.5em auto;
          display: block;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        #wysiwyg-editor blockquote {
          border-left: 4px solid #e2e8f0;
          padding-left: 1em;
          margin-left: 0;
          margin-top: 1.5em;
          margin-bottom: 1.5em;
          color: #64748b;
          font-style: italic;
        }
      ` }} />
      
      <div className="bg-white rounded-lg shadow-lg border">
        {/* Toolbar Sticky */}
        <div className="sticky top-0 z-10 flex justify-between items-center p-2 border-b bg-white backdrop-blur-sm shadow-sm">
          <div className="flex gap-1 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => cmd('formatBlock', 'h2')}><Heading2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => cmd('formatBlock', 'h3')}><Heading3 className="h-4 w-4" /></Button>
            <Separator orientation="vertical" className="h-8 mx-1" />
            <Button variant="ghost" size="sm" onClick={() => cmd('bold')}><Bold className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => cmd('italic')}><Italic className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => cmd('underline')}><Underline className="h-4 w-4" /></Button>
            <Separator orientation="vertical" className="h-8 mx-1" />
            <Button variant="ghost" size="sm" onClick={() => cmd('insertUnorderedList')}><List className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => cmd('insertOrderedList')}><ListOrdered className="h-4 w-4" /></Button>
            {showImagePicker && (
              <>
                <Separator orientation="vertical" className="h-8 mx-1" />
                <Button variant="ghost" size="sm" onClick={() => setShowImages(true)}><ImageIcon className="h-4 w-4" /></Button>
              </>
            )}
          </div>
          <Button 
            variant={showCode ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setShowCode(!showCode)}
            className="ml-2"
          >
            {showCode ? 'Visual' : 'Código'}
          </Button>
        </div>

        {/* Editor Visual */}
        <div
          id="wysiwyg-editor"
          contentEditable={!showCode}
          onInput={(e) => setContent(e.currentTarget.innerHTML)}
          onMouseUp={onMouseUp}
          className={`p-8 min-h-[500px] focus:outline-none ${showCode ? 'hidden' : ''}`}
          suppressContentEditableWarning
          style={{
            fontSize: '16px',
            lineHeight: '1.8',
            color: '#1a202c'
          }}
        />
        
        {/* Editor Código */}
        {showCode && (
          <textarea
            value={content}
            onChange={(e) => {
              const newContent = e.target.value
              setContent(newContent)
              const editor = document.getElementById('wysiwyg-editor')
              if (editor) editor.innerHTML = newContent
            }}
            className="w-full p-8 min-h-[500px] font-mono text-sm bg-gray-900 text-gray-100 focus:outline-none resize-none"
            spellCheck={false}
          />
        )}
      </div>

      {/* Modal Imágenes */}
      {showImages && showImagePicker && (
        <div className="fixed inset-0 bg-white z-50">
          <div className="border-b bg-white">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setShowImages(false)}>
                  <X className="h-5 w-5" />
                </Button>
                <h2 className="text-xl font-semibold">Biblioteca de Medios</h2>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  placeholder="Buscar medios" 
                  className="w-80 pl-10"
                />
              </div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto" style={{ height: 'calc(100vh - 140px)' }}>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              </div>
            ) : images.length > 0 ? (
              <>
                <div className="grid grid-cols-6 gap-4">
                  {images.map((img) => {
                    const isUsed = usedImages.has(img.id)
                    return (
                      <button 
                        key={img.id} 
                        onClick={() => insertImage(img.url, img.id)} 
                        className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all hover:shadow-lg ${
                          isUsed 
                            ? 'border-green-500 ring-2 ring-green-200' 
                            : 'border-gray-200 hover:border-blue-500'
                        }`}
                      >
                        <img src={img.thumb} alt={img.title} className="w-full h-full object-cover" />
                        
                        {/* Indicador de imagen usada */}
                        {isUsed && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-white text-xs font-medium truncate">{img.title}</p>
                            {isUsed && <p className="text-green-300 text-xs mt-1">✓ Usada</p>}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
                
                {/* Botón Cargar Más */}
                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <Button 
                      onClick={loadMoreImages} 
                      disabled={loadingMore}
                      variant="outline"
                      size="lg"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Cargando...
                        </>
                      ) : (
                        'Cargar más imágenes'
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 py-20">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No hay imágenes</p>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 border-t bg-white p-4">
            <p className="text-sm text-gray-600 text-center">
              Mostrando {images.length} de {search ? images.length : cachedImages.length} elementos de medios
            </p>
          </div>
        </div>
      )}

      {/* Toolbar Flotante */}
      {showToolbar && (
        <div className="fixed z-50 bg-white border rounded-lg shadow-2xl p-1.5 animate-in fade-in-0 zoom-in-95 duration-200" style={{ left: `${pos.x}px`, top: `${pos.y}px`, transform: 'translate(-50%, calc(-100% - 10px))' }}>
          {!showLink ? (
            <div className="flex gap-0.5">
              <Button variant="ghost" size="sm" onClick={() => cmd('bold')} className="h-8 w-8 p-0"><Bold className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => cmd('italic')} className="h-8 w-8 p-0"><Italic className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => cmd('underline')} className="h-8 w-8 p-0"><Underline className="h-4 w-4" /></Button>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button variant="ghost" size="sm" onClick={() => setShowLink(true)} className="h-8 w-8 p-0"><Link2 className="h-4 w-4" /></Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 p-2 w-80">
              <div className="flex gap-1">
                <Button variant={linkType === 'interno' ? 'default' : 'outline'} size="sm" onClick={() => setLinkType('interno')} className="flex-1 h-7 text-xs">Interno</Button>
                <Button variant={linkType === 'externo' ? 'default' : 'outline'} size="sm" onClick={() => setLinkType('externo')} className="flex-1 h-7 text-xs">Externo</Button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={linkType === 'interno' ? '/blog/articulo' : 'https://google.com'}
                  autoFocus
                  className="h-8 flex-1 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) addLink(e.currentTarget.value)
                    if (e.key === 'Escape') setShowLink(false)
                  }}
                />
                <Button size="sm" onClick={(e) => { const input = (e.currentTarget.previousElementSibling as HTMLInputElement); if (input?.value) addLink(input.value) }} className="h-8">✓</Button>
              </div>
              <p className="text-xs text-muted-foreground">{linkType === 'interno' ? `De ${activeWebsite?.name || 'tu sitio'}` : 'URL completa'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
