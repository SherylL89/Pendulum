FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["sh", "-c", "if [ \"$SEED_ON_START\" = \"1\" ]; then python seed.py; fi && uvicorn main:app --host 0.0.0.0 --port 8000"]
