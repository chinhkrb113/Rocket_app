from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime, date
from loguru import logger
import asyncio
import io

from ..core.jd_parser import jd_parser
from ..core.recommender import candidate_recommender
from ..core.database import get_db, cache_manager
from ..core.config import settings

router = APIRouter(prefix="/enterprises", tags=["Enterprise Services"])

# Pydantic models for request/response
class JobDescriptionData(BaseModel):
    id: Optional[int] = None
    enterprise_id: int
    title: str
    description_text: str
    requirements: Optional[List[str]] = []
    location: Optional[str] = None
    employment_type: Optional[str] = "full_time"
    salary_range: Optional[Dict[str, Any]] = {}
    posted_date: Optional[date] = None
    metadata: Optional[Dict[str, Any]] = {}

class JDParseRequest(BaseModel):
    job_description: JobDescriptionData
    include_analysis: bool = Field(default=True, description="Include detailed analysis")
    include_skills_extraction: bool = Field(default=True, description="Extract skills from JD")
    include_sentiment: bool = Field(default=False, description="Include sentiment analysis")

class BatchJDParseRequest(BaseModel):
    job_descriptions: List[JobDescriptionData]
    include_analysis: bool = Field(default=True, description="Include detailed analysis")
    include_skills_extraction: bool = Field(default=True, description="Extract skills from JD")
    include_sentiment: bool = Field(default=False, description="Include sentiment analysis")

class JDParseResponse(BaseModel):
    jd_id: Optional[int]
    parsed_requirements: Dict[str, Any]
    extracted_skills: List[str] = []
    experience_level: str
    education_requirements: List[str] = []
    key_responsibilities: List[str] = []
    complexity_score: float
    sentiment_analysis: Optional[Dict[str, Any]] = None
    parsed_at: datetime
    error: Optional[str] = None

class BatchJDParseResponse(BaseModel):
    results: List[JDParseResponse]
    total_jds: int
    successful_parses: int
    failed_parses: int
    processing_time_ms: float

class CandidateRecommendationRequest(BaseModel):
    jd_id: int
    max_candidates: int = Field(default=10, description="Maximum number of candidates to recommend")
    include_scores: bool = Field(default=True, description="Include detailed scoring")
    filters: Optional[Dict[str, Any]] = {}

class CandidateRecommendationResponse(BaseModel):
    jd_id: int
    recommended_candidates: List[Dict[str, Any]]
    total_candidates_evaluated: int
    recommendation_criteria: Dict[str, Any]
    generated_at: datetime

class SimilarCandidatesRequest(BaseModel):
    reference_candidate_id: int
    max_similar: int = Field(default=5, description="Maximum number of similar candidates")
    similarity_threshold: float = Field(default=0.7, description="Minimum similarity score")

class HiringTrendsRequest(BaseModel):
    enterprise_id: Optional[int] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    position_type: Optional[str] = None

class SkillGapAnalysisRequest(BaseModel):
    enterprise_id: int
    target_skills: List[str]
    current_team_skills: Optional[List[Dict[str, Any]]] = []

