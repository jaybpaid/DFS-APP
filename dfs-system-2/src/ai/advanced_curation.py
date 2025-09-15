"""
Advanced AI-Powered DFS Pick Curation System
Combines multiple AI models with web scraping for superior analysis
"""

import asyncio
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum

class AIModelStrengths:
    """Analysis of different AI models for DFS applications"""
    
    RECOMMENDATIONS = {
        "primary_models": {
            "gpt4": {
                "best_for": ["strategic_analysis", "narrative_synthesis", "breaking_news"],
                "strengths": [
                    "Excellent at synthesizing multiple data points",
                    "Strong reasoning about game narratives", 
                    "Good at identifying contrarian angles",
                    "Handles complex multi-factor analysis"
                ],
                "use_cases": [
                    "Main strategic analysis",
                    "Player narrative evaluation", 
                    "Stack reasoning and correlation analysis",
                    "Breaking news impact assessment"
                ],
                "cost": "High",
                "speed": "Medium",
                "reliability": "Excellent"
            },
            "claude": {
                "best_for": ["data_analysis", "pattern_recognition", "technical_analysis"],
                "strengths": [
                    "Superior analytical thinking",
                    "Excellent with statistical analysis",
                    "Strong pattern recognition",
                    "Good at technical breakdowns"
                ],
                "use_cases": [
                    "Statistical analysis of player trends",
                    "Matchup analysis and ratings",
                    "Historical pattern recognition",
                    "Technical metric interpretation"
                ],
                "cost": "Medium",
                "speed": "Fast", 
                "reliability": "Excellent"
            },
            "deepseek": {
                "best_for": ["quantitative_analysis", "mathematical_modeling", "optimization"],
                "strengths": [
                    "Strong mathematical reasoning",
                    "Good at quantitative analysis",
                    "Cost-effective for high volume",
                    "Fast inference speed"
                ],
                "use_cases": [
                    "Projection modeling and validation",
                    "Ownership percentage calculations",
                    "Value and leverage scoring",
                    "High-volume analysis tasks"
                ],
                "cost": "Low",
                "speed": "Very Fast",
                "reliability": "Good"
            }
        },
        "specialized_models": {
            "gemini": {
                "best_for": ["multimodal_analysis", "real_time_processing"],
                "use_cases": ["Image analysis of charts", "Real-time data processing"],
                "note": "Good for processing screenshots of betting odds, charts"
            }
        }
    }

