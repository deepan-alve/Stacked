#!/usr/bin/env node

/**
 * AniList Integration Test Script
 * Tests the various components and APIs we've built
 */

import { anilistClient, getCurrentSeason } from '../src/lib/api/anilist.js'

async function testAniListIntegration() {
  console.log('🚀 Testing AniList Integration...\n')

  try {
    // Test 1: Basic search functionality
    console.log('1. Testing anime search...')
    const searchResults = await anilistClient.searchAnime('Attack on Titan', 1, 5)
    console.log(`✓ Found ${searchResults.data.Page.media.length} results`)
    console.log(`   First result: ${searchResults.data.Page.media[0]?.title.romaji}`)

    // Test 2: Get trending anime
    console.log('\n2. Testing trending anime...')
    const trendingResults = await anilistClient.getTrendingAnime(1, 5)
    console.log(`✓ Found ${trendingResults.data.Page.media.length} trending anime`)
    console.log(`   Top trending: ${trendingResults.data.Page.media[0]?.title.romaji}`)

    // Test 3: Get seasonal anime
    console.log('\n3. Testing seasonal anime...')
    const { season, year } = getCurrentSeason()
    const seasonalResults = await anilistClient.getSeasonalAnime(season, year, 1, 5)
    console.log(`✓ Found ${seasonalResults.data.Page.media.length} ${season} ${year} anime`)
    console.log(`   Current season example: ${seasonalResults.data.Page.media[0]?.title.romaji}`)

    // Test 4: Get anime details
    console.log('\n4. Testing anime details...')
    const animeId = searchResults.data.Page.media[0]?.id
    if (animeId) {
      const detailsResult = await anilistClient.getAnimeDetails(animeId)
      console.log(`✓ Retrieved details for: ${detailsResult.data.Media.title.romaji}`)
      console.log(`   Episodes: ${detailsResult.data.Media.episodes || 'N/A'}`)
      console.log(`   Genres: ${detailsResult.data.Media.genres.slice(0, 3).join(', ')}`)
    }

    // Test 5: OAuth URL generation
    console.log('\n5. Testing OAuth URL generation...')
    const authUrl = anilistClient.getAuthUrl()
    console.log(`✓ Generated OAuth URL: ${authUrl.substring(0, 50)}...`)

    console.log('\n🎉 All AniList integration tests passed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAniListIntegration()
}

export { testAniListIntegration }
