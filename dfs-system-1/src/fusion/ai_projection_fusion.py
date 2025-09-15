from typing import List, Dict
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split

class ProjectionFusion:
    def __init__(self, projection_sources: List[Dict[str, float]]):
        self.projection_sources = projection_sources
        self.model = None

    def prepare_data(self) -> np.ndarray:
        # Combine projections from different sources into a single dataset
        combined_data = []
        for source in self.projection_sources:
            combined_data.append(list(source.values()))
        return np.array(combined_data)

    def train_model(self, target: np.ndarray):
        # Prepare the input data
        X = self.prepare_data()
        y = target

        # Split the data into training and testing sets
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Train a Random Forest model
        self.model = RandomForestRegressor()
        self.model.fit(X_train, y_train)

    def predict(self) -> np.ndarray:
        if self.model is None:
            raise ValueError("Model has not been trained yet.")
        return self.model.predict(self.prepare_data())

    def ensemble_projection(self) -> np.ndarray:
        # Get predictions from the trained model
        return self.predict()

    def rank_projections(self, projections: np.ndarray) -> List[int]:
        # Rank projections based on their values
        return list(np.argsort(-projections))  # Descending order

# Example usage:
# projection_sources = [{'source1': 20, 'source2': 22}, {'source1': 18, 'source2': 21}]
# fusion = ProjectionFusion(projection_sources)
# fusion.train_model(target=np.array([21, 20]))
# fused_projections = fusion.ensemble_projection()
# ranked_indices = fusion.rank_projections(fused_projections)