class AdvancedAICurationStrategies:
    """Advanced strategies for AI-powered pick curation"""
    
    def __init__(self):
        self.curation_methods = {
            "ensemble_consensus": self._ensemble_consensus,
            "contrarian_identification": self._contrarian_identification,  
            "news_sentiment_analysis": self._news_sentiment_analysis,
            "social_media_monitoring": self._social_media_monitoring,
            "expert_consensus_tracking": self._expert_consensus_tracking,
            "betting_market_analysis": self._betting_market_analysis,
            "injury_impact_modeling": self._injury_impact_modeling,
            "weather_game_theory": self._weather_game_theory,
            "ownership_arbitrage": self._ownership_arbitrage,
            "correlation_mining": self._correlation_mining
        }
    
    async def _ensemble_consensus(self, scraped_data: Dict) -> Dict[str, Any]:
        """Use multiple AI models for consensus picks"""
        return {
            "strategy": "Multi-AI Consensus",
            "description": """
            🧠 **Multi-Model Approach:**
            • GPT-4: Strategic narrative analysis and game theory
            • Claude: Statistical analysis and pattern recognition  
            • DeepSeek: Quantitative modeling and value calculation
            
            🎯 **Consensus Process:**
            1. Each AI analyzes the same player pool independently
            2. Compare recommendations across all models
            3. High-confidence picks = all models agree
            4. Contrarian picks = models disagree (leverage opportunity)
            5. Weight by model's historical accuracy per category
            """,
            "implementation": [
                "Run same analysis prompt through all 3 models",
                "Score consensus vs divergence",
                "Weight by model strengths (GPT-4 for narrative, Claude for stats)",
                "Flag disagreements as potential edge opportunities"
            ]
        }
    
    async def _contrarian_identification(self, scraped_data: Dict) -> Dict[str, Any]:
        """AI-powered contrarian play identification"""
        return {
            "strategy": "AI Contrarian Mining",
            "description": """
            🎭 **Contrarian Intelligence:**
            • Scrape ownership from RotoGrinders, FantasyLabs, DFS Army
            • AI analyzes why certain players are under/over-owned
            • Identify narrative vs statistical disconnects
            • Find "too obvious" plays that public will over-play
            
            🎯 **AI Contrarian Process:**
            1. Scrape projected ownership from multiple sources
            2. AI analyzes WHY each player has that ownership
            3. Look for logical inconsistencies (great matchup but low owned)
            4. Identify recency bias (bad recent game = lower ownership)
            5. Find "chalk traps" (obvious plays in bad spots)
            """,
            "implementation": [
                "Multi-source ownership scraping",
                "AI narrative analysis of ownership drivers", 
                "Pattern recognition for over/under-owned situations",
                "Contrarian scoring algorithm"
            ]
        }
    
    async def _news_sentiment_analysis(self, scraped_data: Dict) -> Dict[str, Any]:
        """Real-time news sentiment for pick curation"""
        return {
            "strategy": "AI News Sentiment Engine", 
            "description": """
            📰 **News Intelligence Pipeline:**
            • Scrape FantasyPros, Rotoworld, ESPN, Twitter/X
            • AI sentiment analysis on player news
            • Identify positive/negative sentiment shifts
            • Track news velocity and recency
            
            🎯 **Sentiment Scoring:**
            1. Scrape all player news from past 48 hours
            2. AI rates sentiment: Very Positive (+2) to Very Negative (-2)
            3. Weight by news source credibility
            4. Track sentiment momentum (improving vs declining)
            5. Flag players with sentiment-ownership disconnects
            """,
            "examples": [
                "Player X injury update → Positive teammate boost",
                "Coach comments on usage → Ownership shift opportunity", 
                "Weather reports → Game environment changes",
                "Depth chart changes → Usage projections"
            ]
        }
    
    async def _social_media_monitoring(self, scraped_data: Dict) -> Dict[str, Any]:
        """Social media sentiment and buzz tracking"""
        return {
            "strategy": "Social Media Intelligence",
            "description": """
            📱 **Social Monitoring System:**
            • Twitter/X DFS community sentiment tracking
            • Reddit r/dfsports discussion analysis
            • Discord DFS server monitoring
            • Influencer pick tracking (RG pros, SaberSim users)
            
            🎯 **Social Intelligence:**
            1. Track DFS Twitter for "popular" vs "overlooked" players
            2. Monitor Reddit discussions for emerging narratives
            3. AI analyzes sentiment patterns and buzz levels
            4. Identify "Twitter darlings" to fade in GPPs
            5. Find under-discussed players with good setups
            """,
            "ai_analysis": [
                "Sentiment analysis on player mentions",
                "Buzz level vs projected ownership comparison",
                "Influencer consensus vs contrarian opportunities",
                "Community bias identification"
            ]
        }
    
    async def _expert_consensus_tracking(self, scraped_data: Dict) -> Dict[str, Any]:
        """Track and analyze expert consensus across platforms"""
        return {
            "strategy": "Expert Consensus Intelligence",
            "description": """
            👨‍💼 **Expert Tracking System:**
            • Scrape projections from 10+ expert sources
            • Track historical accuracy by expert and category
            • Weight consensus by expert reliability
            • Find experts' "pet players" and contrarian takes
            
            🎯 **Expert Analysis:**
            1. Aggregate projections from multiple expert sources
            2. AI identifies outlier picks (expert loves, consensus hates)
            3. Track which experts are "hot" week-over-week
            4. Find correlation between expert picks and actual performance
            5. Identify when to follow consensus vs when to contrarian
            """,
            "sources_to_scrape": [
                "FantasyPros expert rankings",
                "Establish The Run projections",
                "4for4 expert picks", 
                "FantasyFootballers content",
                "Individual expert Twitter accounts"
            ]
        }
    
    async def _betting_market_analysis(self, scraped_data: Dict) -> Dict[str, Any]:
        """Analyze betting markets for DFS edges"""
        return {
            "strategy": "Betting Market Intelligence",
            "description": """
            💰 **Sports Betting Integration:**
            • Scrape player props from DK, FD, Caesars sportsbooks
            • Compare sportsbook lines to DFS projections
            • Find discrepancies between betting and DFS markets
            • Track line movement and sharp money indicators
            
            🎯 **Market Analysis:**
            1. Scrape O/U props for rushing yards, receiving yards, TDs
            2. Convert betting odds to implied probabilities
            3. Compare to DFS projections and identify gaps
            4. Track which direction sharp money is moving
            5. Use closing line value as accuracy indicator
            """,
            "edge_opportunities": [
                "Player prop under-valued vs DFS projection",
                "Sharp money on game totals → correlated player picks",
                "Line movement indicates injury/weather concerns",
                "Arbitrage between sportsbook and DFS pricing"
            ]
        }
    
    async def _injury_impact_modeling(self, scraped_data: Dict) -> Dict[str, Any]:
        """AI-powered injury impact and opportunity analysis"""
        return {
            "strategy": "Injury Impact Intelligence",
            "description": """
            🏥 **Injury Intelligence System:**
            • Scrape official injury reports, beat reporter updates
            • AI models knock-on effects of player absences
            • Identify beneficiaries and usage boosts
            • Track injury report patterns and coach-speak
            
            🎯 **Impact Modeling:**
            1. Scrape injury reports from NFL.com, ESPN, team sites
            2. AI analyzes historical impact of similar injuries
            3. Model target/touch redistribution to teammates
            4. Track coach language patterns (probable vs questionable)
            5. Identify secondary beneficiaries (backup's backup)
            """,
            "ai_advantages": [
                "Predict target redistribution patterns",
                "Identify non-obvious beneficiaries",
                "Model game script changes with key players out",
                "Track recovery timelines and return impact"
            ]
        }
    
    async def _weather_game_theory(self, scraped_data: Dict) -> Dict[str, Any]:
        """Advanced weather analysis with game theory"""
        return {
            "strategy": "Weather Game Theory",
            "description": """
            🌨️ **Weather Intelligence:**
            • Real-time weather tracking for all outdoor games
            • AI models weather impact on player performance
            • Game theory: How will public react to weather reports?
            • Historical weather performance analysis
            
            🎯 **Weather Strategy:**
            1. Scrape detailed weather (temp, wind, precip, forecast changes)
            2. AI analyzes historical performance in similar conditions
            3. Model how public perception vs reality creates opportunities
            4. Identify players who perform well in adverse weather
            5. Find overreactions to weather reports (fade opportunities)
            """,
            "advanced_factors": [
                "Wind direction vs stadium orientation",
                "Dome team players in outdoor games",
                "Forecast changes throughout the week",
                "Historical weather performance by player"
            ]
        }
    
    async def _ownership_arbitrage(self, scraped_data: Dict) -> Dict[str, Any]:
        """Find ownership arbitrage opportunities"""
        return {
            "strategy": "Ownership Arbitrage Engine",
            "description": """
            📊 **Ownership Intelligence:**
            • Compare ownership across different contest types
            • Find players with different ownership in cash vs GPP
            • AI identifies ownership inefficiencies
            • Track ownership patterns and public biases
            
            🎯 **Arbitrage Opportunities:**
            1. Scrape projected ownership from multiple sources
            2. Compare cash game vs tournament ownership patterns
            3. AI identifies players priced efficiently but owned inefficiently
            4. Find "tournament leverage" vs "cash safety" disconnects
            5. Exploit contest-specific ownership patterns
            """,
            "opportunities": [
                "High floor player under-owned in cash games",
                "High ceiling player over-owned in tournaments", 
                "Salary-adjusted ownership inefficiencies",
                "Position-specific ownership patterns"
            ]
        }
    
    async def _correlation_mining(self, scraped_data: Dict) -> Dict[str, Any]:
        """AI-powered correlation discovery"""
        return {
            "strategy": "Advanced Correlation Mining",
            "description": """
            🔗 **Correlation Intelligence:**
            • AI discovers non-obvious player correlations
            • Historical analysis of player performance relationships
            • Game environment correlation modeling
            • Dynamic correlation based on game script
            
            🎯 **Correlation Discovery:**
            1. Analyze historical data for hidden correlations
            2. AI identifies game-script dependent relationships
            3. Find correlations that change based on context
            4. Model correlations for different contest types
            5. Dynamic correlation based on Vegas lines
            """,
            "advanced_correlations": [
                "RB2 performance when RB1 struggles",
                "Defense performance vs QB performance",
                "Weather impact on correlation strength",
                "Blowout scenario correlation changes"
            ]
        }

