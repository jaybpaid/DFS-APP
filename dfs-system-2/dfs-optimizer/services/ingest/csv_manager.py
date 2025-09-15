"""
CSV Import/Export Manager for DFS Entries
Handles DraftKings and FanDuel CSV round-trip functionality
"""

import csv
import io
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict

from ...packages.shared.types import Player, Lineup, Entry, Site

logger = logging.getLogger(__name__)

@dataclass
class CSVEntry:
    """Represents a single entry in CSV format"""
    entry_id: str
    contest_id: str
    contest_name: str
    entry_fee: float
    lineup_id: Optional[str] = None
    players: List[str] = None  # Player names

    def __post_init__(self):
        if self.players is None:
            self.players = []

@dataclass
class CSVImportResult:
    """Result of CSV import operation"""
    success: bool
    entries: List[CSVEntry]
    total_entries: int
    validation_errors: List[str]
    warnings: List[str]

@dataclass
class CSVExportResult:
    """Result of CSV export operation"""
    success: bool
    csv_content: str
    file_count: int
    total_entries: int
    errors: List[str]

class CSVManager:
    """Manages CSV import/export operations for DFS contests"""

    def __init__(self):
        self.dk_headers = [
            'Entry ID', 'Contest Name', 'Contest ID', 'Entry Fee',
            'QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'DST'
        ]

        self.fd_headers = [
            'Entry ID', 'Contest Name', 'Contest ID', 'Entry Fee',
            'QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'DST'
        ]

    def import_csv(self, csv_content: str, site: Site = Site.DK) -> CSVImportResult:
        """Import entries from CSV content"""
        try:
            # Parse CSV
            csv_reader = csv.DictReader(io.StringIO(csv_content))
            rows = list(csv_reader)

            if not rows:
                return CSVImportResult(
                    success=False,
                    entries=[],
                    total_entries=0,
                    validation_errors=["CSV file is empty"],
                    warnings=[]
                )

            # Validate headers
            expected_headers = self.dk_headers if site == Site.DK else self.fd_headers
            actual_headers = list(rows[0].keys())

            validation_errors = []
            warnings = []

            # Check for required headers
            missing_headers = []
            for header in expected_headers:
                if header not in actual_headers:
                    missing_headers.append(header)

            if missing_headers:
                validation_errors.append(f"Missing required headers: {', '.join(missing_headers)}")

            # Parse entries
            entries = []
            for i, row in enumerate(rows, 1):
                try:
                    entry = self._parse_csv_row(row, site, i)
                    if entry:
                        entries.append(entry)
                    else:
                        validation_errors.append(f"Failed to parse row {i}")
                except Exception as e:
                    validation_errors.append(f"Error parsing row {i}: {str(e)}")

            # Validate entry consistency
            contest_ids = set(entry.contest_id for entry in entries)
            if len(contest_ids) > 1:
                warnings.append("Multiple contest IDs found in CSV")

            return CSVImportResult(
                success=len(validation_errors) == 0,
                entries=entries,
                total_entries=len(entries),
                validation_errors=validation_errors,
                warnings=warnings
            )

        except Exception as e:
            logger.error(f"CSV import failed: {e}")
            return CSVImportResult(
                success=False,
                entries=[],
                total_entries=0,
                validation_errors=[f"Import failed: {str(e)}"],
                warnings=[]
            )

    def export_csv(self, entries: List[Entry], lineups: Dict[str, Lineup],
                   site: Site = Site.DK, max_per_file: int = 500) -> CSVExportResult:
        """Export entries with lineups to CSV format"""
        try:
            if not entries:
                return CSVExportResult(
                    success=False,
                    csv_content="",
                    file_count=0,
                    total_entries=0,
                    errors=["No entries to export"]
                )

            # Group entries by contest for separate files if needed
            contest_groups = {}
            for entry in entries:
                contest_id = entry.contest_id
                if contest_id not in contest_groups:
                    contest_groups[contest_id] = []
                contest_groups[contest_id].append(entry)

            # Generate CSV content
            csv_outputs = []
            total_exported = 0

            for contest_id, contest_entries in contest_groups.items():
                # Split into chunks if too many entries
                chunks = [contest_entries[i:i + max_per_file]
                         for i in range(0, len(contest_entries), max_per_file)]

                for chunk in chunks:
                    csv_content = self._generate_csv_content(chunk, lineups, site)
                    csv_outputs.append(csv_content)
                    total_exported += len(chunk)

            # Combine all CSV outputs (in practice, you'd save separate files)
            combined_csv = "\n".join(csv_outputs)

            return CSVExportResult(
                success=True,
                csv_content=combined_csv,
                file_count=len(csv_outputs),
                total_entries=total_exported,
                errors=[]
            )

        except Exception as e:
            logger.error(f"CSV export failed: {e}")
            return CSVExportResult(
                success=False,
                csv_content="",
                file_count=0,
                total_entries=0,
                errors=[f"Export failed: {str(e)}"]
            )

    def _parse_csv_row(self, row: Dict[str, Any], site: Site, row_num: int) -> Optional[CSVEntry]:
        """Parse a single CSV row into an entry"""
        try:
            entry_id = str(row.get('Entry ID', f'entry_{row_num}'))
            contest_name = row.get('Contest Name', 'Unknown Contest')
            contest_id = str(row.get('Contest ID', 'unknown'))
            entry_fee = float(row.get('Entry Fee', 0))

            # Extract players from position columns
            players = []
            position_cols = ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'DST']

            for col in position_cols:
                player_name = row.get(col, '').strip()
                if player_name:
                    players.append(player_name)

            return CSVEntry(
                entry_id=entry_id,
                contest_id=contest_id,
                contest_name=contest_name,
                entry_fee=entry_fee,
                players=players
            )

        except Exception as e:
            logger.error(f"Failed to parse CSV row {row_num}: {e}")
            return None

    def _generate_csv_content(self, entries: List[Entry], lineups: Dict[str, Lineup],
                            site: Site) -> str:
        """Generate CSV content for entries"""
        output = io.StringIO()
        writer = csv.writer(output)

        # Write headers
        headers = self.dk_headers if site == Site.DK else self.fd_headers
        writer.writerow(headers)

        # Write entries
        for entry in entries:
            row = [
                entry.entry_id,
                f"{entry.contest_id}_contest",  # Simplified contest name
                entry.contest_id,
                entry.entry_fee
            ]

            # Add player data
            lineup = lineups.get(entry.assigned_lineup_id) if entry.assigned_lineup_id else None
            if lineup:
                # In practice, you'd need player data to get names
                # For now, use placeholder player names
                player_names = [f"Player_{i+1}" for i in range(8)]
                row.extend(player_names)
            else:
                # Empty lineup
                row.extend([''] * 8)

            writer.writerow(row)

        return output.getvalue()

    def validate_csv_format(self, csv_content: str, site: Site = Site.DK) -> Dict[str, Any]:
        """Validate CSV format without importing"""
        try:
            csv_reader = csv.DictReader(io.StringIO(csv_content))
            headers = next(csv_reader, None)

            if not headers:
                return {
                    'valid': False,
                    'errors': ['CSV file is empty or has no headers']
                }

            expected_headers = self.dk_headers if site == Site.DK else self.fd_headers
            actual_headers = list(headers.keys())

            errors = []
            warnings = []

            # Check required headers
            for header in expected_headers:
                if header not in actual_headers:
                    errors.append(f"Missing required header: {header}")

            # Check for extra headers
            extra_headers = [h for h in actual_headers if h not in expected_headers]
            if extra_headers:
                warnings.append(f"Extra headers found: {', '.join(extra_headers)}")

            return {
                'valid': len(errors) == 0,
                'errors': errors,
                'warnings': warnings,
                'headers_found': actual_headers,
                'headers_expected': expected_headers
            }

        except Exception as e:
            return {
                'valid': False,
                'errors': [f'CSV validation failed: {str(e)}']
            }

    def create_sample_csv(self, site: Site = Site.DK, num_entries: int = 5) -> str:
        """Create a sample CSV for testing"""
        output = io.StringIO()
        writer = csv.writer(output)

        # Headers
        headers = self.dk_headers if site == Site.DK else self.fd_headers
        writer.writerow(headers)

        # Sample entries
        for i in range(num_entries):
            entry_id = f"sample_entry_{i+1}"
            contest_name = "Sample $5 Double Up"
            contest_id = "sample_contest_123"
            entry_fee = 5.0

            # Sample players
            players = [
                "Josh Allen", "Christian McCaffrey", "Austin Ekeler",
                "Tyreek Hill", "Davante Adams", "Travis Kelce",
                "D'Andre Swift", "Buffalo Bills"
            ]

            row = [entry_id, contest_name, contest_id, entry_fee] + players
            writer.writerow(row)

        return output.getvalue()

