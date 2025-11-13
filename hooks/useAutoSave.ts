import { useEffect, useRef, useCallback, useState } from 'react'

// Implementación simple de debounce
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null

  const debouncedFunction = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }) as T & { cancel: () => void }

  debouncedFunction.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return debouncedFunction
}

interface UseAutoSaveOptions {
  delay?: number // Delay en ms para el debounce (default: 2000ms)
  enabled?: boolean // Si el auto-save está habilitado
  onSave: (data: any) => Promise<void> // Función para guardar
  onError?: (error: any) => void // Función para manejar errores
  onSuccess?: () => void // Función para éxito
}

interface AutoSaveState {
  isSaving: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  error: string | null
}

export function useAutoSave(data: any, options: UseAutoSaveOptions) {
  const {
    delay = 2000,
    enabled = true,
    onSave,
    onError,
    onSuccess
  } = options

  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    error: null
  })

  const previousDataRef = useRef<any>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Función de guardado con debounce
  const debouncedSave = useCallback(
    debounce(async (dataToSave: any) => {
      if (!enabled) return

      try {
        setState(prev => ({ ...prev, isSaving: true, error: null }))
        
        console.log('🔄 Auto-guardando...', {
          timestamp: new Date().toISOString(),
          dataSize: JSON.stringify(dataToSave).length
        })

        await onSave(dataToSave)
        
        setState(prev => ({
          ...prev,
          isSaving: false,
          lastSaved: new Date(),
          hasUnsavedChanges: false,
          error: null
        }))

        onSuccess?.()
        console.log('✅ Auto-guardado exitoso')

      } catch (error: any) {
        console.error('❌ Error en auto-guardado:', error)
        
        setState(prev => ({
          ...prev,
          isSaving: false,
          error: error.message || 'Error al guardar'
        }))

        onError?.(error)
      }
    }, delay),
    [delay, enabled, onSave, onError, onSuccess]
  )

  // Detectar cambios en los datos
  useEffect(() => {
    if (!enabled) {
      console.log('🚫 [AUTO-SAVE] Deshabilitado')
      return
    }

    // Comparar datos actuales con anteriores
    const currentDataStr = JSON.stringify(data)
    const previousDataStr = JSON.stringify(previousDataRef.current)

    console.log('🔍 [AUTO-SAVE] Verificando cambios:', {
      hasData: !!data,
      currentLength: currentDataStr.length,
      previousLength: previousDataStr.length,
      isFirstTime: previousDataRef.current === null,
      hasChanges: previousDataRef.current !== null && currentDataStr !== previousDataStr
    })

    if (previousDataRef.current !== null && currentDataStr !== previousDataStr) {
      console.log('📝 [AUTO-SAVE] Cambios detectados, programando auto-guardado...', {
        contentLength: data?.content?.length || 0,
        title: data?.title || 'sin título'
      })
      
      setState(prev => ({ ...prev, hasUnsavedChanges: true, error: null }))
      
      // Cancelar guardado anterior si existe
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Programar nuevo guardado
      debouncedSave(data)
    }

    // Actualizar referencia de datos anteriores
    previousDataRef.current = data

  }, [data, enabled, debouncedSave])

  // Función para forzar guardado inmediato
  const forceSave = useCallback(async () => {
    if (!enabled || state.isSaving) return

    // Cancelar debounce pendiente
    debouncedSave.cancel()
    
    try {
      setState(prev => ({ ...prev, isSaving: true, error: null }))
      
      console.log('⚡ Guardado forzado...')
      await onSave(data)
      
      setState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        error: null
      }))

      onSuccess?.()
      console.log('✅ Guardado forzado exitoso')

    } catch (error: any) {
      console.error('❌ Error en guardado forzado:', error)
      
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: error.message || 'Error al guardar'
      }))

      onError?.(error)
    }
  }, [data, enabled, state.isSaving, onSave, onSuccess, onError, debouncedSave])

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      debouncedSave.cancel()
    }
  }, [debouncedSave])

  return {
    ...state,
    forceSave,
    cancel: debouncedSave.cancel
  }
}
