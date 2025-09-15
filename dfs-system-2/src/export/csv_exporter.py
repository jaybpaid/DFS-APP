from typing import List, Dict
import pandas as pd

def export_lineups_to_csv(lineups: List[Dict], file_path: str) -> None:
    """
    Exports generated lineups to a CSV file.

    Parameters:
    - lineups: A list of dictionaries representing the lineups to export.
    - file_path: The file path where the CSV will be saved.
    """
    df = pd.DataFrame(lineups)
    df.to_csv(file_path, index=False)
    print(f"Lineups exported to {file_path}")

def export_projections_to_csv(projections: List[Dict], file_path: str) -> None:
    """
    Exports player projections to a CSV file.

    Parameters:
    - projections: A list of dictionaries representing the player projections to export.
    - file_path: The file path where the CSV will be saved.
    """
    df = pd.DataFrame(projections)
    df.to_csv(file_path, index=False)
    print(f"Projections exported to {file_path}")