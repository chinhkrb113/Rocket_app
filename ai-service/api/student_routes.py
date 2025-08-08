from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime, date
from loguru import logger
import asyncio

from ..core.competency_analyzer import competency_analyzer
from ..core.database import get_db, cache_manager
from ..core.config import settings

router = APIRouter(prefix="/students", tags=["Student Analysis"])

# Pydantic models for request/response
class StudentData(BaseModel):
    id: int
    user_id: int
    enrollment_date: Optional[date] = None
    courses: List[Dict[str, Any]] = []
    tasks: List[Dict[str, Any]] = []
    interactions: List[Dict[str, Any]] = []
    current_competencies: List[Dict[str, Any]] = []
    learning_preferences: Optional[Dict[str, Any]] = {}
    metadata: Optional[Dict[str, Any]] = {}

class CompetencyAnalysisRequest(BaseModel):
    student_data: StudentData
    include_features: bool = Field(default=False, description="Include extracted features in response")
    include_predictions: bool = Field(default=True, description="Include competency predictions")
    include_recommendations: bool = Field(default=True, description="Include learning recommendations")

class BatchCompetencyRequest(BaseModel):
    students: List[StudentData]
    include_features: bool = Field(default=False, description="Include extracted features in response")
    include_predictions: bool = Field(default=True, description="Include competency predictions")
    include_recommendations: bool = Field(default=True, description="Include learning recommendations")

class CompetencyAnalysisResponse(BaseModel):
    student_id: int
    overall_score: float
    learning_profile: str
    competency_gaps: List[Dict[str, Any]] = []
    predicted_growth: List[Dict[str, Any]] = []
    features: Optional[Dict[str, Any]] = None
    recommendations: Optional[List[str]] = None
    analyzed_at: datetime
    error: Optional[str] = None

class BatchCompetencyResponse(BaseModel):
    results: List[CompetencyAnalysisResponse]
    total_students: int
    successful_analyses: int
    failed_analyses: int
    processing_time_ms: float

class LearningPathRequest(BaseModel):
    student_id: int
    target_competencies: List[str]
    time_horizon_weeks: int = Field(default=12, description="Learning path duration in weeks")
    difficulty_preference: str = Field(default="adaptive", description="beginner, intermediate, advanced, adaptive")

class LearningPathResponse(BaseModel):
    student_id: int
    learning_path: List[Dict[str, Any]]
    estimated_duration_weeks: int
    difficulty_level: str
    success_probability: float
    milestones: List[Dict[str, Any]]
    generated_at: datetime

class PerformancePredictionRequest(BaseModel):
    student_id: int
    course_id: Optional[int] = None
    task_type: Optional[str] = None
    prediction_horizon_days: int = Field(default=30, description="Prediction horizon in days")

class SubmissionAnalysisRequest(BaseModel):
    student_id: int
    submission_data: Dict[str, Any] = Field(
        description="Contains submission details like github_url, figma_url, submission_type, etc."
    )
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="Additional metadata")

class SubmissionAnalysisResponse(BaseModel):
    student_id: int
    submission_type: str
    analysis_results: Dict[str, Any]
    competency_updates: List[Dict[str, Any]]
    overall_score: float
    recommendations: List[str]
    analyzed_at: datetime
    processing_time_ms: float
    error: Optional[str] = None

@router.post("/analyze-competency", response_model=CompetencyAnalysisResponse)
async def analyze_student_competency(
    request: CompetencyAnalysisRequest,
    background_tasks: BackgroundTasks
):
    """
    Analyze student competencies and learning patterns
    """
    try:
        start_time = datetime.now()
        
        # Convert Pydantic model to dict
        student_data = request.student_data.dict()
        
        # Analyze competencies
        analysis_result = competency_analyzer.analyze_competencies(student_data)
        
        # Prepare response
        response_data = {
            "student_id": student_data['id'],
            "overall_score": analysis_result.get('overall_score', 0),
            "learning_profile": analysis_result.get('learning_profile', 'balanced'),
            "competency_gaps": analysis_result.get('competency_gaps', []),
            "predicted_growth": analysis_result.get('predicted_growth', []),
            "analyzed_at": datetime.now()
        }
        
        # Include optional fields based on request
        if request.include_features:
            response_data["features"] = analysis_result.get('features')
        
        if request.include_recommendations:
            response_data["recommendations"] = analysis_result.get('recommendations', [])
        
        # Handle errors
        if 'error' in analysis_result:
            response_data["error"] = analysis_result['error']
        
        # Log analysis activity
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        logger.info(f"Student {student_data['id']} competency analyzed: {response_data['overall_score']:.2f} ({processing_time:.2f}ms)")
        
        # Cache result in background
        background_tasks.add_task(
            cache_competency_analysis,
            student_data['id'],
            response_data
        )
        
        return CompetencyAnalysisResponse(**response_data)
        
    except Exception as e:
        logger.error(f"Error analyzing student competency: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing competency: {str(e)}")

@router.post("/analyze-competency/batch", response_model=BatchCompetencyResponse)
async def analyze_students_batch(
    request: BatchCompetencyRequest,
    background_tasks: BackgroundTasks
):
    """
    Analyze multiple students' competencies in batch
    """
    try:
        start_time = datetime.now()
        
        # Convert Pydantic models to dicts
        students_data = [student.dict() for student in request.students]
        
        # Batch analyze competencies
        results = await competency_analyzer.batch_analyze_competencies(students_data)
        
        # Process results
        response_results = []
        successful_analyses = 0
        failed_analyses = 0
        
        for result in results:
            try:
                response_data = {
                    "student_id": result.get('student_id'),
                    "overall_score": result.get('overall_score', 0),
                    "learning_profile": result.get('learning_profile', 'balanced'),
                    "competency_gaps": result.get('competency_gaps', []),
                    "predicted_growth": result.get('predicted_growth', []),
                    "analyzed_at": datetime.now()
                }
                
                # Include optional fields
                if request.include_features:
                    response_data["features"] = result.get('features')
                
                if request.include_recommendations:
                    response_data["recommendations"] = result.get('recommendations', [])
                
                if 'error' in result:
                    response_data["error"] = result['error']
                    failed_analyses += 1
                else:
                    successful_analyses += 1
                
                response_results.append(CompetencyAnalysisResponse(**response_data))
                
            except Exception as e:
                logger.error(f"Error processing result for student {result.get('student_id')}: {e}")
                failed_analyses += 1
                response_results.append(CompetencyAnalysisResponse(
                    student_id=result.get('student_id', 0),
                    overall_score=0,
                    learning_profile='balanced',
                    analyzed_at=datetime.now(),
                    error=str(e)
                ))
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        logger.info(f"Batch analyzed {len(students_data)} students: {successful_analyses} successful, {failed_analyses} failed ({processing_time:.2f}ms)")
        
        return BatchCompetencyResponse(
            results=response_results,
            total_students=len(students_data),
            successful_analyses=successful_analyses,
            failed_analyses=failed_analyses,
            processing_time_ms=processing_time
        )
        
    except Exception as e:
        logger.error(f"Error in batch competency analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Error in batch analysis: {str(e)}")

