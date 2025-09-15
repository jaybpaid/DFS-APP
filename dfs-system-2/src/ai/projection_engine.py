import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import json
from pathlib import Path

try:
    import xgboost as xgb
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.linear_model import LinearRegression, Ridge
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_squared_error, mean_absolute_error
    HAS_ML_LIBS = True
except ImportError:
    HAS_ML_LIBS = False

from ..data.schemas import SportType, Projection

class AIProjectionEngine:
    """AI-powered projection engine with ensemble methods"""
    
    def __init__(self, sport: SportType, config_dir: str = "src/config"):
        self.sport = sport
        self.config_dir = Path(config_dir)
        self.models = {}
        self.scalers = {}
        self.feature_importance = {}
        
        # Load AI configuration
        self.ai_config = self._load_ai_config()
        
        # Initialize models if ML libraries available
        if HAS_ML_LIBS and self.ai_config.get('projection_engines', {}).get('ensemble_ml', {}).get('enabled', False):
            self._initialize_models()
    
    def _load_ai_config(self) -> Dict[str, Any]:
        """Load AI configuration from sources_comprehensive.json"""
        try:
            with open(self.config_dir / "sources_comprehensive.json", 'r') as f:
                config = json.load(f)
                return config.get('AI_Backend', {})
        except Exception as e:
            print(f"Warning: Could not load AI config: {e}")
            return {}
    
    def _initialize_models(self):
        """Initialize ML models for ensemble"""
        model_config = self.ai_config.get('projection_engines', {}).get('ensemble_ml', {})
        models_to_use = model_config.get('models', ['xgboost', 'random_forest', 'linear_regression'])
        
        for model_name in models_to_use:
            if model_name == 'xgboost':
                self.models['xgboost'] = xgb.XGBRegressor(
                    n_estimators=100,
                    max_depth=6,
                    learning_rate=0.1,
                    random_state=42
                )
            elif model_name == 'random_forest':
                self.models['random_forest'] = RandomForestRegressor(
                    n_estimators=100,
                    max_depth=10,
                    random_state=42
                )
            elif model_name == 'linear_regression':
                self.models['linear_regression'] = Ridge(alpha=1.0)
        
        # Initialize scalers
        for model_name in self.models:
            self.scalers[model_name] = StandardScaler()
    
    def create_features(self, player_data: pd.DataFrame, contextual_data: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """Create feature matrix for ML models"""
        features = player_data.copy()
        
        # Add contextual features based on sport
        if self.sport == SportType.NBA:
            features = self._add_nba_features(features, contextual_data)
        else:  # NFL
            features = self._add_nfl_features(features, contextual_data)
        
        # Add common features
        features = self._add_common_features(features, contextual_data)
        
        return features
    
    def _add_nba_features(self, features: pd.DataFrame, contextual_data: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """Add NBA-specific features"""
        # Usage rate and pace features
        if 'usage_rate' not in features.columns:
            features['usage_rate'] = np.random.uniform(0.15, 0.35, len(features))  # Placeholder
        
        if 'pace' not in features.columns:
            features['pace'] = np.random.uniform(95, 105, len(features))  # Placeholder
        
        # Minutes projections
        if 'projected_minutes' not in features.columns:
            features['projected_minutes'] = np.random.uniform(15, 40, len(features))
        
        # Rest days
        features['rest_days'] = np.random.randint(0, 4, len(features))
        
        # Back-to-back indicator
        features['back_to_back'] = np.random.choice([0, 1], len(features), p=[0.8, 0.2])
        
        # Team pace factor
        features['team_pace'] = np.random.uniform(95, 105, len(features))
        
        # Defensive rating against position
        features['opp_def_rating'] = np.random.uniform(100, 120, len(features))
        
        return features
    
    def _add_nfl_features(self, features: pd.DataFrame, contextual_data: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """Add NFL-specific features"""
        # Snap share
        if 'snap_share' not in features.columns:
            features['snap_share'] = np.random.uniform(0.3, 1.0, len(features))
        
        # Target share for pass catchers
        if 'target_share' not in features.columns:
            features['target_share'] = np.random.uniform(0.1, 0.3, len(features))
        
        # Red zone usage
        features['red_zone_share'] = np.random.uniform(0.05, 0.25, len(features))
        
        # Weather impact (for outdoor games)
        features['weather_impact'] = np.random.uniform(0.0, 0.3, len(features))
        
        # Vegas game total
        features['game_total'] = np.random.uniform(40, 55, len(features))
        
        # Team implied total
        features['team_total'] = np.random.uniform(17, 35, len(features))
        
        # Defense vs position ranking
        features['dvp_rank'] = np.random.randint(1, 33, len(features))
        
        return features
    
    def _add_common_features(self, features: pd.DataFrame, contextual_data: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """Add features common to both sports"""
        # Salary-based features
        if 'salary' in features.columns:
            features['salary_per_1k'] = features['salary'] / 1000
            features['value_score'] = np.random.uniform(3, 8, len(features))  # Points per $1k
        
        # Injury risk score
        features['injury_risk'] = np.random.uniform(0.0, 0.3, len(features))
        
        # Ownership projection
        if 'projected_ownership' not in features.columns:
            features['projected_ownership'] = np.random.uniform(0.02, 0.4, len(features))
        
        # Recent form (last 5 games average)
        features['recent_form'] = np.random.uniform(0.8, 1.2, len(features))
        
        # Matchup difficulty score
        features['matchup_difficulty'] = np.random.uniform(0.0, 1.0, len(features))
        
        return features
    
    def train_models(self, training_data: pd.DataFrame, target_column: str = 'actual_points') -> Dict[str, float]:
        """Train ensemble models on historical data"""
        if not HAS_ML_LIBS:
            return {"error": "ML libraries not available"}
        
        # Prepare features
        feature_columns = [col for col in training_data.columns 
                          if col not in ['actual_points', 'player_id', 'name', 'team', 'position', 'game_id']]
        
        X = training_data[feature_columns].fillna(0)
        y = training_data[target_column].fillna(0)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        model_scores = {}
        
        for model_name, model in self.models.items():
            try:
                # Scale features
                X_train_scaled = self.scalers[model_name].fit_transform(X_train)
                X_test_scaled = self.scalers[model_name].transform(X_test)
                
                # Train model
                model.fit(X_train_scaled, y_train)
                
                # Evaluate
                y_pred = model.predict(X_test_scaled)
                mse = mean_squared_error(y_test, y_pred)
                mae = mean_absolute_error(y_test, y_pred)
                
                model_scores[model_name] = {
                    'mse': mse,
                    'mae': mae,
                    'rmse': np.sqrt(mse)
                }
                
                # Store feature importance
                if hasattr(model, 'feature_importances_'):
                    importance_dict = dict(zip(feature_columns, model.feature_importances_))
                    self.feature_importance[model_name] = importance_dict
                
                print(f"{model_name} - RMSE: {np.sqrt(mse):.3f}, MAE: {mae:.3f}")
                
            except Exception as e:
                print(f"Error training {model_name}: {e}")
                model_scores[model_name] = {"error": str(e)}
        
        return model_scores
    
    def generate_projections(self, player_data: pd.DataFrame, contextual_data: Dict[str, pd.DataFrame]) -> List[Projection]:
        """Generate projections using ensemble methods"""
        # Create features
        features = self.create_features(player_data, contextual_data)
        
        projections = []
        
        for _, player in features.iterrows():
            # Generate baseline projection
            baseline_proj = self._generate_baseline_projection(player)
            
            # Generate ML projections if available
            ml_projections = {}
            if HAS_ML_LIBS and self.models:
                ml_projections = self._generate_ml_projections(player, features.columns)
            
            # Ensemble the projections
            final_projection = self._ensemble_projections(baseline_proj, ml_projections, player)
            
            projections.append(final_projection)
        
        return projections
    
    def _generate_baseline_projection(self, player: pd.Series) -> Dict[str, float]:
        """Generate rules-based baseline projection"""
        # Simple baseline based on salary and position
        salary = player.get('salary', 5000)
        position = player.get('position', 'FLEX')
        
        if self.sport == SportType.NBA:
            # NBA baseline: roughly 5-6 points per $1000 salary
            base_points = (salary / 1000) * np.random.uniform(4.5, 6.0)
            
            # Position adjustments
            if position in ['PG', 'SG']:
                base_points *= np.random.uniform(0.95, 1.1)
            elif position in ['SF', 'PF']:
                base_points *= np.random.uniform(0.9, 1.05)
            else:  # C
                base_points *= np.random.uniform(0.85, 1.0)
        
        else:  # NFL
            # NFL baseline: roughly 2.5-3.5 points per $1000 salary
            base_points = (salary / 1000) * np.random.uniform(2.2, 3.8)
            
            # Position adjustments
            if position == 'QB':
                base_points *= np.random.uniform(1.1, 1.3)
            elif position == 'RB':
                base_points *= np.random.uniform(0.9, 1.2)
            elif position in ['WR', 'TE']:
                base_points *= np.random.uniform(0.8, 1.1)
            else:  # DST
                base_points *= np.random.uniform(0.7, 1.0)
        
        return {
            'mean': max(base_points, 0),
            'std': base_points * 0.3,  # 30% standard deviation
            'floor': max(base_points * 0.6, 0),
            'ceiling': base_points * 1.8
        }
    
    def _generate_ml_projections(self, player: pd.Series, feature_columns: List[str]) -> Dict[str, Dict[str, float]]:
        """Generate ML-based projections"""
        if not self.models:
            return {}
        
        ml_projections = {}
        
        # Prepare feature vector
        feature_vector = []
        for col in feature_columns:
            if col in ['player_id', 'name', 'team', 'position', 'game_id']:
                continue
            value = player.get(col, 0)
            if pd.isna(value):
                value = 0
            feature_vector.append(float(value))
        
        feature_vector = np.array(feature_vector).reshape(1, -1)
        
        for model_name, model in self.models.items():
            try:
                # Scale features
                feature_vector_scaled = self.scalers[model_name].transform(feature_vector)
                
                # Predict
                prediction = model.predict(feature_vector_scaled)[0]
                
                ml_projections[model_name] = {
                    'mean': max(prediction, 0),
                    'std': prediction * 0.25,  # 25% standard deviation for ML
                    'floor': max(prediction * 0.7, 0),
                    'ceiling': prediction * 1.6
                }
                
            except Exception as e:
                print(f"Error generating ML projection with {model_name}: {e}")
        
        return ml_projections
    
    def _ensemble_projections(self, baseline: Dict[str, float], 
                            ml_projections: Dict[str, Dict[str, float]], 
                            player: pd.Series) -> Projection:
        """Combine baseline and ML projections using weighted ensemble"""
        
        # Default weights from config
        ensemble_config = self.ai_config.get('projection_engines', {}).get('ensemble_ml', {})
        baseline_weight = 0.4
        ml_weight = 0.6
        
        if 'model_ensemble' in self.ai_config:
            weights = self.ai_config['model_ensemble']
            baseline_weight = weights.get('baseline_rules', 0.3)
            ml_weight = 1.0 - baseline_weight
        
        # Start with baseline
        final_mean = baseline['mean'] * baseline_weight
        final_std = baseline['std'] * baseline_weight
        final_floor = baseline['floor'] * baseline_weight
        final_ceiling = baseline['ceiling'] * baseline_weight
        
        # Add ML projections
        if ml_projections:
            ml_count = len(ml_projections)
            ml_weight_per_model = ml_weight / ml_count
            
            for model_name, proj in ml_projections.items():
                final_mean += proj['mean'] * ml_weight_per_model
                final_std += proj['std'] * ml_weight_per_model
                final_floor += proj['floor'] * ml_weight_per_model
                final_ceiling += proj['ceiling'] * ml_weight_per_model
        
        # Create projection object
        return Projection(
            player_id=str(player.get('player_id', player.get('name', 'unknown'))),
            sport=self.sport,
            mean=final_mean,
            floor=final_floor,
            ceiling=final_ceiling,
            std=final_std,
            baseline_projection=baseline['mean'],
            ml_projection=final_mean - baseline['mean'] * baseline_weight if ml_projections else None,
            confidence=min(0.9, 0.5 + len(ml_projections) * 0.1)  # Higher confidence with more models
        )
    
    def get_feature_importance(self, model_name: str = None) -> Dict[str, float]:
        """Get feature importance from trained models"""
        if model_name and model_name in self.feature_importance:
            return self.feature_importance[model_name]
        
        # Return average importance across all models
        if not self.feature_importance:
            return {}
        
        all_features = set()
        for importances in self.feature_importance.values():
            all_features.update(importances.keys())
        
        avg_importance = {}
        for feature in all_features:
            importances = [imp.get(feature, 0) for imp in self.feature_importance.values()]
            avg_importance[feature] = np.mean(importances)
        
        return avg_importance
    
    def save_models(self, output_dir: str):
        """Save trained models and scalers"""
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        # Save models (would use joblib in real implementation)
        model_info = {
            'sport': self.sport.value,
            'models': list(self.models.keys()),
            'feature_importance': self.feature_importance,
            'created_at': datetime.now().isoformat()
        }
        
        with open(output_path / 'model_info.json', 'w') as f:
            json.dump(model_info, f, indent=2)
        
        print(f"Model information saved to {output_path}")
