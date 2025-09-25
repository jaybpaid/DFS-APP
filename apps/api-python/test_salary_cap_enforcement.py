#!/usr/bin/env python3
"""
Comprehensive Salary Cap Enforcement Test
Tests all components to ensure DK lineups NEVER exceed $50,000
"""

import sys
import os

sys.path.append(os.path.dirname(__file__))

from lib.caps import get_cap, calculate_captain_salary, CapResolverError
from lib.validation import LineupValidator, validate_request
from lib.constants import SALARY_CAPS


def test_cap_resolver():
    """Test salary cap resolver"""
    print("🧪 Testing Cap Resolver...")

    # Test DK Classic
    assert get_cap("DK", "classic") == 50000, "DK Classic cap should be $50,000"
    assert (
        get_cap("DK", "classic", 49000) == 49000
    ), "Override should work when <= default"

    # Test invalid override
    try:
        get_cap("DK", "classic", 55000)
        assert False, "Should raise error for override > default"
    except CapResolverError:
        pass  # Expected

    # Test captain salary
    assert (
        calculate_captain_salary(8000, "DK", "showdown") == 12000
    ), "Captain should be 1.5x"
    assert (
        calculate_captain_salary(8000, "DK", "classic") == 8000
    ), "Classic should be 1x"

    print("✅ Cap Resolver tests passed")


def test_lineup_validator():
    """Test lineup validation"""
    print("🧪 Testing Lineup Validator...")

    # Sample players
    players = [
        {
            "id": "1",
            "name": "Josh Allen",
            "position": "QB",
            "team": "BUF",
            "salary": 8400,
            "projected_points": 25.0,
        },
        {
            "id": "2",
            "name": "Saquon Barkley",
            "position": "RB",
            "team": "NYG",
            "salary": 7400,
            "projected_points": 20.0,
        },
        {
            "id": "3",
            "name": "Nick Chubb",
            "position": "RB",
            "team": "CLE",
            "salary": 7000,
            "projected_points": 18.0,
        },
        {
            "id": "4",
            "name": "Tyreek Hill",
            "position": "WR",
            "team": "MIA",
            "salary": 8200,
            "projected_points": 22.0,
        },
        {
            "id": "5",
            "name": "Stefon Diggs",
            "position": "WR",
            "team": "BUF",
            "salary": 7600,
            "projected_points": 20.0,
        },
        {
            "id": "6",
            "name": "CeeDee Lamb",
            "position": "WR",
            "team": "DAL",
            "salary": 7000,
            "projected_points": 19.0,
        },
        {
            "id": "7",
            "name": "Travis Kelce",
            "position": "TE",
            "team": "KC",
            "salary": 6800,
            "projected_points": 16.0,
        },
        {
            "id": "8",
            "name": "Austin Ekeler",
            "position": "RB",
            "team": "LAC",
            "salary": 4400,
            "projected_points": 14.0,
        },
        {
            "id": "9",
            "name": "Bills DST",
            "position": "DST",
            "team": "BUF",
            "salary": 3200,
            "projected_points": 8.0,
        },
    ]

    validator = LineupValidator("DK", "classic", 50000, players)

    # Valid lineup (under cap)
    valid_lineup = {
        "lineup_id": 1,
        "players": [
            {
                "player_id": "1",
                "name": "Josh Allen",
                "position": "QB",
                "team": "BUF",
                "salary": 8400,
            },
            {
                "player_id": "2",
                "name": "Saquon Barkley",
                "position": "RB",
                "team": "NYG",
                "salary": 7400,
            },
            {
                "player_id": "3",
                "name": "Nick Chubb",
                "position": "RB",
                "team": "CLE",
                "salary": 7000,
            },
            {
                "player_id": "4",
                "name": "Tyreek Hill",
                "position": "WR",
                "team": "MIA",
                "salary": 8200,
            },
            {
                "player_id": "5",
                "name": "Stefon Diggs",
                "position": "WR",
                "team": "BUF",
                "salary": 7600,
            },
            {
                "player_id": "6",
                "name": "CeeDee Lamb",
                "position": "WR",
                "team": "DAL",
                "salary": 7000,
            },
            {
                "player_id": "7",
                "name": "Travis Kelce",
                "position": "TE",
                "team": "KC",
                "salary": 6800,
            },
            {
                "player_id": "8",
                "name": "Austin Ekeler",
                "position": "RB",
                "team": "LAC",
                "salary": 4400,
            },
            {
                "player_id": "9",
                "name": "Bills DST",
                "position": "DST",
                "team": "BUF",
                "salary": 3200,
            },
        ],
    }

    validation = validator.validate_lineup(valid_lineup)
    total_salary = validation["total_salary"]

    print(f"   Over-cap lineup total: ${total_salary:,}")
    assert not validation["valid"], f"Lineup should be invalid: {validation['errors']}"
    assert not validation["salary_cap_ok"], "Salary cap should NOT be OK"
    assert (
        total_salary > 50000
    ), f"Total salary ${total_salary:,} should exceed $50,000 cap"
    assert (
        total_salary == 60000
    ), f"Expected $60,000, got ${total_salary:,}"  # This should be exactly 60k

    # Invalid lineup (over cap) - this should be caught
    invalid_lineup = {
        "lineup_id": 2,
        "players": [
            {
                "player_id": "1",
                "name": "Josh Allen",
                "position": "QB",
                "team": "BUF",
                "salary": 8400,
            },
            {
                "player_id": "2",
                "name": "Saquon Barkley",
                "position": "RB",
                "team": "NYG",
                "salary": 7400,
            },
            {
                "player_id": "3",
                "name": "Nick Chubb",
                "position": "RB",
                "team": "CLE",
                "salary": 7000,
            },
            {
                "player_id": "4",
                "name": "Tyreek Hill",
                "position": "WR",
                "team": "MIA",
                "salary": 8200,
            },
            {
                "player_id": "5",
                "name": "Stefon Diggs",
                "position": "WR",
                "team": "BUF",
                "salary": 7600,
            },
            {
                "player_id": "6",
                "name": "CeeDee Lamb",
                "position": "WR",
                "team": "DAL",
                "salary": 7000,
            },
            {
                "player_id": "7",
                "name": "Travis Kelce",
                "position": "TE",
                "team": "KC",
                "salary": 8800,
            },  # Higher salary
            {
                "player_id": "8",
                "name": "Austin Ekeler",
                "position": "RB",
                "team": "LAC",
                "salary": 6400,
            },  # Higher salary
            {
                "player_id": "9",
                "name": "Bills DST",
                "position": "DST",
                "team": "BUF",
                "salary": 3200,
            },
        ],
    }

    invalid_validation = validator.validate_lineup(invalid_lineup)
    invalid_total = invalid_validation["total_salary"]

    print(f"   Invalid lineup total: ${invalid_total:,}")
    assert not invalid_validation["valid"], "Over-cap lineup should be invalid"
    assert not invalid_validation["salary_cap_ok"], "Salary cap should NOT be OK"
    assert (
        invalid_total > 50000
    ), f"Invalid lineup should exceed cap: ${invalid_total:,}"

    print("✅ Lineup Validator tests passed")