@router.post("/learning-path", response_model=LearningPathResponse)
async def generate_learning_path(
    request: LearningPathRequest,
    background_tasks: BackgroundTasks
):
    """
    Generate personalized learning path for student
    """
    try:
        # Get student's current competency analysis
        cache_key = f"competency_analysis:{request.student_id}"
        cached_analysis = await cache_manager.get(cache_key)
        
        if not cached_analysis:
            raise HTTPException(
                status_code=404, 
                detail="Student competency analysis not found. Please analyze competencies first."
            )
        
        import json
        analysis_data = json.loads(cached_analysis)
        
        # Generate learning path based on current competencies and targets
        learning_path = generate_personalized_path(
            current_competencies=analysis_data.get('competency_gaps', []),
            target_competencies=request.target_competencies,
            learning_profile=analysis_data.get('learning_profile', 'balanced'),
            time_horizon=request.time_horizon_weeks,
            difficulty_preference=request.difficulty_preference
        )
        
        # Calculate success probability
        success_probability = calculate_success_probability(
            analysis_data.get('overall_score', 0),
            analysis_data.get('learning_profile', 'balanced'),
            len(request.target_competencies),
            request.time_horizon_weeks
        )
        
        response_data = {
            "student_id": request.student_id,
            "learning_path": learning_path['path'],
            "estimated_duration_weeks": learning_path['duration'],
            "difficulty_level": learning_path['difficulty'],
            "success_probability": success_probability,
            "milestones": learning_path['milestones'],
            "generated_at": datetime.now()
        }
        
        # Cache learning path
        background_tasks.add_task(
            cache_learning_path,
            request.student_id,
            response_data
        )
        
        logger.info(f"Generated learning path for student {request.student_id}: {len(learning_path['path'])} steps")
        
        return LearningPathResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating learning path: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating learning path: {str(e)}")

@router.post("/analyze-submission", response_model=SubmissionAnalysisResponse)
async def analyze_student_submission(
    request: SubmissionAnalysisRequest,
    background_tasks: BackgroundTasks
):
    """
    Analyze student submission (GitHub code or Figma design) and update competencies
    """
    try:
        start_time = datetime.now()
        
        logger.info(f"Starting submission analysis for student {request.student_id}")
        
        # Analyze submission using competency analyzer
        analysis_result = await competency_analyzer.analyze_submission(
            student_id=request.student_id,
            submission_data=request.submission_data
        )
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        # Calculate overall score from competency updates
        competency_updates = analysis_result.get('competency_updates', [])
        overall_score = sum(update.get('score_change', 0) for update in competency_updates)
        
        # Generate recommendations based on analysis
        recommendations = []
        if 'analysis_details' in analysis_result:
            analysis_details = analysis_result['analysis_details']
            if 'technologies' in analysis_details:
                tech_count = len(analysis_details['technologies'].get('frameworks', []))
                if tech_count > 3:
                    recommendations.append("Excellent use of multiple technologies! Consider deepening expertise in core frameworks.")
                elif tech_count > 0:
                    recommendations.append("Good technology usage. Try exploring additional frameworks to broaden your skillset.")
            
            if 'code_quality' in analysis_details:
                quality_score = analysis_details['code_quality'].get('overall_score', 0)
                if quality_score > 80:
                    recommendations.append("Excellent code quality! Keep up the good practices.")
                elif quality_score > 60:
                    recommendations.append("Good code quality. Focus on improving code documentation and structure.")
                else:
                    recommendations.append("Consider improving code quality through better naming conventions and structure.")
        
        # Prepare response
        response_data = {
            "student_id": request.student_id,
            "submission_type": analysis_result.get('submission_type', 'unknown'),
            "analysis_results": analysis_result.get('analysis_details', {}),
            "competency_updates": competency_updates,
            "overall_score": overall_score,
            "recommendations": recommendations,
            "analyzed_at": datetime.now(),
            "processing_time_ms": processing_time
        }
        
        # Handle errors
        if 'error' in analysis_result:
            response_data["error"] = analysis_result['error']
            logger.error(f"Error in submission analysis for student {request.student_id}: {analysis_result['error']}")
        else:
            logger.info(f"Successfully analyzed submission for student {request.student_id}: {len(analysis_result.get('competency_updates', []))} competency updates")
        
        # Cache result in background
        background_tasks.add_task(
            cache_submission_analysis,
            request.student_id,
            response_data
        )
        
        return SubmissionAnalysisResponse(**response_data)
        
    except Exception as e:
        logger.error(f"Error analyzing student submission: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing submission: {str(e)}")

