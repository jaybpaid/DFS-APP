#!/usr/bin/env node
/**
 * DraftKings Data Prefetch Script
 * Fetches live player pools and saves to JSON for production builds
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Make HTTPS request and return parsed JSON
 */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'application/json',
      },
    };

    https
      .get(url, options, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (err) {
            reject(new Error(`Failed to parse JSON: ${err.message}`));
          }
        });
      })
      .on('error', err => {
        reject(err);
      });
  });
}

/**
 * Find main slate from contests
 */
function findMainSlate(contests, sport) {
  if (!contests || contests.length === 0) return null;

  const now = new Date();
  const validContests = contests.filter(contest => {
    const startTime = new Date(contest.startTimeType || contest.startTime);
    const isToday = startTime.toDateString() === now.toDateString();
    const isMainType =
      contest.gameType === 'Classic' ||
      contest.name?.includes('Main') ||
      contest.name?.includes('Millionaire') ||
      contest.name?.includes('GPP');
    return isToday && isMainType && contest.draftGroupId;
  });

  // Return the most popular (highest entry count) main slate
  return (
    validContests.sort((a, b) => (b.totalEntries || 0) - (a.totalEntries || 0))[0] ||
    contests.find(c => c.draftGroupId)
  ); // Fallback to any contest with draftGroupId
}

/**
 * Validate player pool meets minimum requirements
 */
function validatePool(players, sport) {
  const minSizes = { NFL: 250, NBA: 150 };
  const minSize = minSizes[sport];

  if (players.length < minSize) {
    throw new Error(
      `Player pool too small: ${players.length} < ${minSize} for ${sport}`
    );
  }

  // Check positions
  const positions = new Set(players.map(p => p.rosterSlotId || p.position));
  const expectedPositions =
    sport === 'NFL'
      ? ['QB', 'RB', 'WR', 'TE', 'DST', 'K']
      : ['PG', 'SG', 'SF', 'PF', 'C'];

  const missingPositions = expectedPositions.filter(
    pos => !Array.from(positions).some(p => p.includes(pos))
  );

  if (missingPositions.length > 0) {
    console.warn(`⚠️ Missing positions for ${sport}: ${missingPositions.join(', ')}`);
  }

  console.log(
    `✅ Validation passed: ${players.length} ${sport} players, ${positions.size} position types`
  );
}

/**
 * Prefetch data for a specific sport
 */
async function prefetchSport(sport) {
  try {
    console.log(`\n🔄 Prefetching ${sport} data from DraftKings...`);

    // Step 1: Get contests
    const contestsUrl = `https://www.draftkings.com/lobby/getcontests?sport=${sport.toLowerCase()}`;
    console.log(`Fetching contests: ${contestsUrl}`);

    const contestsData = await fetchJson(contestsUrl);
    const contests = contestsData.contests || [];
    console.log(`Found ${contests.length} contests`);

    // Step 2: Find main slate
    const mainSlate = findMainSlate(contests, sport);
    if (!mainSlate) {
      throw new Error(`No suitable ${sport} slate found`);
    }

    console.log(`Selected slate: ${mainSlate.name} (ID: ${mainSlate.draftGroupId})`);

    // Step 3: Get draftables
    const draftablesUrl = `https://api.draftkings.com/draftgroups/v1/draftgroups/${mainSlate.draftGroupId}/draftables`;
    console.log(`Fetching draftables: ${draftablesUrl}`);

    const draftablesData = await fetchJson(draftablesUrl);
    const players = draftablesData.draftables || [];

    // Step 4: Validate
    validatePool(players, sport);

    // Step 5: Create enriched dataset
    const enrichedData = {
      timestamp: new Date().toISOString(),
      sport: sport,
      site: 'DraftKings',
      slate: {
        id: mainSlate.draftGroupId,
        name: mainSlate.name,
        startTime: mainSlate.startTime,
        gameCount: mainSlate.gameCount || 0,
      },
      validation: {
        totalPlayers: players.length,
        validatedAt: new Date().toISOString(),
        passedMinimumCheck: true,
      },
      players: players,
    };

    // Step 6: Save to file
    const filename = `dk_${sport.toLowerCase()}_${mainSlate.draftGroupId}.json`;
    const filepath = path.join(OUTPUT_DIR, filename);

    fs.writeFileSync(filepath, JSON.stringify(enrichedData, null, 2));
    console.log(`✅ Saved ${players.length} players to ${filename}`);

    // Also save as latest
    const latestFilename = `dk_${sport.toLowerCase()}_latest.json`;
    const latestFilepath = path.join(OUTPUT_DIR, latestFilename);
    fs.writeFileSync(latestFilepath, JSON.stringify(enrichedData, null, 2));
    console.log(`✅ Updated ${latestFilename}`);

    return {
      sport,
      success: true,
      playerCount: players.length,
      slateId: mainSlate.draftGroupId,
      filename: filename,
    };
  } catch (error) {
    console.error(`❌ Failed to prefetch ${sport}:`, error.message);
    return {
      sport,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate validation report
 */
function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    prefetchResults: results,
    summary: {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    },
  };

  const reportPath = path.join(OUTPUT_DIR, 'prefetch_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n📊 PREFETCH REPORT:');
  console.log(`Total sports: ${report.summary.total}`);
  console.log(`Successful: ${report.summary.successful}`);
  console.log(`Failed: ${report.summary.failed}`);

  results.forEach(result => {
    if (result.success) {
      console.log(
        `✅ ${result.sport}: ${result.playerCount} players (${result.filename})`
      );
    } else {
      console.log(`❌ ${result.sport}: ${result.error}`);
    }
  });

  return report;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 DraftKings Data Prefetch Starting...');

  const sports = ['NFL', 'NBA'];
  const results = [];

  for (const sport of sports) {
    const result = await prefetchSport(sport);
    results.push(result);

    // Add delay between requests
    if (sports.indexOf(sport) < sports.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const report = generateReport(results);

  console.log(`\n🎯 Prefetch completed! Files saved to: ${OUTPUT_DIR}`);

  // Exit with error if any failed
  if (report.summary.failed > 0) {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error('💥 Prefetch failed:', err);
    process.exit(1);
  });
}

module.exports = { prefetchSport, generateReport };
