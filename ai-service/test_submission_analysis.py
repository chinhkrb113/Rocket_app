#!/usr/bin/env python3
"""
Test script for submission analysis API endpoint
"""

import asyncio
import aiohttp
import json
from datetime import datetime

# Test data
test_submissions = [
    {
        "student_id": 1,
        "submission_data": {
            "type": "github",
            "url": "https://github.com/facebook/react",
            "description": "React library analysis"
        },
        "metadata": {
            "course_id": 101,
            "assignment_id": 201
        }
    },
    {
        "student_id": 2,
        "submission_data": {
            "type": "figma",
            "url": "https://www.figma.com/file/sample-design",
            "description": "UI/UX design project"
        },
        "metadata": {
            "course_id": 102,
            "assignment_id": 202
        }
    }
]

async def test_submission_analysis():
    """Test the submission analysis endpoint"""
    base_url = "http://localhost:8000/api"
    
    async with aiohttp.ClientSession() as session:
        for i, test_data in enumerate(test_submissions, 1):
            print(f"\n=== Test {i}: {test_data['submission_data']['type'].upper()} Submission ===")
            print(f"Student ID: {test_data['student_id']}")
            print(f"URL: {test_data['submission_data']['url']}")
            
            try:
                # Send POST request to analyze submission
                async with session.post(
                    f"{base_url}/students/analyze-submission",
                    json=test_data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    
                    print(f"Status Code: {response.status}")
                    
                    if response.status == 200:
                        result = await response.json()
                        print("✅ Analysis successful!")
                        print(f"Submission Type: {result.get('submission_type')}")
                        print(f"Overall Score: {result.get('overall_score')}")
                        print(f"Processing Time: {result.get('processing_time_ms')}ms")
                        print(f"Competency Updates: {len(result.get('competency_updates', []))}")
                        print(f"Recommendations: {len(result.get('recommendations', []))}")
                        
                        # Print first few recommendations
                        recommendations = result.get('recommendations', [])
                        if recommendations:
                            print("\nRecommendations:")
                            for j, rec in enumerate(recommendations[:3], 1):
                                print(f"  {j}. {rec}")
                        
                        # Print competency updates
                        competency_updates = result.get('competency_updates', [])
                        if competency_updates:
                            print("\nCompetency Updates:")
                            for update in competency_updates[:3]:
                                print(f"  - {update.get('competency_name')}: +{update.get('score_change')} ({update.get('reason')})")
                    
                    else:
                        error_text = await response.text()
                        print(f"❌ Error: {error_text}")
                        
            except Exception as e:
                print(f"❌ Request failed: {e}")
            
            print("-" * 60)

async def test_health_check():
    """Test if the AI service is running"""
    print("=== Health Check ===")
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get("http://localhost:8000/health") as response:
                if response.status == 200:
                    result = await response.json()
                    print("✅ AI Service is running")
                    print(f"Status: {result.get('status')}")
                    return True
                else:
                    print(f"❌ Health check failed: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Cannot connect to AI service: {e}")
            return False

async def main():
    """Main test function"""
    print("🚀 Testing AI Service - Submission Analysis")
    print(f"Timestamp: {datetime.now()}")
    print("=" * 60)
    
    # Check if service is running
    if await test_health_check():
        print("\n")
        await test_submission_analysis()
    else:
        print("\n❌ AI Service is not running. Please start it first with:")
        print("   cd ai-service && python main.py")
    
    print("\n🏁 Test completed")

if __name__ == "__main__":
    asyncio.run(main())