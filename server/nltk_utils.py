import nltk
from sklearn.feature_extraction.text import TfidfVectorizer

nltk.download('punkt')
nltk.download('stopwords')

class vectorizer:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(tokenizer=self.tokenize, stop_words=nltk.corpus.stopwords.words('english'))

    def fit(self, data):
        self.vectorizer.fit(data)

    def transform(self, data):
        return self.vectorizer.transform(data)

    def tokenize(self, text):
        tokens = nltk.word_tokenize(text)
        return tokens
