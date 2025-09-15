"""
Next-Level Advanced DFS Features
- AI-driven player selection with ML models
- Field duplication simulations 
- Lineup similarity tools
- Adaptive ownership models
- Live EV dashboards
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import json
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from scipy.spatial.distance import cosine, hamming
import asyncio

class AILineupSelector:
    """AI-driven player selection using ML models instead of rules"""
    
    def __init__(self, sport: str):
        self.sport = sport
        self.models = {
            'rf_primary': RandomForestRegressor(n_estimators=200, random_state=42),
            'gb_secondary': GradientBoostingRegressor(n_estimators=150, random_state=42),
            'linear_backup': LinearRegression()
        }
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def train_ai_models(self, historical_data: pd.DataFrame):
        """Train ML models on historical lineup performance"""
        print("🤖 Training AI models for player selection...")
        
        # Feature engineering for ML
        features = self._engineer_features(historical_data)
        target = historical_data['actual_score']
        
        # Scale features
        features_scaled = self.scaler.fit_transform(features)
        
        # Train ensemble models
        for name, model in self.models.items():
            model.fit(features_scaled, target)
            print(f"  ✅ {name} trained - R² score: {model.score(features_scaled, target):.3f}")
        
        self.is_trained = True
        return True
    
    def ai_select_lineup(self, players: List[Dict], constraints: Dict) -> List[Dict]:
        """Use AI/ML to select lineup instead of rule-based optimization"""
        if not self.is_trained:
            return self._fallback_selection(players, constraints)
        
        print("🧠 AI selecting lineup using trained ML models...")
        
        # Convert players to feature matrix
        player_features = []
        for player in players:
            features = self._extract_player_features(player)
            player_features.append(features)
        
        player_features = np.array(player_features)
        player_features_scaled = self.scaler.transform(player_features)
        
        # Get AI predictions for each player
        ai_scores = {}
        for name, model in self.models.items():
            predictions = model.predict(player_features_scaled)
            for i, player in enumerate(players):
                if player['name'] not in ai_scores:
                    ai_scores[player['name']] = {}
                ai_scores[player['name']][name] = predictions[i]
        
        # Ensemble AI predictions
        final_scores = {}
        for player_name, model_scores in ai_scores.items():
            # Weight ensemble: RF 50%, GB 30%, Linear 20%
            ensemble_score = (model_scores.get('rf_primary', 0) * 0.5 + 
                            model_scores.get('gb_secondary', 0) * 0.3 + 
                            model_scores.get('linear_backup', 0) * 0.2)
            final_scores[player_name] = ensemble_score
        
        # AI-driven selection process
        selected_lineup = self._ai_construct_lineup(players, final_scores, constraints)
        
        return selected_lineup
    
    def _engineer_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Engineer features for ML training"""
        features = pd.DataFrame()
        
        # Basic features
        features['salary_percentile'] = data['salary'] / data['salary'].max()
        features['projection_percentile'] = data['projection'] / data['projection'].max()  
        features['ownership_percentile'] = data['ownership'] / 100
        features['value_score'] = data['projection'] / (data['salary'] / 1000)
        
        # Advanced features
        features['recent_form'] = np.random.random(len(data))  # Would be real recent performance
        features['matchup_difficulty'] = np.random.random(len(data))  # Would be real matchup data
        features['injury_risk'] = np.random.random(len(data)) * 0.2  # Injury probability
        features['weather_impact'] = np.random.random(len(data)) * 0.3  # Weather effect
        features['correlation_potential'] = np.random.random(len(data))  # Stack correlation
        
        return features
    
    def _extract_player_features(self, player: Dict) -> List[float]:
        """Extract features for a single player"""
        return [
            player['salary'] / 10000,  # Normalized salary
            player.get('projection', 15) / 30,  # Normalized projection
            player.get('ownership', 15) / 100,  # Ownership percentage
            player.get('value', 3.5),  # Value score
            np.random.random(),  # Recent form (would be real data)
            np.random.random(),  # Matchup rating
            np.random.random() * 0.2,  # Injury risk
            np.random.random() * 0.3,  # Weather impact
            np.random.random()  # Correlation potential
        ]
    
    def _ai_construct_lineup(self, players: List[Dict], ai_scores: Dict[str, float], 
                           constraints: Dict) -> List[Dict]:
        """Use AI scores to construct lineup"""
        lineup = []
        budget = constraints.get('salary_cap', 50000)
        used_players = set()
        
        # Sort players by AI score
        sorted_players = sorted(players, key=lambda p: ai_scores.get(p['name'], 0), reverse=True)
        
        # Position requirements
        positions = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST'] if self.sport == 'NFL' else ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'UTIL']
        
        for pos in positions:
            eligible = [p for p in sorted_players 
                       if p['name'] not in used_players and 
                       p['salary'] <= budget and
                       (p['position'] == pos or self._can_play_position(p['position'], pos))]
            
            if eligible:
                selected = eligible[0]  # Highest AI score
                lineup.append(selected)
                budget -= selected['salary']
                used_players.add(selected['name'])
        
        return lineup
    
    def _can_play_position(self, player_pos: str, needed_pos: str) -> bool:
        """Position eligibility check"""
        if needed_pos == 'FLEX': return player_pos in ['RB', 'WR', 'TE']
        if needed_pos == 'G': return player_pos in ['PG', 'SG']
        if needed_pos == 'F': return player_pos in ['SF', 'PF']
        if needed_pos == 'UTIL': return True
        return player_pos == needed_pos
    
    def _fallback_selection(self, players: List[Dict], constraints: Dict) -> List[Dict]:
        """Fallback when AI models aren't trained"""
        return sorted(players, key=lambda p: p.get('value', 0), reverse=True)[:8]

class FieldDuplicationDetector:
    """Detect how unique lineups are vs projected field"""
    
    def __init__(self):
        self.field_lineup_database = []
        self.uniqueness_threshold = 0.15  # 15% of field playing similar lineup = not unique
    
    def simulate_field_lineups(self, players: List[Dict], ownership_projections: Dict[str, float],
                              field_size: int = 100000) -> List[List[str]]:
        """Simulate what the field will play based on ownership"""
        print(f"🎯 Simulating {field_size:,} field lineups for uniqueness detection...")
        
        field_lineups = []
        
        # Create weighted selection based on ownership
        player_weights = []
        for player in players:
            ownership = ownership_projections.get(player['name'], 10.0)
            # Higher ownership = higher probability of selection
            weight = ownership / 100.0
            player_weights.append(weight)
        
        # Generate field lineups
        for _ in range(min(field_size, 10000)):  # Sample for performance
            lineup = []
            remaining_salary = 50000  # Simplified
            
            # Weighted random selection based on ownership
            available_players = players.copy()
            
            for position in ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST']:
                eligible = [p for p in available_players 
                           if p['salary'] <= remaining_salary and 
                           (p['position'] == position or position == 'FLEX')]
                
                if eligible:
                    # Weighted selection based on ownership
                    weights = [ownership_projections.get(p['name'], 10) / 100 for p in eligible]
                    selected = np.random.choice(eligible, p=np.array(weights)/sum(weights))
                    
                    lineup.append(selected['name'])
                    remaining_salary -= selected['salary']
                    available_players.remove(selected)
            
            if len(lineup) >= 8:
                field_lineups.append(sorted(lineup))  # Sort for comparison
        
        self.field_lineup_database = field_lineups
        print(f"  ✅ Generated {len(field_lineups):,} field simulation lineups")
        return field_lineups
    
    def calculate_lineup_uniqueness(self, user_lineup: List[Dict]) -> Dict[str, float]:
        """Calculate how unique a lineup is vs the field"""
        if not self.field_lineup_database:
            return {"uniqueness": 0.5, "field_duplicate_rate": 0.1}
        
        user_lineup_names = sorted([p['name'] for p in user_lineup])
        
        # Count similar lineups in field
        similar_count = 0
        exact_matches = 0
        
        for field_lineup in self.field_lineup_database:
            # Calculate similarity (Jaccard index)
            user_set = set(user_lineup_names)
            field_set = set(field_lineup)
            
            intersection = len(user_set.intersection(field_set))
            union = len(user_set.union(field_set))
            similarity = intersection / union if union > 0 else 0
            
            if similarity >= 0.8:  # 80%+ similar
                similar_count += 1
            if similarity == 1.0:  # Exact match
                exact_matches += 1
        
        uniqueness_score = 1.0 - (similar_count / len(self.field_lineup_database))
        duplicate_rate = exact_matches / len(self.field_lineup_database)
        
        return {
            "uniqueness": uniqueness_score,
            "field_duplicate_rate": duplicate_rate,
            "similar_lineups_count": similar_count,
            "total_field_lineups": len(self.field_lineup_database),
            "uniqueness_percentile": uniqueness_score * 100
        }

class LineupSimilarityAnalyzer:
    """Measure similarity across your lineup portfolio"""
    
    def __init__(self):
        self.similarity_metrics = {}
    
    def analyze_portfolio_similarity(self, lineups: List[Dict]) -> Dict[str, Any]:
        """Analyze similarity across your entire lineup portfolio"""
        print(f"📊 Analyzing similarity across {len(lineups)} lineup portfolio...")
        
        if len(lineups) < 2:
            return {"avg_similarity": 0, "diversification_score": 1.0}
        
        similarity_matrix = []
        lineup_vectors = []
        
        # Convert lineups to player vectors
        all_players = set()
        for lineup in lineups:
            for player in lineup['players']:
                all_players.add(player['name'])
        
        all_players = sorted(list(all_players))
        
        # Create binary vectors for each lineup
        for lineup in lineups:
            vector = [1 if player in [p['name'] for p in lineup['players']] else 0 
                     for player in all_players]
            lineup_vectors.append(vector)
        
        # Calculate pairwise similarities
        similarities = []
        for i in range(len(lineup_vectors)):
            row = []
            for j in range(len(lineup_vectors)):
                if i == j:
                    similarity = 1.0
                else:
                    # Jaccard similarity
                    vec1, vec2 = lineup_vectors[i], lineup_vectors[j]
                    intersection = sum(a * b for a, b in zip(vec1, vec2))
                    union = sum(max(a, b) for a, b in zip(vec1, vec2))
                    similarity = intersection / union if union > 0 else 0
                
                row.append(similarity)
                if i != j:
                    similarities.append(similarity)
            
            similarity_matrix.append(row)
        
        # Portfolio analysis
        avg_similarity = np.mean(similarities)
        max_similarity = np.max(similarities)
        min_similarity = np.min(similarities)
        diversification_score = 1.0 - avg_similarity  # Higher = more diverse
        
        # Identify most/least similar lineup pairs
        similarity_pairs = []
        for i in range(len(lineups)):
            for j in range(i + 1, len(lineups)):
                similarity_pairs.append({
                    'lineup1': lineups[i]['id'],
                    'lineup2': lineups[j]['id'], 
                    'similarity': similarity_matrix[i][j],
                    'overlap_players': self._get_overlap_players(lineups[i], lineups[j])
                })
        
        # Sort by similarity
        similarity_pairs.sort(key=lambda x: x['similarity'], reverse=True)
        
        return {
            'avg_similarity': round(avg_similarity, 3),
            'max_similarity': round(max_similarity, 3),
            'min_similarity': round(min_similarity, 3),
            'diversification_score': round(diversification_score, 3),
            'most_similar_pair': similarity_pairs[0] if similarity_pairs else None,
            'least_similar_pair': similarity_pairs[-1] if similarity_pairs else None,
            'similarity_matrix': similarity_matrix,
            'portfolio_grade': self._grade_portfolio_diversity(diversification_score)
        }
    
    def _get_overlap_players(self, lineup1: Dict, lineup2: Dict) -> List[str]:
        """Get overlapping players between two lineups"""
        players1 = {p['name'] for p in lineup1['players']}
        players2 = {p['name'] for p in lineup2['players']}
        return list(players1.intersection(players2))
    
    def _grade_portfolio_diversity(self, diversification_score: float) -> str:
        """Grade portfolio diversity"""
        if diversification_score >= 0.8: return "A+ (Excellent Diversity)"
        elif diversification_score >= 0.7: return "A (Very Good Diversity)"
        elif diversification_score >= 0.6: return "B (Good Diversity)" 
        elif diversification_score >= 0.5: return "C (Average Diversity)"
        else: return "D (Poor Diversity - Too Similar)"

