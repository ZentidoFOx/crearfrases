/**
 * Script de prueba para verificar el estado del backend
 */

const API_BASE = 'https://api-writer.turin.dev/api/v1'

async function testBackend() {
  console.log('🧪 Probando conexión con el backend...')
  console.log('🔗 URL:', API_BASE)
  
  try {
    // Test 1: Verificar si el servidor responde
    console.log('\n📡 Test 1: Ping al servidor...')
    const pingResponse = await fetch(API_BASE + '/auth/login', {
      method: 'OPTIONS'
    })
    console.log('Status:', pingResponse.status)
    console.log('Headers:', Object.fromEntries(pingResponse.headers.entries()))
    
    // Test 2: Intentar login con credenciales de prueba
    console.log('\n🔐 Test 2: Intentar login...')
    const loginResponse = await fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'test',
        password: 'test'
      })
    })
    
    console.log('Login Status:', loginResponse.status)
    console.log('Login Headers:', Object.fromEntries(loginResponse.headers.entries()))
    
    const loginText = await loginResponse.text()
    console.log('Login Response:', loginText.substring(0, 500))
    
    // Test 3: Verificar si es HTML (error 500 típico)
    if (loginText.includes('<html>') || loginText.includes('<!DOCTYPE')) {
      console.log('❌ El servidor está devolviendo HTML en lugar de JSON')
      console.log('❌ Esto indica un error 500 interno del servidor')
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message)
  }
}

// Ejecutar si se llama directamente
if (typeof window === 'undefined') {
  testBackend()
}

module.exports = { testBackend }
