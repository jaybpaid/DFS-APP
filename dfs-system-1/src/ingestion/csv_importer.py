from typing import List, Dict
import pandas as pd
import os

class CSVImporter:
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.data = None

    def import_data(self) -> pd.DataFrame:
        if not os.path.exists(self.file_path):
            raise FileNotFoundError(f"The file {self.file_path} does not exist.")
        
        self.data = pd.read_csv(self.file_path)
        self.validate_data()
        return self.data

    def validate_data(self):
        required_columns = ['Player', 'Salary', 'Team', 'Position', 'Slate Time']
        for column in required_columns:
            if column not in self.data.columns:
                raise ValueError(f"Missing required column: {column}")

        self.validate_slate_times()

    def validate_slate_times(self):
        # Example validation logic for slate times
        slate_time_column = 'Slate Time'
        if not pd.to_datetime(self.data[slate_time_column], errors='coerce').notnull().all():
            raise ValueError("Invalid slate times detected. Please check the format.")

    def get_data(self) -> pd.DataFrame:
        return self.data

def main():
    importer = CSVImporter('path_to_your_file.csv')
    try:
        data = importer.import_data()
        print(data.head())
    except Exception as e:
        print(f"Error importing data: {e}")

if __name__ == "__main__":
    main()