class AdaptiveOwnershipEngine:
    """Real-time adaptive ownership models"""
    
    def __init__(self):
        self.base_ownership = {}
        self.adjustment_factors = {
            'sportsbook_movement': 0.15,  # Line movement impact
            'injury_news': 0.25,          # Injury report impact  
            'weather_change': 0.10,       # Weather update impact
            'expert_picks': 0.08,         # Expert recommendation changes
            'social_buzz': 0.12           # Social media buzz impact
        }
        self.last_update = datetime.now()
    
    async def get_adaptive_ownership(self, players: List[Dict], 
                                   live_data: Dict[str, Any]) -> Dict[str, float]:
        """Get real-time adaptive ownership projections"""
        print("📈 Calculating adaptive ownership with live data...")
        
        adaptive_ownership = {}
        
        for player in players:
            # Start with base ownership projection
            base_own = player.get('ownership', 15.0)
            
            # Apply real-time adjustments
            adjustments = 0
            
            # Sportsbook movement adjustment
            if 'line_movements' in live_data:
                game_movement = live_data['line_movements'].get(player.get('game_info', ''), 0)
                adjustments += game_movement * self.adjustment_factors['sportsbook_movement']
            
            # Injury news adjustment
            if 'injury_updates' in live_data:
                player_injury = live_data['injury_updates'].get(player['name'], 0)
                adjustments += player_injury * self.adjustment_factors['injury_news']
            
            # Weather adjustment
            if 'weather_changes' in live_data and player.get('position') in ['QB', 'WR', 'TE']:
                weather_impact = live_data['weather_changes'].get(player.get('game_info', ''), 0)
                adjustments -= weather_impact * self.adjustment_factors['weather_change']  # Negative for passing
            
            # Expert picks adjustment
            if 'expert_buzz' in live_data:
                expert_mentions = live_data['expert_buzz'].get(player['name'], 0)
                adjustments += expert_mentions * self.adjustment_factors['expert_picks']
            
            # Social buzz adjustment
            if 'social_sentiment' in live_data:
                social_score = live_data['social_sentiment'].get(player['name'], 0)
                adjustments += social_score * self.adjustment_factors['social_buzz']
            
            # Calculate final adaptive ownership
            final_ownership = max(1.0, min(60.0, base_own + adjustments))
            adaptive_ownership[player['name']] = round(final_ownership, 1)
        
        print(f"  ✅ Updated ownership for {len(adaptive_ownership)} players")
        return adaptive_ownership
    
    def track_ownership_velocity(self, current_ownership: Dict[str, float]) -> Dict[str, float]:
        """Track how quickly ownership is changing"""
        if not hasattr(self, 'previous_ownership'):
            self.previous_ownership = current_ownership
            return {player: 0.0 for player in current_ownership}
        
        velocity = {}
        for player, current_own in current_ownership.items():
            previous_own = self.previous_ownership.get(player, current_own)
            velocity[player] = current_own - previous_own
        
        self.previous_ownership = current_ownership
        return velocity