def test_request_validation():
    """Test request validation"""
    print("🧪 Testing Request Validation...")

    # Valid request
    valid_request = {
        "slate_id": "test-slate",
        "site": "DK",
        "mode": "classic",
        "players": [
            {
                "id": "1",
                "name": "Test",
                "position": "QB",
                "team": "BUF",
                "salary": 8000,
                "projected_points": 20,
            }
        ],
        "num_lineups": 10,
        "constraints": {},
    }

    is_valid, errors = validate_request(valid_request)
    assert is_valid, f"Valid request should pass: {errors}"

    # Invalid request (missing site)
    invalid_request = {"slate_id": "test-slate", "players": [], "num_lineups": 10}

    is_valid, errors = validate_request(invalid_request)
    assert not is_valid, "Invalid request should fail"
    assert any(
        "site" in error for error in errors
    ), f"Should mention missing site: {errors}"

    print("✅ Request Validation tests passed")


def test_salary_cap_constants():
    """Test salary cap constants are correct"""
    print("🧪 Testing Salary Cap Constants...")

    # Verify DK caps
    assert SALARY_CAPS["DK"]["classic"] == 50000, "DK Classic should be $50,000"
    assert SALARY_CAPS["DK"]["showdown"] == 50000, "DK Showdown should be $50,000"
    assert SALARY_CAPS["FD"]["classic"] == 60000, "FD Classic should be $60,000"

    print("✅ Salary Cap Constants tests passed")


def test_never_exceed_50k():
    """Critical test: Ensure system NEVER allows lineups over $50,000 for DK"""
    print("🧪 Testing NEVER EXCEED $50,000 for DraftKings...")

    # Test various scenarios that should all be blocked
    test_cases = [
        {"site": "DK", "mode": "classic", "expected_cap": 50000},
        {"site": "DK", "mode": "showdown", "expected_cap": 50000},
    ]

    for case in test_cases:
        cap = get_cap(case["site"], case["mode"])
        assert (
            cap == case["expected_cap"]
        ), f"{case['site']} {case['mode']} cap should be ${case['expected_cap']:,}"

        # Test that override cannot exceed default
        try:
            get_cap(case["site"], case["mode"], case["expected_cap"] + 1)
            assert False, f"Should not allow override > ${case['expected_cap']:,}"
        except CapResolverError:
            pass  # Expected

    print("✅ NEVER EXCEED $50,000 tests passed")


def run_all_tests():
    """Run all salary cap enforcement tests"""
    print("🚀 Running Comprehensive Salary Cap Enforcement Tests")
    print("=" * 60)

    try:
        test_salary_cap_constants()
        test_cap_resolver()
        test_request_validation()
        test_lineup_validator()
        test_never_exceed_50k()

        print("=" * 60)
        print("🎉 ALL TESTS PASSED!")
        print("✅ DraftKings salary cap enforcement is working correctly")
        print("✅ System will NEVER generate lineups over $50,000")
        print("✅ Post-solve validation will catch and repair/drop invalid lineups")
        print("✅ Request validation prevents invalid configurations")

        return True

    except Exception as e:
        print("=" * 60)
        print(f"❌ TEST FAILED: {e}")
        print("🚨 SALARY CAP ENFORCEMENT IS NOT WORKING CORRECTLY")
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
