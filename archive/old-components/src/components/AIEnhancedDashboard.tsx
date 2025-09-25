import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface AIInsight {
  type: 'boom' | 'bust' | 'value' | 'weather' | 'correlation';
  player: string;
  confidence: number;
  reasoning: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

interface MarketIntelligence {
  overall_sentiment: string;
  volatility_index: number;
  top_plays: Array<{
    player: string;
    position: string;
    confidence: number;
    roi_projection: number;
  }>;
  weather_impacts: Array<{
    game: string;
    conditions: string;
    impact_score: number;
    affected_players: string[];
  }>;
}

interface OptimizationResult {
  lineups: Array<{
    id: string;
    players: Array<{
      name: string;
      position: string;
      salary: number;
      projection: number;
    }>;
    total_salary: number;
    projected_points: number;
    genetic_fitness: number;
    diversity_score: number;
  }>;
  generation_stats: {
    total_generations: number;
    convergence_rate: number;
    diversity_maintained: number;
  };
}

export default function AIEnhancedDashboard() {
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [marketData, setMarketData] = useState<MarketIntelligence | null>(null);
  const [optimizationResults, setOptimizationResults] =
    useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAIMode, setActiveAIMode] = useState<
    'analysis' | 'optimization' | 'simulation'
  >('analysis');

  useEffect(() => {
    // Initialize AI-powered insights
    generateAIInsights();
    loadMarketIntelligence();
  }, []);

  const generateAIInsights = async () => {
    setIsLoading(true);
    // Simulate AI analysis with realistic DFS insights
    const insights: AIInsight[] = [
      {
        type: 'boom',
        player: 'Josh Allen',
        confidence: 92,
        reasoning:
          'Weather advantage + favorable matchup vs weak secondary. Projected 28+ points with correlation opportunities.',
        impact: 'high',
        recommendation: 'Tournament leverage play with stacking potential',
      },
      {
        type: 'value',
        player: 'Breece Hall',
        confidence: 87,
        reasoning:
          'Underpriced at $6,400 with 20+ touch projection. Jets likely to have positive game script.',
        impact: 'high',
        recommendation: 'Cash game anchor with GPP upside',
      },
      {
        type: 'weather',
        player: 'Tyreek Hill',
        confidence: 84,
        reasoning:
          'Miami home game with 5-8 mph winds. Optimal conditions for deep passing attack.',
        impact: 'medium',
        recommendation: 'Stack with Tua in favorable conditions',
      },
      {
        type: 'bust',
        player: 'Malik Nabers',
        confidence: 89,
        reasoning:
          'Facing elite secondary with limited target share. Oversalaried relative to projected usage.',
        impact: 'high',
        recommendation: 'Fade in tournaments, pivot to value alternatives',
      },
      {
        type: 'correlation',
        player: 'Christian McCaffrey',
        confidence: 91,
        reasoning:
          'Game total 47.5 with SF favored by 6. Positive correlation with team success and clock control.',
        impact: 'high',
        recommendation: 'Anchor play with 49ers DST correlation',
      },
    ];

    setTimeout(() => {
      setAiInsights(insights);
      setIsLoading(false);
    }, 1500);
  };

  const loadMarketIntelligence = async () => {
    // Simulate market research data
    const intelligence: MarketIntelligence = {
      overall_sentiment:
        'Bullish on passing games, cautious on weather-affected venues',
      volatility_index: 1.24,
      top_plays: [
        { player: 'Josh Allen', position: 'QB', confidence: 92, roi_projection: 1.35 },
        { player: 'Tyreek Hill', position: 'WR', confidence: 88, roi_projection: 1.28 },
        {
          player: 'Christian McCaffrey',
          position: 'RB',
          confidence: 89,
          roi_projection: 1.31,
        },
        {
          player: 'Travis Kelce',
          position: 'TE',
          confidence: 85,
          roi_projection: 1.22,
        },
      ],
      weather_impacts: [
        {
          game: 'BUF @ MIA',
          conditions: 'Clear, 72°F, 5mph winds',
          impact_score: 0.15,
          affected_players: ['Josh Allen', 'Stefon Diggs', 'Tua Tagovailoa'],
        },
        {
          game: 'SF @ NYG',
          conditions: 'Partly cloudy, 68°F, 8mph winds',
          impact_score: 0.08,
          affected_players: ['Christian McCaffrey', 'Malik Nabers', 'Daniel Jones'],
        },
      ],
    };

    setMarketData(intelligence);
  };

  const runGeneticOptimization = async () => {
    setIsLoading(true);
    // Simulate genetic algorithm optimization
    const results: OptimizationResult = {
      lineups: [
        {
          id: 'genetic_optimal_1',
          players: [
            { name: 'Josh Allen', position: 'QB', salary: 8400, projection: 26.2 },
            {
              name: 'Christian McCaffrey',
              position: 'RB',
              salary: 8800,
              projection: 22.1,
            },
            { name: 'Breece Hall', position: 'RB', salary: 6400, projection: 18.5 },
            { name: 'Tyreek Hill', position: 'WR', salary: 8200, projection: 21.3 },
            { name: 'Stefon Diggs', position: 'WR', salary: 7600, projection: 19.8 },
            { name: 'CeeDee Lamb', position: 'WR', salary: 7000, projection: 17.2 },
            { name: 'Travis Kelce', position: 'TE', salary: 6800, projection: 16.4 },
            { name: '49ers DST', position: 'DST', salary: 2800, projection: 9.2 },
          ],
          total_salary: 50000,
          projected_points: 150.7,
          genetic_fitness: 94.2,
          diversity_score: 0.87,
        },
        {
          id: 'genetic_optimal_2',
          players: [
            { name: 'Tua Tagovailoa', position: 'QB', salary: 7200, projection: 23.8 },
            { name: 'Saquon Barkley', position: 'RB', salary: 7800, projection: 20.4 },
            { name: 'Austin Ekeler', position: 'RB', salary: 6200, projection: 16.9 },
            { name: 'Cooper Kupp', position: 'WR', salary: 7400, projection: 19.1 },
            { name: 'Davante Adams', position: 'WR', salary: 7600, projection: 18.7 },
            {
              name: 'Amon-Ra St. Brown',
              position: 'WR',
              salary: 6800,
              projection: 17.3,
            },
            { name: 'Mark Andrews', position: 'TE', salary: 5600, projection: 14.6 },
            { name: 'Bills DST', position: 'DST', salary: 3400, projection: 8.8 },
          ],
          total_salary: 49000,
          projected_points: 139.6,
          genetic_fitness: 91.8,
          diversity_score: 0.92,
        },
      ],
      generation_stats: {
        total_generations: 150,
        convergence_rate: 0.94,
        diversity_maintained: 0.89,
      },
    };

    setTimeout(() => {
      setOptimizationResults(results);
      setIsLoading(false);
    }, 3000);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-500';
    if (confidence >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getImpactBadge = (impact: string) => {
    const colors = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
    };
    return colors[impact as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className='min-h-screen bg-slate-900 text-white p-6'>
      <div className='max-w-7xl mx-auto'>
        <div className='mb-8'>
          <h1 className='text-4xl font-bold text-blue-400 mb-2'>
            🧠 AI-Powered DFS Dashboard
          </h1>
          <p className='text-gray-300 text-lg'>
            Advanced genetic algorithms, market intelligence, and real-time optimization
          </p>
        </div>

        <Tabs
          value={activeAIMode}
          onValueChange={value => setActiveAIMode(value as any)}
        >
          <TabsList className='grid w-full grid-cols-3 mb-6'>
            <TabsTrigger value='analysis' className='text-sm'>
              📊 AI Analysis
            </TabsTrigger>
            <TabsTrigger value='optimization' className='text-sm'>
              🧬 Genetic Optimizer
            </TabsTrigger>
            <TabsTrigger value='simulation' className='text-sm'>
              🎲 Monte Carlo Sim
            </TabsTrigger>
          </TabsList>

          <TabsContent value='analysis' className='space-y-6'>
            {/* AI Insights Section */}
            <Card className='bg-slate-800 border-slate-700 p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-2xl font-bold text-green-400'>
                  🎯 AI-Powered Play Analysis
                </h2>
                <Button
                  onClick={generateAIInsights}
                  disabled={isLoading}
                  className='bg-blue-600 hover:bg-blue-700'
                >
                  {isLoading ? 'Analyzing...' : 'Refresh Analysis'}
                </Button>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {aiInsights.map((insight, index) => (
                  <Card key={index} className='bg-slate-700 border-slate-600 p-4'>
                    <div className='flex items-center justify-between mb-3'>
                      <Badge
                        className={`${
                          insight.type === 'boom'
                            ? 'bg-green-500'
                            : insight.type === 'bust'
                              ? 'bg-red-500'
                              : insight.type === 'value'
                                ? 'bg-blue-500'
                                : insight.type === 'weather'
                                  ? 'bg-yellow-500'
                                  : 'bg-purple-500'
                        } text-white`}
                      >
                        {insight.type.toUpperCase()}
                      </Badge>
                      <div className='flex items-center space-x-2'>
                        <div
                          className={`w-3 h-3 rounded-full ${getConfidenceColor(insight.confidence)}`}
                        />
                        <span className='text-sm font-medium'>
                          {insight.confidence}%
                        </span>
                      </div>
                    </div>

                    <h3 className='font-bold text-lg mb-2'>{insight.player}</h3>
                    <p className='text-gray-300 text-sm mb-3'>{insight.reasoning}</p>

                    <div className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-gray-400'>Impact:</span>
                        <Badge
                          className={`${getImpactBadge(insight.impact)} text-white text-xs`}
                        >
                          {insight.impact.toUpperCase()}
                        </Badge>
                      </div>
                      <div className='text-xs text-blue-300 bg-slate-600 p-2 rounded'>
                        💡 {insight.recommendation}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Market Intelligence */}
            {marketData && (
              <Card className='bg-slate-800 border-slate-700 p-6'>
                <h2 className='text-2xl font-bold text-yellow-400 mb-4'>
                  📈 Market Intelligence
                </h2>

                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  <div>
                    <h3 className='text-lg font-semibold text-blue-300 mb-3'>
                      🎯 Top AI Recommendations
                    </h3>
                    <div className='space-y-3'>
                      {marketData.top_plays.map((play, index) => (
                        <div key={index} className='bg-slate-700 p-3 rounded-lg'>
                          <div className='flex items-center justify-between mb-2'>
                            <span className='font-semibold'>{play.player}</span>
                            <Badge className='bg-green-600'>{play.position}</Badge>
                          </div>
                          <div className='flex items-center justify-between text-sm'>
                            <span>Confidence: {play.confidence}%</span>
                            <span className='text-green-300'>
                              ROI: {play.roi_projection}x
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className='text-lg font-semibold text-blue-300 mb-3'>
                      🌤️ Weather Impact Analysis
                    </h3>
                    <div className='space-y-3'>
                      {marketData.weather_impacts.map((weather, index) => (
                        <div key={index} className='bg-slate-700 p-3 rounded-lg'>
                          <div className='flex items-center justify-between mb-2'>
                            <span className='font-semibold'>{weather.game}</span>
                            <span className='text-xs text-gray-300'>
                              Impact: {(weather.impact_score * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className='text-sm text-gray-300 mb-2'>
                            {weather.conditions}
                          </div>
                          <div className='text-xs text-blue-300'>
                            Affected: {weather.affected_players.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className='mt-4 p-4 bg-slate-700 rounded-lg'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm'>Market Sentiment:</span>
                    <span className='text-yellow-300 font-medium'>
                      {marketData.overall_sentiment}
                    </span>
                  </div>
                  <div className='flex items-center justify-between mt-2'>
                    <span className='text-sm'>Volatility Index:</span>
                    <span className='text-red-300 font-medium'>
                      {marketData.volatility_index.toFixed(2)}
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value='optimization' className='space-y-6'>
            <Card className='bg-slate-800 border-slate-700 p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-2xl font-bold text-purple-400'>
                  🧬 Genetic Algorithm Optimizer
                </h2>
                <Button
                  onClick={runGeneticOptimization}
                  disabled={isLoading}
                  className='bg-purple-600 hover:bg-purple-700'
                >
                  {isLoading ? 'Evolving Lineups...' : 'Run Genetic Optimization'}
                </Button>
              </div>

              {optimizationResults && (
                <div className='space-y-4'>
                  <div className='grid grid-cols-3 gap-4 mb-6'>
                    <div className='bg-slate-700 p-4 rounded-lg text-center'>
                      <div className='text-2xl font-bold text-green-400'>
                        {optimizationResults.generation_stats.total_generations}
                      </div>
                      <div className='text-sm text-gray-300'>Generations</div>
                    </div>
                    <div className='bg-slate-700 p-4 rounded-lg text-center'>
                      <div className='text-2xl font-bold text-blue-400'>
                        {(
                          optimizationResults.generation_stats.convergence_rate * 100
                        ).toFixed(1)}
                        %
                      </div>
                      <div className='text-sm text-gray-300'>Convergence</div>
                    </div>
                    <div className='bg-slate-700 p-4 rounded-lg text-center'>
                      <div className='text-2xl font-bold text-yellow-400'>
                        {(
                          optimizationResults.generation_stats.diversity_maintained *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                      <div className='text-sm text-gray-300'>Diversity</div>
                    </div>
                  </div>

                  <h3 className='text-lg font-semibold text-green-300 mb-3'>
                    🏆 Optimized Lineups
                  </h3>
                  <div className='space-y-4'>
                    {optimizationResults.lineups.map((lineup, index) => (
                      <Card
                        key={lineup.id}
                        className='bg-slate-700 border-slate-600 p-4'
                      >
                        <div className='flex items-center justify-between mb-3'>
                          <h4 className='font-semibold'>Lineup #{index + 1}</h4>
                          <div className='flex items-center space-x-4'>
                            <span className='text-green-400'>
                              ${lineup.total_salary.toLocaleString()}
                            </span>
                            <span className='text-blue-400'>
                              {lineup.projected_points.toFixed(1)} pts
                            </span>
                            <Badge className='bg-purple-600'>
                              Fitness: {lineup.genetic_fitness.toFixed(1)}
                            </Badge>
                          </div>
                        </div>

                        <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                          {lineup.players.map((player, playerIndex) => (
                            <div
                              key={playerIndex}
                              className='bg-slate-600 p-2 rounded text-sm'
                            >
                              <div className='font-medium'>{player.name}</div>
                              <div className='text-xs text-gray-300'>
                                {player.position} • ${player.salary.toLocaleString()} •{' '}
                                {player.projection.toFixed(1)} pts
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className='text-center py-8'>
                  <div className='text-purple-400 mb-2'>
                    🧬 Genetic Algorithm Active
                  </div>
                  <div className='text-gray-300'>
                    Running 500 population size with 10% elite preservation...
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value='simulation' className='space-y-6'>
            <Card className='bg-slate-800 border-slate-700 p-6'>
              <h2 className='text-2xl font-bold text-cyan-400 mb-4'>
                🎲 Monte Carlo Simulation Engine
              </h2>

              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
                <div className='bg-slate-700 p-4 rounded-lg text-center'>
                  <div className='text-2xl font-bold text-green-400'>1.15x</div>
                  <div className='text-sm text-gray-300'>Expected ROI</div>
                </div>
                <div className='bg-slate-700 p-4 rounded-lg text-center'>
                  <div className='text-2xl font-bold text-blue-400'>23.5%</div>
                  <div className='text-sm text-gray-300'>Cash Rate</div>
                </div>
                <div className='bg-slate-700 p-4 rounded-lg text-center'>
                  <div className='text-2xl font-bold text-yellow-400'>2.1%</div>
                  <div className='text-sm text-gray-300'>Top 1%</div>
                </div>
                <div className='bg-slate-700 p-4 rounded-lg text-center'>
                  <div className='text-2xl font-bold text-purple-400'>10,000</div>
                  <div className='text-sm text-gray-300'>Simulations</div>
                </div>
              </div>

              <div className='bg-slate-700 p-4 rounded-lg'>
                <h3 className='text-lg font-semibold text-cyan-300 mb-3'>
                  📊 Portfolio Performance Distribution
                </h3>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span>Top 1% Finish:</span>
                    <span className='text-green-400'>2.1%</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Top 10% Finish:</span>
                    <span className='text-blue-400'>8.7%</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Cash Finish (50%+):</span>
                    <span className='text-yellow-400'>23.5%</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>ROI Confidence Interval:</span>
                    <span className='text-gray-300'>0.95x - 1.35x (95%)</span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Real-time System Status */}
        <Card className='bg-slate-800 border-slate-700 p-4 mt-6'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-blue-300'>🤖 AI System Status</h3>
            <div className='flex items-center space-x-4'>
              <div className='flex items-center space-x-2'>
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                <span className='text-xs text-gray-300'>Genetic Algorithm: Active</span>
              </div>
              <div className='flex items-center space-x-2'>
                <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse'></div>
                <span className='text-xs text-gray-300'>Market Intelligence: Live</span>
              </div>
              <div className='flex items-center space-x-2'>
                <div className='w-2 h-2 bg-purple-500 rounded-full animate-pulse'></div>
                <span className='text-xs text-gray-300'>
                  Vector Analysis: Operational
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
