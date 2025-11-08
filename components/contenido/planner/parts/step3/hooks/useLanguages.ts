import { useState, useEffect } from 'react'

export interface Language {
  code: string
  name: string
  locale: string
  is_default: boolean
  flag: string | null
  url: string
}

interface LanguagesAPIResponse {
  success: boolean
  total: number
  has_multilanguage_plugin: boolean
  plugin: string
  data: Language[]
}

export const useLanguages = (siteUrl: string | undefined) => {
  const [languages, setLanguages] = useState<Language[]>([
    { code: 'es', name: 'Español', locale: 'es_ES', is_default: true, flag: null, url: '' }
  ])
  const [currentLanguage, setCurrentLanguage] = useState<string>('es')
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false)

  useEffect(() => {
    const fetchLanguages = async () => {
      if (!siteUrl) {
        console.log('⚠️ No hay URL de sitio para cargar idiomas')
        return
      }

      setIsLoadingLanguages(true)
      
      try {
        const url = `${siteUrl}/wp-json/content-search/v1/languages`
        console.log('🌐 Cargando idiomas desde:', url)
        
        const response = await fetch(url)
        
        if (response.ok) {
          const apiResponse: LanguagesAPIResponse = await response.json()
          console.log('✅ Respuesta completa de idiomas:', apiResponse)
          
          // La API devuelve { success, total, data: [] }
          if (apiResponse.success && Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
            setLanguages(apiResponse.data)
            console.log('✅ Idiomas parseados:', apiResponse.data)
            
            // Buscar español primero, luego idioma por defecto, luego el primero
            const spanishLang = apiResponse.data.find(l => l.code === 'es')
            const defaultLang = apiResponse.data.find(l => l.is_default)
            const initialLang = spanishLang || defaultLang || apiResponse.data[0]
            
            setCurrentLanguage(initialLang.code)
            console.log('🌐 Idioma inicial establecido:', initialLang.code, '(Español por defecto)')
          } else {
            console.warn('⚠️ La respuesta no tiene datos válidos:', apiResponse)
            setLanguages([{ code: 'es', name: 'Español', locale: 'es_ES', is_default: true, flag: null, url: '' }])
          }
        } else {
          console.error('❌ Error cargando idiomas:', response.status)
          // Fallback a español si falla
          setLanguages([{ code: 'es', name: 'Español', locale: 'es_ES', is_default: true, flag: null, url: '' }])
        }
      } catch (error) {
        console.error('❌ Error en fetch de idiomas:', error)
        // Fallback a español si falla
        setLanguages([{ code: 'es', name: 'Español', locale: 'es_ES', is_default: true, flag: null, url: '' }])
      } finally {
        setIsLoadingLanguages(false)
      }
    }

    fetchLanguages()
  }, [siteUrl])

  return {
    languages,
    currentLanguage,
    setCurrentLanguage,
    isLoadingLanguages
  }
}
