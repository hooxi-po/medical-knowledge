import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# MongoDB 配置
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "medical_database"
COLLECTION_NAME = "professionals"

# Gemini API 配置（直接设置）
GEMINI_API_KEY = "AIzaSyAg4LQgRpzp-AcEjR28k7NI7hP4AmFABPA"
GEMINI_MODEL = "models/gemini-1.5-flash-001"