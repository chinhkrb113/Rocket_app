#!/usr/bin/env python3
"""
Simplified AI Service for Rocket Training System
Core functionality without heavy ML dependencies
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime, date
import uvicorn
import json
import re
import random
from loguru import logger
import sys

# Configure logging
logger.remove()
logger.add(sys.stdout, level="INFO")

# FastAPI app
app = FastAPI(
    title="Rocket Training System - AI Service",
    description="AI-powered services for training and recruitment management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class SubmissionAnalysisRequest(BaseModel):
    student_id: int
    submission_type: str
    submission_url: str
    metadata: Optional[Dict[str, Any]] = {}

class JobDescriptionData(BaseModel):
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
    include_analysis: bool = Field(default=True)
    include_skills_extraction: bool = Field(default=True)
    include_sentiment: bool = Field(default=False)

class CandidateRecommendationRequest(BaseModel):
    jd_id: int
    max_candidates: int = Field(default=10)
    include_scores: bool = Field(default=True)
    filters: Optional[Dict[str, Any]] = {}

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
    include_features: bool = Field(default=False)
    include_recommendations: bool = Field(default=True)

class LeadScoreByIdRequest(BaseModel):
    lead_id: str = Field(..., description="ID of the lead to score")

# Helper functions
def extract_skills_from_text(text: str) -> List[str]:
    """Extract skills from job description text"""
    skills_keywords = [
        'python', 'javascript', 'java', 'react', 'node.js', 'sql', 'html', 'css',
        'aws', 'docker', 'kubernetes', 'git', 'agile', 'scrum', 'machine learning',
        'data analysis', 'figma', 'sketch', 'photoshop', 'ui/ux', 'design',
        'project management', 'communication', 'teamwork', 'leadership'
    ]
    
    text_lower = text.lower()
    found_skills = []
    
    for skill in skills_keywords:
        if skill in text_lower:
            found_skills.append(skill.title())
    
    return list(set(found_skills))

def extract_experience_level(text: str) -> str:
    """Extract experience level from job description"""
    text_lower = text.lower()
    
    if any(term in text_lower for term in ['senior', '5+ years', '5-', 'lead', 'principal']):
        return 'senior'
    elif any(term in text_lower for term in ['mid', '3-5 years', '2-4 years', 'intermediate']):
        return 'mid'
    elif any(term in text_lower for term in ['junior', 'entry', '0-2 years', 'graduate']):
        return 'junior'
    else:
        return 'mid'

def calculate_complexity_score(text: str) -> float:
    """Calculate job description complexity score"""
    factors = {
        'length': min(len(text) / 1000, 1.0),
        'technical_terms': len(extract_skills_from_text(text)) / 20,
        'requirements': text.lower().count('requirement') / 10,
        'responsibilities': text.lower().count('responsib') / 10
    }
    
    return min(sum(factors.values()) / len(factors), 1.0)

def generate_mock_candidates(max_candidates: int = 10) -> List[Dict[str, Any]]:
    """Generate mock candidate recommendations"""
    candidates = []
    
    for i in range(min(max_candidates, 10)):
        candidate = {
            'candidate_id': f'CAND_{i+1:03d}',
            'name': f'Candidate {i+1}',
            'email': f'candidate{i+1}@example.com',
            'overall_score': round(random.uniform(0.6, 0.95), 2),
            'skill_match_score': round(random.uniform(0.5, 0.9), 2),
            'experience_match_score': round(random.uniform(0.6, 0.95), 2),
            'performance_score': round(random.uniform(0.7, 0.95), 2),
            'learning_potential': round(random.uniform(0.6, 0.9), 2),
            'matched_skills': random.sample(['Python', 'JavaScript', 'React', 'SQL', 'AWS'], random.randint(2, 4)),
            'missing_skills': random.sample(['Docker', 'Kubernetes', 'Machine Learning'], random.randint(0, 2)),
            'experience_years': random.randint(2, 8),
            'location': random.choice(['Remote', 'San Francisco', 'New York', 'Austin']),
            'availability': random.choice(['Immediate', '2 weeks', '1 month'])
        }
        candidates.append(candidate)
    
    # Sort by overall score
    candidates.sort(key=lambda x: x['overall_score'], reverse=True)
    return candidates

def calculate_lead_score(lead_data: LeadData) -> Dict[str, Any]:
    """Calculate lead score based on interactions and data"""
    score = 0
    factors = []
    
    # Email quality
    if '@' in lead_data.email and '.' in lead_data.email:
        score += 20
        factors.append('Valid email format')
    
    # Phone provided
    if lead_data.phone:
        score += 15
        factors.append('Phone number provided')
    
    # Interactions
    interaction_score = min(len(lead_data.interactions) * 10, 30)
    score += interaction_score
    if interaction_score > 0:
        factors.append(f'{len(lead_data.interactions)} interactions recorded')
    
    # Course interest
    if lead_data.interested_courses:
        score += min(len(lead_data.interested_courses) * 5, 20)
        factors.append(f'Interested in {len(lead_data.interested_courses)} courses')
    
    # Source quality
    source_scores = {
        'website': 15,
        'referral': 20,
        'social_media': 10,
        'advertisement': 8,
        'unknown': 0
    }
    score += source_scores.get(lead_data.source, 0)
    
    # Determine quality
    if score >= 70:
        quality = 'hot'
    elif score >= 50:
        quality = 'warm'
    elif score >= 30:
        quality = 'cold'
    else:
        quality = 'unqualified'
    
    return {
        'score': min(score, 100),
        'quality': quality,
        'factors': factors
    }

# API Routes

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "AI Service"
    }

@app.get("/")
async def root():
    return {
        "message": "Rocket Training System - AI Service",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Student Routes
@app.post("/api/students/analyze-submission")
async def analyze_submission(request: SubmissionAnalysisRequest):
    """Analyze student submission"""
    try:
        # Simulate analysis based on submission type
        if request.submission_type.lower() == 'github':
            analysis_type = 'code'
            score = random.uniform(75, 95)
            competencies = ['Python', 'Git', 'Code Quality']
        elif request.submission_type.lower() == 'figma':
            analysis_type = 'design'
            score = random.uniform(70, 90)
            competencies = ['UI Design', 'UX Design', 'Prototyping']
        else:
            analysis_type = 'general'
            score = random.uniform(60, 85)
            competencies = ['Problem Solving', 'Creativity']
        
        return {
            "student_id": request.student_id,
            "submission_type": analysis_type,
            "analysis_results": {
                "url_analyzed": request.submission_url,
                "technologies_detected": competencies,
                "complexity_score": round(random.uniform(0.6, 0.9), 2)
            },
            "competency_updates": [
                {
                    "competency_name": comp,
                    "previous_score": round(random.uniform(0.5, 0.8), 2),
                    "new_score": round(random.uniform(0.7, 0.95), 2),
                    "improvement": round(random.uniform(0.1, 0.3), 2)
                } for comp in competencies[:2]
            ],
            "overall_score": round(score, 1),
            "recommendations": [
                "Great work on this submission!",
                "Consider improving code documentation",
                "Keep practicing with advanced features"
            ],
            "analyzed_at": datetime.now().isoformat(),
            "processing_time_ms": round(random.uniform(1000, 2500), 1),
            "error": None
        }
    except Exception as e:
        logger.error(f"Error analyzing submission: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/students/health")
async def students_health():
    return {
        "status": "healthy",
        "service": "Student Analysis",
        "features": ["submission_analysis", "competency_tracking"]
    }

# Enterprise Routes
@app.post("/api/enterprises/parse-jd")
async def parse_job_description(request: JDParseRequest):
    """Parse job description"""
    try:
        jd = request.job_description
        
        # Extract information
        skills = extract_skills_from_text(jd.description_text)
        experience_level = extract_experience_level(jd.description_text)
        complexity = calculate_complexity_score(jd.description_text)
        
        # Extract responsibilities and qualifications
        text_lines = jd.description_text.split('\n')
        responsibilities = [line.strip('- ').strip() for line in text_lines if 'develop' in line.lower() or 'maintain' in line.lower() or 'collaborate' in line.lower()][:3]
        education_reqs = [line.strip('- ').strip() for line in text_lines if 'degree' in line.lower() or 'bachelor' in line.lower() or 'master' in line.lower()][:2]
        
        result = {
            "jd_id": getattr(jd, 'id', jd.enterprise_id),
            "parsed_requirements": {
                "skills": skills,
                "experience_level": experience_level,
                "education": education_reqs,
                "location": jd.location,
                "employment_type": jd.employment_type
            },
            "extracted_skills": skills,
            "experience_level": experience_level,
            "education_requirements": education_reqs,
            "key_responsibilities": responsibilities if responsibilities else [
                "Develop and maintain applications",
                "Collaborate with team members",
                "Write clean, maintainable code"
            ],
            "complexity_score": round(complexity, 2),
            "parsed_at": datetime.now().isoformat(),
            "error": None
        }
        
        if request.include_sentiment:
            result["sentiment_analysis"] = {
                "overall_sentiment": "positive",
                "confidence": 0.85,
                "key_phrases": ["competitive salary", "great team", "growth opportunities"]
            }
        
        return result
        
    except Exception as e:
        logger.error(f"Error parsing JD: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/enterprises/recommend-candidates")
async def recommend_candidates(request: CandidateRecommendationRequest):
    """Recommend candidates for a job"""
    try:
        candidates = generate_mock_candidates(request.max_candidates)
        
        return {
            "jd_id": request.jd_id,
            "recommended_candidates": candidates,
            "total_candidates_evaluated": random.randint(50, 200),
            "recommendation_criteria": {
                "skill_match_weight": 0.35,
                "experience_weight": 0.25,
                "performance_weight": 0.20,
                "learning_potential_weight": 0.15,
                "cultural_fit_weight": 0.05
            },
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error recommending candidates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/enterprises/health")
async def enterprises_health():
    return {
        "status": "healthy",
        "service": "Enterprise Services",
        "features": ["jd_parsing", "candidate_recommendation", "skill_analysis"]
    }

# Lead Routes
@app.post("/api/leads/score-by-id")
async def score_lead_by_id(request: LeadScoreByIdRequest):
    """Score lead by ID"""
    try:
        # Mock lead data based on ID
        mock_interactions = [
            {"type": "page_view", "timestamp": datetime.now().isoformat()},
            {"type": "form_submission", "timestamp": datetime.now().isoformat()},
            {"type": "email_open", "timestamp": datetime.now().isoformat()}
        ]
        
        score = random.randint(45, 95)
        quality = 'hot' if score >= 70 else 'warm' if score >= 50 else 'cold'
        
        return {
            "lead_id": request.lead_id,
            "lead_score": score,
            "quality": quality,
            "needs_human_intervention": score < 30,
            "interaction_details": [
                "Viewed pricing page",
                "Downloaded course brochure",
                "Submitted contact form"
            ],
            "total_interactions": len(mock_interactions),
            "scored_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error scoring lead by ID: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/leads/score")
async def score_lead(request: LeadScoreRequest):
    """Score lead with detailed analysis"""
    try:
        score_result = calculate_lead_score(request.lead_data)
        
        result = {
            "lead_id": request.lead_data.id,
            "lead_score": score_result['score'],
            "quality": score_result['quality'],
            "ml_score": round(random.uniform(0.6, 0.9), 2),
            "rule_based_score": score_result['score'],
            "scored_at": datetime.now().isoformat(),
            "error": None
        }
        
        if request.include_features:
            result["features"] = {
                "email_quality": 0.9 if '@' in request.lead_data.email else 0.3,
                "interaction_frequency": min(len(request.lead_data.interactions) / 10, 1.0),
                "course_interest_level": min(len(request.lead_data.interested_courses) / 5, 1.0),
                "source_quality": 0.8 if request.lead_data.source == 'referral' else 0.5
            }
        
        if request.include_recommendations:
            recommendations = [
                "Follow up within 24 hours",
                "Send personalized course information",
                "Schedule a consultation call"
            ]
            if score_result['score'] >= 70:
                recommendations.insert(0, "High priority lead - immediate attention required")
            result["recommendations"] = recommendations
        
        return result
        
    except Exception as e:
        logger.error(f"Error scoring lead: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/leads/health")
async def leads_health():
    return {
        "status": "healthy",
        "service": "Lead Scoring",
        "features": ["lead_scoring", "quality_assessment", "recommendation_engine"]
    }

if __name__ == "__main__":
    uvicorn.run(
        "main_simple:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )