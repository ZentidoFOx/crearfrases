/**
 * Test file for AI Service
 * Run this to verify multi-llm-ts integration
 */

import { aiService } from './ai-service'

export async function testAIService() {
  console.log('🧪 Testing AI Service with multi-llm-ts...\n')
  
  try {
    // Test 1: Check provider info
    console.log('📊 Test 1: Provider Info')
    const info = aiService.getProviderInfo()
    console.log(`   Provider: ${info.provider}`)
    console.log(`   Model: ${info.model}`)
    console.log(`   Ready: ${aiService.isReady()}\n`)
    
    // Test 2: Basic generation
    console.log('💬 Test 2: Basic Generation')
    console.log('   Generating response...')
    const response = await aiService.generate('Di "Hola" en una palabra')
    console.log(`   Response: ${response}\n`)
    
    // Test 3: Streaming generation
    console.log('⚡ Test 3: Streaming Generation')
    console.log('   Starting stream...')
    let streamedText = ''
    await aiService.generateWithStreaming(
      'Cuenta del 1 al 5, un número por vez',
      {
        onChunk: (chunk, full) => {
          process.stdout.write(chunk)
          streamedText = full
        },
        onComplete: () => {
          console.log('\n   ✅ Stream completed')
        },
        onError: (error) => {
          console.error('   ❌ Stream error:', error)
        }
      }
    )
    console.log(`   Full text: ${streamedText}\n`)
    
    // Test 4: List streaming
    console.log('📝 Test 4: List Streaming')
    console.log('   Generating list...')
    let count = 0
    for await (const item of aiService.generateListStream(
      'Dame 3 colores, uno por línea, sin numeración'
    )) {
      count++
      console.log(`   ${count}. ${item}`)
    }
    console.log('   ✅ List completed\n')
    
    // Test 5: JSON generation
    console.log('🔗 Test 5: JSON Generation')
    console.log('   Generating structured data...')
    const jsonData = await aiService.generateJSON<{name: string, age: number}>(
      'Responde con un objeto JSON con name: "Juan" y age: 30'
    )
    console.log(`   JSON: ${JSON.stringify(jsonData, null, 2)}\n`)
    
    console.log('✅ All tests passed!\n')
    
    return {
      success: true,
      provider: info.provider,
      model: info.model
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Run tests if executed directly
if (require.main === module) {
  testAIService().then((result) => {
    console.log('Test Result:', result)
    process.exit(result.success ? 0 : 1)
  })
}