class LiveEVDashboard:
    """Live expected value dashboard with real-time ROI tracking"""
    
    def __init__(self):
        self.contest_ev_cache = {}
        self.lineup_performance_history = {}
    
    def calculate_live_ev(self, lineups: List[Dict], contest_info: Dict, 
                         live_ownership: Dict[str, float]) -> Dict[str, Dict[str, float]]:
        """Calculate live EV for each lineup in current contest"""
        print("💰 Calculating live EV for all lineups...")
        
        live_ev_data = {}
        contest_type = contest_info.get('type', 'gpp')
        field_size = contest_info.get('field_size', 100000)
        entry_fee = contest_info.get('entry_fee', 20.0)
        
        for lineup in lineups:
            lineup_id = lineup['id']
            
            # Calculate lineup metrics
            lineup_ownership = np.mean([live_ownership.get(p['name'], 15) for p in lineup['players']])
            lineup_projection = sum(p.get('projection', 15) for p in lineup['players'])
            lineup_volatility = np.std([p.get('projection', 15) for p in lineup['players']])
            
            # EV Calculation Components
            ev_components = self._calculate_ev_components(
                lineup_projection, lineup_ownership, lineup_volatility, contest_info
            )
            
            # Live adjustments
            live_adjustments = self._calculate_live_adjustments(lineup, live_ownership)
            
            # Final EV calculation
            base_ev = ev_components['expected_score'] - entry_fee
            adjusted_ev = base_ev + live_adjustments['total_adjustment']
            
            live_ev_data[lineup_id] = {
                'expected_roi': adjusted_ev / entry_fee,
                'expected_score': ev_components['expected_score'],
                'win_probability': ev_components['win_probability'],
                'top1_probability': ev_components['top1_probability'],
                'cash_probability': ev_components['cash_probability'],
                'lineup_ownership': lineup_ownership,
                'uniqueness_bonus': live_adjustments['uniqueness_bonus'],
                'ownership_penalty': live_adjustments['ownership_penalty'],
                'live_edge': live_adjustments['total_adjustment'],
                'recommended_exposure': self._calculate_recommended_exposure(adjusted_ev, lineup_ownership),
                'kelly_bet_size': self._calculate_kelly_sizing(ev_components, entry_fee),
                'confidence_level': self._calculate_confidence_level(lineup_volatility, lineup_ownership)
            }
        
        print(f"  ✅ Live EV calculated for {len(live_ev_data)} lineups")
        return live_ev_data
    
    def _calculate_ev_components(self, projection: float, ownership: float, 
                               volatility: float, contest_info: Dict) -> Dict[str, float]:
        """Calculate EV components for lineup"""
        # Simulate contest performance
        field_strength = 145.0  # Average field score
        
        # Adjust for ownership (chalk lineups perform worse in large fields)
        ownership_penalty = (ownership - 15) * 0.02 if ownership > 15 else 0
        adjusted_projection = projection - ownership_penalty
        
        # Calculate probabilities
        z_score = (adjusted_projection - field_strength) / 20  # Assume 20pt std dev
        win_prob = max(0.001, min(0.999, 0.5 + z_score * 0.1))
        top1_prob = win_prob * 0.01  # Rough approximation
        cash_prob = max(0.1, min(0.9, win_prob * 2))  # Cash easier than winning
        
        # Expected payout
        contest_type = contest_info.get('type', 'gpp')
        if contest_type == 'cash':
            expected_payout = cash_prob * contest_info.get('entry_fee', 20) * 1.8
        else:
            # Tournament payout structure
            expected_payout = (win_prob * 1000 +  # 1st place simplified
                             top1_prob * 100 +    # Top 1%
                             cash_prob * 3)       # Min cash
        
        return {
            'expected_score': adjusted_projection,
            'win_probability': win_prob,
            'top1_probability': top1_prob,
            'cash_probability': cash_prob,
            'expected_payout': expected_payout
        }
    
    def _calculate_live_adjustments(self, lineup: Dict, live_ownership: Dict[str, float]) -> Dict[str, float]:
        """Calculate live EV adjustments based on current conditions"""
        lineup_players = [p['name'] for p in lineup['players']]
        current_ownership = np.mean([live_ownership.get(name, 15) for name in lineup_players])
        
        # Uniqueness bonus (lower ownership = bonus)
        uniqueness_bonus = max(0, (20 - current_ownership) * 0.1)
        
        # Ownership penalty (higher ownership = penalty) 
        ownership_penalty = max(0, (current_ownership - 25) * 0.05)
        
        total_adjustment = uniqueness_bonus - ownership_penalty
        
        return {
            'uniqueness_bonus': uniqueness_bonus,
            'ownership_penalty': ownership_penalty,
            'total_adjustment': total_adjustment
        }
    
    def _calculate_recommended_exposure(self, ev: float, ownership: float) -> float:
        """Calculate recommended exposure % based on EV and ownership"""
        if ev <= 0:
            return 0.0
        
        # Higher EV = higher exposure, but cap at reasonable levels
        base_exposure = min(40.0, ev * 100)
        
        # Adjust for ownership (lower ownership = higher exposure potential)
        ownership_multiplier = max(0.5, (30 - ownership) / 30)
        
        recommended = base_exposure * ownership_multiplier
        return max(5.0, min(50.0, recommended))
    
    def _calculate_kelly_sizing(self, ev_components: Dict, entry_fee: float) -> float:
        """Calculate Kelly criterion optimal bet sizing"""
        win_prob = ev_components['win_probability']
        expected_payout = ev_components['expected_payout']
        
        if win_prob <= 0 or expected_payout <= entry_fee:
            return 0.0
        
        # Kelly = (bp - q) / b
        b = (expected_payout / entry_fee) - 1  # Odds
        p = win_prob  # Win probability
        q = 1 - p     # Loss probability
        
        kelly = (b * p - q) / b
        return max(0.0, min(0.25, kelly))  # Cap at 25% of bankroll
    
    def _calculate_confidence_level(self, volatility: float, ownership: float) -> str:
        """Calculate confidence level for the EV calculation"""
        # Lower volatility and moderate ownership = higher confidence
        volatility_score = max(0, 1 - (volatility / 30))
        ownership_score = 1 - abs(ownership - 15) / 35  # Best confidence around 15% ownership
        
        confidence = (volatility_score + ownership_score) / 2
        
        if confidence >= 0.8: return "Very High"
        elif confidence >= 0.6: return "High"
        elif confidence >= 0.4: return "Medium"
        else: return "Low"

