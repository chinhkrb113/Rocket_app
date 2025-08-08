from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
from loguru import logger
import asyncio

from ..core.lead_scorer import lead_scorer
from ..core.database import get_db, cache_manager
from ..core.config import settings

router = APIRouter(prefix="/leads", tags=["Lead Scoring"])

# Pydantic models for request/response
class LeadData(BaseModel):
    id: Optional[int] = None
    full_name: str
    email: str
    phone: Optional[str] = None
    source: str = "unknown"
    status: str = "new"
    created_at: Optional[datetime] = None
    interactions: List[Dict[str, Any]] = []
    interested_courses: List[str] = []
    metadata: Optional[Dict[str, Any]] = {}

class LeadScoreRequest(BaseModel):
    lead_data: LeadData
    include_features: bool = Field(default=False, description="Include extracted features in response")
    include_recommendations: bool = Field(default=True, description="Include recommendations in response")

class BatchLeadScoreRequest(BaseModel):
    leads: List[LeadData]
    include_features: bool = Field(default=False, description="Include extracted features in response")
    include_recommendations: bool = Field(default=True, description="Include recommendations in response")

class LeadScoreResponse(BaseModel):
    lead_id: Optional[int]
    lead_score: float
    quality: str
    ml_score: Optional[float] = None
    rule_based_score: Optional[float] = None
    features: Optional[Dict[str, Any]] = None
    recommendations: Optional[List[str]] = None
    scored_at: datetime
    error: Optional[str] = None

class BatchLeadScoreResponse(BaseModel):
    results: List[LeadScoreResponse]
    total_leads: int
    successful_scores: int
    failed_scores: int
    processing_time_ms: float

class LeadUpdateRequest(BaseModel):
    lead_id: int
    new_interactions: List[Dict[str, Any]] = []
    updated_fields: Optional[Dict[str, Any]] = {}

class LeadScoreByIdRequest(BaseModel):
    lead_id: str = Field(..., description="ID of the lead to score")

class LeadScoreByIdResponse(BaseModel):
    lead_id: str
    lead_score: int
    quality: str
    needs_human_intervention: bool
    interaction_details: List[str]
    total_interactions: int
    scored_at: str

@router.post("/score-by-id", response_model=LeadScoreByIdResponse)
async def score_lead_by_id(
    request: LeadScoreByIdRequest,
    background_tasks: BackgroundTasks
):
    """
    Score a lead based on their interaction data from database
    
    This endpoint:
    1. Fetches all interactions for the given lead_id
    2. Calculates score using interaction-based rules
    3. Updates the lead score in database
    4. Returns score and intervention flag
    """
    try:
        lead_id = request.lead_id
        
        # Get interaction data for the lead (mock implementation)
        interaction_data = await get_lead_interactions_from_db(lead_id)
        
        if not interaction_data:
            logger.warning(f"No interactions found for lead_id: {lead_id}")
            return LeadScoreByIdResponse(
                lead_id=lead_id,
                lead_score=0,
                quality="unqualified",
                needs_human_intervention=False,
                interaction_details=["No interactions found"],
                total_interactions=0,
                scored_at=datetime.utcnow().isoformat()
            )
        
        # Calculate lead score using new interaction-based method
        scoring_result = lead_scorer.score_lead(interaction_data)
        
        # Update lead score in database
        await update_lead_score_in_db(lead_id, scoring_result['lead_score'])
        
        # Cache the result
        background_tasks.add_task(
            cache_lead_score, 
            lead_id, 
            scoring_result
        )
        
        logger.info(f"Lead {lead_id} scored: {scoring_result['lead_score']} points")
        
        return LeadScoreByIdResponse(
            lead_id=lead_id,
            lead_score=scoring_result['lead_score'],
            quality=scoring_result['quality'],
            needs_human_intervention=scoring_result['needs_human_intervention'],
            interaction_details=scoring_result['interaction_details'],
            total_interactions=scoring_result['total_interactions'],
            scored_at=scoring_result['scored_at']
        )
        
    except Exception as e:
        logger.error(f"Error scoring lead by ID: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to score lead: {str(e)}"
        )

@router.post("/score", response_model=LeadScoreResponse)
async def score_lead(
    request: LeadScoreRequest,
    background_tasks: BackgroundTasks
):
    """
    Score a single lead based on provided data
    """
    try:
        start_time = datetime.now()
        
        # Convert Pydantic model to dict
        lead_data = request.lead_data.dict()
        
        # Calculate lead score
        score_result = lead_scorer.calculate_lead_score(lead_data)
        
        # Prepare response
        response_data = {
            "lead_id": lead_data.get('id'),
            "lead_score": score_result.get('lead_score', 0),
            "quality": score_result.get('quality', 'medium'),
            "scored_at": datetime.now()
        }
        
        # Include optional fields based on request
        if request.include_features:
            response_data["features"] = score_result.get('features')
            response_data["ml_score"] = score_result.get('ml_score')
            response_data["rule_based_score"] = score_result.get('rule_based_score')
        
        if request.include_recommendations:
            response_data["recommendations"] = score_result.get('recommendations', [])
        
        # Handle errors
        if 'error' in score_result:
            response_data["error"] = score_result['error']
        
        # Log scoring activity
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        logger.info(f"Lead {lead_data.get('id', 'unknown')} scored: {response_data['lead_score']:.2f} ({processing_time:.2f}ms)")
        
        # Cache result in background
        if lead_data.get('id'):
            background_tasks.add_task(
                cache_lead_score,
                lead_data['id'],
                response_data
            )
        
        return LeadScoreResponse(**response_data)
        
    except Exception as e:
        logger.error(f"Error scoring lead: {e}")
        raise HTTPException(status_code=500, detail=f"Error scoring lead: {str(e)}")

@router.post("/score/batch", response_model=BatchLeadScoreResponse)
async def score_leads_batch(
    request: BatchLeadScoreRequest,
    background_tasks: BackgroundTasks
):
    """
    Score multiple leads in batch
    """
    try:
        start_time = datetime.now()
        
        # Convert Pydantic models to dicts
        leads_data = [lead.dict() for lead in request.leads]
        
        # Batch score leads
        results = await lead_scorer.batch_score_leads(leads_data)
        
        # Process results
        response_results = []
        successful_scores = 0
        failed_scores = 0
        
        for result in results:
            try:
                response_data = {
                    "lead_id": result.get('lead_id'),
                    "lead_score": result.get('lead_score', 0),
                    "quality": result.get('quality', 'medium'),
                    "scored_at": datetime.now()
                }
                
                # Include optional fields
                if request.include_features:
                    response_data["features"] = result.get('features')
                    response_data["ml_score"] = result.get('ml_score')
                    response_data["rule_based_score"] = result.get('rule_based_score')
                
                if request.include_recommendations:
                    response_data["recommendations"] = result.get('recommendations', [])
                
                if 'error' in result:
                    response_data["error"] = result['error']
                    failed_scores += 1
                else:
                    successful_scores += 1
                
                response_results.append(LeadScoreResponse(**response_data))
                
            except Exception as e:
                logger.error(f"Error processing result for lead {result.get('lead_id')}: {e}")
                failed_scores += 1
                response_results.append(LeadScoreResponse(
                    lead_id=result.get('lead_id'),
                    lead_score=0,
                    quality='medium',
                    scored_at=datetime.now(),
                    error=str(e)
                ))
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        logger.info(f"Batch scored {len(leads_data)} leads: {successful_scores} successful, {failed_scores} failed ({processing_time:.2f}ms)")
        
        return BatchLeadScoreResponse(
            results=response_results,
            total_leads=len(leads_data),
            successful_scores=successful_scores,
            failed_scores=failed_scores,
            processing_time_ms=processing_time
        )
        
    except Exception as e:
        logger.error(f"Error in batch lead scoring: {e}")
        raise HTTPException(status_code=500, detail=f"Error in batch lead scoring: {str(e)}")

@router.put("/update-score")
async def update_lead_score(
    request: LeadUpdateRequest,
    background_tasks: BackgroundTasks
):
    """
    Update lead score based on new interactions or data
    """
    try:
        # Get existing lead data (this would typically come from database)
        # For now, we'll simulate getting lead data
        lead_data = {
            'id': request.lead_id,
            'interactions': request.new_interactions,
            **request.updated_fields
        }
        
        # Recalculate score
        score_result = lead_scorer.calculate_lead_score(lead_data)
        
        # Update cache in background
        background_tasks.add_task(
            cache_lead_score,
            request.lead_id,
            score_result
        )
        
        logger.info(f"Updated score for lead {request.lead_id}: {score_result.get('lead_score', 0):.2f}")
        
        return {
            "lead_id": request.lead_id,
            "updated_score": score_result.get('lead_score', 0),
            "quality": score_result.get('quality', 'medium'),
            "updated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error updating lead score: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating lead score: {str(e)}")