@router.post("/predict-performance")
async def predict_student_performance(
    request: PerformancePredictionRequest
):
    """
    Predict student performance for specific course or task type
    """
    try:
        # Get student's competency analysis
        cache_key = f"competency_analysis:{request.student_id}"
        cached_analysis = await cache_manager.get(cache_key)
        
        if not cached_analysis:
            raise HTTPException(
                status_code=404,
                detail="Student competency analysis not found"
            )
        
        import json
        analysis_data = json.loads(cached_analysis)
        
        # Predict performance based on competencies and learning profile
        prediction = predict_performance(
            overall_score=analysis_data.get('overall_score', 0),
            learning_profile=analysis_data.get('learning_profile', 'balanced'),
            competency_gaps=analysis_data.get('competency_gaps', []),
            course_id=request.course_id,
            task_type=request.task_type,
            prediction_horizon=request.prediction_horizon_days
        )
        
        return {
            "student_id": request.student_id,
            "predicted_score": prediction['score'],
            "confidence_level": prediction['confidence'],
            "success_probability": prediction['success_probability'],
            "risk_factors": prediction['risk_factors'],
            "recommendations": prediction['recommendations'],
            "prediction_horizon_days": request.prediction_horizon_days,
            "predicted_at": datetime.now()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error predicting student performance: {e}")
        raise HTTPException(status_code=500, detail=f"Error predicting performance: {str(e)}")

@router.get("/competency/{student_id}")
async def get_student_competency(
    student_id: int,
    include_features: bool = Query(False, description="Include extracted features"),
    include_recommendations: bool = Query(True, description="Include recommendations")
):
    """
    Get cached student competency analysis by ID
    """
    try:
        cache_key = f"competency_analysis:{student_id}"
        cached_result = await cache_manager.get(cache_key)
        
        if not cached_result:
            raise HTTPException(status_code=404, detail="Student competency analysis not found in cache")
        
        import json
        result = json.loads(cached_result)
        
        # Filter response based on query parameters
        if not include_features:
            result.pop('features', None)
        
        if not include_recommendations:
            result.pop('recommendations', None)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving student competency: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving competency: {str(e)}")

@router.get("/analytics/learning-trends")
async def get_learning_trends(
    date_from: Optional[datetime] = Query(None, description="Start date for analysis"),
    date_to: Optional[datetime] = Query(None, description="End date for analysis"),
    competency_filter: Optional[str] = Query(None, description="Filter by competency")
):
    """
    Get learning trends analytics
    """
    try:
        # This would typically query the database for learning trends
        # For now, we'll return a mock response
        
        trends = {
            "competency_growth": {
                "python": 15.2,
                "javascript": 12.8,
                "ui_design": 8.5,
                "teamwork": 6.3,
                "problem_solving": 11.7
            },
            "learning_profiles": {
                "visual": 35,
                "analytical": 28,
                "hands_on": 22,
                "balanced": 15
            },
            "completion_rates": {
                "beginner": 0.85,
                "intermediate": 0.72,
                "advanced": 0.58
            }
        }
        
        return {
            "trends": trends,
            "date_range": {
                "from": date_from,
                "to": date_to
            },
            "filters": {
                "competency": competency_filter
            },
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error getting learning trends: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting trends: {str(e)}")

@router.get("/recommendations/{student_id}")
async def get_personalized_recommendations(
    student_id: int,
    recommendation_type: str = Query("all", description="Type: courses, tasks, skills, all")
):
    """
    Get personalized recommendations for student
    """
    try:
        # Get student's competency analysis
        cache_key = f"competency_analysis:{student_id}"
        cached_analysis = await cache_manager.get(cache_key)
        
        if not cached_analysis:
            raise HTTPException(
                status_code=404,
                detail="Student competency analysis not found"
            )
        
        import json
        analysis_data = json.loads(cached_analysis)
        
        # Generate recommendations based on competency gaps and learning profile
        recommendations = generate_recommendations(
            competency_gaps=analysis_data.get('competency_gaps', []),
            learning_profile=analysis_data.get('learning_profile', 'balanced'),
            overall_score=analysis_data.get('overall_score', 0),
            recommendation_type=recommendation_type
        )
        
        return {
            "student_id": student_id,
            "recommendations": recommendations,
            "recommendation_type": recommendation_type,
            "generated_at": datetime.now()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting recommendations: {str(e)}")

# Helper functions
def generate_personalized_path(current_competencies, target_competencies, learning_profile, time_horizon, difficulty_preference):
    """Generate personalized learning path"""
    # This is a simplified implementation
    # In practice, this would use more sophisticated algorithms
    
    path_steps = []
    milestones = []
    
    for i, competency in enumerate(target_competencies):
        step = {
            "step": i + 1,
            "competency": competency,
            "estimated_weeks": max(2, time_horizon // len(target_competencies)),
            "difficulty": difficulty_preference if difficulty_preference != "adaptive" else "intermediate",
            "resources": [f"Course: {competency} Fundamentals", f"Practice: {competency} Projects"],
            "prerequisites": target_competencies[:i] if i > 0 else []
        }
        path_steps.append(step)
        
        if (i + 1) % 3 == 0:  # Milestone every 3 steps
            milestones.append({
                "milestone": f"Milestone {len(milestones) + 1}",
                "week": step["estimated_weeks"] * (i + 1),
                "competencies_achieved": target_competencies[:i+1],
                "assessment": f"Assessment for {', '.join(target_competencies[max(0, i-2):i+1])}"
            })
    
    return {
        "path": path_steps,
        "duration": time_horizon,
        "difficulty": difficulty_preference,
        "milestones": milestones
    }

def calculate_success_probability(overall_score, learning_profile, num_targets, time_horizon):
    """Calculate success probability for learning path"""
    base_probability = min(overall_score / 100, 0.9)  # Cap at 90%
    
    # Adjust for learning profile
    profile_multipliers = {
        "visual": 1.1,
        "analytical": 1.05,
        "hands_on": 1.0,
        "balanced": 1.15
    }
    
    profile_factor = profile_multipliers.get(learning_profile, 1.0)
    
    # Adjust for complexity (more targets = lower probability)
    complexity_factor = max(0.5, 1 - (num_targets - 3) * 0.1)
    
    # Adjust for time (more time = higher probability)
    time_factor = min(1.2, time_horizon / 12)
    
    final_probability = base_probability * profile_factor * complexity_factor * time_factor
    return round(min(final_probability, 0.95), 3)

def predict_performance(overall_score, learning_profile, competency_gaps, course_id, task_type, prediction_horizon):
    """Predict student performance"""
    # Base prediction on overall score
    base_score = overall_score
    
    # Adjust for competency gaps
    gap_penalty = len(competency_gaps) * 5
    adjusted_score = max(0, base_score - gap_penalty)
    
    # Adjust for learning profile and task type
    if task_type:
        profile_task_match = {
            "visual": ["design", "presentation"],
            "analytical": ["coding", "analysis"],
            "hands_on": ["project", "implementation"],
            "balanced": ["all"]
        }
        
        if task_type in profile_task_match.get(learning_profile, []):
            adjusted_score += 10
    
    # Calculate confidence based on data quality
    confidence = "high" if overall_score > 70 else "medium" if overall_score > 40 else "low"
    
    # Success probability
    success_probability = min(adjusted_score / 100, 0.95)
    
    # Risk factors
    risk_factors = []
    if len(competency_gaps) > 3:
        risk_factors.append("Multiple competency gaps")
    if overall_score < 50:
        risk_factors.append("Low overall competency score")
    if prediction_horizon > 30:
        risk_factors.append("Long prediction horizon")
    
    # Recommendations
    recommendations = []
    if len(competency_gaps) > 0:
        recommendations.append(f"Focus on improving: {', '.join([gap['competency'] for gap in competency_gaps[:3]])}")
    if overall_score < 60:
        recommendations.append("Consider additional practice sessions")
    
    return {
        "score": round(adjusted_score, 1),
        "confidence": confidence,
        "success_probability": round(success_probability, 3),
        "risk_factors": risk_factors,
        "recommendations": recommendations
    }

def generate_recommendations(competency_gaps, learning_profile, overall_score, recommendation_type):
    """Generate personalized recommendations"""
    recommendations = {
        "courses": [],
        "tasks": [],
        "skills": [],
        "general": []
    }
    
    # Course recommendations based on competency gaps
    for gap in competency_gaps[:3]:  # Top 3 gaps
        recommendations["courses"].append({
            "title": f"{gap['competency']} Fundamentals",
            "reason": f"Address competency gap in {gap['competency']}",
            "priority": "high" if gap.get('severity', 0) > 0.7 else "medium"
        })
    
    # Task recommendations based on learning profile
    profile_tasks = {
        "visual": ["Create infographics", "Design presentations", "Build UI mockups"],
        "analytical": ["Solve coding challenges", "Analyze datasets", "Write algorithms"],
        "hands_on": ["Build projects", "Implement features", "Create prototypes"],
        "balanced": ["Complete mixed projects", "Participate in team challenges"]
    }
    
    recommendations["tasks"] = [
        {"task": task, "reason": f"Matches {learning_profile} learning style"}
        for task in profile_tasks.get(learning_profile, [])[:3]
    ]
    
    # Skill recommendations
    if overall_score < 60:
        recommendations["skills"].append({
            "skill": "Time management",
            "reason": "Improve overall learning efficiency"
        })
    
    recommendations["skills"].append({
        "skill": "Self-assessment",
        "reason": "Better track learning progress"
    })
    
    # General recommendations
    if len(competency_gaps) > 5:
        recommendations["general"].append("Focus on fewer competencies at a time for better results")
    
    recommendations["general"].append(f"Your {learning_profile} learning style suggests interactive content works best")
    
    if recommendation_type == "all":
        return recommendations
    else:
        return recommendations.get(recommendation_type, [])

# Background tasks
async def cache_competency_analysis(student_id: int, analysis_data: Dict[str, Any]):
    """Cache competency analysis data"""
    try:
        cache_key = f"competency_analysis:{student_id}"
        import json
        await cache_manager.set(
            cache_key,
            json.dumps(analysis_data, default=str),
            ttl=settings.PREDICTION_CACHE_TTL
        )
        logger.debug(f"Cached competency analysis for student {student_id}")
    except Exception as e:
        logger.error(f"Error caching competency analysis: {e}")

async def cache_learning_path(student_id: int, path_data: Dict[str, Any]):
    """
    Cache learning path data
    """
    try:
        cache_key = f"learning_path:{student_id}"
        import json
        await cache_manager.set(
            cache_key, 
            json.dumps(path_data, default=str), 
            expire=settings.CACHE_EXPIRE_HOURS * 3600
        )
        logger.debug(f"Cached learning path for student {student_id}")
    except Exception as e:
        logger.error(f"Error caching learning path: {e}")

async def cache_submission_analysis(student_id: int, analysis_data: Dict[str, Any]):
    """
    Cache submission analysis data
    """
    try:
        cache_key = f"submission_analysis:{student_id}:{datetime.now().strftime('%Y%m%d')}"
        import json
        await cache_manager.set(
            cache_key,
            json.dumps(analysis_data, default=str),
            expire=settings.CACHE_EXPIRE_HOURS * 3600
        )
        logger.debug(f"Cached submission analysis for student {student_id}")
    except Exception as e:
        logger.error(f"Error caching submission analysis: {e}")

# Health check for student analysis service
@router.get("/health")
async def student_analysis_health():
    """Health check for student analysis service"""
    try:
        # Check if model is loaded
        model_status = "loaded" if competency_analyzer.is_trained else "not_loaded"
        
        # Check cache connectivity
        cache_status = "connected"
        try:
            await cache_manager.ping()
        except:
            cache_status = "disconnected"
        
        return {
            "service": "student_analysis",
            "status": "healthy",
            "model_status": model_status,
            "cache_status": cache_status,
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "service": "student_analysis",
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now()
        }