@router.post("/parse-jd", response_model=JDParseResponse)
async def parse_job_description(
    request: JDParseRequest,
    background_tasks: BackgroundTasks
):
    """
    Parse and analyze job description
    """
    try:
        start_time = datetime.now()
        
        # Convert Pydantic model to dict
        jd_data = request.job_description.dict()
        
        # Parse job description
        parse_result = jd_parser.parse_job_description(
            jd_data['description_text'],
            include_sentiment=request.include_sentiment
        )
        
        # Prepare response
        response_data = {
            "jd_id": jd_data.get('id'),
            "parsed_requirements": parse_result.get('requirements', {}),
            "extracted_skills": parse_result.get('skills', []),
            "experience_level": parse_result.get('experience_level', 'mid'),
            "education_requirements": parse_result.get('education', []),
            "key_responsibilities": parse_result.get('responsibilities', []),
            "complexity_score": parse_result.get('complexity_score', 0.5),
            "parsed_at": datetime.now()
        }
        
        # Include optional fields based on request
        if request.include_sentiment:
            response_data["sentiment_analysis"] = parse_result.get('sentiment')
        
        # Handle errors
        if 'error' in parse_result:
            response_data["error"] = parse_result['error']
        
        # Log parsing activity
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        logger.info(f"JD {jd_data.get('id', 'unknown')} parsed: {len(response_data['extracted_skills'])} skills extracted ({processing_time:.2f}ms)")
        
        # Cache result in background
        if jd_data.get('id'):
            background_tasks.add_task(
                cache_jd_parse,
                jd_data['id'],
                response_data
            )
        
        return JDParseResponse(**response_data)
        
    except Exception as e:
        logger.error(f"Error parsing job description: {e}")
        raise HTTPException(status_code=500, detail=f"Error parsing JD: {str(e)}")

@router.post("/parse-jd/batch", response_model=BatchJDParseResponse)
async def parse_job_descriptions_batch(
    request: BatchJDParseRequest,
    background_tasks: BackgroundTasks
):
    """
    Parse multiple job descriptions in batch
    """
    try:
        start_time = datetime.now()
        
        # Convert Pydantic models to dicts
        jds_data = [jd.dict() for jd in request.job_descriptions]
        
        # Batch parse job descriptions
        results = await jd_parser.batch_parse_job_descriptions(
            [jd['description_text'] for jd in jds_data],
            include_sentiment=request.include_sentiment
        )
        
        # Process results
        response_results = []
        successful_parses = 0
        failed_parses = 0
        
        for i, result in enumerate(results):
            try:
                jd_data = jds_data[i]
                response_data = {
                    "jd_id": jd_data.get('id'),
                    "parsed_requirements": result.get('requirements', {}),
                    "extracted_skills": result.get('skills', []),
                    "experience_level": result.get('experience_level', 'mid'),
                    "education_requirements": result.get('education', []),
                    "key_responsibilities": result.get('responsibilities', []),
                    "complexity_score": result.get('complexity_score', 0.5),
                    "parsed_at": datetime.now()
                }
                
                # Include optional fields
                if request.include_sentiment:
                    response_data["sentiment_analysis"] = result.get('sentiment')
                
                if 'error' in result:
                    response_data["error"] = result['error']
                    failed_parses += 1
                else:
                    successful_parses += 1
                
                response_results.append(JDParseResponse(**response_data))
                
            except Exception as e:
                logger.error(f"Error processing result for JD {i}: {e}")
                failed_parses += 1
                response_results.append(JDParseResponse(
                    jd_id=jds_data[i].get('id'),
                    parsed_requirements={},
                    experience_level='mid',
                    complexity_score=0.5,
                    parsed_at=datetime.now(),
                    error=str(e)
                ))
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        logger.info(f"Batch parsed {len(jds_data)} JDs: {successful_parses} successful, {failed_parses} failed ({processing_time:.2f}ms)")
        
        return BatchJDParseResponse(
            results=response_results,
            total_jds=len(jds_data),
            successful_parses=successful_parses,
            failed_parses=failed_parses,
            processing_time_ms=processing_time
        )
        
    except Exception as e:
        logger.error(f"Error in batch JD parsing: {e}")
        raise HTTPException(status_code=500, detail=f"Error in batch parsing: {str(e)}")

