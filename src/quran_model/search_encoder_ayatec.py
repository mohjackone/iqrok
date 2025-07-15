import pandas as pd
from typing import List, Dict, Optional
from pathlib import Path
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class AyatecSearchEncoder:
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent / "model" / "quran-qa-2023" / "Task-A" / "data"
        self.dev_data = pd.read_csv(self.data_dir / "QQA23_TaskA_ayatec_v1.2_dev.tsv", sep='\t', header=None, names=['id', 'question'])
        self.test_data = pd.read_csv(self.data_dir / "QQA23_TaskA_ayatec_v1.2_test.tsv", sep='\t', header=None, names=['id', 'question'])
        self.train_data = pd.read_csv(self.data_dir / "QQA23_TaskA_ayatec_v1.2_train.tsv", sep='\t', header=None, names=['id', 'question'])
        
        # Load gold standard answers
        self.dev_gold = pd.read_csv(self.data_dir / "qrels" / "QQA23_TaskA_ayatec_v1.2_qrels_dev.gold", sep='\t', header=None, names=['id', 'iteration', 'verse', 'relevance'])
        self.test_gold = pd.read_csv(self.data_dir / "qrels" / "QQA23_TaskA_ayatec_v1.2_qrels_test.gold", sep='\t', header=None, names=['id', 'iteration', 'verse', 'relevance'])
        self.train_gold = pd.read_csv(self.data_dir / "qrels" / "QQA23_TaskA_ayatec_v1.2_qrels_train.gold", sep='\t', header=None, names=['id', 'iteration', 'verse', 'relevance'])
        
        # Combine all data
        self.questions = pd.concat([self.dev_data, self.test_data, self.train_data])
        self.gold_answers = pd.concat([self.dev_gold, self.test_gold, self.train_gold])
        
        # Initialize TF-IDF vectorizer
        self.vectorizer = TfidfVectorizer(analyzer='char_wb', ngram_range=(3, 5))
        self.question_vectors = self.vectorizer.fit_transform(self.questions['question'])

    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        # Vectorize the query
        query_vector = self.vectorizer.transform([query])
        
        # Calculate similarities
        similarities = cosine_similarity(query_vector, self.question_vectors)[0]
        
        # Get top k matches
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        results = []
        for idx in top_indices:
            question_id = self.questions.iloc[idx]['id']
            question = self.questions.iloc[idx]['question']
            
            # Get relevant verses for this question
            verses = self.gold_answers[
                (self.gold_answers['id'] == question_id) & 
                (self.gold_answers['verse'] != '-1')
            ]['verse'].tolist()
            
            results.append({
                'id': str(question_id),
                'question_ar': question,
                'question_id': str(question_id),
                'similarity_score': float(similarities[idx]),
                'ayatec_match': {
                    'question': question,
                    'verses': verses
                }
            })
        
        return results

    def encode(self, text: str) -> np.ndarray:
        # For compatibility with other encoders
        return self.vectorizer.transform([text]).toarray()[0] 