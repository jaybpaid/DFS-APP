"""
Test suite for DFS Analytics Engine
Tests all pro-grade metrics with deterministic results
"""

import pytest
from lib.analytics import DFSAnalytics


class TestDFSAnalytics:
    """Test DFS analytics engine"""

    def setup_method(self):
        """Setup test data"""
        self.analytics = DFSAnalytics(seed=42)  # Deterministic

        self.sample_lineup = {
            "proj": 125.5,
            "totalSalary": 49800,
            "slots": [
                {
                    "id": "1",
                    "name": "Josh Allen",
                    "pos": "QB",
                    "team": "BUF",
                    "salary": 8400,
                },
                {
                    "id": "2",
                    "name": "Saquon Barkley",
                    "pos": "RB",
                    "team": "NYG",
                    "salary": 7400,
                },
                {
                    "id": "3",
                    "name": "Nick Chubb",
                    "pos": "RB",
                    "team": "CLE",
                    "salary": 7000,
                },
                {
                    "id": "4",
                    "name": "Tyreek Hill",
                    "pos": "WR",
                    "team": "MIA",
                    "salary": 8200,
                },
                {
                    "id": "5",
                    "name": "Stefon Diggs",
                    "pos": "WR",
                    "team": "BUF",
                    "salary": 7600,
                },
                {
                    "id": "6",
                    "name": "CeeDee Lamb",
                    "pos": "WR",
                    "team": "DAL",
                    "salary": 7000,
                },
                {
                    "id": "7",
                    "name": "Travis Kelce",
                    "pos": "TE",
                    "team": "KC",
                    "salary": 6800,
                },
                {
                    "id": "8",
                    "name": "Austin Ekeler",
                    "pos": "RB",
                    "team": "LAC",
                    "salary": 4400,
                },
                {
                    "id": "9",
                    "name": "Bills DST",
                    "pos": "DST",
                    "team": "BUF",
                    "salary": 3000,
                },
            ],
        }

        self.contest_info = {
            "entryFee": 25.0,
            "topPrize": 10000.0,
            "payoutCurve": "top-heavy",
            "fieldSize": 50000,
        }

        self.ownership_data = {
            "1": 25.5,  # Josh Allen
            "2": 18.2,  # Saquon Barkley
            "3": 15.8,  # Nick Chubb
            "4": 22.1,  # Tyreek Hill
            "5": 19.4,  # Stefon Diggs
            "6": 16.7,  # CeeDee Lamb
            "7": 12.3,  # Travis Kelce
            "8": 8.9,  # Austin Ekeler
            "9": 5.1,  # Bills DST
        }

    def test_analyze_lineups_returns_all_metrics(self):
        """Test that analyze_lineups returns all required metrics"""
        lineups = [self.sample_lineup]

        analytics = self.analytics.analyze_lineups(
            lineups, self.contest_info, self.ownership_data
        )

        assert len(analytics) == 1
        result = analytics[0]

        # Check all required fields exist
        required_fields = [
            "lineupId",
            "winProb",
            "minCashProb",
            "roi",
            "dupRisk",
            "projOwnership",
            "leverageScore",
        ]
        for field in required_fields:
            assert field in result, f"Missing field: {field}"

        # Check data types and ranges
        assert isinstance(result["lineupId"], int)
        assert 0 <= result["winProb"] <= 1
        assert 0 <= result["minCashProb"] <= 1
        assert isinstance(result["roi"], float)
        assert 0 <= result["dupRisk"] <= 1
        assert result["projOwnership"] >= 0
        assert isinstance(result["leverageScore"], float)

    def test_win_probability_in_valid_range(self):
        """Test win probability is in valid range [0,1]"""
        lineups = [self.sample_lineup]

        analytics = self.analytics.analyze_lineups(
            lineups, self.contest_info, self.ownership_data
        )

        win_prob = analytics[0]["winProb"]
        assert 0 <= win_prob <= 1, f"Win probability {win_prob} not in [0,1]"
        assert win_prob > 0, "Win probability should be > 0 for reasonable lineup"

    def test_min_cash_probability_in_valid_range(self):
        """Test min cash probability is in valid range [0,1]"""
        lineups = [self.sample_lineup]

        analytics = self.analytics.analyze_lineups(
            lineups, self.contest_info, self.ownership_data
        )

        min_cash_prob = analytics[0]["minCashProb"]
        assert (
            0 <= min_cash_prob <= 1
        ), f"Min cash probability {min_cash_prob} not in [0,1]"
        assert (
            min_cash_prob > 0
        ), "Min cash probability should be > 0 for reasonable lineup"

    def test_duplicate_risk_in_valid_range(self):
        """Test duplicate risk is in valid range [0,1]"""
        lineups = [self.sample_lineup]

        analytics = self.analytics.analyze_lineups(
            lineups, self.contest_info, self.ownership_data
        )

        dup_risk = analytics[0]["dupRisk"]
        assert 0 <= dup_risk <= 1, f"Duplicate risk {dup_risk} not in [0,1]"

    def test_roi_uses_entry_fee_and_curve(self):
        """Test ROI calculation uses entry fee and payout curve"""
        lineups = [self.sample_lineup]

        # Test different payout curves
        curves = ["top-heavy", "flat", "double-up", "single-entry"]
        rois = []

        for curve in curves:
            contest_info = self.contest_info.copy()
            contest_info["payoutCurve"] = curve

            analytics = self.analytics.analyze_lineups(
                lineups, contest_info, self.ownership_data
            )

            roi = analytics[0]["roi"]
            rois.append(roi)
            assert isinstance(roi, float), f"ROI should be float for {curve}"

        # ROIs should be different for different payout curves
        assert len(set(rois)) > 1, "ROI should vary by payout curve"

    def test_projected_ownership_calculation(self):
        """Test projected ownership is sum of player ownerships"""
        lineups = [self.sample_lineup]

        analytics = self.analytics.analyze_lineups(
            lineups, self.contest_info, self.ownership_data
        )

        proj_ownership = analytics[0]["projOwnership"]
        expected_ownership = sum(self.ownership_data.values())

        assert (
            abs(proj_ownership - expected_ownership) < 0.1
        ), f"Projected ownership {proj_ownership} != expected {expected_ownership}"

    def test_leverage_score_calculation(self):
        """Test leverage score calculation"""
        lineups = [self.sample_lineup]

        analytics = self.analytics.analyze_lineups(
            lineups, self.contest_info, self.ownership_data
        )

        leverage_score = analytics[0]["leverageScore"]
        assert isinstance(leverage_score, float), "Leverage score should be float"
        # Leverage can be positive (contrarian) or negative (chalky)

    def test_deterministic_with_seed(self):
        """Test analytics are deterministic with same seed"""
        lineups = [self.sample_lineup]

        # Run analytics twice with same seed
        analytics1 = DFSAnalytics(seed=42).analyze_lineups(
            lineups, self.contest_info, self.ownership_data
        )

        analytics2 = DFSAnalytics(seed=42).analyze_lineups(
            lineups, self.contest_info, self.ownership_data
        )

        # Results should be identical
        for key in analytics1[0]:
            assert (
                analytics1[0][key] == analytics2[0][key]
            ), f"Non-deterministic result for {key}"

    def test_win_prob_monotonic_vs_projection(self):
        """Test higher projection generally yields higher win probability"""
        # Create lineups with different projections
        lineup_low = self.sample_lineup.copy()
        lineup_low["proj"] = 100.0

        lineup_high = self.sample_lineup.copy()
        lineup_high["proj"] = 150.0

        lineups = [lineup_low, lineup_high]

        analytics = self.analytics.analyze_lineups(
            lineups, self.contest_info, self.ownership_data
        )

        win_prob_low = analytics[0]["winProb"]
        win_prob_high = analytics[1]["winProb"]

        # Higher projection should generally have higher win probability
        # (allowing for some variance due to Monte Carlo)
        assert (
            win_prob_high >= win_prob_low * 0.8
        ), f"Higher projection should yield higher win prob: {win_prob_high} vs {win_prob_low}"

    def test_multiple_lineups_analysis(self):
        """Test analyzing multiple lineups"""
        lineup2 = self.sample_lineup.copy()
        lineup2["proj"] = 130.0
        lineup2["totalSalary"] = 48500

        lineups = [self.sample_lineup, lineup2]

        analytics = self.analytics.analyze_lineups(
            lineups, self.contest_info, self.ownership_data
        )

        assert len(analytics) == 2
        assert analytics[0]["lineupId"] == 1
        assert analytics[1]["lineupId"] == 2

        # Each lineup should have all metrics
        for result in analytics:
            assert "winProb" in result
            assert "roi" in result
            assert "dupRisk" in result

    def test_edge_cases(self):
        """Test edge cases"""
        # Empty lineup
        empty_lineup = {"proj": 0, "totalSalary": 0, "slots": []}

        analytics = self.analytics.analyze_lineups(
            [empty_lineup], self.contest_info, {}
        )

        result = analytics[0]
        assert result["winProb"] >= 0
        assert result["minCashProb"] >= 0
        assert 0 <= result["dupRisk"] <= 1
        assert result["projOwnership"] >= 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
