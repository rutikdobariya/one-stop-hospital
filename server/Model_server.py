from flask import Flask, jsonify, request, render_template
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GCNConv
from torch_geometric.data import Data
import asyncio
from groq import AsyncGroq
from flask_cors import CORS
import math
import datetime
from collections import defaultdict
import pandas as pd
import json
import re

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

disease_progression = {
    "Diabetes": ["Hypertension", "Kidney Disease", "Heart Disease"],
    "Hypertension": ["Heart Disease", "Stroke"],
    "Heart Disease": ["Stroke", "Paralysis"],
    "Obesity": ["Diabetes", "Heart Disease"],
    "Smoking": ["Lung Cancer", "COPD"],
    "Lung Cancer": ["COPD", "Respiratory Failure"],
    "High BP": ["Stroke", "Kidney Disease"],
    "Stroke": ["Paralysis", "Cognitive Decline"],
    "Kidney Disease": ["Dialysis", "Kidney Failure"],
    "Asthma": ["COPD", "Lung Infections"],
    "Arthritis": ["Chronic Pain", "Mobility Issues"],
    "Alzheimer's": ["Memory Loss", "Cognitive Decline"],
    "Migraine": ["Chronic Headache", "Neurological Disorders"],
    "Depression": ["Anxiety", "Mental Health Decline"],
    "Anemia": ["Fatigue", "Organ Dysfunction"],
    "Thyroid Disorder": ["Metabolism Issues", "Hormonal Imbalance"]
}

class DiseaseGNN(nn.Module):
    def __init__(self, num_node_features, num_classes):
        super(DiseaseGNN, self).__init__()
        self.conv1 = GCNConv(num_node_features, 64)  # First GCN layer
        self.conv2 = GCNConv(64, 32)  # Second GCN layer
        self.fc = nn.Linear(32, num_classes)  # Final fully connected layer

    def forward(self, data):
        x, edge_index = data.x, data.edge_index  # Node features and graph connectivity
        x = F.relu(self.conv1(x, edge_index))  # Apply first GCN layer
        x = F.relu(self.conv2(x, edge_index))  # Apply second GCN layer
        x = torch.mean(x, dim=0)  # Global pooling (mean)
        x = self.fc(x)  # Classification layer
        return x

# Load the model
model = DiseaseGNN(num_node_features=1, num_classes=len(disease_progression))
model.load_state_dict(torch.load('disease_gnn_model.pth'))
model.eval()  # Set the model to evaluation mode

def create_graph_from_patient_data(patient_data, disease_progression):
    disease_to_id = {disease: idx for idx, disease in enumerate(disease_progression.keys())}
    edges = []

    for patient in patient_data:
        disease_history = patient['disease_history']
        for i in range(len(disease_history) - 1):
            current_disease = disease_to_id[disease_history[i]]
            next_disease = disease_to_id[disease_history[i + 1]]
            edges.append([current_disease, next_disease])

    edges = torch.tensor(edges, dtype=torch.long).t().contiguous()
    num_diseases = len(disease_to_id)

    node_features = torch.ones(num_diseases, 1, dtype=torch.float)  # 1 feature per node for now

    data = Data(x=node_features, edge_index=edges)
    return data

@app.route('/future_prediction', methods=['POST'])
def future_prediction():
    try:
        # Get patient data from the request
        patient_data = request.json.get('patient_data')
        if not patient_data:
            return jsonify(error="No patient data provided"), 400

        # Create graph data from patient data
        data = create_graph_from_patient_data(patient_data, disease_progression)
        if data.x.size(0) == 0 or data.edge_index.size(1) == 0:
            return jsonify(error="Invalid graph data"), 400

        # Make prediction
        output = model(data)
        if output.size(0) == 0:
            return jsonify(error="Model output is empty"), 500

        disease_names = list(disease_progression.keys())

        # Get the index of the maximum value (predicted disease)
        predicted_index = torch.argmax(output).item()

        # Get the predicted disease name
        predicted_disease = disease_names[predicted_index]

        return jsonify(predicted_disease=predicted_disease)
    except Exception as e:
        return jsonify(error=str(e)), 500

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
    "Depression": {"severity": 6, "decay_rate": 0.06, "progression": ["Anxiety", "Mental Health Decline"]},
    "Anemia": {"severity": 5, "decay_rate": 0.07, "progression": ["Fatigue", "Organ Dysfunction"]},
    "Thyroid Disorder": {"severity": 5, "decay_rate": 0.07, "progression": ["Metabolism Issues", "Hormonal Imbalance"]}
}