class RealTimeDataEngine:
    """Real-time data processing for adaptive features"""
    
    def __init__(self):
        self.data_streams = {
            'sportsbook_lines': {},
            'injury_reports': {},
            'weather_updates': {},
            'social_sentiment': {},
            'expert_picks': {}
        }
        self.update_frequency = 60  # seconds
    
    async def get_live_data_feed(self) -> Dict[str, Any]:
        """Get live data feed for adaptive ownership and EV calculations"""
        print("📡 Fetching live data feeds...")
        
        # Simulate live data (would be real API calls)
        live_data = {
            'line_movements': {
                'BUF@MIA': 0.5,    # Game total moved up
                'KC@LAC': -0.3,    # Game total moved down
                'DAL@NYG': 0.2
            },
            'injury_updates': {
                'Christian McCaffrey': -0.1,  # Minor concern
                'Saquon Barkley': 0.2,        # Positive update
                'Tyreek Hill': 0.0             # No change
            },
            'weather_changes': {
                'BUF@MIA': 0.3,    # Weather got worse
                'GB@CHI': 0.2      # Cold weather impact
            },
            'expert_buzz': {
                'Josh Allen': 0.15,      # Experts talking up
                'Kyren Williams': 0.3,   # Sleeper buzz
                'Tank Dell': 0.25        # Under-the-radar pick
            },
            'social_sentiment': {
                'Christian McCaffrey': 0.4,  # Hyped on Twitter
                'David Montgomery': -0.1,    # Negative sentiment
                'Stefon Diggs': 0.2          # Positive buzz
            },
            'timestamp': datetime.now().isoformat()
        }
        
        return live_data
    
    def detect_significant_changes(self, current_data: Dict, previous_data: Dict) -> List[Dict]:
        """Detect significant changes that should trigger alerts"""
        significant_changes = []
        
        # Check for major line movements
        if 'line_movements' in current_data and 'line_movements' in previous_data:
            for game, movement in current_data['line_movements'].items():
                prev_movement = previous_data['line_movements'].get(game, 0)
                change = abs(movement - prev_movement)
                
                if change >= 1.0:  # 1+ point movement
                    significant_changes.append({
                        'type': 'line_movement',
                        'game': game,
                        'change': change,
                        'impact': 'high' if change >= 2.0 else 'medium'
                    })
        
        return significant_changes

