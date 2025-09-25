"""
Test suite for DFS salary cap resolver
"""

import pytest
from lib.caps import (
    get_cap,
    get_default_cap,
    validate_site_mode,
    get_supported_sites,
    get_supported_modes,
    calculate_captain_salary,
    CapResolverError,
)


class TestCapResolver:
    """Test salary cap resolution"""

    def test_get_cap_defaults(self):
        """Test default salary caps"""
        assert get_cap("DK", "classic") == 50000
        assert get_cap("DK", "showdown") == 50000
        assert get_cap("FD", "classic") == 60000

    def test_get_cap_with_override(self):
        """Test salary cap with override"""
        # Valid override (less than default)
        assert get_cap("DK", "classic", 45000) == 45000
        assert get_cap("FD", "classic", 55000) == 55000

        # Override equal to default
        assert get_cap("DK", "classic", 50000) == 50000

    def test_get_cap_invalid_override(self):
        """Test invalid salary cap overrides"""
        # Override exceeds default
        with pytest.raises(CapResolverError, match="exceeds maximum"):
            get_cap("DK", "classic", 55000)

        with pytest.raises(CapResolverError, match="exceeds maximum"):
            get_cap("FD", "classic", 65000)

        # Negative override
        with pytest.raises(CapResolverError, match="cannot be negative"):
            get_cap("DK", "classic", -1000)

    def test_get_cap_invalid_site(self):
        """Test invalid DFS site"""
        with pytest.raises(CapResolverError, match="Invalid DFS site"):
            get_cap("INVALID", "classic")

    def test_get_cap_invalid_mode(self):
        """Test invalid contest mode"""
        with pytest.raises(CapResolverError, match="Invalid contest mode"):
            get_cap("DK", "invalid_mode")

    def test_validate_site_mode(self):
        """Test site/mode validation"""
        assert validate_site_mode("DK", "classic") == True
        assert validate_site_mode("DK", "showdown") == True
        assert validate_site_mode("FD", "classic") == True

        assert validate_site_mode("INVALID", "classic") == False
        assert validate_site_mode("DK", "invalid") == False

    def test_get_supported_sites(self):
        """Test getting supported sites"""
        sites = get_supported_sites()
        assert "DK" in sites
        assert "FD" in sites
        assert len(sites) >= 2

    def test_get_supported_modes(self):
        """Test getting supported modes"""
        dk_modes = get_supported_modes("DK")
        assert "classic" in dk_modes
        assert "showdown" in dk_modes

        fd_modes = get_supported_modes("FD")
        assert "classic" in fd_modes

        # Invalid site
        with pytest.raises(CapResolverError):
            get_supported_modes("INVALID")


class TestCaptainSalary:
    """Test captain salary calculations for showdown"""

    def test_calculate_captain_salary_dk_showdown(self):
        """Test DK showdown captain salary (1.5x multiplier)"""
        assert calculate_captain_salary(8000, "DK", "showdown") == 12000
        assert calculate_captain_salary(6400, "DK", "showdown") == 9600
        assert calculate_captain_salary(5000, "DK", "showdown") == 7500

        # Test floor behavior with odd numbers
        assert (
            calculate_captain_salary(5333, "DK", "showdown") == 7999
        )  # floor(5333 * 1.5)

    def test_calculate_captain_salary_classic(self):
        """Test classic mode (no multiplier)"""
        assert calculate_captain_salary(8000, "DK", "classic") == 8000
        assert calculate_captain_salary(6400, "FD", "classic") == 6400

    def test_calculate_captain_salary_edge_cases(self):
        """Test edge cases"""
        # Minimum salary
        assert calculate_captain_salary(3000, "DK", "showdown") == 4500

        # Zero salary (edge case)
        assert calculate_captain_salary(0, "DK", "showdown") == 0


class TestIntegration:
    """Integration tests for cap resolver"""

    def test_dk_classic_constraints(self):
        """Test DK Classic salary constraints"""
        cap = get_cap("DK", "classic")
        assert cap == 50000

        # Test 98% minimum (typical constraint)
        min_salary = int(cap * 0.98)
        assert min_salary == 49000

        # Test valid range
        assert get_cap("DK", "classic", 49500) == 49500  # Valid override

        with pytest.raises(CapResolverError):
            get_cap("DK", "classic", 50001)  # Over cap

    def test_showdown_captain_total_salary(self):
        """Test showdown lineup with captain doesn't exceed cap"""
        base_salaries = [8000, 6400, 5800, 5200, 4800, 4600]  # 6 players

        # Calculate total with first player as captain
        captain_salary = calculate_captain_salary(base_salaries[0], "DK", "showdown")
        flex_salaries = base_salaries[1:]

        total_salary = captain_salary + sum(flex_salaries)

        # Should be within DK showdown cap
        cap = get_cap("DK", "showdown")
        assert total_salary <= cap

        # Verify captain multiplier applied
        assert captain_salary == 12000  # 8000 * 1.5
        assert total_salary == 12000 + 26800  # 38800 total
        assert total_salary < 50000  # Under cap


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
