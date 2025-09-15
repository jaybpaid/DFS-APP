from fastapi import FastAPI, UploadFile, File
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
from src.ingestion.csv_importer import import_csv
from src.optimization.mip_solver import generate_lineups
from src.export.csv_exporter import export_to_csv

app = FastAPI()
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    data = await file.read()
    players_data = import_csv(data)
    lineups = generate_lineups(players_data)
    return {"lineups": lineups}

@app.get("/export/")
async def export_lineups():
    # Logic to export lineups to CSV
    export_to_csv()
    return {"message": "Lineups exported successfully."}