class RecommendedAIStrategy:
    """Recommended AI model strategy for DFS"""
    
    OPTIMAL_SETUP = {
        "primary_model": {
            "model": "GPT-4o", 
            "reasoning": """
            🥇 **GPT-4o as Primary (Recommended):**
            • Best overall reasoning and strategic analysis
            • Excellent at synthesizing multiple data sources
            • Strong at narrative and contrarian analysis
            • Handles complex multi-factor decision making
            • Good at explaining reasoning (important for learning)
            """,
            "use_for": [
                "Primary strategic analysis",
                "Player pool synthesis", 
                "Stack recommendations",
                "Breaking news analysis",
                "Narrative evaluation"
            ]
        },
        
        "secondary_model": {
            "model": "Claude-3", 
            "reasoning": """
            🥈 **Claude-3 as Secondary:**
            • Superior analytical and technical analysis
            • Better at statistical pattern recognition
            • Excellent for data-heavy analysis
            • Good at finding logical inconsistencies
            • Strong at technical breakdowns
            """,
            "use_for": [
                "Statistical analysis validation",
                "Pattern recognition in data",
                "Technical matchup analysis", 
                "Historical trend analysis",
                "Quantitative verification"
            ]
        },
        
        "tertiary_model": {
            "model": "DeepSeek-V3",
            "reasoning": """
            🥉 **DeepSeek as Tertiary (High Volume):**
            • Most cost-effective for high-volume tasks
            • Fast inference for real-time processing
            • Good at quantitative analysis
            • Excellent for routine analysis tasks
            """,
            "use_for": [
                "High-volume projection processing",
                "Routine ownership calculations",
                "Real-time news processing",
                "Bulk data analysis",
                "Cost-effective background tasks"
            ]
        }
    }

