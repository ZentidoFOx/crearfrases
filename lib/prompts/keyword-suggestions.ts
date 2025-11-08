/**
 * Prompt for generating keyword suggestions
 */

export interface KeywordSuggestionsPromptParams {
  baseKeyword: string
  existingKeywords: string[]
}

export function buildKeywordSuggestionsPrompt(params: KeywordSuggestionsPromptParams): string {
  const { baseKeyword, existingKeywords } = params
  
  const existingList = existingKeywords.length > 0 
    ? `\n\nPalabras clave YA EXISTENTES (NO incluir):\n${existingKeywords.map(k => `- ${k}`).join('\n')}`
    : ''

  return `Eres un experto en SEO y marketing de contenidos. 

Palabra clave base: "${baseKeyword}"${existingList}

Genera 10 sugerencias de palabras clave relacionadas que:
1. Sean DIFERENTES a las existentes (no duplicados)
2. Tengan potencial de posicionamiento SEO
3. Sean relevantes para el tema principal
4. Incluyan variaciones long-tail
5. Estén en español

Formato: Una palabra clave por línea, sin números ni guiones.`
}