def calculate_health_score(past_diseases):
    """Calculate overall health score based on disease history"""
    total_score = 100
    for disease_data in past_diseases:
        severity = diseases[disease_data['disease_name']]['severity']
        decay_rate = diseases[disease_data['disease_name']]['decay_rate']
        time_diff = (datetime.datetime.now() - datetime.datetime.strptime(disease_data['date'], '%Y-%m-%d')).days
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

# Load dataset
dataset_path = r"symtoms_df.csv"
data = pd.read_csv(dataset_path)

# Convert dataset to dictionary for quick lookup
disease_dict = {}
for _, row in data.iterrows():
    symptoms = tuple(sorted([
        symptom.strip().lower()
        for symptom in [row["Symptom_1"], row["Symptom_2"], row["Symptom_3"], row["Symptom_4"]]
        if pd.notna(symptom)
    ]))
    disease_dict[symptoms] = {"disease": row["Disease"], "probability": 100.0}  # Default probability is 100%

# Load user feedback data if available
feedback_path = "user_feedback.json"
try:
    with open(feedback_path, "r") as f:
        user_feedback = json.load(f)
except FileNotFoundError:
    user_feedback = {}

async def chat_with_bot(user_input):
    api_key = "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"  # Add your API key
    client = AsyncGroq(api_key=api_key)

    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "system", "content": "Answer these questions only if they are related to health, diseases, or any other health-related topics. Otherwise, reply saying 'I can't answer these questions. Sorry!'"}
    ]

    cleaned_input = re.sub(r'[^\w\s]', '', user_input)
    user_symptoms = tuple(sorted(cleaned_input.split()))  # Store symptoms in a sorted tuple for consistency

    # Check if user has corrected this before
    found_disease = user_feedback.get(str(user_symptoms))

    if not found_disease:
        # Check dataset for a match with the highest probability
        max_probability = 0
        best_match = None
        for symptoms, info in disease_dict.items():
            if set(symptoms).issubset(user_symptoms) and info["probability"] > max_probability:
                max_probability = info["probability"]
                best_match = info

        if best_match and max_probability >= 50:
            found_disease = best_match["disease"]
        else:
            found_disease = None  # If confidence is too low, don't make a prediction

    if found_disease:
        response = f"Based on my dataset, you may have {found_disease} with {max_probability:.2f}% confidence. Please consult a doctor for confirmation. (Prediction from Dataset)"
        
        user_feedback_response = request.json.get('feedback', '').strip().lower()

        if user_feedback_response == "no":
            # Reduce probability of incorrect disease by 2%
            for symptoms, info in disease_dict.items():
                if info["disease"] == found_disease:
                    info["probability"] = max(0, info["probability"] - 2)  # Prevent negative probabilities
            
            # Ask for correct disease
            correct_disease = request.json.get('correct_disease', '').strip()
            user_feedback[str(user_symptoms)] = {"disease": correct_disease, "probability": 100.0}  # Store correct disease with 100% probability

            with open(feedback_path, "w") as f:
                json.dump(user_feedback, f, indent=4)  # Save feedback to file

            response += " Thank you! I will remember this correction for future predictions."
    else:
        messages.append({"role": "user", "content": user_input})

        try:
            chat_completion = await client.chat.completions.create(
                messages=messages,
                model="llama-3.3-70b-versatile",
                temperature=0.5,
                max_completion_tokens=1024,
                top_p=1,
                stop=None,
                stream=False,
            )

            response = chat_completion.choices[0].message.content
            messages.append({"role": "assistant", "content": response})
        except Exception as e:
            response = f"Error with API call: {e}"
            response += " I couldn't fetch the information right now. Please try again later."

    return response

@app.route('/LLMchatbot', methods=['POST'])
def chatbot():
    user_input = request.json.get('message')
    response = asyncio.run(chat_with_bot(user_input))
    return jsonify(response=response)

if __name__ == '__main__':
    app.run(debug=True)