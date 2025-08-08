import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.decomposition import TruncatedSVD
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestRegressor
import joblib
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from loguru import logger
from .config import settings
from .database import get_db, cache_manager
from .jd_parser import jd_parser
from .competency_analyzer import competency_analyzer
import asyncio
import os

class CandidateRecommender:
    def __init__(self):
        self.similarity_model = None
        self.ranking_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.svd_model = TruncatedSVD(n_components=50, random_state=42)
        self.clustering_model = KMeans(n_clusters=10, random_state=42)
        
        self.feature_columns = []
        self.competency_weights = {}
        self.model_path = settings.RECOMMENDATION_MODEL_PATH
        self.is_trained = False
        
        # Recommendation weights
        self.recommendation_weights = {
            'skill_match': 0.35,
            'experience_match': 0.25,
            'performance_score': 0.20,
            'learning_potential': 0.15,
            'cultural_fit': 0.05
        }
        
    def load_model(self) -> bool:
        """Load pre-trained recommendation model"""
        try:
            if os.path.exists(self.model_path):
                model_data = joblib.load(self.model_path)
                self.similarity_model = model_data.get('similarity_model')
                self.ranking_model = model_data.get('ranking_model')
                self.scaler = model_data.get('scaler', StandardScaler())
                self.svd_model = model_data.get('svd_model')
                self.clustering_model = model_data.get('clustering_model')
                self.feature_columns = model_data.get('feature_columns', [])
                self.competency_weights = model_data.get('competency_weights', {})
                self.is_trained = True
                logger.info("Recommendation model loaded successfully")
                return True
            else:
                logger.warning("Recommendation model file not found")
                return False
        except Exception as e:
            logger.error(f"Error loading recommendation model: {e}")
            return False
    
    def save_model(self) -> bool:
        """Save trained model to disk"""
        try:
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            model_data = {
                'similarity_model': self.similarity_model,
                'ranking_model': self.ranking_model,
                'scaler': self.scaler,
                'svd_model': self.svd_model,
                'clustering_model': self.clustering_model,
                'feature_columns': self.feature_columns,
                'competency_weights': self.competency_weights,
                'trained_at': datetime.now().isoformat()
            }
            joblib.dump(model_data, self.model_path)
            logger.info("Recommendation model saved successfully")
            return True
        except Exception as e:
            logger.error(f"Error saving recommendation model: {e}")
            return False
    
    def extract_candidate_features(self, candidate: Dict) -> Dict:
        """Extract features from candidate data for recommendation"""
        features = {}
        
        # Basic candidate info
        features['candidate_id'] = candidate.get('id')
        features['total_courses'] = len(candidate.get('enrollments', []))
        features['completed_courses'] = len([e for e in candidate.get('enrollments', []) if e.get('status') == 'completed'])
        features['course_completion_rate'] = features['completed_courses'] / max(features['total_courses'], 1)
        
        # Performance metrics
        tasks = candidate.get('tasks', [])
        completed_tasks = [t for t in tasks if t.get('status') == 'completed' and t.get('score') is not None]
        features['avg_task_score'] = np.mean([t.get('score', 0) for t in completed_tasks]) if completed_tasks else 0
        features['total_tasks_completed'] = len(completed_tasks)
        features['task_completion_rate'] = len(completed_tasks) / max(len(tasks), 1)
        
        # Competency scores
        competencies = candidate.get('competencies', [])
        features['avg_competency_score'] = np.mean([c.get('score', 0) for c in competencies]) if competencies else 0
        features['max_competency_score'] = max([c.get('score', 0) for c in competencies]) if competencies else 0
        features['competency_count'] = len(competencies)
        
        # Create competency vector
        competency_vector = {}
        for comp in competencies:
            comp_name = comp.get('competency_name', '').lower().replace(' ', '_')
            competency_vector[comp_name] = comp.get('score', 0)
        features['competency_vector'] = competency_vector
        
        # Learning metrics
        features['days_since_enrollment'] = self._calculate_days_since_enrollment(candidate)
        features['learning_velocity'] = self._calculate_learning_velocity(candidate)
        features['improvement_trend'] = self._calculate_improvement_trend(tasks)
        features['consistency_score'] = self._calculate_consistency_score(tasks)
        
        # Engagement metrics
        interactions = candidate.get('interactions', [])
        features['total_interactions'] = len(interactions)
        features['recent_activity'] = self._calculate_recent_activity(interactions)
        features['engagement_score'] = self._calculate_engagement_score(interactions)
        
        return features
    
    def _calculate_days_since_enrollment(self, candidate: Dict) -> int:
        """Calculate days since first enrollment"""
        enrollments = candidate.get('enrollments', [])
        if not enrollments:
            return 0
        
        earliest_date = None
        for enrollment in enrollments:
            created_at = enrollment.get('created_at')
            if created_at:
                if isinstance(created_at, str):
                    created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                if earliest_date is None or created_at < earliest_date:
                    earliest_date = created_at
        
        return (datetime.now() - earliest_date).days if earliest_date else 0
    
    def _calculate_learning_velocity(self, candidate: Dict) -> float:
        """Calculate learning velocity (competency improvement over time)"""
        competencies = candidate.get('competencies', [])
        if not competencies:
            return 0.0
        
        days_enrolled = self._calculate_days_since_enrollment(candidate)
        if days_enrolled == 0:
            return 0.0
        
        avg_competency = np.mean([c.get('score', 0) for c in competencies])
        velocity = avg_competency / max(days_enrolled, 1) * 30  # Monthly velocity
        
        return min(velocity, 10.0)  # Cap at reasonable value
    
    def _calculate_improvement_trend(self, tasks: List[Dict]) -> float:
        """Calculate improvement trend based on task scores"""
        completed_tasks = [t for t in tasks if t.get('status') == 'completed' and t.get('score') is not None]
        if len(completed_tasks) < 3:
            return 0.5
        
        # Sort by completion date
        completed_tasks.sort(key=lambda x: x.get('completed_at', ''))
        scores = [t.get('score', 0) for t in completed_tasks]
        
        # Calculate trend using linear regression
        x = np.arange(len(scores))
        if len(scores) > 1:
            slope = np.polyfit(x, scores, 1)[0]
            # Normalize to 0-1 range
            trend = max(0, min(1, (slope + 5) / 10))
            return trend
        
        return 0.5
    
    def _calculate_consistency_score(self, tasks: List[Dict]) -> float:
        """Calculate learning consistency score"""
        completed_tasks = [t for t in tasks if t.get('status') == 'completed' and t.get('score') is not None]
        if len(completed_tasks) < 3:
            return 0.5
        
        scores = [t.get('score', 0) for t in completed_tasks]
        cv = np.std(scores) / np.mean(scores) if np.mean(scores) > 0 else 1
        consistency = max(0, 1 - cv / 2)  # Lower CV = higher consistency
        
        return min(consistency, 1.0)
    
    def _calculate_recent_activity(self, interactions: List[Dict]) -> float:
        """Calculate recent activity score (last 30 days)"""
        if not interactions:
            return 0.0
        
        cutoff_date = datetime.now() - timedelta(days=30)
        recent_interactions = []
        
        for interaction in interactions:
            created_at = interaction.get('created_at')
            if created_at:
                if isinstance(created_at, str):
                    created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                if created_at >= cutoff_date:
                    recent_interactions.append(interaction)
        
        # Normalize by expected activity level
        activity_score = min(len(recent_interactions) / 20, 1.0)
        return activity_score
    
    def _calculate_engagement_score(self, interactions: List[Dict]) -> float:
        """Calculate overall engagement score"""
        if not interactions:
            return 0.0
        
        # Weight different interaction types
        interaction_weights = {
            'submit_task': 1.0,
            'view_content': 0.3,
            'chat_message': 0.7,
            'forum_post': 0.8,
            'take_quiz': 0.9
        }
        
        total_score = 0
        for interaction in interactions:
            interaction_type = interaction.get('interaction_type', '')
            weight = interaction_weights.get(interaction_type, 0.5)
            total_score += weight
        
        # Normalize
        engagement_score = min(total_score / len(interactions), 1.0)
        return engagement_score
    
    def calculate_skill_match_score(self, candidate_competencies: Dict, required_skills: List[str]) -> Dict:
        """Calculate skill match score between candidate and job requirements"""
        if not required_skills:
            return {'score': 0, 'matched_skills': [], 'missing_skills': []}
        
        matched_skills = []
        missing_skills = []
        skill_scores = []
        
        for skill in required_skills:
            skill_normalized = skill.lower().replace(' ', '_')
            if skill_normalized in candidate_competencies:
                score = candidate_competencies[skill_normalized]
                matched_skills.append({
                    'skill': skill,
                    'score': score,
                    'proficiency': self._get_proficiency_level(score)
                })
                skill_scores.append(score)
            else:
                missing_skills.append(skill)
        
        # Calculate overall match score
        if required_skills:
            match_rate = len(matched_skills) / len(required_skills)
            avg_skill_score = np.mean(skill_scores) if skill_scores else 0
            overall_score = (match_rate * 0.6 + (avg_skill_score / 100) * 0.4) * 100
        else:
            overall_score = 0
        
        return {
            'score': round(overall_score, 2),
            'match_rate': round(match_rate * 100, 2),
            'avg_skill_score': round(avg_skill_score, 2),
            'matched_skills': matched_skills,
            'missing_skills': missing_skills
        }
    
    def _get_proficiency_level(self, score: float) -> str:
        """Convert numeric score to proficiency level"""
        if score >= 90:
            return 'expert'
        elif score >= 80:
            return 'advanced'
        elif score >= 70:
            return 'intermediate'
        elif score >= 60:
            return 'beginner'
        else:
            return 'novice'
    
    def calculate_experience_match(self, candidate_features: Dict, required_experience: str) -> Dict:
        """Calculate experience level match"""
        candidate_exp_score = candidate_features.get('avg_competency_score', 0)
        days_enrolled = candidate_features.get('days_since_enrollment', 0)
        
        # Estimate candidate experience level
        if candidate_exp_score >= 85 and days_enrolled >= 365:
            candidate_level = 'senior'
        elif candidate_exp_score >= 70 and days_enrolled >= 180:
            candidate_level = 'mid_level'
        elif candidate_exp_score >= 60:
            candidate_level = 'junior'
        else:
            candidate_level = 'entry_level'
        
        # Map required experience to levels
        exp_mapping = {
            'entry_level': 1,
            'junior': 2,
            'mid_level': 3,
            'senior': 4,
            'executive': 5
        }
        
        candidate_score = exp_mapping.get(candidate_level, 2)
        required_score = exp_mapping.get(required_experience, 3)
        
        # Calculate match score
        if candidate_score >= required_score:
            match_score = 100
            match_quality = 'excellent'
        elif candidate_score == required_score - 1:
            match_score = 75
            match_quality = 'good'
        elif candidate_score == required_score - 2:
            match_score = 50
            match_quality = 'fair'
        else:
            match_score = 25
            match_quality = 'poor'
        
        return {
            'score': match_score,
            'candidate_level': candidate_level,
            'required_level': required_experience,
            'match_quality': match_quality
        }
    
    def calculate_performance_score(self, candidate_features: Dict) -> float:
        """Calculate overall performance score"""
        components = [
            candidate_features.get('avg_task_score', 0) / 100 * 0.4,
            candidate_features.get('course_completion_rate', 0) * 0.3,
            candidate_features.get('task_completion_rate', 0) * 0.2,
            candidate_features.get('consistency_score', 0) * 0.1
        ]
        
        return sum(components) * 100
    
    def calculate_learning_potential(self, candidate_features: Dict) -> float:
        """Calculate learning potential score"""
        components = [
            candidate_features.get('improvement_trend', 0) * 0.4,
            candidate_features.get('learning_velocity', 0) / 10 * 0.3,
            candidate_features.get('engagement_score', 0) * 0.2,
            candidate_features.get('recent_activity', 0) * 0.1
        ]
        
        return sum(components) * 100
    
    def calculate_cultural_fit(self, candidate_features: Dict, company_culture: Dict) -> float:
        """Calculate cultural fit score (simplified)"""
        # This is a simplified version - in practice, this would be more sophisticated
        base_score = 70  # Default cultural fit score
        
        # Adjust based on engagement and consistency
        engagement_bonus = candidate_features.get('engagement_score', 0) * 10
        consistency_bonus = candidate_features.get('consistency_score', 0) * 10
        
        cultural_fit_score = base_score + engagement_bonus + consistency_bonus
        return min(cultural_fit_score, 100)
    
    def recommend_candidates(self, job_description: Dict, candidates: List[Dict], top_k: int = 10) -> List[Dict]:
        """Recommend top candidates for a job description"""
        try:
            # Parse job description if not already parsed
            if 'parsed_requirements' not in job_description:
                parsed_jd = jd_parser.parse_job_description(
                    job_description.get('description_text', ''),
                    job_description.get('title', '')
                )
            else:
                parsed_jd = job_description.get('parsed_requirements', {})
            
            # Extract required skills from parsed JD
            jd_skills = parsed_jd.get('skills', {})
            required_skills = []
            for category, skills in jd_skills.items():
                required_skills.extend(skills)
            
            required_experience = parsed_jd.get('experience_level', {}).get('level', 'mid_level')
            
            recommendations = []
            
            for candidate in candidates:
                try:
                    # Extract candidate features
                    candidate_features = self.extract_candidate_features(candidate)
                    
                    # Calculate different match scores
                    skill_match = self.calculate_skill_match_score(
                        candidate_features.get('competency_vector', {}),
                        required_skills
                    )
                    
                    experience_match = self.calculate_experience_match(
                        candidate_features,
                        required_experience
                    )
                    
                    performance_score = self.calculate_performance_score(candidate_features)
                    learning_potential = self.calculate_learning_potential(candidate_features)
                    cultural_fit = self.calculate_cultural_fit(candidate_features, {})
                    
                    # Calculate weighted overall score
                    overall_score = (
                        skill_match['score'] * self.recommendation_weights['skill_match'] +
                        experience_match['score'] * self.recommendation_weights['experience_match'] +
                        performance_score * self.recommendation_weights['performance_score'] +
                        learning_potential * self.recommendation_weights['learning_potential'] +
                        cultural_fit * self.recommendation_weights['cultural_fit']
                    )
                    
                    recommendation = {
                        'candidate_id': candidate.get('id'),
                        'candidate_name': candidate.get('full_name', 'Unknown'),
                        'overall_score': round(overall_score, 2),
                        'skill_match': skill_match,
                        'experience_match': experience_match,
                        'performance_score': round(performance_score, 2),
                        'learning_potential': round(learning_potential, 2),
                        'cultural_fit': round(cultural_fit, 2),
                        'recommendation_reasons': self._generate_recommendation_reasons(
                            skill_match, experience_match, performance_score, learning_potential
                        ),
                        'areas_for_development': skill_match.get('missing_skills', []),
                        'strengths': [skill['skill'] for skill in skill_match.get('matched_skills', []) 
                                    if skill['score'] >= 80]
                    }
                    
                    recommendations.append(recommendation)
                    
                except Exception as e:
                    logger.error(f"Error processing candidate {candidate.get('id')}: {e}")
                    continue
            
            # Sort by overall score and return top K
            recommendations.sort(key=lambda x: x['overall_score'], reverse=True)
            return recommendations[:top_k]
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return []
    
    def _generate_recommendation_reasons(self, skill_match: Dict, experience_match: Dict, 
                                       performance_score: float, learning_potential: float) -> List[str]:
        """Generate reasons for recommendation"""
        reasons = []
        
        # Skill-based reasons
        if skill_match['score'] >= 80:
            reasons.append(f"Excellent skill match ({skill_match['score']:.1f}%)")
        elif skill_match['score'] >= 60:
            reasons.append(f"Good skill alignment ({skill_match['score']:.1f}%)")
        
        # Experience-based reasons
        if experience_match['score'] >= 75:
            reasons.append(f"Strong experience match ({experience_match['match_quality']})")
        
        # Performance-based reasons
        if performance_score >= 80:
            reasons.append("High performance track record")
        elif performance_score >= 60:
            reasons.append("Solid performance history")
        
        # Learning potential reasons
        if learning_potential >= 80:
            reasons.append("Excellent learning potential")
        elif learning_potential >= 60:
            reasons.append("Good growth potential")
        
        # Specific strengths
        matched_skills = skill_match.get('matched_skills', [])
        expert_skills = [skill['skill'] for skill in matched_skills if skill['score'] >= 90]
        if expert_skills:
            reasons.append(f"Expert level in: {', '.join(expert_skills[:3])}")
        
        return reasons
    
    def get_similar_candidates(self, target_candidate: Dict, candidate_pool: List[Dict], top_k: int = 5) -> List[Dict]:
        """Find candidates similar to a target candidate"""
        try:
            target_features = self.extract_candidate_features(target_candidate)
            target_competencies = target_features.get('competency_vector', {})
            
            similarities = []
            
            for candidate in candidate_pool:
                if candidate.get('id') == target_candidate.get('id'):
                    continue
                
                candidate_features = self.extract_candidate_features(candidate)
                candidate_competencies = candidate_features.get('competency_vector', {})
                
                # Calculate similarity
                similarity_score = self._calculate_candidate_similarity(
                    target_competencies, candidate_competencies
                )
                
                similarities.append({
                    'candidate_id': candidate.get('id'),
                    'candidate_name': candidate.get('full_name', 'Unknown'),
                    'similarity_score': similarity_score,
                    'shared_competencies': self._get_shared_competencies(
                        target_competencies, candidate_competencies
                    )
                })
            
            # Sort by similarity and return top K
            similarities.sort(key=lambda x: x['similarity_score'], reverse=True)
            return similarities[:top_k]
            
        except Exception as e:
            logger.error(f"Error finding similar candidates: {e}")
            return []
    
    def _calculate_candidate_similarity(self, comp1: Dict, comp2: Dict) -> float:
        """Calculate similarity between two candidates based on competencies"""
        if not comp1 or not comp2:
            return 0.0
        
        # Get all competencies
        all_competencies = set(comp1.keys()) | set(comp2.keys())
        
        if not all_competencies:
            return 0.0
        
        # Create vectors
        vec1 = np.array([comp1.get(comp, 0) for comp in all_competencies])
        vec2 = np.array([comp2.get(comp, 0) for comp in all_competencies])
        
        # Calculate cosine similarity
        similarity = cosine_similarity([vec1], [vec2])[0][0]
        return max(0, similarity)  # Ensure non-negative
    
    def _get_shared_competencies(self, comp1: Dict, comp2: Dict) -> List[Dict]:
        """Get shared competencies between two candidates"""
        shared = []
        
        for comp_name in comp1.keys():
            if comp_name in comp2:
                shared.append({
                    'competency': comp_name,
                    'candidate1_score': comp1[comp_name],
                    'candidate2_score': comp2[comp_name],
                    'avg_score': (comp1[comp_name] + comp2[comp_name]) / 2
                })
        
        # Sort by average score
        shared.sort(key=lambda x: x['avg_score'], reverse=True)
        return shared[:5]  # Top 5 shared competencies
    
    async def batch_recommend_candidates(self, job_descriptions: List[Dict], 
                                       candidates: List[Dict]) -> List[Dict]:
        """Generate recommendations for multiple job descriptions"""
        results = []
        
        for jd in job_descriptions:
            try:
                jd_id = jd.get('id')
                cache_key = f"recommendations:{jd_id}"
                
                # Check cache
                cached_result = await cache_manager.get(cache_key)
                if cached_result:
                    results.append(json.loads(cached_result))
                    continue
                
                # Generate recommendations
                recommendations = self.recommend_candidates(jd, candidates)
                
                result = {
                    'job_description_id': jd_id,
                    'job_title': jd.get('title', ''),
                    'recommendations': recommendations,
                    'total_candidates_evaluated': len(candidates),
                    'generated_at': datetime.now().isoformat()
                }
                
                results.append(result)
                
                # Cache result
                await cache_manager.set(
                    cache_key,
                    json.dumps(result),
                    ttl=settings.PREDICTION_CACHE_TTL
                )
                
            except Exception as e:
                logger.error(f"Error generating recommendations for JD {jd.get('id')}: {e}")
                results.append({
                    'job_description_id': jd.get('id'),
                    'error': str(e)
                })
        
        return results
    
    def analyze_hiring_trends(self, historical_data: List[Dict]) -> Dict:
        """Analyze hiring trends and patterns"""
        try:
            if not historical_data:
                return {'error': 'No historical data provided'}
            
            # Convert to DataFrame for analysis
            df = pd.DataFrame(historical_data)
            
            trends = {
                'total_hires': len(df),
                'avg_time_to_hire': df['time_to_hire'].mean() if 'time_to_hire' in df.columns else None,
                'success_rate': df['hire_success'].mean() if 'hire_success' in df.columns else None,
                'top_skills_hired': self._analyze_top_skills(df),
                'hiring_by_experience_level': self._analyze_experience_distribution(df),
                'seasonal_trends': self._analyze_seasonal_trends(df),
                'performance_correlation': self._analyze_performance_correlation(df)
            }
            
            return trends
            
        except Exception as e:
            logger.error(f"Error analyzing hiring trends: {e}")
            return {'error': str(e)}
    
    def _analyze_top_skills(self, df: pd.DataFrame) -> List[Dict]:
        """Analyze most frequently hired skills"""
        # This would need to be implemented based on actual data structure
        return []
    
    def _analyze_experience_distribution(self, df: pd.DataFrame) -> Dict:
        """Analyze hiring distribution by experience level"""
        if 'experience_level' not in df.columns:
            return {}
        
        distribution = df['experience_level'].value_counts().to_dict()
        return distribution
    
    def _analyze_seasonal_trends(self, df: pd.DataFrame) -> Dict:
        """Analyze seasonal hiring trends"""
        if 'hire_date' not in df.columns:
            return {}
        
        df['hire_date'] = pd.to_datetime(df['hire_date'])
        df['month'] = df['hire_date'].dt.month
        monthly_hires = df['month'].value_counts().sort_index().to_dict()
        
        return monthly_hires
    
    def _analyze_performance_correlation(self, df: pd.DataFrame) -> Dict:
        """Analyze correlation between hiring criteria and performance"""
        correlations = {}
        
        if 'performance_score' in df.columns:
            numeric_columns = df.select_dtypes(include=[np.number]).columns
            for col in numeric_columns:
                if col != 'performance_score':
                    correlation = df[col].corr(df['performance_score'])
                    correlations[col] = round(correlation, 3)
        
        return correlations

# Global instance
candidate_recommender = CandidateRecommender()