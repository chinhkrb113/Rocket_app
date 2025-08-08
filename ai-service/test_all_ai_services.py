#!/usr/bin/env python3
"""
Comprehensive AI Services Test Suite
Tests all AI services: Submission Analysis, JD Parser, Candidate Recommender, and Lead Scoring
"""

import requests
import json
from datetime import datetime, date
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

def print_header(title: str):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f"=== {title} ===")
    print("=" * 60)

def print_test_result(test_name: str, success: bool, details: str = ""):
    """Print test result with formatting"""
    status = "✅" if success else "❌"
    print(f"{status} {test_name}")
    if details:
        print(f"   {details}")
    print("-" * 60)

def test_health_check():
    """Test if the AI service is running"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_test_result("Health Check", True, f"Status: {data.get('status', 'unknown')}")
            return True
        else:
            print_test_result("Health Check", False, f"Status Code: {response.status_code}")
            return False
    except Exception as e:
        print_test_result("Health Check", False, f"Error: {str(e)}")
        return False

def test_submission_analysis():
    """Test submission analysis endpoint"""
    print_header("Submission Analysis Service")
    
    # Test GitHub submission
    github_payload = {
        "student_id": 1,
        "submission_type": "github",
        "submission_url": "https://github.com/facebook/react",
        "metadata": {
            "assignment_id": 101,
            "course_id": 1
        }
    }
    
    try:
        response = requests.post(f"{API_BASE}/students/analyze-submission", 
                               json=github_payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            print_test_result("GitHub Submission Analysis", True, 
                            f"Score: {data.get('overall_score', 'N/A')}, "
                            f"Type: {data.get('submission_type', 'N/A')}")
        else:
            print_test_result("GitHub Submission Analysis", False, 
                            f"Status Code: {response.status_code}")
    except Exception as e:
        print_test_result("GitHub Submission Analysis", False, f"Error: {str(e)}")
    
    # Test Figma submission
    figma_payload = {
        "student_id": 2,
        "submission_type": "figma",
        "submission_url": "https://www.figma.com/file/sample-design",
        "metadata": {
            "assignment_id": 102,
            "course_id": 2
        }
    }
    
    try:
        response = requests.post(f"{API_BASE}/students/analyze-submission", 
                               json=figma_payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            print_test_result("Figma Submission Analysis", True, 
                            f"Score: {data.get('overall_score', 'N/A')}, "
                            f"Type: {data.get('submission_type', 'N/A')}")
        else:
            print_test_result("Figma Submission Analysis", False, 
                            f"Status Code: {response.status_code}")
    except Exception as e:
        print_test_result("Figma Submission Analysis", False, f"Error: {str(e)}")

def test_jd_parser():
    """Test JD Parser service"""
    print_header("Job Description Parser Service")
    
    jd_payload = {
        "job_description": {
            "enterprise_id": 1,
            "title": "Senior Python Developer",
            "description_text": """
            We are looking for a Senior Python Developer with 5+ years of experience.
            
            Requirements:
            - Strong proficiency in Python, Django, and Flask
            - Experience with React and JavaScript
            - Knowledge of SQL databases (PostgreSQL, MySQL)
            - Familiarity with AWS cloud services
            - Bachelor's degree in Computer Science or related field
            
            Responsibilities:
            - Develop and maintain web applications
            - Collaborate with cross-functional teams
            - Write clean, maintainable code
            - Participate in code reviews
            
            Benefits:
            - Competitive salary ($80,000 - $120,000)
            - Health insurance
            - Remote work options
            - Professional development opportunities
            """,
            "location": "San Francisco, CA",
            "employment_type": "full_time",
            "posted_date": date.today().isoformat()
        },
        "include_analysis": True,
        "include_skills_extraction": True,
        "include_sentiment": True
    }
    
    try:
        response = requests.post(f"{API_BASE}/enterprises/parse-jd", 
                               json=jd_payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            skills = data.get('extracted_skills', [])
            experience = data.get('experience_level', 'N/A')
            complexity = data.get('complexity_score', 0)
            print_test_result("JD Parsing", True, 
                            f"Skills: {len(skills)}, Experience: {experience}, "
                            f"Complexity: {complexity:.2f}")
        else:
            print_test_result("JD Parsing", False, f"Status Code: {response.status_code}")
    except Exception as e:
        print_test_result("JD Parsing", False, f"Error: {str(e)}")

def test_candidate_recommendation():
    """Test Candidate Recommendation service"""
    print_header("Candidate Recommendation Service")
    
    recommendation_payload = {
        "jd_id": 1,
        "max_candidates": 5,
        "include_scores": True,
        "filters": {
            "min_experience_years": 3,
            "location_preference": "remote"
        }
    }
    
    try:
        response = requests.post(f"{API_BASE}/enterprises/recommend-candidates", 
                               json=recommendation_payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            candidates = data.get('recommended_candidates', [])
            total_evaluated = data.get('total_candidates_evaluated', 0)
            print_test_result("Candidate Recommendation", True, 
                            f"Recommended: {len(candidates)}, "
                            f"Total Evaluated: {total_evaluated}")
        else:
            print_test_result("Candidate Recommendation", False, 
                            f"Status Code: {response.status_code}")
    except Exception as e:
        print_test_result("Candidate Recommendation", False, f"Error: {str(e)}")

def test_lead_scoring():
    """Test Lead Scoring service"""
    print_header("Lead Scoring Service")
    
    # Test lead scoring by ID
    lead_id_payload = {
        "lead_id": "LEAD_001"
    }
    
    try:
        response = requests.post(f"{API_BASE}/leads/score-by-id", 
                               json=lead_id_payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            score = data.get('lead_score', 0)
            quality = data.get('quality', 'N/A')
            interactions = data.get('total_interactions', 0)
            print_test_result("Lead Scoring by ID", True, 
                            f"Score: {score}, Quality: {quality}, "
                            f"Interactions: {interactions}")
        else:
            print_test_result("Lead Scoring by ID", False, 
                            f"Status Code: {response.status_code}")
    except Exception as e:
        print_test_result("Lead Scoring by ID", False, f"Error: {str(e)}")
    
    # Test comprehensive lead scoring
    lead_payload = {
        "lead_data": {
            "full_name": "John Doe",
            "email": "john.doe@example.com",
            "phone": "+1-555-0123",
            "source": "website",
            "status": "new",
            "interactions": [
                {
                    "type": "page_view",
                    "timestamp": datetime.now().isoformat(),
                    "details": {"page": "/courses/python"}
                },
                {
                    "type": "form_submission",
                    "timestamp": datetime.now().isoformat(),
                    "details": {"form": "contact_us"}
                }
            ],
            "interested_courses": ["Python Development", "Data Science"],
            "metadata": {
                "utm_source": "google",
                "utm_campaign": "python_course"
            }
        },
        "include_features": True,
        "include_recommendations": True
    }
    
    try:
        response = requests.post(f"{API_BASE}/leads/score", 
                               json=lead_payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            score = data.get('lead_score', 0)
            quality = data.get('quality', 'N/A')
            recommendations = data.get('recommendations', [])
            print_test_result("Comprehensive Lead Scoring", True, 
                            f"Score: {score:.2f}, Quality: {quality}, "
                            f"Recommendations: {len(recommendations)}")
        else:
            print_test_result("Comprehensive Lead Scoring", False, 
                            f"Status Code: {response.status_code}")
    except Exception as e:
        print_test_result("Comprehensive Lead Scoring", False, f"Error: {str(e)}")

def test_service_health_endpoints():
    """Test individual service health endpoints"""
    print_header("Service Health Checks")
    
    services = [
        ("Students Service", f"{API_BASE}/students/health"),
        ("Enterprises Service", f"{API_BASE}/enterprises/health"),
        ("Leads Service", f"{API_BASE}/leads/health")
    ]
    
    for service_name, endpoint in services:
        try:
            response = requests.get(endpoint, timeout=5)
            if response.status_code == 200:
                data = response.json()
                status = data.get('status', 'unknown')
                print_test_result(f"{service_name} Health", True, f"Status: {status}")
            else:
                print_test_result(f"{service_name} Health", False, 
                                f"Status Code: {response.status_code}")
        except Exception as e:
            print_test_result(f"{service_name} Health", False, f"Error: {str(e)}")

def main():
    """Run all tests"""
    print("🚀 Testing AI Services - Comprehensive Suite")
    print(f"Timestamp: {datetime.now()}")
    print("=" * 60)
    
    # Check if service is running
    if not test_health_check():
        print("\n❌ AI Service is not running. Please start the service first.")
        return
    
    print("\n✅ AI Service is running\n")
    
    # Run all service tests
    test_submission_analysis()
    test_jd_parser()
    test_candidate_recommendation()
    test_lead_scoring()
    test_service_health_endpoints()
    
    print_header("Test Summary")
    print("🏁 All AI services have been tested")
    print("📊 Check individual test results above for detailed status")
    print("\n💡 Tip: Visit http://localhost:8000/docs for interactive API documentation")

if __name__ == "__main__":
    main()