import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from loguru import logger
from .config import settings
from .database import get_db, cache_manager
import os
import re

class LeadScorer:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.feature_columns = []
        self.model_path = settings.LEAD_SCORING_MODEL_PATH
        self.weights = settings.LEAD_SCORE_WEIGHTS
        self.is_trained = False
        
    def load_model(self) -> bool:
        """Load pre-trained model from disk"""
        try:
            if os.path.exists(self.model_path):
                model_data = joblib.load(self.model_path)
                self.model = model_data['model']
                self.scaler = model_data['scaler']
                self.feature_columns = model_data['feature_columns']
                self.is_trained = True
                logger.info("Lead scoring model loaded successfully")
                return True
            else:
                logger.warning("Lead scoring model file not found")
                return False
        except Exception as e:
            logger.error(f"Error loading lead scoring model: {e}")
            return False
    
    def save_model(self) -> bool:
        """Save trained model to disk"""
        try:
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            model_data = {
                'model': self.model,
                'scaler': self.scaler,
                'feature_columns': self.feature_columns,
                'trained_at': datetime.now().isoformat()
            }
            joblib.dump(model_data, self.model_path)
            logger.info("Lead scoring model saved successfully")
            return True
        except Exception as e:
            logger.error(f"Error saving lead scoring model: {e}")
            return False
    
    def extract_features(self, lead_data: Dict) -> Dict:
        """Extract features from lead data"""
        features = {}
        
        # Basic demographic features
        features['has_phone'] = 1 if lead_data.get('phone') else 0
        features['source_encoded'] = self._encode_source(lead_data.get('source', 'unknown'))
        
        # Interaction features
        interactions = lead_data.get('interactions', [])
        features['total_interactions'] = len(interactions)
        features['unique_interaction_types'] = len(set([i.get('interaction_type') for i in interactions]))
        
        # Time-based features
        created_at = lead_data.get('created_at')
        if created_at:
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            features['days_since_creation'] = (datetime.now() - created_at).days
        else:
            features['days_since_creation'] = 0
        
        # Engagement features
        features['email_engagement_score'] = self._calculate_email_engagement(interactions)
        features['website_activity_score'] = self._calculate_website_activity(interactions)
        features['interaction_frequency'] = self._calculate_interaction_frequency(interactions)
        features['content_engagement_score'] = self._calculate_content_engagement(interactions)
        
        # Course interest features
        interested_courses = lead_data.get('interested_courses', [])
        if isinstance(interested_courses, str):
            try:
                interested_courses = json.loads(interested_courses)
            except:
                interested_courses = []
        
        features['num_interested_courses'] = len(interested_courses)
        features['has_premium_interest'] = self._check_premium_course_interest(interested_courses)
        
        return features
    
    def _encode_source(self, source: str) -> int:
        """Encode lead source to numerical value"""
        source_mapping = {
            'website': 5,
            'social_media': 4,
            'referral': 5,
            'email_campaign': 3,
            'paid_ads': 3,
            'organic_search': 4,
            'direct': 2,
            'unknown': 1
        }
        return source_mapping.get(source.lower(), 1)
    
    def _calculate_email_engagement(self, interactions: List[Dict]) -> float:
        """Calculate email engagement score"""
        email_interactions = [i for i in interactions if i.get('interaction_type') in ['email_open', 'email_click']]
        if not email_interactions:
            return 0.0
        
        opens = len([i for i in email_interactions if i.get('interaction_type') == 'email_open'])
        clicks = len([i for i in email_interactions if i.get('interaction_type') == 'email_click'])
        
        # Weight clicks more than opens
        score = (opens * 0.3 + clicks * 0.7) / len(email_interactions)
        return min(score, 1.0)
    
    def _calculate_website_activity(self, interactions: List[Dict]) -> float:
        """Calculate website activity score"""
        website_interactions = [i for i in interactions if i.get('interaction_type') == 'view_page']
        if not website_interactions:
            return 0.0
        
        # Consider unique pages visited and total visits
        unique_pages = len(set([i.get('metadata', {}).get('page_url', '') for i in website_interactions]))
        total_visits = len(website_interactions)
        
        # Normalize score
        score = min((unique_pages * 0.6 + total_visits * 0.4) / 10, 1.0)
        return score
    
    def _calculate_interaction_frequency(self, interactions: List[Dict]) -> float:
        """Calculate interaction frequency score"""
        if not interactions:
            return 0.0
        
        # Group interactions by day
        interaction_dates = []
        for interaction in interactions:
            created_at = interaction.get('created_at')
            if created_at:
                if isinstance(created_at, str):
                    created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                interaction_dates.append(created_at.date())
        
        if not interaction_dates:
            return 0.0
        
        unique_days = len(set(interaction_dates))
        total_days = (max(interaction_dates) - min(interaction_dates)).days + 1 if len(interaction_dates) > 1 else 1
        
        frequency_score = unique_days / total_days
        return min(frequency_score, 1.0)
    
    def _calculate_content_engagement(self, interactions: List[Dict]) -> float:
        """Calculate content engagement score"""
        content_interactions = [i for i in interactions if i.get('interaction_type') in ['submit_form', 'chat_message']]
        if not content_interactions:
            return 0.0
        
        # Weight form submissions higher than chat messages
        forms = len([i for i in content_interactions if i.get('interaction_type') == 'submit_form'])
        chats = len([i for i in content_interactions if i.get('interaction_type') == 'chat_message'])
        
        score = (forms * 0.8 + chats * 0.2) / len(content_interactions)
        return min(score, 1.0)
    
    def _check_premium_course_interest(self, interested_courses: List) -> int:
        """Check if lead is interested in premium courses"""
        # This would need to be updated based on actual course data
        premium_keywords = ['advanced', 'premium', 'professional', 'enterprise']
        
        for course in interested_courses:
            course_name = str(course).lower()
            if any(keyword in course_name for keyword in premium_keywords):
                return 1
        return 0
    
    def score_lead(self, interaction_data: List[Dict]) -> Dict:
        """Calculate lead score based on interaction data"""
        try:
            total_score = 0
            needs_human_intervention = False
            interaction_details = []
            
            for interaction in interaction_data:
                interaction_score = 0
                interaction_type = interaction.get('type', '')
                content = interaction.get('content', '')
                duration = interaction.get('duration', 0)
                page_url = interaction.get('page_url', '')
                
                # Rule 1: Truy cập trang giá: +10 điểm
                if 'pricing' in page_url.lower() or 'gia' in page_url.lower():
                    interaction_score += 10
                    interaction_details.append("Visited pricing page (+10)")
                
                # Rule 2: Xem chi tiết khóa học Python trên 3 phút: +15 điểm
                if ('python' in page_url.lower() or 'python' in content.lower()) and duration > 180:
                    interaction_score += 15
                    interaction_details.append("Viewed Python course >3min (+15)")
                
                # Rule 3: Gửi form liên hệ: +20 điểm
                if interaction_type == 'form_submission' or 'contact' in interaction_type.lower():
                    interaction_score += 20
                    interaction_details.append("Submitted contact form (+20)")
                
                # Rule 4: NLP analysis on chat/message content
                if interaction_type in ['chat', 'message'] and content:
                    nlp_score, sentiment_flag = self._analyze_content_nlp(content)
                    interaction_score += nlp_score
                    
                    if sentiment_flag:
                        needs_human_intervention = True
                        interaction_details.append("Negative sentiment detected - needs human intervention")
                    
                    if nlp_score > 0:
                        interaction_details.append(f"NLP analysis (+{nlp_score})")
                
                total_score += interaction_score
            
            # Determine lead quality
            quality = self._determine_lead_quality(total_score)
            
            return {
                'lead_score': total_score,
                'quality': quality,
                'needs_human_intervention': needs_human_intervention,
                'interaction_details': interaction_details,
                'total_interactions': len(interaction_data),
                'scored_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error scoring lead: {e}")
            return {
                'lead_score': 0,
                'quality': 'unqualified',
                'needs_human_intervention': True,
                'interaction_details': [],
                'error': str(e)
            }
    
    def _analyze_content_nlp(self, content: str) -> Tuple[int, bool]:
        """Analyze content using NLP for sentiment and intent"""
        try:
            score = 0
            negative_sentiment = False
            
            content_lower = content.lower()
            
            # High-value enterprise keywords (+30 points)
            enterprise_keywords = [
                'báo giá doanh nghiệp', 'hợp tác', 'số lượng lớn', 
                'enterprise', 'corporate', 'bulk training', 'team training',
                'partnership', 'collaboration', 'enterprise solution'
            ]
            
            # Positive intent keywords (+5 points each)
            positive_keywords = [
                'mua', 'đăng ký', 'quan tâm', 'muốn học', 'tham gia', 
                'chi phí', 'giá cả', 'pricing', 'cost', 'interested',
                'enroll', 'register', 'sign up'
            ]
            
            # Negative sentiment keywords (trigger human intervention)
            negative_keywords = [
                'không hài lòng', 'thất vọng', 'tệ', 'kém', 'không tốt',
                'bực bội', 'tức giận', 'khó chịu', 'phản đối',
                'disappointed', 'frustrated', 'angry', 'upset', 'terrible',
                'awful', 'horrible', 'worst', 'hate'
            ]
            
            # Check for enterprise keywords
            for keyword in enterprise_keywords:
                if keyword in content_lower:
                    score += 30
                    break  # Only count once for enterprise intent
            
            # Check for positive intent keywords
            for keyword in positive_keywords:
                if keyword in content_lower:
                    score += 5
            
            # Check for negative sentiment
            for keyword in negative_keywords:
                if keyword in content_lower:
                    negative_sentiment = True
                    break  # One negative keyword is enough
            
            # Additional sentiment analysis using simple rules
            if not negative_sentiment:
                # Check for negative patterns
                negative_patterns = [
                    r'không\s+\w*\s*(tốt|hay|ok)',  # "không tốt", "không hay"
                    r'quá\s+(đắt|cao)',  # "quá đắt", "quá cao"
                    r'(rất|quá)\s+(tệ|kém)',  # "rất tệ", "quá kém"
                ]
                
                for pattern in negative_patterns:
                    if re.search(pattern, content_lower):
                        negative_sentiment = True
                        break
            
            # Ensure score is not negative
            score = max(0, score)
            
            return score, negative_sentiment
            
        except Exception as e:
            logger.error(f"Error in NLP analysis: {e}")
            return 0, False
    
    def calculate_lead_score(self, lead_data: Dict) -> Dict:
        """Calculate comprehensive lead score (legacy method)"""
        try:
            features = self.extract_features(lead_data)
            
            # If model is trained, use ML prediction
            if self.is_trained and self.model:
                ml_score = self._predict_with_model(features)
            else:
                ml_score = 0.5  # Default score if no model
            
            # Calculate rule-based score
            rule_based_score = self._calculate_rule_based_score(features)
            
            # Combine scores (70% ML, 30% rule-based)
            final_score = (ml_score * 0.7 + rule_based_score * 0.3) * 100
            final_score = max(0, min(100, final_score))  # Ensure score is between 0-100
            
            # Determine lead quality
            quality = self._determine_lead_quality(final_score)
            
            return {
                'lead_score': round(final_score, 2),
                'quality': quality,
                'ml_score': round(ml_score * 100, 2),
                'rule_based_score': round(rule_based_score * 100, 2),
                'features': features,
                'recommendations': self._generate_recommendations(features, final_score)
            }
        except Exception as e:
            logger.error(f"Error calculating lead score: {e}")
            return {
                'lead_score': 50.0,
                'quality': 'medium',
                'error': str(e)
            }
    
    def _predict_with_model(self, features: Dict) -> float:
        """Predict lead score using trained ML model"""
        try:
            # Prepare feature vector
            feature_vector = [features.get(col, 0) for col in self.feature_columns]
            feature_vector = np.array(feature_vector).reshape(1, -1)
            
            # Scale features
            feature_vector_scaled = self.scaler.transform(feature_vector)
            
            # Predict probability of conversion
            prediction = self.model.predict_proba(feature_vector_scaled)[0][1]
            return prediction
        except Exception as e:
            logger.error(f"Error in ML prediction: {e}")
            return 0.5
    
    def _calculate_rule_based_score(self, features: Dict) -> float:
        """Calculate score using rule-based approach"""
        score = 0.0
        
        # Email engagement (30%)
        score += features.get('email_engagement_score', 0) * self.weights['email_engagement']
        
        # Website activity (25%)
        score += features.get('website_activity_score', 0) * self.weights['website_activity']
        
        # Demographic fit (20%)
        demographic_score = 0
        if features.get('has_phone', 0):
            demographic_score += 0.3
        if features.get('source_encoded', 0) >= 4:
            demographic_score += 0.4
        if features.get('num_interested_courses', 0) > 0:
            demographic_score += 0.3
        score += demographic_score * self.weights['demographic_fit']
        
        # Interaction frequency (15%)
        score += features.get('interaction_frequency', 0) * self.weights['interaction_frequency']
        
        # Content engagement (10%)
        score += features.get('content_engagement_score', 0) * self.weights['content_engagement']
        
        return min(score, 1.0)
    
    def _determine_lead_quality(self, score: float) -> str:
        """Determine lead quality based on score"""
        if score >= 80:
            return 'hot'
        elif score >= 60:
            return 'warm'
        elif score >= 40:
            return 'medium'
        elif score >= 20:
            return 'cold'
        else:
            return 'very_cold'
    
    def _generate_recommendations(self, features: Dict, score: float) -> List[str]:
        """Generate recommendations for lead nurturing"""
        recommendations = []
        
        if features.get('email_engagement_score', 0) < 0.3:
            recommendations.append("Improve email content and timing to increase engagement")
        
        if features.get('website_activity_score', 0) < 0.3:
            recommendations.append("Encourage more website exploration with targeted content")
        
        if features.get('total_interactions', 0) < 3:
            recommendations.append("Increase touchpoints through multiple channels")
        
        if features.get('num_interested_courses', 0) == 0:
            recommendations.append("Identify and promote relevant courses based on lead profile")
        
        if score < 40:
            recommendations.append("Consider lead nurturing campaign to build interest")
        elif score > 70:
            recommendations.append("High-quality lead - prioritize for direct contact")
        
        return recommendations
    
    async def batch_score_leads(self, leads: List[Dict]) -> List[Dict]:
        """Score multiple leads in batch"""
        results = []
        
        for lead in leads:
            try:
                # Check cache first
                cache_key = f"lead_score:{lead.get('id', 'unknown')}"
                cached_result = await cache_manager.get(cache_key)
                
                if cached_result:
                    results.append(json.loads(cached_result))
                else:
                    score_result = self.calculate_lead_score(lead)
                    score_result['lead_id'] = lead.get('id')
                    results.append(score_result)
                    
                    # Cache result
                    await cache_manager.set(
                        cache_key, 
                        json.dumps(score_result), 
                        ttl=settings.PREDICTION_CACHE_TTL
                    )
            except Exception as e:
                logger.error(f"Error scoring lead {lead.get('id')}: {e}")
                results.append({
                    'lead_id': lead.get('id'),
                    'lead_score': 50.0,
                    'quality': 'medium',
                    'error': str(e)
                })
        
        return results

# Global instance
lead_scorer = LeadScorer()