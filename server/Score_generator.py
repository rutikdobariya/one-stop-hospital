from flask import Flask, request, jsonify, render_template
import math
import datetime
import pandas as pd
from collections import defaultdict

app = Flask(__name__)

# Disease data table with severity, decay rate, and progression

diseases = {
    "Diabetes": {"severity": 7, "decay_rate": 0.03, "progression": ["Hypertension", "Kidney Disease", "Heart Disease"]},
    "Hypertension": {"severity": 7, "decay_rate": 0.04, "progression": ["Heart Disease", "Stroke"]},
    "Heart Disease": {"severity": 9, "decay_rate": 0.02, "progression": ["Stroke", "Paralysis"]},
    "Obesity": {"severity": 6, "decay_rate": 0.05, "progression": ["Diabetes", "Heart Disease"]},
    "Smoking": {"severity": 8, "decay_rate": 0.02, "progression": ["Lung Cancer", "COPD"]},
    "Lung Cancer": {"severity": 10, "decay_rate": 0.01, "progression": ["COPD", "Respiratory Failure"]},
    "High BP": {"severity": 7, "decay_rate": 0.04, "progression": ["Stroke", "Kidney Disease"]},
    "Stroke": {"severity": 9, "decay_rate": 0.02, "progression": ["Paralysis", "Cognitive Decline"]},
    "Kidney Disease": {"severity": 8, "decay_rate": 0.03, "progression": ["Dialysis", "Kidney Failure"]},
    "Asthma": {"severity": 6, "decay_rate": 0.07, "progression": ["COPD", "Lung Infections"]},
    "Arthritis": {"severity": 5, "decay_rate": 0.07, "progression": ["Chronic Pain", "Mobility Issues"]},
    "Alzheimer's": {"severity": 9, "decay_rate": 0.02, "progression": ["Memory Loss", "Cognitive Decline"]},
    "Migraine": {"severity": 4, "decay_rate": 0.1, "progression": ["Chronic Headache", "Neurological Disorders"]},
    "Depression": {"severity": 6, "decay_rate": 0.06, "progression": ["Anxiety", "Mental Health Decline"]},
    "Anemia": {"severity": 5, "decay_rate": 0.07, "progression": ["Fatigue", "Organ Dysfunction"]},
    "Thyroid Disorder": {"severity": 5, "decay_rate": 0.07, "progression": ["Metabolism Issues", "Hormonal Imbalance"]}
}

def calculate_health_score(past_diseases):
    """Calculate overall health score based on disease history"""
    total_score = 100
    for disease_data in past_diseases:
        severity = diseases[disease_data]['severity']
        decay_rate = diseases[disease_data]['decay_rate']
        time_diff = (datetime.datetime.now() - datetime.datetime.strptime(disease_data['date'], '%d-%m-%Y')).days
        weighted_impact = severity * math.exp(-decay_rate * time_diff)
        total_score -= weighted_impact
    return max(0, min(100, total_score))

def predict_progression(past_diseases):
    """Predict future diseases based on past disease progression"""
    future_diseases = set()
    for disease_data in past_diseases:
        disease_name = disease_data['disease_name']
        if disease_name in diseases and 'progression' in diseases[disease_name]:
            future_diseases.update(diseases[disease_name]['progression'])
    return list(future_diseases)

@app.route('/')
def index():
    return render_template('index1.html')

@app.route('/predict_health', methods=['POST'])
def predict_health():
    data = request.get_json()
    past_diseases = data.get('past_diseases', [])
    health_score = calculate_health_score(past_diseases)
    future_diseases = predict_progression(past_diseases)
    return jsonify({
        'health_score': health_score,
        'predicted_future_diseases': future_diseases
    })

if __name__ == '__main__':
    app.run(debug=True)
