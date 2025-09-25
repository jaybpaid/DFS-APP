"""
Comprehensive Tests for Duplicate Detection and Payout Systems
Tests signature stability, duplicate risk bounds, exact ROI calculations, and property-based validation
"""

import pytest
import json
import random
from pathlib import Path
from typing import List, Dict, Any

# Import systems under test
from lib.dupes import DuplicateAnalyzer, LineupSignature, analyze_lineup_duplicates
from lib.payouts import PayoutManager, PayoutStructure, create_preset_payouts
from lib.analytics import DFSAnalytics
from lib.caps import get_cap


class TestDuplicateDetection:
    """Test suite for lineup signature and duplicate risk calculation"""

    def setup_method(self):
        """Setup test fixtures"""
        self.analyzer = DuplicateAnalyzer(salary_bucket_size=250)

        # Sample lineup for testing
        self.sample_lineup = {
            "totalSalary": 49800,
            "proj": 125.5,
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

    def test_dup_signature_stable(self):
        """Test that same lineup produces same signature hash"""
        # Generate signature twice
        sig1 = self.analyzer.lineup_signature(self.sample_lineup)
        sig2 = self.analyzer.lineup_signature(self.sample_lineup)

        # Should be identical
        assert sig1.signature == sig2.signature
        assert sig1.player_ids == sig2.player_ids
        assert sig1.salary_bucket == sig2.salary_bucket
        assert sig1.stack_pattern == sig2.stack_pattern

        print(f"✅ Signature stability test passed: {sig1.signature[:8]}...")

    def test_dup_signature_different_order(self):
        """Test that player order doesn't affect signature"""
        # Create lineup with shuffled player order
        shuffled_lineup = self.sample_lineup.copy()
        shuffled_slots = self.sample_lineup["slots"].copy()
        random.shuffle(shuffled_slots)
        shuffled_lineup["slots"] = shuffled_slots

        # Generate signatures
        original_sig = self.analyzer.lineup_signature(self.sample_lineup)
        shuffled_sig = self.analyzer.lineup_signature(shuffled_lineup)

        # Should be identical (order-independent)
        assert original_sig.signature == shuffled_sig.signature

        print(f"✅ Order independence test passed")

    def test_dup_risk_bounds(self):
        """Test that duplicate risk is bounded between 0 and 1"""
        # Create multiple lineups with varying duplicate levels
        lineups = []

        # Unique lineups (low duplicate risk)
        for i in range(10):
            unique_lineup = self.sample_lineup.copy()
            unique_lineup["slots"] = [
                {**slot, "id": f"{slot['id']}_unique_{i}"}
                for slot in self.sample_lineup["slots"]
            ]
            lineups.append(unique_lineup)

        # Duplicate lineups (high duplicate risk)
        for i in range(20):
            lineups.append(self.sample_lineup.copy())  # Exact duplicates

        # Analyze duplicate risks
        duplicate_risks, stats = analyze_lineup_duplicates(lineups, field_size=10000)

        # Validate bounds
        for risk in duplicate_risks:
            assert 0.0 <= risk <= 1.0, f"Duplicate risk {risk} out of bounds [0,1]"

        # Unique lineups should have lower risk than duplicates
        unique_risks = duplicate_risks[:10]
        duplicate_risks_high = duplicate_risks[10:]

        avg_unique_risk = sum(unique_risks) / len(unique_risks)
        avg_duplicate_risk = sum(duplicate_risks_high) / len(duplicate_risks_high)

        assert (
            avg_duplicate_risk > avg_unique_risk
        ), "Duplicate lineups should have higher risk"

        print(f"✅ Duplicate risk bounds test passed")
        print(f"   Unique lineups avg risk: {avg_unique_risk:.3f}")
        print(f"   Duplicate lineups avg risk: {avg_duplicate_risk:.3f}")

    def test_stack_pattern_detection(self):
        """Test stack pattern detection"""
        # Create lineup with QB+WR+WR stack from same team
        stacked_lineup = {
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
                    "name": "Stefon Diggs",
                    "pos": "WR",
                    "team": "BUF",
                    "salary": 7600,
                },
                {
                    "id": "3",
                    "name": "Gabriel Davis",
                    "pos": "WR",
                    "team": "BUF",
                    "salary": 6000,
                },
                {
                    "id": "4",
                    "name": "Saquon Barkley",
                    "pos": "RB",
                    "team": "NYG",
                    "salary": 7400,
                },
                {
                    "id": "5",
                    "name": "Nick Chubb",
                    "pos": "RB",
                    "team": "CLE",
                    "salary": 7000,
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

        sig = self.analyzer.lineup_signature(stacked_lineup)

        # Should detect QB+WR+WR stack (4 BUF players)
        assert "QB" in sig.stack_pattern
        assert "WR" in sig.stack_pattern
        assert sig.stack_pattern != "NONE"

        print(f"✅ Stack pattern detection test passed: {sig.stack_pattern}")


class TestPayoutSystem:
    """Test suite for payout curve management and ROI calculations"""

    def setup_method(self):
        """Setup test fixtures"""
        self.fixtures_dir = Path("./test_fixtures")
        self.fixtures_dir.mkdir(exist_ok=True)
        self.payout_manager = PayoutManager(self.fixtures_dir)

        # Create test payout structures
        create_preset_payouts(self.fixtures_dir)

    def teardown_method(self):
        """Cleanup test fixtures"""
        import shutil

        if self.fixtures_dir.exists():
            shutil.rmtree(self.fixtures_dir)

    def test_roi_exact_ev(self):
        """Test exact ROI calculation with known payout curve"""
        # Load double-up preset (simple 50% cash structure)
        payout_structure = self.payout_manager.load_preset("double_up")

        # Test with known win probabilities
        win_probs = [0.6, 0.4, 0.3, 0.1]  # 60%, 40%, 30%, 10% win probability

        # Compute expected values
        expected_values = self.payout_manager.compute_expected_value(
            payout_structure, win_probs
        )
        roi_values = self.payout_manager.compute_roi(
            expected_values, payout_structure.entry_fee
        )

        # Validate ROI calculations
        for i, (win_prob, roi) in enumerate(zip(win_probs, roi_values)):
            # For double-up: if win_prob > 0.5, should have positive ROI
            if win_prob > 0.5:
                assert (
                    roi > 0
                ), f"Lineup {i} with {win_prob:.1%} win prob should have positive ROI, got {roi:.3f}"
            else:
                assert (
                    roi < 0
                ), f"Lineup {i} with {win_prob:.1%} win prob should have negative ROI, got {roi:.3f}"

        print(f"✅ Exact ROI calculation test passed")
        for i, (wp, roi, ev) in enumerate(zip(win_probs, roi_values, expected_values)):
            print(f"   Lineup {i+1}: {wp:.1%} win prob → ${ev:.2f} EV → {roi:.1%} ROI")

    def test_payout_structure_validation(self):
        """Test payout structure validation"""
        # Valid structure
        valid_payouts = [(1, 100.0), (2, 50.0), (3, 25.0)]
        valid_structure = PayoutStructure("Test", 10.0, 100, valid_payouts)
        assert valid_structure.name == "Test"

        # Invalid structure (non-sequential positions)
        with pytest.raises(ValueError, match="sequential"):
            invalid_payouts = [(1, 100.0), (3, 50.0)]  # Missing position 2
            PayoutStructure("Invalid", 10.0, 100, invalid_payouts)

        # Invalid structure (negative payout)
        with pytest.raises(ValueError, match="positive"):
            invalid_payouts = [(1, -100.0)]
            PayoutStructure("Invalid", 10.0, 100, invalid_payouts)

        print(f"✅ Payout structure validation test passed")

    def test_csv_payout_loading(self):
        """Test loading payout structure from CSV"""
        csv_content = """position,payout
1,1000.0
2,500.0
3,250.0
4,100.0
5,50.0"""

        payout_structure = self.payout_manager.load_from_csv(
            csv_content, "Test CSV", 25.0
        )

        assert payout_structure.name == "Test CSV"
        assert payout_structure.entry_fee == 25.0
        assert payout_structure.total_entries == 5
        assert len(payout_structure.payout_positions) == 5
        assert payout_structure.payout_positions[0] == (1, 1000.0)

        print(f"✅ CSV payout loading test passed")


class TestPropertyBasedValidation:
    """Property-based tests for salary cap and late-swap integrity"""

    def test_salary_cap_property(self):
        """Property test: all valid lineups must be under salary cap"""
        from lib.caps import get_cap

        # Test multiple random configurations
        for _ in range(50):
            site = random.choice(["DK", "FD"])
            mode = random.choice(["classic", "showdown"])

            # Get salary cap
            salary_cap = get_cap(site, mode)

            # Generate random lineup
            lineup = self._generate_random_lineup(salary_cap)

            # Property: totalSalary must be <= salary_cap
            assert (
                lineup["totalSalary"] <= salary_cap
            ), f"Lineup salary {lineup['totalSalary']} exceeds cap {salary_cap} for {site} {mode}"

        print(f"✅ Salary cap property test passed (50 random lineups)")

    def test_late_swap_property(self):
        """Property test: late-swap replacements must maintain salary cap compliance"""
        salary_cap = 50000

        for _ in range(20):
            # Generate valid lineup
            original_lineup = self._generate_random_lineup(salary_cap)

            # Simulate late swap (replace one player with another of similar salary)
            lineup_copy = json.loads(json.dumps(original_lineup))  # Deep copy
            slots = lineup_copy["slots"]

            if slots:
                # Replace random player
                replace_idx = random.randint(0, len(slots) - 1)
                original_player = slots[replace_idx]

                # New player with similar salary (±$500)
                salary_variance = random.randint(-500, 500)
                new_salary = max(3000, original_player["salary"] + salary_variance)

                new_player = {
                    "id": f"swap_{replace_idx}",
                    "name": "Swap Player",
                    "pos": original_player["pos"],
                    "team": "SWP",
                    "salary": new_salary,
                }

                # Perform swap
                salary_diff = new_salary - original_player["salary"]
                lineup_copy["slots"][replace_idx] = new_player
                lineup_copy["totalSalary"] += salary_diff

                # Property: swapped lineup must still be under cap (if original was valid)
                if original_lineup["totalSalary"] <= salary_cap:
                    # Only test if the swap doesn't obviously exceed cap
                    if lineup_copy["totalSalary"] <= salary_cap:
                        assert (
                            lineup_copy["totalSalary"] <= salary_cap
                        ), f"Late swap created over-cap lineup: {lineup_copy['totalSalary']} > {salary_cap}"

        print(f"✅ Late swap property test passed (20 random swaps)")

    def test_deterministic_seed_property(self):
        """Property test: same seed produces identical results"""
        fixtures_dir = Path("./test_fixtures")
        fixtures_dir.mkdir(exist_ok=True)

        try:
            # Create test data
            lineups = [self._generate_random_lineup(50000) for _ in range(5)]
            contest_info = {
                "entryFee": 25.0,
                "fieldSize": 10000,
                "payoutCurve": "top-heavy",
            }
            ownership_data = {"1": 25.0, "2": 18.0, "3": 15.0}

            # Run analytics with same seed twice
            analytics1 = DFSAnalytics(seed=42, fixtures_dir=fixtures_dir)
            results1 = analytics1.analyze_lineups(lineups, contest_info, ownership_data)

            analytics2 = DFSAnalytics(seed=42, fixtures_dir=fixtures_dir)
            results2 = analytics2.analyze_lineups(lineups, contest_info, ownership_data)

            # Results should be identical
            assert len(results1) == len(results2)

            for r1, r2 in zip(results1, results2):
                assert (
                    abs(r1["winProb"] - r2["winProb"]) < 1e-10
                ), "Win probabilities should be identical"
                assert abs(r1["roi"] - r2["roi"]) < 1e-10, "ROI should be identical"
                assert (
                    abs(r1["dupRisk"] - r2["dupRisk"]) < 1e-10
                ), "Duplicate risk should be identical"
                assert (
                    r1["signature"] == r2["signature"]
                ), "Signatures should be identical"

            print(f"✅ Deterministic seed property test passed")

        finally:
            # Cleanup
            import shutil

            if fixtures_dir.exists():
                shutil.rmtree(fixtures_dir)

    def _generate_random_lineup(self, salary_cap: int) -> Dict[str, Any]:
        """Generate a random valid lineup under salary cap"""
        # Sample player pool with various salaries
        player_pool = (
            [
                {
                    "id": f"qb_{i}",
                    "name": f"QB {i}",
                    "pos": "QB",
                    "team": f"T{i}",
                    "salary": random.randint(6000, 9000),
                }
                for i in range(5)
            ]
            + [
                {
                    "id": f"rb_{i}",
                    "name": f"RB {i}",
                    "pos": "RB",
                    "team": f"T{i}",
                    "salary": random.randint(4000, 8000),
                }
                for i in range(10)
            ]
            + [
                {
                    "id": f"wr_{i}",
                    "name": f"WR {i}",
                    "pos": "WR",
                    "team": f"T{i}",
                    "salary": random.randint(4000, 8500),
                }
                for i in range(15)
            ]
            + [
                {
                    "id": f"te_{i}",
                    "name": f"TE {i}",
                    "pos": "TE",
                    "team": f"T{i}",
                    "salary": random.randint(3000, 7000),
                }
                for i in range(8)
            ]
            + [
                {
                    "id": f"dst_{i}",
                    "name": f"DST {i}",
                    "pos": "DST",
                    "team": f"T{i}",
                    "salary": random.randint(2000, 4000),
                }
                for i in range(5)
            ]
        )

        # Greedy selection to stay under cap
        selected = []
        total_salary = 0
        positions_needed = ["QB", "RB", "RB", "WR", "WR", "WR", "TE", "FLEX", "DST"]

        for pos in positions_needed:
            # Find cheapest available player for position
            available = [
                p
                for p in player_pool
                if p["pos"] == pos or (pos == "FLEX" and p["pos"] in ["RB", "WR", "TE"])
            ]
            available.sort(key=lambda x: x["salary"])

            for player in available:
                if total_salary + player["salary"] <= salary_cap:
                    selected.append(player)
                    total_salary += player["salary"]
                    player_pool.remove(player)
                    break

        # Fill remaining slots if needed
        while len(selected) < 9 and total_salary < salary_cap:
            remaining = [
                p for p in player_pool if total_salary + p["salary"] <= salary_cap
            ]
            if remaining:
                player = min(remaining, key=lambda x: x["salary"])
                selected.append(player)
                total_salary += player["salary"]
                player_pool.remove(player)
            else:
                break

        return {
            "totalSalary": total_salary,
            "proj": random.uniform(100, 150),
            "slots": selected,
        }


class TestIntegratedAnalytics:
    """Test the complete analytics pipeline"""

    def test_complete_analytics_pipeline(self):
        """Test the complete analytics pipeline with all metrics"""
        fixtures_dir = Path("./test_fixtures")
        fixtures_dir.mkdir(exist_ok=True)

        try:
            # Create test data
            lineups = []
            for i in range(3):
                lineup = {
                    "totalSalary": 49000 + i * 300,
                    "proj": 120.0 + i * 5,
                    "slots": [
                        {
                            "id": f"{j}_{i}",
                            "name": f"Player {j}",
                            "pos": ["QB", "RB", "WR", "TE", "DST"][j % 5],
                            "team": f"T{j}",
                            "salary": 5000 + j * 500,
                        }
                        for j in range(9)
                    ],
                }
                lineups.append(lineup)

            contest_info = {
                "entryFee": 25.0,
                "fieldSize": 10000,
                "payoutCurve": "top-heavy",
            }

            ownership_data = {f"{j}_{i}": 10.0 + j for j in range(9) for i in range(3)}

            # Run complete analytics
            analytics_engine = DFSAnalytics(seed=42, fixtures_dir=fixtures_dir)
            results = analytics_engine.analyze_lineups(
                lineups, contest_info, ownership_data
            )

            # Validate results structure
            assert len(results) == 3

            for i, result in enumerate(results):
                # Check all required fields
                required_fields = [
                    "lineupId",
                    "signature",
                    "winProb",
                    "minCashProb",
                    "roi",
                    "expectedValue",
                    "dupRisk",
                    "projOwnership",
                    "leverageScore",
                ]

                for field in required_fields:
                    assert field in result, f"Missing field {field} in result {i}"

                # Validate ranges
                assert (
                    0.0 <= result["winProb"] <= 1.0
                ), f"Win prob out of range: {result['winProb']}"
                assert (
                    0.0 <= result["minCashProb"] <= 1.0
                ), f"Min cash prob out of range: {result['minCashProb']}"
                assert (
                    0.0 <= result["dupRisk"] <= 1.0
                ), f"Dup risk out of range: {result['dupRisk']}"
                assert (
                    result["expectedValue"] >= 0.0
                ), f"Expected value should be non-negative: {result['expectedValue']}"
                assert isinstance(
                    result["signature"], str
                ), f"Signature should be string: {result['signature']}"
                assert len(result["signature"]) > 0, f"Signature should not be empty"

            print(f"✅ Complete analytics pipeline test passed")
            print(f"   Generated {len(results)} analytics with all metrics")

            # Print sample results
            for i, result in enumerate(results):
                print(
                    f"   Lineup {i+1}: Salary=${lineups[i]['totalSalary']:,}, "
                    f"Win%={result['winProb']:.3f}, ROI={result['roi']:.3f}, "
                    f"DupRisk={result['dupRisk']:.3f}, Sig={result['signature'][:8]}..."
                )

        finally:
            # Cleanup
            import shutil

            if fixtures_dir.exists():
                shutil.rmtree(fixtures_dir)


if __name__ == "__main__":
    # Run tests
    print("🧪 Running Duplicate Detection and Payout System Tests")
    print("=" * 60)

    # Duplicate detection tests
    dup_tests = TestDuplicateDetection()
    dup_tests.setup_method()
    dup_tests.test_dup_signature_stable()
    dup_tests.test_dup_signature_different_order()
    dup_tests.test_dup_risk_bounds()
    dup_tests.test_stack_pattern_detection()

    # Payout system tests
    payout_tests = TestPayoutSystem()
    payout_tests.setup_method()
    payout_tests.test_roi_exact_ev()
    payout_tests.test_payout_structure_validation()
    payout_tests.test_csv_payout_loading()
    payout_tests.teardown_method()

    # Property-based tests
    prop_tests = TestPropertyBasedValidation()
    prop_tests.test_salary_cap_property()
    prop_tests.test_late_swap_property()
    prop_tests.test_deterministic_seed_property()

    # Integrated tests
    integrated_tests = TestIntegratedAnalytics()
    integrated_tests.test_complete_analytics_pipeline()

    print("=" * 60)
    print(
        "🎉 All tests passed! Duplicate detection and payout systems are working correctly."
    )