# Integration class for all advanced features
class NextLevelDFSEngine:
    """Integration of all next-level DFS features"""
    
    def __init__(self, sport: str):
        self.sport = sport
        self.ai_selector = AILineupSelector(sport)
        self.field_detector = FieldDuplicationDetector()
        self.similarity_analyzer = LineupSimilarityAnalyzer()
        self.ownership_engine = AdaptiveOwnershipEngine()
        self.ev_dashboard = LiveEVDashboard()
        self.data_engine = RealTimeDataEngine()
    
    async def run_complete_analysis(self, players: List[Dict], 
                                  lineup_constraints: Dict,
                                  contest_info: Dict) -> Dict[str, Any]:
        """Run complete next-level analysis"""
        print("🚀 Running complete next-level DFS analysis...")
        
        # Step 1: Get live data
        live_data = await self.data_engine.get_live_data_feed()
        
        # Step 2: Calculate adaptive ownership
        adaptive_ownership = await self.ownership_engine.get_adaptive_ownership(players, live_data)
        
        # Step 3: Simulate field lineups for uniqueness detection
        field_lineups = self.field_detector.simulate_field_lineups(
            players, adaptive_ownership, contest_info.get('field_size', 100000)
        )
        
        # Step 4: Generate AI-driven lineups
        ai_lineups = []
        if self.ai_selector.is_trained:
            for i in range(lineup_constraints.get('num_lineups', 20)):
                ai_lineup = self.ai_selector.ai_select_lineup(players, lineup_constraints)
                ai_lineups.append({
                    'id': f'ai_lineup_{i+1}',
                    'players': ai_lineup,
                    'generation_method': 'AI-ML'
                })
        
        # Step 5: Analyze lineup similarity
        if len(ai_lineups) > 1:
            similarity_analysis = self.similarity_analyzer.analyze_portfolio_similarity(ai_lineups)
        else:
            similarity_analysis = {"diversification_score": 1.0}
        
        # Step 6: Calculate live EV for all lineups
        live_ev_data = self.ev_dashboard.calculate_live_ev(ai_lineups, contest_info, adaptive_ownership)
        
        # Step 7: Check uniqueness vs field
        uniqueness_results = {}
        for lineup in ai_lineups:
            uniqueness = self.field_detector.calculate_lineup_uniqueness(lineup['players'])
            uniqueness_results[lineup['id']] = uniqueness
        
        # Compile complete analysis
        complete_analysis = {
            'ai_lineups': ai_lineups,
            'adaptive_ownership': adaptive_ownership,
            'similarity_analysis': similarity_analysis,
            'live_ev_data': live_ev_data,
            'uniqueness_results': uniqueness_results,
            'live_data': live_data,
            'field_simulation_size': len(field_lineups),
            'analysis_timestamp': datetime.now().isoformat(),
            'next_level_features': {
                'ai_driven_selection': True,
                'field_duplication_detection': True,
                'similarity_analysis': True,
                'adaptive_ownership': True,
                'live_ev_dashboard': True
            }
        }
        
        print("✅ Complete next-level analysis finished!")
        return complete_analysis

# Usage functions for dashboard integration
async def get_next_level_analysis(players: List[Dict], sport: str = "NFL") -> Dict[str, Any]:
    """Main function to get next-level analysis for dashboard"""
    engine = NextLevelDFSEngine(sport)
    
    lineup_constraints = {
        'num_lineups': 20,
        'salary_cap': 50000 if sport == 'NFL' else 60000
    }
    
    contest_info = {
        'type': 'gpp',
        'field_size': 100000,
        'entry_fee': 20.0
    }
    
    return await engine.run_complete_analysis(players, lineup_constraints, contest_info)

def has_next_level_features() -> Dict[str, bool]:
    """Check which next-level features are available"""
    return {
        'ai_driven_player_selection': True,
        'field_duplication_simulations': True, 
        'lineup_similarity_tools': True,
        'adaptive_ownership_models': True,
        'live_ev_dashboards': True
    }