@router.post("/recommend-candidates", response_model=CandidateRecommendationResponse)
async def recommend_candidates(
    request: CandidateRecommendationRequest,
    background_tasks: BackgroundTasks
):
    """
    Recommend candidates for a job description
    """
    try:
        # Get parsed JD from cache
        cache_key = f"jd_parse:{request.jd_id}"
        cached_jd = await cache_manager.get(cache_key)
        
        if not cached_jd:
            raise HTTPException(
                status_code=404,
                detail="Job description not found. Please parse the JD first."
            )
        
        import json
        jd_data = json.loads(cached_jd)
        
        # Get candidate recommendations
        recommendations = await candidate_recommender.recommend_candidates_for_jd(
            jd_requirements=jd_data['parsed_requirements'],
            max_candidates=request.max_candidates,
            filters=request.filters
        )
        
        # Prepare response
        response_data = {
            "jd_id": request.jd_id,
            "recommended_candidates": recommendations['candidates'],
            "total_candidates_evaluated": recommendations['total_evaluated'],
            "recommendation_criteria": recommendations['criteria'],
            "generated_at": datetime.now()
        }
        
        # Cache recommendations
        background_tasks.add_task(
            cache_candidate_recommendations,
            request.jd_id,
            response_data
        )
        
        logger.info(f"Generated {len(recommendations['candidates'])} candidate recommendations for JD {request.jd_id}")
        
        return CandidateRecommendationResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recommending candidates: {e}")
        raise HTTPException(status_code=500, detail=f"Error recommending candidates: {str(e)}")

