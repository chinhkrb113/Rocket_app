from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    
    # Database Configuration
    DATABASE_URL: str = "mysql+mysqlconnector://root:password@localhost:3306/rocket_training_system"
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "rocket_training_system"
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_DB: int = 0
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_HOSTS: List[str] = ["*"]
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # ML Models Configuration
    MODELS_PATH: str = "models"
    LEAD_SCORING_MODEL_PATH: str = "models/lead_scoring_model.pkl"
    COMPETENCY_MODEL_PATH: str = "models/competency_analyzer_model.pkl"
    JD_PARSER_MODEL_PATH: str = "models/jd_parser_model.pkl"
    RECOMMENDER_MODEL_PATH: str = "models/recommender_model.pkl"
    
    # External Services
    USER_SERVICE_URL: str = "http://localhost:3001"
    COURSE_SERVICE_URL: str = "http://localhost:3002"
    CONSULTING_SERVICE_URL: str = "http://localhost:3003"
    ENTERPRISE_SERVICE_URL: str = "http://localhost:3004"
    ADMIN_SERVICE_URL: str = "http://localhost:3005"
    
    # AI Service Configuration
    MAX_BATCH_SIZE: int = 100
    MODEL_CACHE_TTL: int = 3600  # 1 hour
    PREDICTION_CACHE_TTL: int = 300  # 5 minutes
    
    # NLP Configuration
    SPACY_MODEL: str = "en_core_web_sm"
    NLTK_DATA_PATH: str = "nltk_data"
    
    # File Processing
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: List[str] = [".pdf", ".docx", ".txt", ".csv", ".xlsx"]
    UPLOAD_PATH: str = "uploads"
    
    # Lead Scoring Configuration
    LEAD_SCORE_WEIGHTS: dict = {
        "email_engagement": 0.3,
        "website_activity": 0.25,
        "demographic_fit": 0.2,
        "interaction_frequency": 0.15,
        "content_engagement": 0.1
    }
    
    # Competency Analysis Configuration
    COMPETENCY_CATEGORIES: List[str] = [
        "Technical Skills",
        "Soft Skills",
        "Domain Knowledge",
        "Problem Solving",
        "Communication",
        "Leadership"
    ]
    
    # Job Description Parsing Configuration
    JD_REQUIRED_SECTIONS: List[str] = [
        "job_title",
        "responsibilities",
        "requirements",
        "skills",
        "experience_level"
    ]
    
    # Recommendation System Configuration
    RECOMMENDATION_ALGORITHM: str = "collaborative_filtering"  # or "content_based"
    MAX_RECOMMENDATIONS: int = 10
    MIN_SIMILARITY_SCORE: float = 0.6
    
    class Config:
        env_file = ".env"
        case_sensitive = True

    def get_database_url(self) -> str:
        """Construct database URL from individual components"""
        return f"mysql+mysqlconnector://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    def get_redis_url(self) -> str:
        """Construct Redis URL from individual components"""
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

settings = Settings()