@router.get("/score/{lead_id}")
async def get_lead_score(
    lead_id: int,
    include_features: bool = Query(False, description="Include extracted features"),
    include_recommendations: bool = Query(True, description="Include recommendations")
):
    """
    Get cached lead score by ID
    """
    try:
        cache_key = f"lead_score:{lead_id}"
        cached_result = await cache_manager.get(cache_key)
        
        if not cached_result:
            raise HTTPException(status_code=404, detail="Lead score not found in cache")
        
        import json
        result = json.loads(cached_result)
        
        # Filter response based on query parameters
        if not include_features:
            result.pop('features', None)
            result.pop('ml_score', None)
            result.pop('rule_based_score', None)
        
        if not include_recommendations:
            result.pop('recommendations', None)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving lead score: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving lead score: {str(e)}")

@router.get("/analytics/quality-distribution")
async def get_lead_quality_distribution(
    date_from: Optional[datetime] = Query(None, description="Start date for analysis"),
    date_to: Optional[datetime] = Query(None, description="End date for analysis"),
    source_filter: Optional[str] = Query(None, description="Filter by lead source")
):
    """
    Get lead quality distribution analytics
    """
    try:
        # This would typically query the database for lead scores
        # For now, we'll return a mock response
        
        distribution = {
            "hot": 15,
            "warm": 35,
            "medium": 30,
            "cold": 15,
            "very_cold": 5
        }
        
        total_leads = sum(distribution.values())
        
        return {
            "distribution": distribution,
            "total_leads": total_leads,
            "percentages": {k: round(v/total_leads*100, 1) for k, v in distribution.items()},
            "date_range": {
                "from": date_from,
                "to": date_to
            },
            "filters": {
                "source": source_filter
            },
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error getting lead quality distribution: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting analytics: {str(e)}")

@router.get("/analytics/conversion-prediction")
async def predict_lead_conversion(
    lead_id: int,
    time_horizon_days: int = Query(30, description="Prediction time horizon in days")
):
    """
    Predict lead conversion probability
    """
    try:
        # Get lead score from cache
        cache_key = f"lead_score:{lead_id}"
        cached_result = await cache_manager.get(cache_key)
        
        if not cached_result:
            raise HTTPException(status_code=404, detail="Lead score not found")
        
        import json
        lead_score_data = json.loads(cached_result)
        
        # Simple conversion prediction based on lead score
        lead_score = lead_score_data.get('lead_score', 0)
        quality = lead_score_data.get('quality', 'medium')
        
        # Conversion probability mapping
        conversion_probabilities = {
            'hot': 0.75,
            'warm': 0.45,
            'medium': 0.25,
            'cold': 0.10,
            'very_cold': 0.05
        }
        
        base_probability = conversion_probabilities.get(quality, 0.25)
        
        # Adjust for time horizon (longer time = higher probability)
        time_factor = min(time_horizon_days / 30, 2.0)  # Cap at 2x
        adjusted_probability = min(base_probability * time_factor, 0.95)
        
        return {
            "lead_id": lead_id,
            "conversion_probability": round(adjusted_probability, 3),
            "confidence_level": "medium",
            "time_horizon_days": time_horizon_days,
            "factors": {
                "lead_score": lead_score,
                "quality": quality,
                "time_factor": round(time_factor, 2)
            },
            "recommendations": lead_score_data.get('recommendations', []),
            "predicted_at": datetime.now()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error predicting lead conversion: {e}")
        raise HTTPException(status_code=500, detail=f"Error predicting conversion: {str(e)}")

@router.post("/retrain-model")
async def retrain_lead_scoring_model(
    background_tasks: BackgroundTasks
):
    """
    Trigger retraining of the lead scoring model
    """
    try:
        # Add retraining task to background
        background_tasks.add_task(retrain_model_task)
        
        return {
            "message": "Model retraining initiated",
            "status": "started",
            "initiated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error initiating model retraining: {e}")
        raise HTTPException(status_code=500, detail=f"Error initiating retraining: {str(e)}")

# Background tasks
async def cache_lead_score(lead_id: int, score_data: Dict[str, Any]):
    """Cache lead score data"""
    try:
        cache_key = f"lead_score:{lead_id}"
        import json
        await cache_manager.set(
            cache_key,
            json.dumps(score_data, default=str),
            ttl=settings.PREDICTION_CACHE_TTL
        )
        logger.debug(f"Cached score for lead {lead_id}")
    except Exception as e:
        logger.error(f"Error caching lead score: {e}")

async def get_lead_interactions_from_db(lead_id: str) -> List[Dict[str, Any]]:
    """
    Get all interactions for a specific lead from database
    Mock implementation - replace with actual database query
    """
    try:
        # Mock data - in production, replace with actual database query
        mock_interactions = [
            {
                'id': 1,
                'lead_id': lead_id,
                'type': 'page_visit',
                'page_url': '/pricing',
                'duration': 45,
                'content': '',
                'created_at': '2024-01-15T10:30:00Z'
            },
            {
                'id': 2,
                'lead_id': lead_id,
                'type': 'page_visit',
                'page_url': '/courses/python-advanced',
                'duration': 240,
                'content': 'Python advanced course details',
                'created_at': '2024-01-15T10:35:00Z'
            },
            {
                'id': 3,
                'lead_id': lead_id,
                'type': 'form_submission',
                'page_url': '/contact',
                'duration': 0,
                'content': 'Tôi quan tâm đến báo giá doanh nghiệp cho team 20 người',
                'created_at': '2024-01-15T10:45:00Z'
            },
            {
                'id': 4,
                'lead_id': lead_id,
                'type': 'chat',
                'page_url': '/chat',
                'duration': 0,
                'content': 'Chúng tôi muốn hợp tác đào tạo số lượng lớn cho công ty',
                'created_at': '2024-01-15T11:00:00Z'
            }
        ]
        
        # In production, use actual database query like:
        # db = await get_db()
        # query = """
        #     SELECT id, lead_id, type, page_url, duration, content, created_at
        #     FROM interactions 
        #     WHERE lead_id = %s 
        #     ORDER BY created_at ASC
        # """
        # interactions = await db.fetch_all(query, [lead_id])
        # return [dict(row) for row in interactions]
        
        return mock_interactions
        
    except Exception as e:
        logger.error(f"Error fetching interactions for lead {lead_id}: {str(e)}")
        return []

async def update_lead_score_in_db(lead_id: str, score: int) -> bool:
    """
    Update lead score in database
    Mock implementation - replace with actual database update
    """
    try:
        # Mock implementation - in production, replace with actual database update
        logger.info(f"Mock: Updating lead {lead_id} score to {score}")
        
        # In production, use actual database update like:
        # db = await get_db()
        # query = """
        #     UPDATE leads 
        #     SET score = %s, updated_at = NOW() 
        #     WHERE id = %s
        # """
        # await db.execute(query, [score, lead_id])
        
        return True
        
    except Exception as e:
        logger.error(f"Error updating lead score for {lead_id}: {str(e)}")
        return False

async def retrain_model_task():
    """Background task to retrain the lead scoring model"""
    try:
        logger.info("Starting lead scoring model retraining...")
        
        # This would typically:
        # 1. Fetch latest training data from database
        # 2. Preprocess the data
        # 3. Train the model
        # 4. Evaluate performance
        # 5. Save the new model if performance is better
        
        # For now, we'll simulate the process
        await asyncio.sleep(5)  # Simulate training time
        
        # Save model
        success = lead_scorer.save_model()
        
        if success:
            logger.info("Lead scoring model retrained successfully")
        else:
            logger.error("Failed to save retrained model")
            
    except Exception as e:
        logger.error(f"Error in model retraining task: {e}")

# Health check for lead scoring service
@router.get("/health")
async def lead_scoring_health():
    """Health check for lead scoring service"""
    try:
        # Check if model is loaded
        model_status = "loaded" if lead_scorer.is_trained else "not_loaded"
        
        # Check cache connectivity
        cache_status = "connected"
        try:
            await cache_manager.ping()
        except:
            cache_status = "disconnected"
        
        return {
            "service": "lead_scoring",
            "status": "healthy",
            "model_status": model_status,
            "cache_status": cache_status,
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "service": "lead_scoring",
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now()
        }