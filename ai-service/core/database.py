from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from contextlib import asynccontextmanager
import redis.asyncio as redis
from loguru import logger
from .config import settings
import asyncio
from typing import AsyncGenerator

# Database setup
engine = create_engine(
    settings.get_database_url(),
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=settings.ENVIRONMENT == "development"
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
metadata = MetaData()

# Redis setup
redis_client = None

class DatabaseManager:
    def __init__(self):
        self.engine = engine
        self.SessionLocal = SessionLocal
        self.redis_client = None
    
    async def init_redis(self):
        """Initialize Redis connection"""
        try:
            self.redis_client = redis.from_url(
                settings.get_redis_url(),
                encoding="utf-8",
                decode_responses=True,
                max_connections=20
            )
            # Test connection
            await self.redis_client.ping()
            logger.info("Redis connection established")
            return self.redis_client
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis_client = None
            return None
    
    async def close_redis(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Redis connection closed")
    
    def get_db_session(self) -> Session:
        """Get database session"""
        return self.SessionLocal()
    
    @asynccontextmanager
    async def get_db_session_async(self) -> AsyncGenerator[Session, None]:
        """Get database session with async context manager"""
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            session.close()
    
    async def get_redis_client(self):
        """Get Redis client"""
        if not self.redis_client:
            await self.init_redis()
        return self.redis_client

# Global database manager instance
db_manager = DatabaseManager()

# Dependency for FastAPI
def get_db() -> Session:
    """Dependency to get database session"""
    db = db_manager.get_db_session()
    try:
        yield db
    finally:
        db.close()

async def get_redis():
    """Dependency to get Redis client"""
    return await db_manager.get_redis_client()

# Database initialization
async def init_db():
    """Initialize database and Redis connections"""
    try:
        # Test database connection
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        logger.info("Database connection established")
        
        # Initialize Redis
        await db_manager.init_redis()
        
        logger.info("Database initialization completed")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

async def close_db():
    """Close database and Redis connections"""
    try:
        # Close Redis
        await db_manager.close_redis()
        
        # Close database engine
        engine.dispose()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database connections: {e}")

# Cache utilities
class CacheManager:
    def __init__(self, redis_client=None):
        self.redis_client = redis_client
    
    async def get(self, key: str):
        """Get value from cache"""
        if not self.redis_client:
            return None
        try:
            return await self.redis_client.get(key)
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    async def set(self, key: str, value: str, ttl: int = 300):
        """Set value in cache with TTL"""
        if not self.redis_client:
            return False
        try:
            await self.redis_client.setex(key, ttl, value)
            return True
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False
    
    async def delete(self, key: str):
        """Delete key from cache"""
        if not self.redis_client:
            return False
        try:
            await self.redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        if not self.redis_client:
            return False
        try:
            return await self.redis_client.exists(key) > 0
        except Exception as e:
            logger.error(f"Cache exists error: {e}")
            return False

# Global cache manager
cache_manager = CacheManager()

# Update cache manager with Redis client after initialization
async def init_cache_manager():
    """Initialize cache manager with Redis client"""
    redis_client = await db_manager.get_redis_client()
    cache_manager.redis_client = redis_client
    return cache_manager