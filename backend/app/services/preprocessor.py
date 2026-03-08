import torch
from transformers import AutoTokenizer
import pickle
import re
from typing import List, Union


class Preprocessor:
    def __init__(self):
        pass

    @staticmethod
    def clean_text(text: str) -> str:
        """Basic text cleaning."""
        text = text.lower()
        text = re.sub(r'http\S+', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def preprocess_bert(self, text: str, tokenizer: AutoTokenizer, max_len: int = 128):
        """Preprocess text for BERT model."""
        text = self.clean_text(text)
        encoding = tokenizer(
            text,
            add_special_tokens=True,
            max_length=max_len,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )
        return encoding['input_ids'], encoding['attention_mask']

    def preprocess_rnn(self, text: str, tokenizer, max_len: int = 150):
        """Preprocess text for LSTM/GRU models."""
        text = self.clean_text(text)
        
        if hasattr(tokenizer, 'texts_to_sequences'):
            sequences = tokenizer.texts_to_sequences([text])
        else:
            sequences = [[0]]
        
        seq = sequences[0]
        if len(seq) < max_len:
            seq = seq + [0] * (max_len - len(seq))
        else:
            seq = seq[:max_len]
            
        return torch.tensor([seq], dtype=torch.long)