@router.post("/similar-candidates")
async def find_similar_candidates(
    request: SimilarCandidatesRequest
):
    """
    Find candidates similar to a reference candidate
    """
    try:
        # Find similar candidates
        similar_candidates = await candidate_recommender.find_similar_candidates(
            reference_candidate_id=request.reference_candidate_id,
            max_similar=request.max_similar,
            similarity_threshold=request.similarity_threshold
        )
        
        return {
            "reference_candidate_id": request.reference_candidate_id,
            "similar_candidates": similar_candidates['candidates'],
            "similarity_threshold": request.similarity_threshold,
            "total_candidates_compared": similar_candidates['total_compared'],
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error finding similar candidates: {e}")
        raise HTTPException(status_code=500, detail=f"Error finding similar candidates: {str(e)}")

@router.post("/upload-jd")
async def upload_job_description(
    file: UploadFile = File(...),
    enterprise_id: int = Query(..., description="Enterprise ID"),
    include_analysis: bool = Query(True, description="Include detailed analysis")
):
    """
    Upload and parse job description from file
    """
    try:
        # Validate file type
        if not file.filename.endswith(('.txt', '.pdf', '.docx')):
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload .txt, .pdf, or .docx files.")
        
        # Read file content
        content = await file.read()
        
        # Extract text based on file type
        if file.filename.endswith('.txt'):
            text_content = content.decode('utf-8')
        else:
            # For PDF and DOCX, you would use appropriate libraries
            # For now, we'll assume text content
            text_content = content.decode('utf-8', errors='ignore')
        
        # Parse the job description
        parse_result = jd_parser.parse_job_description(
            text_content,
            include_sentiment=True
        )
        
        # Create JD data
        jd_data = {
            "enterprise_id": enterprise_id,
            "title": file.filename.replace('.txt', '').replace('.pdf', '').replace('.docx', ''),
            "description_text": text_content,
            "parsed_requirements": parse_result.get('requirements', {}),
            "extracted_skills": parse_result.get('skills', []),
            "experience_level": parse_result.get('experience_level', 'mid'),
            "complexity_score": parse_result.get('complexity_score', 0.5),
            "uploaded_at": datetime.now()
        }
        
        logger.info(f"Uploaded and parsed JD file: {file.filename} for enterprise {enterprise_id}")
        
        return {
            "message": "Job description uploaded and parsed successfully",
            "filename": file.filename,
            "enterprise_id": enterprise_id,
            "parsed_data": jd_data if include_analysis else {"skills_count": len(parse_result.get('skills', []))},
            "uploaded_at": datetime.now()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading JD: {e}")
        raise HTTPException(status_code=500, detail=f"Error uploading job description: {str(e)}")

@router.get("/hiring-trends")
async def get_hiring_trends(
    request: HiringTrendsRequest = Depends()
):
    """
    Get hiring trends and analytics
    """
    try:
        # Get hiring trends (this would typically query the database)
        trends = await candidate_recommender.analyze_hiring_trends(
            enterprise_id=request.enterprise_id,
            date_from=request.date_from,
            date_to=request.date_to,
            position_type=request.position_type
        )
        
        return {
            "trends": trends,
            "filters": {
                "enterprise_id": request.enterprise_id,
                "date_from": request.date_from,
                "date_to": request.date_to,
                "position_type": request.position_type
            },
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error getting hiring trends: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting hiring trends: {str(e)}")

@router.post("/skill-gap-analysis")
async def analyze_skill_gaps(
    request: SkillGapAnalysisRequest
):
    """
    Analyze skill gaps for enterprise hiring
    """
    try:
        # Analyze skill gaps
        gap_analysis = analyze_enterprise_skill_gaps(
            target_skills=request.target_skills,
            current_team_skills=request.current_team_skills,
            enterprise_id=request.enterprise_id
        )
        
        return {
            "enterprise_id": request.enterprise_id,
            "skill_gaps": gap_analysis['gaps'],
            "recommendations": gap_analysis['recommendations'],
            "priority_skills": gap_analysis['priority_skills'],
            "hiring_suggestions": gap_analysis['hiring_suggestions'],
            "analyzed_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error analyzing skill gaps: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing skill gaps: {str(e)}")

@router.get("/jd/{jd_id}")
async def get_parsed_jd(
    jd_id: int,
    include_analysis: bool = Query(True, description="Include detailed analysis")
):
    """
    Get cached parsed job description by ID
    """
    try:
        cache_key = f"jd_parse:{jd_id}"
        cached_result = await cache_manager.get(cache_key)
        
        if not cached_result:
            raise HTTPException(status_code=404, detail="Parsed job description not found in cache")
        
        import json
        result = json.loads(cached_result)
        
        # Filter response based on query parameters
        if not include_analysis:
            # Return only basic info
            filtered_result = {
                "jd_id": result.get('jd_id'),
                "extracted_skills": result.get('extracted_skills', []),
                "experience_level": result.get('experience_level'),
                "parsed_at": result.get('parsed_at')
            }
            return filtered_result
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving parsed JD: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving JD: {str(e)}")

@router.get("/analytics/skill-demand")
async def get_skill_demand_analytics(
    date_from: Optional[datetime] = Query(None, description="Start date for analysis"),
    date_to: Optional[datetime] = Query(None, description="End date for analysis"),
    enterprise_id: Optional[int] = Query(None, description="Filter by enterprise")
):
    """
    Get skill demand analytics across job descriptions
    """
    try:
        # This would typically query the database for skill demand trends
        # For now, we'll return a mock response
        
        skill_demand = {
            "top_skills": [
                {"skill": "Python", "demand_count": 145, "growth_rate": 15.2},
                {"skill": "JavaScript", "demand_count": 132, "growth_rate": 12.8},
                {"skill": "React", "demand_count": 98, "growth_rate": 22.1},
                {"skill": "SQL", "demand_count": 87, "growth_rate": 8.5},
                {"skill": "AWS", "demand_count": 76, "growth_rate": 18.9}
            ],
            "emerging_skills": [
                {"skill": "Machine Learning", "demand_count": 34, "growth_rate": 45.2},
                {"skill": "Docker", "demand_count": 28, "growth_rate": 38.7},
                {"skill": "Kubernetes", "demand_count": 22, "growth_rate": 52.1}
            ],
            "experience_levels": {
                "junior": 35,
                "mid": 45,
                "senior": 20
            }
        }
        
        return {
            "skill_demand": skill_demand,
            "date_range": {
                "from": date_from,
                "to": date_to
            },
            "filters": {
                "enterprise_id": enterprise_id
            },
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error getting skill demand analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting analytics: {str(e)}")

# Helper functions
def analyze_enterprise_skill_gaps(target_skills, current_team_skills, enterprise_id):
    """Analyze skill gaps for enterprise"""
    # Convert current team skills to a set for easier comparison
    current_skills = set()
    skill_levels = {}
    
    for team_member in current_team_skills:
        for skill_data in team_member.get('skills', []):
            skill = skill_data.get('skill')
            level = skill_data.get('level', 0)
            current_skills.add(skill)
            skill_levels[skill] = max(skill_levels.get(skill, 0), level)
    
    # Identify gaps
    gaps = []
    for target_skill in target_skills:
        if target_skill not in current_skills:
            gaps.append({
                "skill": target_skill,
                "gap_type": "missing",
                "severity": "high",
                "current_level": 0,
                "target_level": 3  # Assume target level 3
            })
        elif skill_levels.get(target_skill, 0) < 3:  # Below target level
            gaps.append({
                "skill": target_skill,
                "gap_type": "insufficient",
                "severity": "medium",
                "current_level": skill_levels.get(target_skill, 0),
                "target_level": 3
            })
    
    # Generate recommendations
    recommendations = []
    if len(gaps) > 5:
        recommendations.append("Consider hiring multiple specialists to address skill gaps")
    elif len(gaps) > 0:
        recommendations.append("Focus on training existing team members or targeted hiring")
    
    # Priority skills (missing skills with high demand)
    priority_skills = [gap['skill'] for gap in gaps if gap['gap_type'] == 'missing'][:3]
    
    # Hiring suggestions
    hiring_suggestions = []
    for gap in gaps[:3]:  # Top 3 gaps
        if gap['gap_type'] == 'missing':
            hiring_suggestions.append({
                "skill": gap['skill'],
                "suggested_level": "senior",
                "urgency": "high",
                "estimated_candidates": 15  # Mock data
            })
    
    return {
        "gaps": gaps,
        "recommendations": recommendations,
        "priority_skills": priority_skills,
        "hiring_suggestions": hiring_suggestions
    }

# Background tasks
async def cache_jd_parse(jd_id: int, parse_data: Dict[str, Any]):
    """Cache job description parse data"""
    try:
        cache_key = f"jd_parse:{jd_id}"
        import json
        await cache_manager.set(
            cache_key,
            json.dumps(parse_data, default=str),
            ttl=settings.PREDICTION_CACHE_TTL
        )
        logger.debug(f"Cached JD parse for JD {jd_id}")
    except Exception as e:
        logger.error(f"Error caching JD parse: {e}")

async def cache_candidate_recommendations(jd_id: int, recommendations_data: Dict[str, Any]):
    """Cache candidate recommendations data"""
    try:
        cache_key = f"candidate_recommendations:{jd_id}"
        import json
        await cache_manager.set(
            cache_key,
            json.dumps(recommendations_data, default=str),
            ttl=settings.PREDICTION_CACHE_TTL
        )
        logger.debug(f"Cached candidate recommendations for JD {jd_id}")
    except Exception as e:
        logger.error(f"Error caching candidate recommendations: {e}")

# Health check for enterprise services
@router.get("/health")
async def enterprise_services_health():
    """Health check for enterprise services"""
    try:
        # Check if models are loaded
        jd_parser_status = "loaded" if jd_parser.is_trained else "not_loaded"
        recommender_status = "loaded" if candidate_recommender.is_trained else "not_loaded"
        
        # Check cache connectivity
        cache_status = "connected"
        try:
            await cache_manager.ping()
        except:
            cache_status = "disconnected"
        
        return {
            "service": "enterprise_services",
            "status": "healthy",
            "jd_parser_status": jd_parser_status,
            "recommender_status": recommender_status,
            "cache_status": cache_status,
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "service": "enterprise_services",
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now()
        }