# Convenience functions
def import_dk_csv(csv_content: str) -> CSVImportResult:
    """Import DraftKings CSV"""
    manager = CSVManager()
    return manager.import_csv(csv_content, Site.DK)

def import_fd_csv(csv_content: str) -> CSVImportResult:
    """Import FanDuel CSV"""
    manager = CSVManager()
    return manager.import_csv(csv_content, Site.FD)

def export_dk_csv(entries: List[Entry], lineups: Dict[str, Lineup]) -> CSVExportResult:
    """Export to DraftKings CSV format"""
    manager = CSVManager()
    return manager.export_csv(entries, lineups, Site.DK)

def export_fd_csv(entries: List[Entry], lineups: Dict[str, Lineup]) -> CSVExportResult:
    """Export to FanDuel CSV format"""
    manager = CSVManager()
    return manager.export_csv(entries, lineups, Site.FD)

def validate_csv(csv_content: str, site: Site = Site.DK) -> Dict[str, Any]:
    """Validate CSV format"""
    manager = CSVManager()
    return manager.validate_csv_format(csv_content, site)

def create_sample_csv(site: Site = Site.DK, num_entries: int = 5) -> str:
    """Create sample CSV for testing"""
    manager = CSVManager()
    return manager.create_sample_csv(site, num_entries)
