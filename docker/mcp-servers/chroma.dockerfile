FROM python:3.11-slim

WORKDIR /app

COPY chroma-server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY chroma-server/main.py .

EXPOSE 8000

CMD ["python3", "main.py"]
