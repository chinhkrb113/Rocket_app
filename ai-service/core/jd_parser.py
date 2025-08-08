import re
import json
import spacy
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.stem import WordNetLemmatizer
from textblob import TextBlob
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
from loguru import logger
from .config import settings
from .database import get_db, cache_manager
import asyncio

class JDParser:
    def __init__(self):
        self.nlp = None
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))
        self.tfidf_vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        
        # Predefined skill categories and keywords
        self.skill_categories = {
            'programming_languages': {
                'keywords': ['python', 'java', 'javascript', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala', 'r', 'matlab'],
                'patterns': [r'\b(python|java|javascript|js|c\+\+|c#|php|ruby|golang|go|rust|swift|kotlin|scala)\b']
            },
            'web_technologies': {
                'keywords': ['html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel'],
                'patterns': [r'\b(html5?|css3?|react|angular|vue\.?js|node\.?js|express|django|flask|spring|laravel)\b']
            },
            'databases': {
                'keywords': ['mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sql server', 'sqlite'],
                'patterns': [r'\b(mysql|postgresql|postgres|mongodb|redis|elasticsearch|oracle|sql\s+server|sqlite)\b']
            },
            'cloud_platforms': {
                'keywords': ['aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'terraform'],
                'patterns': [r'\b(aws|azure|gcp|google\s+cloud|docker|kubernetes|k8s|terraform)\b']
            },
            'data_science': {
                'keywords': ['machine learning', 'deep learning', 'ai', 'data analysis', 'pandas', 'numpy', 'tensorflow', 'pytorch'],
                'patterns': [r'\b(machine\s+learning|deep\s+learning|artificial\s+intelligence|ai|data\s+analysis|pandas|numpy|tensorflow|pytorch)\b']
            },
            'design_tools': {
                'keywords': ['figma', 'sketch', 'adobe', 'photoshop', 'illustrator', 'xd', 'invision'],
                'patterns': [r'\b(figma|sketch|adobe|photoshop|illustrator|xd|invision)\b']
            },
            'soft_skills': {
                'keywords': ['communication', 'teamwork', 'leadership', 'problem solving', 'analytical', 'creative', 'adaptable'],
                'patterns': [r'\b(communication|teamwork|leadership|problem\s+solving|analytical|creative|adaptable|flexible)\b']
            }
        }
        
        # Experience level patterns
        self.experience_patterns = {
            'entry_level': [r'\b(0-2|0\s*-\s*2|entry\s+level|junior|fresh|graduate|intern)\b'],
            'mid_level': [r'\b(2-5|3-5|2\s*-\s*5|3\s*-\s*5|mid\s+level|intermediate|experienced)\b'],
            'senior_level': [r'\b(5\+|5-8|5\s*-\s*8|senior|lead|principal|architect)\b'],
            'executive': [r'\b(8\+|10\+|director|manager|head\s+of|vp|vice\s+president|cto|ceo)\b']
        }
        
        # Education patterns
        self.education_patterns = {
            'degree_required': [r'\b(bachelor|master|phd|degree|diploma)\b'],
            'field_of_study': [r'\b(computer\s+science|software\s+engineering|information\s+technology|mathematics|statistics)\b']
        }
        
        # Salary patterns
        self.salary_patterns = [
            r'\$([0-9,]+)\s*-\s*\$([0-9,]+)',
            r'\$([0-9,]+)k?\s*-\s*([0-9,]+)k',
            r'([0-9,]+)\s*-\s*([0-9,]+)\s*(usd|dollars?)',
            r'salary\s*:?\s*\$?([0-9,]+)',
            r'compensation\s*:?\s*\$?([0-9,]+)'
        ]
        
        self._initialize_nlp()
    
    def _initialize_nlp(self):
        """Initialize NLP models"""
        try:
            # Download required NLTK data
            nltk.download('punkt', quiet=True)
            nltk.download('stopwords', quiet=True)
            nltk.download('wordnet', quiet=True)
            nltk.download('averaged_perceptron_tagger', quiet=True)
            
            # Load spaCy model
            try:
                self.nlp = spacy.load('en_core_web_sm')
            except OSError:
                logger.warning("spaCy English model not found. Some features may be limited.")
                self.nlp = None
                
        except Exception as e:
            logger.error(f"Error initializing NLP models: {e}")
    
    def parse_job_description(self, jd_text: str, job_title: str = "") -> Dict:
        """Parse job description and extract structured information"""
        try:
            # Clean and preprocess text
            cleaned_text = self._clean_text(jd_text)
            
            # Extract different components
            parsed_data = {
                'job_title': job_title,
                'original_text': jd_text,
                'cleaned_text': cleaned_text,
                'skills': self._extract_skills(cleaned_text),
                'experience_level': self._extract_experience_level(cleaned_text),
                'education_requirements': self._extract_education_requirements(cleaned_text),
                'responsibilities': self._extract_responsibilities(cleaned_text),
                'qualifications': self._extract_qualifications(cleaned_text),
                'salary_info': self._extract_salary_info(cleaned_text),
                'company_benefits': self._extract_benefits(cleaned_text),
                'location_info': self._extract_location(cleaned_text),
                'employment_type': self._extract_employment_type(cleaned_text),
                'key_phrases': self._extract_key_phrases(cleaned_text),
                'sentiment_analysis': self._analyze_sentiment(cleaned_text),
                'complexity_score': self._calculate_complexity_score(cleaned_text),
                'parsed_at': datetime.now().isoformat()
            }
            
            # Generate summary
            parsed_data['summary'] = self._generate_summary(parsed_data)
            
            return parsed_data
            
        except Exception as e:
            logger.error(f"Error parsing job description: {e}")
            return {
                'error': str(e),
                'job_title': job_title,
                'original_text': jd_text
            }
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep important punctuation
        text = re.sub(r'[^\w\s.,;:()\-/]', '', text)
        
        # Convert to lowercase for processing
        return text.lower().strip()
    
    def _extract_skills(self, text: str) -> Dict:
        """Extract technical and soft skills from text"""
        skills = {}
        
        for category, config in self.skill_categories.items():
            found_skills = set()
            
            # Search by keywords
            for keyword in config['keywords']:
                if keyword.lower() in text.lower():
                    found_skills.add(keyword)
            
            # Search by patterns
            for pattern in config['patterns']:
                matches = re.findall(pattern, text, re.IGNORECASE)
                found_skills.update([match.lower() if isinstance(match, str) else match[0].lower() for match in matches])
            
            skills[category] = list(found_skills)
        
        # Extract additional skills using NLP if available
        if self.nlp:
            doc = self.nlp(text)
            additional_skills = []
            
            # Look for noun phrases that might be skills
            for chunk in doc.noun_chunks:
                chunk_text = chunk.text.lower().strip()
                if (len(chunk_text.split()) <= 3 and 
                    chunk_text not in self.stop_words and 
                    len(chunk_text) > 2):
                    additional_skills.append(chunk_text)
            
            skills['additional_skills'] = list(set(additional_skills))
        
        return skills
    
    def _extract_experience_level(self, text: str) -> Dict:
        """Extract experience level requirements"""
        experience_info = {
            'level': 'not_specified',
            'years_required': None,
            'details': []
        }
        
        for level, patterns in self.experience_patterns.items():
            for pattern in patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                if matches:
                    experience_info['level'] = level
                    experience_info['details'].extend(matches)
        
        # Extract specific years of experience
        year_patterns = [
            r'(\d+)\+?\s*years?\s*of\s*experience',
            r'(\d+)\s*-\s*(\d+)\s*years?\s*experience',
            r'minimum\s*(\d+)\s*years?',
            r'at\s*least\s*(\d+)\s*years?'
        ]
        
        for pattern in year_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                if isinstance(matches[0], tuple):
                    experience_info['years_required'] = matches[0]
                else:
                    experience_info['years_required'] = matches[0]
                break
        
        return experience_info
    
    def _extract_education_requirements(self, text: str) -> Dict:
        """Extract education requirements"""
        education = {
            'degree_required': False,
            'degree_level': [],
            'field_of_study': [],
            'details': []
        }
        
        # Check for degree requirements
        for pattern in self.education_patterns['degree_required']:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                education['degree_required'] = True
                education['degree_level'].extend(matches)
        
        # Extract field of study
        for pattern in self.education_patterns['field_of_study']:
            matches = re.findall(pattern, text, re.IGNORECASE)
            education['field_of_study'].extend(matches)
        
        # Look for specific degree mentions
        degree_patterns = [
            r'\b(bachelor\'?s?|master\'?s?|phd|doctorate|associate)\s*(degree|diploma)?\b',
            r'\b(bs|ba|ms|ma|mba|phd)\b'
        ]
        
        for pattern in degree_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            education['details'].extend([match[0] if isinstance(match, tuple) else match for match in matches])
        
        return education
    
    def _extract_responsibilities(self, text: str) -> List[str]:
        """Extract job responsibilities"""
        responsibilities = []
        
        # Look for sections that typically contain responsibilities
        responsibility_sections = [
            r'responsibilities?:?\s*([^\n]*(?:\n[^\n]*)*?)(?=\n\s*(?:qualifications?|requirements?|skills?|education|experience)|$)',
            r'duties?:?\s*([^\n]*(?:\n[^\n]*)*?)(?=\n\s*(?:qualifications?|requirements?|skills?|education|experience)|$)',
            r'role:?\s*([^\n]*(?:\n[^\n]*)*?)(?=\n\s*(?:qualifications?|requirements?|skills?|education|experience)|$)'
        ]
        
        for pattern in responsibility_sections:
            matches = re.findall(pattern, text, re.IGNORECASE | re.DOTALL)
            for match in matches:
                # Split by bullet points or line breaks
                items = re.split(r'[•\*\-]|\n', match)
                responsibilities.extend([item.strip() for item in items if item.strip() and len(item.strip()) > 10])
        
        # If no specific section found, look for action verbs
        if not responsibilities:
            action_verbs = ['develop', 'design', 'implement', 'manage', 'lead', 'create', 'maintain', 'collaborate', 'analyze']
            sentences = sent_tokenize(text)
            
            for sentence in sentences:
                for verb in action_verbs:
                    if verb in sentence.lower() and len(sentence) > 20:
                        responsibilities.append(sentence.strip())
                        break
        
        return list(set(responsibilities))[:10]  # Limit to top 10
    
    def _extract_qualifications(self, text: str) -> List[str]:
        """Extract qualifications and requirements"""
        qualifications = []
        
        # Look for qualification sections
        qualification_sections = [
            r'qualifications?:?\s*([^\n]*(?:\n[^\n]*)*?)(?=\n\s*(?:responsibilities?|duties?|benefits?|salary)|$)',
            r'requirements?:?\s*([^\n]*(?:\n[^\n]*)*?)(?=\n\s*(?:responsibilities?|duties?|benefits?|salary)|$)',
            r'must\s+have:?\s*([^\n]*(?:\n[^\n]*)*?)(?=\n\s*(?:responsibilities?|duties?|benefits?|salary)|$)'
        ]
        
        for pattern in qualification_sections:
            matches = re.findall(pattern, text, re.IGNORECASE | re.DOTALL)
            for match in matches:
                items = re.split(r'[•\*\-]|\n', match)
                qualifications.extend([item.strip() for item in items if item.strip() and len(item.strip()) > 5])
        
        return list(set(qualifications))[:10]  # Limit to top 10
    
    def _extract_salary_info(self, text: str) -> Dict:
        """Extract salary and compensation information"""
        salary_info = {
            'salary_mentioned': False,
            'salary_range': None,
            'currency': 'USD',
            'details': []
        }
        
        for pattern in self.salary_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                salary_info['salary_mentioned'] = True
                salary_info['details'].extend(matches)
                
                # Try to extract range
                if isinstance(matches[0], tuple) and len(matches[0]) >= 2:
                    try:
                        min_sal = int(re.sub(r'[^0-9]', '', str(matches[0][0])))
                        max_sal = int(re.sub(r'[^0-9]', '', str(matches[0][1])))
                        salary_info['salary_range'] = {'min': min_sal, 'max': max_sal}
                    except ValueError:
                        pass
        
        return salary_info
    
    def _extract_benefits(self, text: str) -> List[str]:
        """Extract company benefits"""
        benefits = []
        
        benefit_keywords = [
            'health insurance', 'dental', 'vision', 'retirement', '401k', 'vacation', 'pto',
            'remote work', 'flexible hours', 'gym membership', 'training', 'conference',
            'stock options', 'bonus', 'commission'
        ]
        
        for keyword in benefit_keywords:
            if keyword in text.lower():
                benefits.append(keyword)
        
        # Look for benefits section
        benefit_patterns = [
            r'benefits?:?\s*([^\n]*(?:\n[^\n]*)*?)(?=\n\s*(?:qualifications?|requirements?|responsibilities?)|$)',
            r'perks?:?\s*([^\n]*(?:\n[^\n]*)*?)(?=\n\s*(?:qualifications?|requirements?|responsibilities?)|$)'
        ]
        
        for pattern in benefit_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.DOTALL)
            for match in matches:
                items = re.split(r'[•\*\-]|\n', match)
                benefits.extend([item.strip() for item in items if item.strip() and len(item.strip()) > 3])
        
        return list(set(benefits))
    
    def _extract_location(self, text: str) -> Dict:
        """Extract location information"""
        location_info = {
            'remote_allowed': False,
            'locations': [],
            'details': []
        }
        
        # Check for remote work
        remote_patterns = [r'\b(remote|work\s+from\s+home|wfh|distributed|anywhere)\b']
        for pattern in remote_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                location_info['remote_allowed'] = True
                break
        
        # Extract city/state patterns
        location_patterns = [
            r'\b([A-Z][a-z]+,\s*[A-Z]{2})\b',  # City, State
            r'\b([A-Z][a-z]+\s+[A-Z][a-z]+,\s*[A-Z]{2})\b',  # City Name, State
            r'\b(New York|Los Angeles|Chicago|Houston|Phoenix|Philadelphia|San Antonio|San Diego|Dallas|San Jose|Austin|Jacksonville|Fort Worth|Columbus|Charlotte|San Francisco|Indianapolis|Seattle|Denver|Washington|Boston|Nashville|Baltimore|Oklahoma City|Louisville|Portland|Las Vegas|Milwaukee|Albuquerque|Tucson|Fresno|Sacramento|Kansas City|Mesa|Atlanta|Colorado Springs|Raleigh|Omaha|Miami|Oakland|Minneapolis|Tulsa|Cleveland|Wichita|Arlington)\b'
        ]
        
        for pattern in location_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            location_info['locations'].extend(matches)
        
        return location_info
    
    def _extract_employment_type(self, text: str) -> Dict:
        """Extract employment type information"""
        employment_info = {
            'type': 'not_specified',
            'details': []
        }
        
        type_patterns = {
            'full_time': [r'\b(full\s*time|full-time|permanent)\b'],
            'part_time': [r'\b(part\s*time|part-time)\b'],
            'contract': [r'\b(contract|contractor|freelance|consultant)\b'],
            'internship': [r'\b(intern|internship|co-op)\b'],
            'temporary': [r'\b(temporary|temp|seasonal)\b']
        }
        
        for emp_type, patterns in type_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    employment_info['type'] = emp_type
                    matches = re.findall(pattern, text, re.IGNORECASE)
                    employment_info['details'].extend(matches)
                    break
            if employment_info['type'] != 'not_specified':
                break
        
        return employment_info
    
    def _extract_key_phrases(self, text: str) -> List[str]:
        """Extract key phrases using TF-IDF"""
        try:
            # Tokenize and clean
            words = word_tokenize(text)
            words = [self.lemmatizer.lemmatize(word.lower()) for word in words 
                    if word.isalpha() and word.lower() not in self.stop_words]
            
            # Create phrases (bigrams and trigrams)
            phrases = []
            for i in range(len(words) - 1):
                phrases.append(f"{words[i]} {words[i+1]}")
            for i in range(len(words) - 2):
                phrases.append(f"{words[i]} {words[i+1]} {words[i+2]}")
            
            # Use TF-IDF to find important phrases
            if phrases:
                tfidf_matrix = self.tfidf_vectorizer.fit_transform([' '.join(phrases)])
                feature_names = self.tfidf_vectorizer.get_feature_names_out()
                tfidf_scores = tfidf_matrix.toarray()[0]
                
                # Get top phrases
                top_indices = tfidf_scores.argsort()[-10:][::-1]
                key_phrases = [feature_names[i] for i in top_indices if tfidf_scores[i] > 0]
                
                return key_phrases
        except Exception as e:
            logger.error(f"Error extracting key phrases: {e}")
        
        return []
    
    def _analyze_sentiment(self, text: str) -> Dict:
        """Analyze sentiment of job description"""
        try:
            blob = TextBlob(text)
            sentiment = blob.sentiment
            
            # Categorize sentiment
            if sentiment.polarity > 0.1:
                sentiment_label = 'positive'
            elif sentiment.polarity < -0.1:
                sentiment_label = 'negative'
            else:
                sentiment_label = 'neutral'
            
            return {
                'polarity': round(sentiment.polarity, 3),
                'subjectivity': round(sentiment.subjectivity, 3),
                'label': sentiment_label
            }
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            return {'polarity': 0, 'subjectivity': 0, 'label': 'neutral'}
    
    def _calculate_complexity_score(self, text: str) -> float:
        """Calculate job complexity score based on various factors"""
        try:
            # Factors that contribute to complexity
            complexity_score = 0
            
            # Text length (longer descriptions might be more complex)
            word_count = len(text.split())
            length_score = min(word_count / 1000, 1.0) * 0.2
            complexity_score += length_score
            
            # Number of technical skills mentioned
            total_skills = sum(len(skills) for skills in self._extract_skills(text).values())
            skill_score = min(total_skills / 20, 1.0) * 0.3
            complexity_score += skill_score
            
            # Experience level requirement
            exp_level = self._extract_experience_level(text)['level']
            exp_scores = {
                'entry_level': 0.2,
                'mid_level': 0.5,
                'senior_level': 0.8,
                'executive': 1.0,
                'not_specified': 0.3
            }
            complexity_score += exp_scores.get(exp_level, 0.3) * 0.3
            
            # Education requirements
            education = self._extract_education_requirements(text)
            if education['degree_required']:
                complexity_score += 0.2
            
            return min(complexity_score, 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating complexity score: {e}")
            return 0.5
    
    def _generate_summary(self, parsed_data: Dict) -> Dict:
        """Generate a summary of the parsed job description"""
        summary = {
            'total_skills_found': sum(len(skills) for skills in parsed_data.get('skills', {}).values()),
            'experience_level': parsed_data.get('experience_level', {}).get('level', 'not_specified'),
            'degree_required': parsed_data.get('education_requirements', {}).get('degree_required', False),
            'remote_allowed': parsed_data.get('location_info', {}).get('remote_allowed', False),
            'employment_type': parsed_data.get('employment_type', {}).get('type', 'not_specified'),
            'complexity_score': parsed_data.get('complexity_score', 0),
            'sentiment': parsed_data.get('sentiment_analysis', {}).get('label', 'neutral')
        }
        
        # Top skill categories
        skills = parsed_data.get('skills', {})
        top_categories = sorted(skills.items(), key=lambda x: len(x[1]), reverse=True)[:3]
        summary['top_skill_categories'] = [cat for cat, skills_list in top_categories if skills_list]
        
        return summary
    
    def match_candidate_to_jd(self, candidate_competencies: List[Dict], parsed_jd: Dict) -> Dict:
        """Match candidate competencies to job description requirements"""
        try:
            # Extract required skills from JD
            jd_skills = parsed_jd.get('skills', {})
            all_jd_skills = []
            for category, skills in jd_skills.items():
                all_jd_skills.extend([skill.lower() for skill in skills])
            
            # Get candidate skills
            candidate_skills = {comp.get('competency_name', '').lower(): comp.get('score', 0) 
                              for comp in candidate_competencies}
            
            # Calculate matches
            matched_skills = []
            missing_skills = []
            skill_scores = []
            
            for jd_skill in all_jd_skills:
                if jd_skill in candidate_skills:
                    score = candidate_skills[jd_skill]
                    matched_skills.append({
                        'skill': jd_skill,
                        'candidate_score': score,
                        'match_quality': 'excellent' if score >= 80 else 'good' if score >= 60 else 'fair'
                    })
                    skill_scores.append(score)
                else:
                    missing_skills.append(jd_skill)
            
            # Calculate overall match score
            if all_jd_skills:
                skill_match_rate = len(matched_skills) / len(all_jd_skills)
                avg_skill_score = np.mean(skill_scores) if skill_scores else 0
                overall_score = (skill_match_rate * 0.6 + (avg_skill_score / 100) * 0.4) * 100
            else:
                overall_score = 0
            
            # Experience level match
            jd_exp_level = parsed_jd.get('experience_level', {}).get('level', 'not_specified')
            exp_match = self._calculate_experience_match(candidate_competencies, jd_exp_level)
            
            return {
                'overall_match_score': round(overall_score, 2),
                'skill_match_rate': round(skill_match_rate * 100, 2),
                'average_skill_score': round(avg_skill_score, 2),
                'matched_skills': matched_skills,
                'missing_skills': missing_skills,
                'experience_match': exp_match,
                'recommendations': self._generate_match_recommendations(matched_skills, missing_skills, overall_score)
            }
            
        except Exception as e:
            logger.error(f"Error matching candidate to JD: {e}")
            return {'error': str(e)}
    
    def _calculate_experience_match(self, candidate_competencies: List[Dict], jd_exp_level: str) -> Dict:
        """Calculate experience level match"""
        # Estimate candidate experience based on competency scores
        if not candidate_competencies:
            return {'match': 'unknown', 'score': 0}
        
        avg_competency = np.mean([comp.get('score', 0) for comp in candidate_competencies])
        
        # Map competency scores to experience levels
        if avg_competency >= 85:
            candidate_level = 'senior_level'
        elif avg_competency >= 70:
            candidate_level = 'mid_level'
        elif avg_competency >= 50:
            candidate_level = 'entry_level'
        else:
            candidate_level = 'beginner'
        
        # Calculate match score
        level_hierarchy = ['beginner', 'entry_level', 'mid_level', 'senior_level', 'executive']
        
        try:
            candidate_idx = level_hierarchy.index(candidate_level)
            jd_idx = level_hierarchy.index(jd_exp_level) if jd_exp_level in level_hierarchy else 2
            
            if candidate_idx == jd_idx:
                match_score = 100
                match_quality = 'perfect'
            elif abs(candidate_idx - jd_idx) == 1:
                match_score = 75
                match_quality = 'good'
            elif abs(candidate_idx - jd_idx) == 2:
                match_score = 50
                match_quality = 'fair'
            else:
                match_score = 25
                match_quality = 'poor'
        except ValueError:
            match_score = 50
            match_quality = 'unknown'
        
        return {
            'candidate_level': candidate_level,
            'required_level': jd_exp_level,
            'match_quality': match_quality,
            'score': match_score
        }
    
    def _generate_match_recommendations(self, matched_skills: List[Dict], missing_skills: List[str], overall_score: float) -> List[str]:
        """Generate recommendations based on candidate-JD match"""
        recommendations = []
        
        if overall_score >= 80:
            recommendations.append("Excellent match! Candidate meets most requirements.")
        elif overall_score >= 60:
            recommendations.append("Good match with some skill gaps to address.")
        elif overall_score >= 40:
            recommendations.append("Moderate match. Significant training may be required.")
        else:
            recommendations.append("Poor match. Consider other candidates or extensive training.")
        
        # Skill-specific recommendations
        if missing_skills:
            if len(missing_skills) <= 3:
                recommendations.append(f"Focus on developing: {', '.join(missing_skills[:3])}")
            else:
                recommendations.append(f"Multiple skill gaps identified. Prioritize: {', '.join(missing_skills[:3])}")
        
        # Strength-based recommendations
        excellent_skills = [skill['skill'] for skill in matched_skills if skill['match_quality'] == 'excellent']
        if excellent_skills:
            recommendations.append(f"Leverage strengths in: {', '.join(excellent_skills[:3])}")
        
        return recommendations
    
    async def batch_parse_jds(self, job_descriptions: List[Dict]) -> List[Dict]:
        """Parse multiple job descriptions in batch"""
        results = []
        
        for jd in job_descriptions:
            try:
                jd_id = jd.get('id')
                cache_key = f"jd_parsed:{jd_id}"
                
                # Check cache
                cached_result = await cache_manager.get(cache_key)
                if cached_result:
                    results.append(json.loads(cached_result))
                    continue
                
                # Parse JD
                parsed_result = self.parse_job_description(
                    jd.get('description_text', ''),
                    jd.get('title', '')
                )
                parsed_result['jd_id'] = jd_id
                
                results.append(parsed_result)
                
                # Cache result
                await cache_manager.set(
                    cache_key,
                    json.dumps(parsed_result),
                    ttl=settings.PREDICTION_CACHE_TTL
                )
                
            except Exception as e:
                logger.error(f"Error parsing JD {jd.get('id')}: {e}")
                results.append({
                    'jd_id': jd.get('id'),
                    'error': str(e)
                })
        
        return results

# Global instance
jd_parser = JDParser()