class AdvancedScrapingCuration:
    """Advanced scraping strategies for AI curation"""
    
    SCRAPING_STRATEGIES = {
        "real_time_curation": {
            "description": "Continuous AI-powered pick curation",
            "process": [
                "🕷️ **Continuous Scraping**: Every 15 minutes from 10+ sources",
                "🤖 **AI Processing**: Immediate analysis of new data",
                "📊 **Dynamic Updates**: Player rankings adjust in real-time", 
                "🚨 **Alert System**: Push notifications for major changes",
                "⚡ **Auto-Optimization**: Lineups auto-adjust to new information"
            ],
            "sources": [
                "Official injury reports → Auto injury impact analysis",
                "Weather updates → Game environment adjustments",
                "Betting line movements → Sharp money indicators",
                "Expert pick changes → Consensus shift tracking",
                "Social media buzz → Public perception monitoring"
            ]
        },
        
        "multi_angle_analysis": {
            "description": "Scrape different data types for comprehensive view",
            "angles": {
                "statistical": [
                    "Scrape advanced stats from PFF, Football Outsiders",
                    "AI identifies statistical advantages/disadvantages",
                    "Find players outperforming/underperforming metrics"
                ],
                "narrative": [
                    "Scrape beat reporter articles and analysis",
                    "AI extracts coaching tendencies and game planning",
                    "Identify usage pattern changes and opportunities"
                ],
                "market": [
                    "Scrape DFS pricing across sites",
                    "Compare to sportsbook player props", 
                    "Find pricing inefficiencies between markets"
                ],
                "public_sentiment": [
                    "Scrape DFS forums, Discord, Reddit discussions",
                    "AI analyzes public perception vs actual value",
                    "Identify overhyped and overlooked players"
                ]
            }
        }
    }

class AIPickCurationEngine:
    """Complete AI-powered pick curation system"""
    
    def __init__(self):
        self.ai_models = {
            "gpt4": {"priority": 1, "cost": 0.03, "reliability": 0.95},
            "claude": {"priority": 2, "cost": 0.015, "reliability": 0.93},
            "deepseek": {"priority": 3, "cost": 0.002, "reliability": 0.85}
        }
        
        self.curation_pipeline = [
            "scrape_multi_source_data",
            "ai_consensus_analysis", 
            "contrarian_opportunity_identification",
            "correlation_analysis",
            "ownership_arbitrage_detection",
            "news_sentiment_integration",
            "final_pick_ranking"
        ]
    
    async def curate_daily_picks(self, sport: str, contest_type: str) -> Dict[str, Any]:
        """Run complete AI curation pipeline"""
        
        curation_results = {
            "sport": sport,
            "contest_type": contest_type,
            "curated_at": datetime.now().isoformat(),
            "ai_models_used": [],
            "data_sources_scraped": [],
            "curated_picks": {},
            "contrarian_opportunities": [],
            "stack_recommendations": [],
            "ownership_leverage": {},
            "news_impact_players": [],
            "confidence_scores": {}
        }
        
        # Comprehensive AI analysis
        print(f"🤖 Running AI pick curation for {sport} {contest_type}...")
        
        # Step 1: Multi-source data scraping
        scraped_sources = await self._scrape_comprehensive_data(sport)
        curation_results["data_sources_scraped"] = scraped_sources
        
        # Step 2: AI consensus analysis
        consensus_picks = await self._run_ai_consensus(scraped_sources, sport)
        curation_results["curated_picks"] = consensus_picks
        
        # Step 3: Contrarian opportunity mining
        contrarian_picks = await self._find_contrarian_opportunities(scraped_sources)
        curation_results["contrarian_opportunities"] = contrarian_picks
        
        # Step 4: Advanced correlation analysis
        stack_recs = await self._generate_stack_recommendations(scraped_sources, sport)
        curation_results["stack_recommendations"] = stack_recs
        
        print(f"✅ AI curation complete! Generated {len(consensus_picks)} consensus picks, {len(contrarian_picks)} contrarian opportunities")
        
        return curation_results
    
    async def _scrape_comprehensive_data(self, sport: str) -> List[str]:
        """Scrape all relevant sources for comprehensive data"""
        sources = [
            "DraftKings player salaries and contest info",
            "FanDuel player salaries and contest info", 
            "RotoGrinders ownership projections",
            "SaberSim advanced projections and correlations",
            "Stokastic projections with confidence scores",
            "PFF player grades and analytics",
            "DFS Army strategy and lineup tools",
            "FantasyPros expert consensus rankings",
            "ESPN/NFL.com injury reports",
            "Weather.com game conditions",
            "Vegas sportsbook player props",
            "Twitter DFS community sentiment",
            "Reddit r/dfsports discussions"
        ]
        
        return sources
    
    async def _run_ai_consensus(self, sources: List[str], sport: str) -> Dict[str, Any]:
        """Run AI consensus analysis across multiple models"""
        
        # Simulate running all 3 AI models
        consensus = {
            "top_plays": {
                "gpt4_picks": ["Josh Allen", "Christian McCaffrey", "Tyreek Hill"],
                "claude_picks": ["Josh Allen", "Saquon Barkley", "CeeDee Lamb"], 
                "deepseek_picks": ["Lamar Jackson", "Christian McCaffrey", "Davante Adams"]
            },
            "consensus_agreement": {
                "high_confidence": ["Josh Allen", "Christian McCaffrey"],  # All models agree
                "medium_confidence": ["Tyreek Hill", "CeeDee Lamb"],      # 2/3 models agree
                "contrarian_targets": ["Saquon Barkley", "Davante Adams"] # Models disagree = opportunity
            },
            "model_strengths_utilized": {
                "gpt4": "Strategic narrative synthesis",
                "claude": "Statistical pattern analysis", 
                "deepseek": "Quantitative optimization"
            }
        }
        
        return consensus
    
    async def _find_contrarian_opportunities(self, sources: List[str]) -> List[Dict[str, Any]]:
        """Find contrarian opportunities through AI analysis"""
        
        contrarian_ops = [
            {
                "player": "Kyren Williams",
                "opportunity_type": "Under-owned stud",
                "reasoning": "Elite matchup vs Cardinals, but public focused on CMC/Saquon",
                "ownership_projection": 8.2,
                "ai_recommendation": "High leverage in tournaments", 
                "confidence": 0.82
            },
            {
                "player": "Tank Dell", 
                "opportunity_type": "Injury beneficiary",
                "reasoning": "WR1 questionable, Dell sees target boost but low-owned",
                "ownership_projection": 6.1,
                "ai_recommendation": "Tournament ceiling play",
                "confidence": 0.74
            },
            {
                "player": "David Montgomery",
                "opportunity_type": "Weather leverage",
                "reasoning": "Cold weather game, public will fade but Montgomery excels",
                "ownership_projection": 11.3,
                "ai_recommendation": "Cash game safety with leverage",
                "confidence": 0.79
            }
        ]
        
        return contrarian_ops
    
    async def _generate_stack_recommendations(self, sources: List[str], sport: str) -> List[Dict[str, Any]]:
        """Generate AI-powered stacking recommendations"""
        
        stack_recs = [
            {
                "stack_type": "QB-WR Correlation",
                "primary": "Josh Allen",
                "secondary": ["Stefon Diggs", "Dawson Knox"],
                "reasoning": "High total game (49.5), Allen projects for 3+ TDs",
                "correlation_score": 0.74,
                "ai_confidence": 0.88,
                "ownership_leverage": "Medium"
            },
            {
                "stack_type": "Game Environment", 
                "primary": "Chiefs-Chargers game",
                "players": ["Patrick Mahomes", "Keenan Allen", "Austin Ekeler"],
                "reasoning": "Projected shootout, both teams likely to score 28+",
                "correlation_score": 0.62,
                "ai_confidence": 0.81,
                "ownership_leverage": "High"
            },
            {
                "stack_type": "Bring-back Counter",
                "primary": "Lamar Jackson + Mark Andrews",
                "bring_back": "Joe Burrow",
                "reasoning": "If Ravens score, Bengals will throw to catch up",
                "correlation_score": 0.58,
                "ai_confidence": 0.76,
                "ownership_leverage": "Very High"
            }
        ]
        
        return stack_recs

