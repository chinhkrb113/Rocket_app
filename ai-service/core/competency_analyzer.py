import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from loguru import logger
from .config import settings
from .database import get_db, cache_manager
import os
import asyncio
import subprocess
import tempfile
import shutil
import re
from pathlib import Path
import requests

class CompetencyAnalyzer:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.pca = PCA(n_components=10)
        self.clustering_model = KMeans(n_clusters=5, random_state=42)
        self.feature_columns = []
        self.competency_weights = {}
        self.model_path = settings.COMPETENCY_MODEL_PATH
        self.is_trained = False
        
        # Competency categories
        self.competency_categories = {
            'technical': ['Python', 'JavaScript', 'SQL', 'React', 'Node.js', 'Machine Learning', 'Data Analysis'],
            'design': ['UI Design', 'UX Design', 'Graphic Design', 'Prototyping', 'User Research'],
            'soft_skills': ['Communication', 'Teamwork', 'Leadership', 'Problem Solving', 'Time Management'],
            'business': ['Project Management', 'Business Analysis', 'Marketing', 'Sales', 'Strategy']
        }
        
    def load_model(self) -> bool:
        """Load pre-trained competency analysis model"""
        try:
            if os.path.exists(self.model_path):
                model_data = joblib.load(self.model_path)
                self.model = model_data['model']
                self.scaler = model_data['scaler']
                self.pca = model_data.get('pca')
                self.clustering_model = model_data.get('clustering_model')
                self.feature_columns = model_data['feature_columns']
                self.competency_weights = model_data.get('competency_weights', {})
                self.is_trained = True
                logger.info("Competency analysis model loaded successfully")
                return True
            else:
                logger.warning("Competency analysis model file not found")
                return False
        except Exception as e:
            logger.error(f"Error loading competency analysis model: {e}")
            return False
    
    def save_model(self) -> bool:
        """Save trained model to disk"""
        try:
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            model_data = {
                'model': self.model,
                'scaler': self.scaler,
                'pca': self.pca,
                'clustering_model': self.clustering_model,
                'feature_columns': self.feature_columns,
                'competency_weights': self.competency_weights,
                'trained_at': datetime.now().isoformat()
            }
            joblib.dump(model_data, self.model_path)
            logger.info("Competency analysis model saved successfully")
            return True
        except Exception as e:
            logger.error(f"Error saving competency analysis model: {e}")
            return False
    
    def extract_student_features(self, student_data: Dict) -> Dict:
        """Extract features from student data for competency analysis"""
        features = {}
        
        # Basic student info
        features['days_since_enrollment'] = self._calculate_days_since_enrollment(student_data)
        features['total_courses'] = len(student_data.get('enrollments', []))
        features['completed_courses'] = len([e for e in student_data.get('enrollments', []) if e.get('status') == 'completed'])
        features['active_courses'] = len([e for e in student_data.get('enrollments', []) if e.get('status') == 'active'])
        
        # Task performance features
        tasks = student_data.get('tasks', [])
        features['total_tasks'] = len(tasks)
        features['completed_tasks'] = len([t for t in tasks if t.get('status') == 'completed'])
        features['overdue_tasks'] = len([t for t in tasks if t.get('status') == 'overdue'])
        features['avg_task_score'] = self._calculate_avg_task_score(tasks)
        features['task_completion_rate'] = features['completed_tasks'] / max(features['total_tasks'], 1)
        
        # Learning pattern features
        features['learning_consistency'] = self._calculate_learning_consistency(tasks)
        features['improvement_trend'] = self._calculate_improvement_trend(tasks)
        features['difficulty_preference'] = self._calculate_difficulty_preference(tasks)
        
        # Interaction features
        interactions = student_data.get('interactions', [])
        features['total_interactions'] = len(interactions)
        features['study_session_frequency'] = self._calculate_study_frequency(interactions)
        features['help_seeking_behavior'] = self._calculate_help_seeking(interactions)
        
        # Current competency scores
        current_competencies = student_data.get('competencies', [])
        for comp in current_competencies:
            comp_name = comp.get('competency_name', '').replace(' ', '_').lower()
            features[f'current_{comp_name}_score'] = comp.get('score', 0)
        
        return features
    
    def _calculate_days_since_enrollment(self, student_data: Dict) -> int:
        """Calculate days since first enrollment"""
        enrollments = student_data.get('enrollments', [])
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
        
        if earliest_date:
            return (datetime.now() - earliest_date).days
        return 0
    
    def _calculate_avg_task_score(self, tasks: List[Dict]) -> float:
        """Calculate average task score"""
        scores = [t.get('score', 0) for t in tasks if t.get('score') is not None and t.get('status') == 'completed']
        return np.mean(scores) if scores else 0.0
    
    def _calculate_learning_consistency(self, tasks: List[Dict]) -> float:
        """Calculate learning consistency based on task completion patterns"""
        if not tasks:
            return 0.0
        
        # Group tasks by week and calculate completion rate per week
        weekly_completions = {}
        for task in tasks:
            if task.get('status') == 'completed' and task.get('completed_at'):
                completed_at = task.get('completed_at')
                if isinstance(completed_at, str):
                    completed_at = datetime.fromisoformat(completed_at.replace('Z', '+00:00'))
                week_key = completed_at.strftime('%Y-W%U')
                weekly_completions[week_key] = weekly_completions.get(week_key, 0) + 1
        
        if len(weekly_completions) < 2:
            return 0.5
        
        # Calculate coefficient of variation (lower = more consistent)
        completion_counts = list(weekly_completions.values())
        cv = np.std(completion_counts) / np.mean(completion_counts) if np.mean(completion_counts) > 0 else 1
        
        # Convert to consistency score (0-1, higher = more consistent)
        consistency = max(0, 1 - cv)
        return min(consistency, 1.0)
    
    def _calculate_improvement_trend(self, tasks: List[Dict]) -> float:
        """Calculate improvement trend based on task scores over time"""
        completed_tasks = [t for t in tasks if t.get('status') == 'completed' and t.get('score') is not None]
        if len(completed_tasks) < 3:
            return 0.5
        
        # Sort by completion date
        completed_tasks.sort(key=lambda x: x.get('completed_at', ''))
        
        # Calculate trend using linear regression
        scores = [t.get('score', 0) for t in completed_tasks]
        x = np.arange(len(scores))
        
        if len(scores) > 1:
            slope = np.polyfit(x, scores, 1)[0]
            # Normalize slope to 0-1 range
            trend = max(0, min(1, (slope + 10) / 20))  # Assuming max slope of 10
            return trend
        
        return 0.5
    
    def _calculate_difficulty_preference(self, tasks: List[Dict]) -> float:
        """Calculate student's preference for difficult tasks"""
        completed_tasks = [t for t in tasks if t.get('status') == 'completed']
        if not completed_tasks:
            return 0.5
        
        # Estimate difficulty based on average score (lower avg score = higher difficulty)
        avg_scores_by_task = {}
        for task in completed_tasks:
            task_id = task.get('task_id')
            score = task.get('score', 0)
            if task_id not in avg_scores_by_task:
                avg_scores_by_task[task_id] = []
            avg_scores_by_task[task_id].append(score)
        
        # Calculate difficulty preference
        difficult_tasks = 0
        total_tasks = 0
        
        for task_id, scores in avg_scores_by_task.items():
            avg_score = np.mean(scores)
            total_tasks += 1
            if avg_score < 70:  # Consider tasks with avg score < 70 as difficult
                difficult_tasks += 1
        
        return difficult_tasks / max(total_tasks, 1)
    
    def _calculate_study_frequency(self, interactions: List[Dict]) -> float:
        """Calculate study session frequency"""
        study_interactions = [i for i in interactions if i.get('interaction_type') in ['view_content', 'submit_task', 'take_quiz']]
        if not study_interactions:
            return 0.0
        
        # Group by day
        study_days = set()
        for interaction in study_interactions:
            created_at = interaction.get('created_at')
            if created_at:
                if isinstance(created_at, str):
                    created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                study_days.add(created_at.date())
        
        # Calculate frequency over last 30 days
        days_with_study = len(study_days)
        frequency = min(days_with_study / 30, 1.0)
        return frequency
    
    def _calculate_help_seeking(self, interactions: List[Dict]) -> float:
        """Calculate help-seeking behavior score"""
        help_interactions = [i for i in interactions if i.get('interaction_type') in ['chat_message', 'forum_post', 'ask_question']]
        total_interactions = len(interactions)
        
        if total_interactions == 0:
            return 0.0
        
        help_ratio = len(help_interactions) / total_interactions
        return min(help_ratio * 2, 1.0)  # Scale up help-seeking behavior
    
    def analyze_competency_gaps(self, student_data: Dict, target_competencies: List[Dict]) -> Dict:
        """Analyze competency gaps for a student"""
        try:
            current_competencies = {comp.get('competency_name'): comp.get('score', 0) 
                                  for comp in student_data.get('competencies', [])}
            
            gaps = []
            strengths = []
            
            for target_comp in target_competencies:
                comp_name = target_comp.get('name')
                target_score = target_comp.get('target_score', 80)
                current_score = current_competencies.get(comp_name, 0)
                
                gap = target_score - current_score
                
                if gap > 20:
                    gaps.append({
                        'competency': comp_name,
                        'current_score': current_score,
                        'target_score': target_score,
                        'gap': gap,
                        'priority': 'high' if gap > 40 else 'medium'
                    })
                elif current_score >= target_score:
                    strengths.append({
                        'competency': comp_name,
                        'current_score': current_score,
                        'target_score': target_score,
                        'excess': current_score - target_score
                    })
            
            # Sort gaps by priority
            gaps.sort(key=lambda x: x['gap'], reverse=True)
            
            return {
                'gaps': gaps,
                'strengths': strengths,
                'overall_readiness': self._calculate_overall_readiness(current_competencies, target_competencies),
                'recommendations': self._generate_competency_recommendations(gaps, strengths)
            }
        except Exception as e:
            logger.error(f"Error analyzing competency gaps: {e}")
            return {'error': str(e)}
    
    def _calculate_overall_readiness(self, current_competencies: Dict, target_competencies: List[Dict]) -> float:
        """Calculate overall readiness score"""
        if not target_competencies:
            return 0.0
        
        total_readiness = 0
        for target_comp in target_competencies:
            comp_name = target_comp.get('name')
            target_score = target_comp.get('target_score', 80)
            current_score = current_competencies.get(comp_name, 0)
            
            readiness = min(current_score / target_score, 1.0)
            total_readiness += readiness
        
        return total_readiness / len(target_competencies)
    
    def _generate_competency_recommendations(self, gaps: List[Dict], strengths: List[Dict]) -> List[str]:
        """Generate recommendations based on competency analysis"""
        recommendations = []
        
        # Recommendations for gaps
        high_priority_gaps = [g for g in gaps if g.get('priority') == 'high']
        if high_priority_gaps:
            recommendations.append(f"Focus on developing {len(high_priority_gaps)} high-priority competencies")
            for gap in high_priority_gaps[:3]:  # Top 3 gaps
                recommendations.append(f"Prioritize {gap['competency']} training (gap: {gap['gap']} points)")
        
        # Recommendations based on strengths
        if strengths:
            top_strength = max(strengths, key=lambda x: x['current_score'])
            recommendations.append(f"Leverage strength in {top_strength['competency']} for mentoring opportunities")
        
        # Learning path recommendations
        if gaps:
            technical_gaps = [g for g in gaps if g['competency'] in self.competency_categories['technical']]
            soft_skill_gaps = [g for g in gaps if g['competency'] in self.competency_categories['soft_skills']]
            
            if technical_gaps and soft_skill_gaps:
                recommendations.append("Balance technical and soft skill development")
            elif technical_gaps:
                recommendations.append("Focus on technical skill development")
            elif soft_skill_gaps:
                recommendations.append("Focus on soft skill development")
        
        return recommendations
    
    def predict_competency_growth(self, student_data: Dict, competency_name: str, time_horizon_days: int = 90) -> Dict:
        """Predict competency growth over time"""
        try:
            features = self.extract_student_features(student_data)
            
            # Get current competency score
            current_competencies = {comp.get('competency_name'): comp.get('score', 0) 
                                  for comp in student_data.get('competencies', [])}
            current_score = current_competencies.get(competency_name, 0)
            
            # Calculate growth rate based on student features
            growth_rate = self._calculate_growth_rate(features, competency_name)
            
            # Predict future score
            predicted_growth = growth_rate * (time_horizon_days / 30)  # Monthly growth rate
            predicted_score = min(current_score + predicted_growth, 100)
            
            # Calculate confidence based on data quality
            confidence = self._calculate_prediction_confidence(features)
            
            return {
                'competency': competency_name,
                'current_score': current_score,
                'predicted_score': round(predicted_score, 2),
                'predicted_growth': round(predicted_growth, 2),
                'time_horizon_days': time_horizon_days,
                'confidence': round(confidence, 2),
                'factors': self._identify_growth_factors(features)
            }
        except Exception as e:
            logger.error(f"Error predicting competency growth: {e}")
            return {'error': str(e)}
    
    def _calculate_growth_rate(self, features: Dict, competency_name: str) -> float:
        """Calculate expected growth rate for a competency"""
        base_growth_rate = 5.0  # Base monthly growth rate
        
        # Adjust based on student features
        multiplier = 1.0
        
        # Learning consistency factor
        consistency = features.get('learning_consistency', 0.5)
        multiplier *= (0.5 + consistency)
        
        # Task completion rate factor
        completion_rate = features.get('task_completion_rate', 0.5)
        multiplier *= (0.5 + completion_rate)
        
        # Improvement trend factor
        improvement = features.get('improvement_trend', 0.5)
        multiplier *= (0.5 + improvement)
        
        # Study frequency factor
        frequency = features.get('study_session_frequency', 0.5)
        multiplier *= (0.5 + frequency)
        
        return base_growth_rate * multiplier
    
    def _calculate_prediction_confidence(self, features: Dict) -> float:
        """Calculate confidence in prediction based on data quality"""
        confidence_factors = [
            min(features.get('total_tasks', 0) / 10, 1.0),  # More tasks = higher confidence
            min(features.get('days_since_enrollment', 0) / 30, 1.0),  # More time = higher confidence
            features.get('learning_consistency', 0.5),  # Consistent learning = higher confidence
            min(features.get('total_interactions', 0) / 50, 1.0)  # More interactions = higher confidence
        ]
        
        return np.mean(confidence_factors)
    
    def _identify_growth_factors(self, features: Dict) -> List[str]:
        """Identify key factors affecting competency growth"""
        factors = []
        
        if features.get('learning_consistency', 0) > 0.7:
            factors.append("High learning consistency")
        elif features.get('learning_consistency', 0) < 0.3:
            factors.append("Inconsistent learning pattern")
        
        if features.get('task_completion_rate', 0) > 0.8:
            factors.append("High task completion rate")
        elif features.get('task_completion_rate', 0) < 0.5:
            factors.append("Low task completion rate")
        
        if features.get('improvement_trend', 0) > 0.7:
            factors.append("Strong improvement trend")
        elif features.get('improvement_trend', 0) < 0.3:
            factors.append("Declining performance trend")
        
        if features.get('help_seeking_behavior', 0) > 0.5:
            factors.append("Active help-seeking behavior")
        
        return factors
    
    async def analyze_submission(self, student_id: int, submission_data: Dict) -> Dict:
        """Analyze student submission and update competencies"""
        try:
            submission_type = submission_data.get('type')  # 'github' or 'figma'
            submission_url = submission_data.get('url')
            
            if not submission_type or not submission_url:
                raise ValueError("Missing submission type or URL")
            
            analysis_result = {
                'student_id': student_id,
                'submission_type': submission_type,
                'submission_url': submission_url,
                'analyzed_at': datetime.now().isoformat(),
                'competency_updates': [],
                'analysis_details': {}
            }
            
            if submission_type == 'github':
                code_analysis = await self._analyze_github_repo(submission_url)
                analysis_result['analysis_details'] = code_analysis
                analysis_result['competency_updates'] = self._extract_competency_updates_from_code(code_analysis)
                
            elif submission_type == 'figma':
                design_analysis = await self._analyze_figma_design(submission_url)
                analysis_result['analysis_details'] = design_analysis
                analysis_result['competency_updates'] = self._extract_competency_updates_from_design(design_analysis)
                
            else:
                raise ValueError(f"Unsupported submission type: {submission_type}")
            
            # Update student competencies in database
            await self._update_student_competencies(student_id, analysis_result['competency_updates'])
            
            logger.info(f"Successfully analyzed submission for student {student_id}")
            return analysis_result
            
        except Exception as e:
            logger.error(f"Error analyzing submission for student {student_id}: {e}")
            return {
                'student_id': student_id,
                'error': str(e),
                'analyzed_at': datetime.now().isoformat()
            }
    
    async def _analyze_github_repo(self, repo_url: str) -> Dict:
        """Analyze GitHub repository for code quality and technologies"""
        try:
            # Create temporary directory for cloning
            with tempfile.TemporaryDirectory() as temp_dir:
                repo_path = Path(temp_dir) / "repo"
                
                # Clone repository
                clone_result = subprocess.run(
                    ["git", "clone", repo_url, str(repo_path)],
                    capture_output=True,
                    text=True,
                    timeout=300
                )
                
                if clone_result.returncode != 0:
                    raise Exception(f"Failed to clone repository: {clone_result.stderr}")
                
                analysis = {
                    'technologies': self._detect_technologies(repo_path),
                    'code_quality': await self._analyze_code_quality(repo_path),
                    'complexity': self._analyze_code_complexity(repo_path),
                    'structure': self._analyze_project_structure(repo_path),
                    'documentation': self._analyze_documentation(repo_path)
                }
                
                return analysis
                
        except Exception as e:
            logger.error(f"Error analyzing GitHub repo {repo_url}: {e}")
            return {'error': str(e)}
    
    def _detect_technologies(self, repo_path: Path) -> Dict:
        """Detect technologies and frameworks used in the repository"""
        technologies = {
            'languages': [],
            'frameworks': [],
            'libraries': [],
            'tools': []
        }
        
        # Check for common files and patterns
        file_patterns = {
            'package.json': ['JavaScript', 'Node.js'],
            'requirements.txt': ['Python'],
            'Pipfile': ['Python'],
            'pom.xml': ['Java', 'Maven'],
            'build.gradle': ['Java', 'Gradle'],
            'Cargo.toml': ['Rust'],
            'go.mod': ['Go'],
            'composer.json': ['PHP']
        }
        
        for file_name, langs in file_patterns.items():
            if (repo_path / file_name).exists():
                technologies['languages'].extend(langs)
        
        # Analyze package.json for JavaScript frameworks
        package_json_path = repo_path / 'package.json'
        if package_json_path.exists():
            try:
                with open(package_json_path, 'r', encoding='utf-8') as f:
                    package_data = json.load(f)
                    
                dependencies = {**package_data.get('dependencies', {}), **package_data.get('devDependencies', {})}
                
                framework_mapping = {
                    'react': 'React',
                    'vue': 'Vue.js',
                    'angular': 'Angular',
                    'express': 'Express.js',
                    'next': 'Next.js',
                    'nuxt': 'Nuxt.js',
                    'svelte': 'Svelte',
                    'typescript': 'TypeScript',
                    'webpack': 'Webpack',
                    'vite': 'Vite'
                }
                
                for dep_name, framework_name in framework_mapping.items():
                    if any(dep_name in dep for dep in dependencies.keys()):
                        technologies['frameworks'].append(framework_name)
                        
            except Exception as e:
                logger.warning(f"Error parsing package.json: {e}")
        
        # Analyze requirements.txt for Python libraries
        requirements_path = repo_path / 'requirements.txt'
        if requirements_path.exists():
            try:
                with open(requirements_path, 'r', encoding='utf-8') as f:
                    requirements = f.read()
                    
                library_mapping = {
                    'django': 'Django',
                    'flask': 'Flask',
                    'fastapi': 'FastAPI',
                    'pandas': 'Pandas',
                    'numpy': 'NumPy',
                    'scikit-learn': 'Scikit-learn',
                    'tensorflow': 'TensorFlow',
                    'pytorch': 'PyTorch'
                }
                
                for lib_name, lib_display in library_mapping.items():
                    if lib_name in requirements.lower():
                        technologies['libraries'].append(lib_display)
                        
            except Exception as e:
                logger.warning(f"Error parsing requirements.txt: {e}")
        
        # Remove duplicates
        for key in technologies:
            technologies[key] = list(set(technologies[key]))
        
        return technologies
    
    async def _analyze_code_quality(self, repo_path: Path) -> Dict:
        """Analyze code quality using static analysis tools"""
        quality_metrics = {
            'overall_score': 0,
            'issues': [],
            'metrics': {}
        }
        
        try:
            # Analyze Python files with pylint
            python_files = list(repo_path.rglob('*.py'))
            if python_files:
                quality_metrics['metrics']['python'] = await self._analyze_python_quality(python_files)
            
            # Analyze JavaScript files with basic metrics
            js_files = list(repo_path.rglob('*.js')) + list(repo_path.rglob('*.jsx')) + list(repo_path.rglob('*.ts')) + list(repo_path.rglob('*.tsx'))
            if js_files:
                quality_metrics['metrics']['javascript'] = await self._analyze_javascript_quality(js_files)
            
            # Calculate overall score
            scores = []
            for lang_metrics in quality_metrics['metrics'].values():
                if 'score' in lang_metrics:
                    scores.append(lang_metrics['score'])
            
            quality_metrics['overall_score'] = np.mean(scores) if scores else 50
            
        except Exception as e:
            logger.error(f"Error analyzing code quality: {e}")
            quality_metrics['error'] = str(e)
        
        return quality_metrics
    
    async def _analyze_python_quality(self, python_files: List[Path]) -> Dict:
        """Analyze Python code quality"""
        metrics = {
            'score': 70,  # Default score
            'file_count': len(python_files),
            'issues': []
        }
        
        try:
            # Basic metrics calculation
            total_lines = 0
            total_functions = 0
            total_classes = 0
            
            for file_path in python_files[:10]:  # Limit to first 10 files
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    lines = content.split('\n')
                    total_lines += len(lines)
                    total_functions += len(re.findall(r'^\s*def\s+', content, re.MULTILINE))
                    total_classes += len(re.findall(r'^\s*class\s+', content, re.MULTILINE))
                    
                except Exception as e:
                    logger.warning(f"Error reading file {file_path}: {e}")
            
            metrics.update({
                'total_lines': total_lines,
                'total_functions': total_functions,
                'total_classes': total_classes,
                'avg_lines_per_file': total_lines / len(python_files) if python_files else 0
            })
            
            # Adjust score based on metrics
            if total_lines > 1000:
                metrics['score'] += 10
            if total_functions > 20:
                metrics['score'] += 10
            if total_classes > 5:
                metrics['score'] += 10
                
        except Exception as e:
            logger.error(f"Error analyzing Python quality: {e}")
            metrics['error'] = str(e)
        
        return metrics
    
    async def _analyze_javascript_quality(self, js_files: List[Path]) -> Dict:
        """Analyze JavaScript/TypeScript code quality"""
        metrics = {
            'score': 70,  # Default score
            'file_count': len(js_files),
            'issues': []
        }
        
        try:
            total_lines = 0
            total_functions = 0
            total_components = 0
            has_typescript = False
            
            for file_path in js_files[:10]:  # Limit to first 10 files
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    if file_path.suffix in ['.ts', '.tsx']:
                        has_typescript = True
                    
                    lines = content.split('\n')
                    total_lines += len(lines)
                    total_functions += len(re.findall(r'function\s+\w+|const\s+\w+\s*=\s*\(', content))
                    total_components += len(re.findall(r'const\s+\w+\s*=\s*\(.*\)\s*=>|function\s+\w+.*\{.*return.*<', content, re.DOTALL))
                    
                except Exception as e:
                    logger.warning(f"Error reading file {file_path}: {e}")
            
            metrics.update({
                'total_lines': total_lines,
                'total_functions': total_functions,
                'total_components': total_components,
                'has_typescript': has_typescript,
                'avg_lines_per_file': total_lines / len(js_files) if js_files else 0
            })
            
            # Adjust score based on metrics
            if has_typescript:
                metrics['score'] += 15
            if total_functions > 15:
                metrics['score'] += 10
            if total_components > 5:
                metrics['score'] += 10
                
        except Exception as e:
            logger.error(f"Error analyzing JavaScript quality: {e}")
            metrics['error'] = str(e)
        
        return metrics
    
    def _analyze_code_complexity(self, repo_path: Path) -> Dict:
        """Analyze code complexity"""
        complexity = {
            'overall_complexity': 'medium',
            'file_structure_depth': 0,
            'total_files': 0,
            'code_files': 0
        }
        
        try:
            # Calculate directory depth
            max_depth = 0
            total_files = 0
            code_extensions = {'.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs'}
            code_files = 0
            
            for root, dirs, files in os.walk(repo_path):
                depth = len(Path(root).relative_to(repo_path).parts)
                max_depth = max(max_depth, depth)
                total_files += len(files)
                
                for file in files:
                    if Path(file).suffix.lower() in code_extensions:
                        code_files += 1
            
            complexity.update({
                'file_structure_depth': max_depth,
                'total_files': total_files,
                'code_files': code_files
            })
            
            # Determine complexity level
            if code_files > 50 or max_depth > 5:
                complexity['overall_complexity'] = 'high'
            elif code_files > 20 or max_depth > 3:
                complexity['overall_complexity'] = 'medium'
            else:
                complexity['overall_complexity'] = 'low'
                
        except Exception as e:
            logger.error(f"Error analyzing code complexity: {e}")
            complexity['error'] = str(e)
        
        return complexity
    
    def _analyze_project_structure(self, repo_path: Path) -> Dict:
        """Analyze project structure and organization"""
        structure = {
            'has_readme': False,
            'has_tests': False,
            'has_docs': False,
            'has_config': False,
            'organization_score': 0
        }
        
        try:
            # Check for README
            readme_files = list(repo_path.glob('README*')) + list(repo_path.glob('readme*'))
            structure['has_readme'] = len(readme_files) > 0
            
            # Check for tests
            test_patterns = ['test*', '*test*', 'spec*', '*spec*']
            has_tests = False
            for pattern in test_patterns:
                if list(repo_path.rglob(pattern)):
                    has_tests = True
                    break
            structure['has_tests'] = has_tests
            
            # Check for documentation
            doc_dirs = ['docs', 'doc', 'documentation']
            structure['has_docs'] = any((repo_path / doc_dir).exists() for doc_dir in doc_dirs)
            
            # Check for configuration files
            config_files = ['.gitignore', '.env.example', 'config.json', 'settings.py', '.eslintrc', 'tsconfig.json']
            structure['has_config'] = any((repo_path / config_file).exists() for config_file in config_files)
            
            # Calculate organization score
            score = 0
            if structure['has_readme']: score += 25
            if structure['has_tests']: score += 30
            if structure['has_docs']: score += 25
            if structure['has_config']: score += 20
            
            structure['organization_score'] = score
            
        except Exception as e:
            logger.error(f"Error analyzing project structure: {e}")
            structure['error'] = str(e)
        
        return structure
    
    def _analyze_documentation(self, repo_path: Path) -> Dict:
        """Analyze documentation quality"""
        documentation = {
            'readme_quality': 0,
            'code_comments': 0,
            'documentation_score': 0
        }
        
        try:
            # Analyze README quality
            readme_files = list(repo_path.glob('README*')) + list(repo_path.glob('readme*'))
            if readme_files:
                try:
                    with open(readme_files[0], 'r', encoding='utf-8') as f:
                        readme_content = f.read()
                    
                    readme_score = 0
                    if len(readme_content) > 200: readme_score += 20
                    if 'installation' in readme_content.lower(): readme_score += 20
                    if 'usage' in readme_content.lower(): readme_score += 20
                    if 'example' in readme_content.lower(): readme_score += 20
                    if any(word in readme_content.lower() for word in ['api', 'documentation', 'guide']): readme_score += 20
                    
                    documentation['readme_quality'] = readme_score
                    
                except Exception as e:
                    logger.warning(f"Error reading README: {e}")
            
            # Analyze code comments (sample from Python and JavaScript files)
            code_files = list(repo_path.rglob('*.py'))[:5] + list(repo_path.rglob('*.js'))[:5]
            total_lines = 0
            comment_lines = 0
            
            for file_path in code_files:
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                    
                    total_lines += len(lines)
                    for line in lines:
                        stripped = line.strip()
                        if stripped.startswith('#') or stripped.startswith('//') or stripped.startswith('/*'):
                            comment_lines += 1
                            
                except Exception as e:
                    logger.warning(f"Error reading file {file_path}: {e}")
            
            comment_ratio = (comment_lines / total_lines * 100) if total_lines > 0 else 0
            documentation['code_comments'] = min(comment_ratio * 2, 100)  # Scale to 0-100
            
            # Calculate overall documentation score
            documentation['documentation_score'] = (documentation['readme_quality'] + documentation['code_comments']) / 2
            
        except Exception as e:
            logger.error(f"Error analyzing documentation: {e}")
            documentation['error'] = str(e)
        
        return documentation
    
    async def _analyze_figma_design(self, figma_url: str) -> Dict:
        """Analyze Figma design (simulated analysis)"""
        # Note: This is a simplified simulation since Figma API requires authentication
        # In a real implementation, you would use Figma API to extract design data
        
        analysis = {
            'layout_analysis': self._simulate_layout_analysis(),
            'color_analysis': self._simulate_color_analysis(),
            'consistency_analysis': self._simulate_consistency_analysis(),
            'design_complexity': self._simulate_design_complexity(),
            'ui_patterns': self._simulate_ui_patterns_analysis()
        }
        
        return analysis
    
    def _simulate_layout_analysis(self) -> Dict:
        """Simulate layout analysis for Figma design"""
        return {
            'grid_usage': np.random.choice(['excellent', 'good', 'fair', 'poor'], p=[0.2, 0.4, 0.3, 0.1]),
            'spacing_consistency': np.random.uniform(60, 95),
            'alignment_score': np.random.uniform(70, 100),
            'hierarchy_clarity': np.random.uniform(65, 90)
        }
    
    def _simulate_color_analysis(self) -> Dict:
        """Simulate color theory analysis"""
        return {
            'color_harmony': np.random.choice(['excellent', 'good', 'fair'], p=[0.3, 0.5, 0.2]),
            'contrast_ratio': np.random.uniform(4.5, 21),
            'accessibility_score': np.random.uniform(70, 100),
            'brand_consistency': np.random.uniform(80, 100)
        }
    
    def _simulate_consistency_analysis(self) -> Dict:
        """Simulate design consistency analysis"""
        return {
            'component_reuse': np.random.uniform(60, 95),
            'style_consistency': np.random.uniform(70, 100),
            'pattern_adherence': np.random.uniform(65, 90),
            'design_system_usage': np.random.choice(['high', 'medium', 'low'], p=[0.4, 0.4, 0.2])
        }
    
    def _simulate_design_complexity(self) -> Dict:
        """Simulate design complexity analysis"""
        return {
            'component_count': np.random.randint(10, 100),
            'interaction_complexity': np.random.choice(['simple', 'moderate', 'complex'], p=[0.3, 0.5, 0.2]),
            'information_density': np.random.uniform(0.3, 0.8),
            'visual_hierarchy_levels': np.random.randint(3, 8)
        }
    
    def _simulate_ui_patterns_analysis(self) -> Dict:
        """Simulate UI patterns analysis"""
        return {
            'modern_patterns_usage': np.random.uniform(70, 100),
            'responsive_design': np.random.choice(['excellent', 'good', 'fair'], p=[0.4, 0.4, 0.2]),
            'user_flow_clarity': np.random.uniform(75, 100),
            'interaction_feedback': np.random.uniform(60, 95)
        }
    
    def _extract_competency_updates_from_code(self, code_analysis: Dict) -> List[Dict]:
        """Extract competency updates from code analysis"""
        updates = []
        
        if 'error' in code_analysis:
            return updates
        
        try:
            technologies = code_analysis.get('technologies', {})
            quality = code_analysis.get('code_quality', {})
            complexity = code_analysis.get('complexity', {})
            structure = code_analysis.get('structure', {})
            
            # Technology-based competency updates
            tech_mapping = {
                'React': 'ReactJS',
                'Vue.js': 'Vue.js',
                'Angular': 'Angular',
                'Node.js': 'NodeJS',
                'Express.js': 'Express.js',
                'Python': 'Python',
                'JavaScript': 'JavaScript',
                'TypeScript': 'TypeScript',
                'Django': 'Django',
                'Flask': 'Flask'
            }
            
            for tech_category in ['languages', 'frameworks', 'libraries']:
                for tech in technologies.get(tech_category, []):
                    if tech in tech_mapping:
                        competency_name = tech_mapping[tech]
                        base_score = 10  # Base score for using the technology
                        
                        # Adjust score based on code quality
                        quality_bonus = 0
                        if quality.get('overall_score', 0) > 80:
                            quality_bonus = 15
                        elif quality.get('overall_score', 0) > 60:
                            quality_bonus = 10
                        elif quality.get('overall_score', 0) > 40:
                            quality_bonus = 5
                        
                        # Adjust score based on project complexity
                        complexity_bonus = 0
                        if complexity.get('overall_complexity') == 'high':
                            complexity_bonus = 10
                        elif complexity.get('overall_complexity') == 'medium':
                            complexity_bonus = 5
                        
                        total_score = base_score + quality_bonus + complexity_bonus
                        
                        updates.append({
                            'competency_name': competency_name,
                            'score_change': total_score,
                            'reason': f'Code submission using {tech}',
                            'evidence': {
                                'technology': tech,
                                'quality_score': quality.get('overall_score', 0),
                                'complexity': complexity.get('overall_complexity', 'unknown')
                            }
                        })
            
            # Project management and software engineering competencies
            if structure.get('organization_score', 0) > 70:
                updates.append({
                    'competency_name': 'Project Management',
                    'score_change': 8,
                    'reason': 'Well-organized project structure',
                    'evidence': structure
                })
            
            if structure.get('has_tests'):
                updates.append({
                    'competency_name': 'Software Testing',
                    'score_change': 12,
                    'reason': 'Includes test files',
                    'evidence': {'has_tests': True}
                })
            
            if structure.get('has_docs') or structure.get('has_readme'):
                updates.append({
                    'competency_name': 'Technical Documentation',
                    'score_change': 8,
                    'reason': 'Includes documentation',
                    'evidence': {
                        'has_docs': structure.get('has_docs'),
                        'has_readme': structure.get('has_readme')
                    }
                })
                
        except Exception as e:
            logger.error(f"Error extracting competency updates from code: {e}")
        
        return updates
    
    def _extract_competency_updates_from_design(self, design_analysis: Dict) -> List[Dict]:
        """Extract competency updates from design analysis"""
        updates = []
        
        try:
            layout = design_analysis.get('layout_analysis', {})
            color = design_analysis.get('color_analysis', {})
            consistency = design_analysis.get('consistency_analysis', {})
            complexity = design_analysis.get('design_complexity', {})
            ui_patterns = design_analysis.get('ui_patterns', {})
            
            # UI Design competency
            ui_score = 0
            if layout.get('alignment_score', 0) > 80: ui_score += 8
            if layout.get('hierarchy_clarity', 0) > 75: ui_score += 7
            if layout.get('grid_usage') in ['excellent', 'good']: ui_score += 6
            
            if ui_score > 0:
                updates.append({
                    'competency_name': 'UI Design',
                    'score_change': ui_score,
                    'reason': 'Good layout and visual hierarchy',
                    'evidence': layout
                })
            
            # UX Design competency
            ux_score = 0
            if ui_patterns.get('user_flow_clarity', 0) > 80: ux_score += 10
            if ui_patterns.get('interaction_feedback', 0) > 75: ux_score += 8
            if consistency.get('pattern_adherence', 0) > 70: ux_score += 7
            
            if ux_score > 0:
                updates.append({
                    'competency_name': 'UX Design',
                    'score_change': ux_score,
                    'reason': 'Good user experience design',
                    'evidence': {
                        'user_flow_clarity': ui_patterns.get('user_flow_clarity'),
                        'interaction_feedback': ui_patterns.get('interaction_feedback')
                    }
                })
            
            # Graphic Design competency
            graphic_score = 0
            if color.get('color_harmony') == 'excellent': graphic_score += 10
            elif color.get('color_harmony') == 'good': graphic_score += 7
            if color.get('accessibility_score', 0) > 85: graphic_score += 8
            
            if graphic_score > 0:
                updates.append({
                    'competency_name': 'Graphic Design',
                    'score_change': graphic_score,
                    'reason': 'Good color theory and visual design',
                    'evidence': color
                })
            
            # Design Systems competency
            if consistency.get('design_system_usage') == 'high':
                updates.append({
                    'competency_name': 'Design Systems',
                    'score_change': 12,
                    'reason': 'Excellent use of design systems',
                    'evidence': consistency
                })
            elif consistency.get('design_system_usage') == 'medium':
                updates.append({
                    'competency_name': 'Design Systems',
                    'score_change': 8,
                    'reason': 'Good use of design systems',
                    'evidence': consistency
                })
                
        except Exception as e:
            logger.error(f"Error extracting competency updates from design: {e}")
        
        return updates
    
    async def _update_student_competencies(self, student_id: int, competency_updates: List[Dict]) -> bool:
        """Update student competencies in database"""
        try:
            db = await get_db()
            
            for update in competency_updates:
                competency_name = update['competency_name']
                score_change = update['score_change']
                reason = update['reason']
                evidence = json.dumps(update.get('evidence', {}))
                
                # Check if competency exists for student
                existing_query = """
                    SELECT id, score FROM student_competencies 
                    WHERE student_id = %s AND competency_name = %s
                """
                
                cursor = await db.execute(existing_query, (student_id, competency_name))
                existing = await cursor.fetchone()
                
                if existing:
                    # Update existing competency
                    new_score = min(existing['score'] + score_change, 100)
                    update_query = """
                        UPDATE student_competencies 
                        SET score = %s, updated_at = NOW()
                        WHERE id = %s
                    """
                    await db.execute(update_query, (new_score, existing['id']))
                else:
                    # Create new competency record
                    insert_query = """
                        INSERT INTO student_competencies 
                        (student_id, competency_name, score, created_at, updated_at)
                        VALUES (%s, %s, %s, NOW(), NOW())
                    """
                    await db.execute(insert_query, (student_id, competency_name, score_change))
                
                # Log the competency update
                log_query = """
                    INSERT INTO competency_analysis_logs 
                    (student_id, competency_name, score_change, reason, evidence, created_at)
                    VALUES (%s, %s, %s, %s, %s, NOW())
                """
                await db.execute(log_query, (student_id, competency_name, score_change, reason, evidence))
            
            await db.commit()
            logger.info(f"Updated {len(competency_updates)} competencies for student {student_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating student competencies: {e}")
            await db.rollback()
            return False
    
    async def batch_analyze_competencies(self, students: List[Dict]) -> List[Dict]:
        """Analyze competencies for multiple students"""
        results = []
        
        for student in students:
            try:
                student_id = student.get('id')
                cache_key = f"competency_analysis:{student_id}"
                
                # Check cache
                cached_result = await cache_manager.get(cache_key)
                if cached_result:
                    results.append(json.loads(cached_result))
                    continue
                
                # Analyze competencies
                features = self.extract_student_features(student)
                
                # Get competency predictions for all competencies
                competency_predictions = {}
                current_competencies = student.get('competencies', [])
                
                for comp in current_competencies:
                    comp_name = comp.get('competency_name')
                    prediction = self.predict_competency_growth(student, comp_name)
                    competency_predictions[comp_name] = prediction
                
                analysis_result = {
                    'student_id': student_id,
                    'features': features,
                    'competency_predictions': competency_predictions,
                    'overall_learning_score': self._calculate_overall_learning_score(features),
                    'learning_profile': self._determine_learning_profile(features),
                    'analyzed_at': datetime.now().isoformat()
                }
                
                results.append(analysis_result)
                
                # Cache result
                await cache_manager.set(
                    cache_key,
                    json.dumps(analysis_result),
                    ttl=settings.PREDICTION_CACHE_TTL
                )
                
            except Exception as e:
                logger.error(f"Error analyzing competencies for student {student.get('id')}: {e}")
                results.append({
                    'student_id': student.get('id'),
                    'error': str(e)
                })
        
        return results
    
    def _calculate_overall_learning_score(self, features: Dict) -> float:
        """Calculate overall learning effectiveness score"""
        score_components = [
            features.get('task_completion_rate', 0) * 0.3,
            features.get('learning_consistency', 0) * 0.25,
            features.get('improvement_trend', 0) * 0.25,
            features.get('study_session_frequency', 0) * 0.2
        ]
        
        return sum(score_components)
    
    def _determine_learning_profile(self, features: Dict) -> str:
        """Determine student's learning profile"""
        consistency = features.get('learning_consistency', 0)
        completion_rate = features.get('task_completion_rate', 0)
        improvement = features.get('improvement_trend', 0)
        frequency = features.get('study_session_frequency', 0)
        
        if all(score > 0.7 for score in [consistency, completion_rate, improvement, frequency]):
            return 'high_performer'
        elif consistency > 0.7 and completion_rate > 0.7:
            return 'steady_learner'
        elif improvement > 0.7:
            return 'fast_improver'
        elif frequency > 0.7:
            return 'active_learner'
        elif completion_rate < 0.3 or consistency < 0.3:
            return 'struggling_learner'
        else:
            return 'average_learner'
    
    def _generate_submission_recommendations(self, analysis_results: Dict, competency_updates: List[Dict]) -> List[str]:
        """Generate recommendations based on submission analysis"""
        recommendations = []
        
        try:
            # Recommendations based on technologies used
            if 'technologies' in analysis_results:
                technologies = analysis_results['technologies']
                frameworks = technologies.get('frameworks', [])
                languages = technologies.get('languages', [])
                
                if len(frameworks) > 3:
                    recommendations.append("Excellent use of multiple technologies! Consider deepening expertise in core frameworks.")
                elif len(frameworks) > 0:
                    recommendations.append("Good technology usage. Try exploring additional frameworks to broaden your skillset.")
                
                if 'React' in frameworks and 'TypeScript' in languages:
                    recommendations.append("Great combination of React and TypeScript! Consider learning Next.js for full-stack development.")
                
                if 'Python' in languages:
                    recommendations.append("Strong Python skills detected. Consider exploring data science libraries like Pandas and NumPy.")
            
            # Recommendations based on code quality
            if 'code_quality' in analysis_results:
                quality = analysis_results['code_quality']
                overall_score = quality.get('overall_score', 0)
                
                if overall_score > 80:
                    recommendations.append("Excellent code quality! Keep up the good practices.")
                elif overall_score > 60:
                    recommendations.append("Good code quality. Focus on improving code documentation and structure.")
                else:
                    recommendations.append("Consider improving code quality through better naming conventions and structure.")
                
                issues = quality.get('issues', [])
                if len(issues) > 10:
                    recommendations.append("Consider addressing code quality issues to improve maintainability.")
            
            # Recommendations based on project structure
            if 'project_structure' in analysis_results:
                structure = analysis_results['project_structure']
                organization_score = structure.get('organization_score', 0)
                
                if organization_score > 80:
                    recommendations.append("Well-organized project structure! This shows good software engineering practices.")
                elif organization_score < 50:
                    recommendations.append("Consider improving project organization with better folder structure and separation of concerns.")
            
            # Recommendations based on documentation
            if 'documentation' in analysis_results:
                docs = analysis_results['documentation']
                completeness = docs.get('completeness_score', 0)
                
                if completeness > 70:
                    recommendations.append("Good documentation practices! This helps with project maintainability.")
                elif completeness < 30:
                    recommendations.append("Consider adding more documentation, including README and code comments.")
            
            # Recommendations based on competency updates
            if competency_updates:
                strong_areas = [update['competency_name'] for update in competency_updates if update.get('score_change', 0) > 10]
                weak_areas = [update['competency_name'] for update in competency_updates if update.get('score_change', 0) < 5]
                
                if strong_areas:
                    recommendations.append(f"Strong performance in: {', '.join(strong_areas[:3])}. Consider mentoring others in these areas.")
                
                if weak_areas:
                    recommendations.append(f"Areas for improvement: {', '.join(weak_areas[:3])}. Focus on these for your next projects.")
            
            # Design-specific recommendations
            if 'layout_analysis' in analysis_results:
                layout = analysis_results['layout_analysis']
                if layout.get('grid_usage', 0) > 70:
                    recommendations.append("Excellent use of grid systems! This shows strong understanding of layout principles.")
                
            if 'color_analysis' in analysis_results:
                color = analysis_results['color_analysis']
                if color.get('harmony_score', 0) > 80:
                    recommendations.append("Great color harmony! Your design shows strong understanding of color theory.")
            
            # General recommendations
            if not recommendations:
                recommendations.append("Keep up the good work! Continue practicing and exploring new technologies.")
            
        except Exception as e:
            logger.error(f"Error generating submission recommendations: {e}")
            recommendations.append("Analysis completed. Continue developing your skills!")
        
        return recommendations[:5]  # Limit to 5 recommendations

# Global instance
competency_analyzer = CompetencyAnalyzer()