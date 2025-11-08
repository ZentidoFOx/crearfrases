import { useState } from 'react'

export interface FormErrors {
  [key: string]: string[]
}

export function useAuthForm() {
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState<string>('')

  const clearErrors = () => {
    setErrors({})
    setGeneralError('')
  }

  const handleError = (error: any) => {
    if (error?.error?.details) {
      // Validation errors
      setErrors(error.error.details)
      setGeneralError('')
    } else if (error?.error?.message) {
      // General error message
      setGeneralError(error.error.message)
      setErrors({})
    } else {
      // Unknown error
      setGeneralError('Ocurrió un error. Por favor, intenta de nuevo.')
      setErrors({})
    }
  }

  return {
    errors,
    isSubmitting,
    generalError,
    setIsSubmitting,
    clearErrors,
    handleError,
  }
}