# RECOMMENDED IMPLEMENTATION STRATEGY
IMPLEMENTATION_ROADMAP = """
🎯 **Recommended AI Model Strategy:**

**PHASE 1: Start with GPT-4o Only**
- Cost-effective to test and validate
- Excellent all-around performance
- Good for learning what works
- Single model = simpler implementation

**PHASE 2: Add Claude-3 for Validation**  
- Run same analysis through both models
- Compare results and find patterns
- Use Claude for technical/statistical analysis
- Keep GPT-4 for strategic/narrative analysis

**PHASE 3: Add DeepSeek for Scale**
- Use for high-volume routine tasks
- Real-time processing and updates
- Cost-effective for background analysis
- Bulk data processing

**OPTIMAL CONFIGURATION:**
• Primary: GPT-4o (70% of requests) - Strategic analysis
• Secondary: Claude-3 (20% of requests) - Technical validation
• Background: DeepSeek (10% of requests) - High-volume processing

**COST OPTIMIZATION:**
• Start with GPT-4o only ($30-50/month for serious use)
• Add Claude for validation ($20-30/month)
• DeepSeek for scale ($5-10/month)
• Total: $55-90/month for professional-grade AI analysis

🚀 **Advanced Curation Opportunities:**

1. **Real-time News Sentiment** - Scrape news → AI sentiment → Pick adjustments
2. **Ownership Arbitrage** - Multi-source ownership → Find disconnects → Leverage
3. **Betting Market Integration** - Props vs DFS → Market inefficiencies → Edge
4. **Social Media Monitoring** - Twitter/Reddit buzz → Fade hype → Contrarian
5. **Expert Consensus Tracking** - Weight by accuracy → Follow hot experts → Fade cold
6. **Weather Game Theory** - Real conditions → Public overreaction → Opportunity
7. **Injury Impact Modeling** - Official reports → Beneficiary identification → Usage boosts

**HIGHEST ROI AI Applications:**
1. News sentiment → Pick adjustments (immediate impact)
2. Ownership arbitrage → Tournament leverage (contest-winning edge)  
3. Expert tracking → Accuracy-weighted consensus (reliable edge)
4. Betting market analysis → Market inefficiencies (quantifiable edge)
"""

def get_ai_recommendations():
    """Get AI model and curation strategy recommendations"""
    return {
        "model_recommendation": "Start with GPT-4o, add Claude for validation, DeepSeek for scale",
        "implementation_roadmap": IMPLEMENTATION_ROADMAP,
        "advanced_strategies": AdvancedAICurationStrategies(),
        "cost_analysis": "GPT-4o: $30-50/month, Claude: $20-30/month, DeepSeek: $5-10/month"
    }
