/**
 * Funciones de validación para formularios
 */

/**
 * Normaliza un campo de texto eliminando espacios al inicio, al final y espacios dobles
 * @param value - Valor del campo
 * @returns Valor normalizado
 */
export function normalizeTextInput(value: string): string {
  // Eliminar espacios al inicio y al final
  let normalized = value.trimStart()
  
  // Reemplazar espacios dobles o múltiples por un solo espacio
  normalized = normalized.replace(/\s+/g, ' ')
  
  return normalized
}

/**
 * Valida y normaliza un campo de texto en tiempo real mientras el usuario escribe
 * Previene espacios al inicio, al final y espacios dobles
 * @param value - Valor actual del campo
 * @param previousValue - Valor anterior del campo (para comparar)
 * @returns Valor normalizado
 */
export function handleTextInputChange(value: string, previousValue: string = ""): string {
  // Si el usuario está escribiendo al inicio y agrega un espacio, no permitirlo
  if (value.startsWith(' ')) {
    return previousValue
  }
  
  // Si hay espacios dobles o múltiples, reemplazarlos por uno solo
  let normalized = value.replace(/\s{2,}/g, ' ')
  
  return normalized
}

/**
 * Valida que un campo contenga solo números
 * @param value - Valor del campo
 * @returns Valor con solo números (sin caracteres especiales)
 */
export function normalizeNumericInput(value: string): string {
  // Eliminar todo lo que no sea número
  return value.replace(/\D/g, '')
}

/**
 * Valida y normaliza un campo numérico en tiempo real
 * Solo permite números, sin caracteres especiales
 * @param value - Valor actual del campo
 * @returns Valor con solo números
 */
export function handleNumericInputChange(value: string): string {
  return normalizeNumericInput(value)
}

/**
 * Valida un campo de texto antes de guardarlo
 * Asegura que no tenga espacios al inicio, al final ni espacios dobles
 * @param value - Valor a validar
 * @returns Valor validado y normalizado
 */
export function validateAndNormalizeText(value: string): string {
  return normalizeTextInput(value).trimEnd()
}

