import asyncio
import pandas as pd
import json
import re
from groq import AsyncGroq

# Load dataset
dataset_path = r"C:\Users\kunjk\Downloads\CVM\CVM\datasets\symtoms_df.csv"
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

async def chat_with_bot():
    api_key = "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"  # Add your API key
    client = AsyncGroq(api_key=api_key)

    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "system", "content": "Answer these questions only if they are related to health, diseases, or any other health-related topics. Otherwise, reply saying 'I can't answer these questions. Sorry!'"}
    ]

    print("Hello! I'm your assistant. You can ask me anything about health-related topics.")
    print("Type 'exit', 'bye', or 'quit' to end the conversation.")

    while True:
        user_input = input("You: ").strip().lower()

        if user_input in ["exit", "bye", "quit"]:
            print("Goodbye!")
            break

        cleaned_input = re.sub(r'[^\w\s]', '', user_input)
        user_symptoms = tuple(sorted(cleaned_input.split()))  # Store symptoms in a sorted tuple for consistency

        print(f"User symptoms: {user_symptoms}")

        # *Check if user has corrected this before*
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
            print(f"Bot: Based on my dataset, you may have {found_disease} with {max_probability:.2f}% confidence. Please consult a doctor for confirmation. (Prediction from Dataset)")
            
            user_feedback_response = input("Is this diagnosis correct? (yes/no): ").strip().lower()

            if user_feedback_response == "no":
                # Reduce probability of incorrect disease by 2%
                for symptoms, info in disease_dict.items():
                    if info["disease"] == found_disease:
                        info["probability"] = max(0, info["probability"] - 2)  # Prevent negative probabilities
                
                # Ask for correct disease
                correct_disease = input("What is the correct disease?: ").strip()
                user_feedback[str(user_symptoms)] = {"disease": correct_disease, "probability": 100.0}  # Store correct disease with 100% probability

                with open(feedback_path, "w") as f:
                    json.dump(user_feedback, f, indent=4)  # Save feedback to file

                print("Bot: Thank you! I will remember this correction for future predictions.")
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
                print(f"Bot: {response}")

                messages.append({"role": "assistant", "content": response})
            except Exception as e:
                print(f"Error with API call: {e}")
                print("Bot: I couldn't fetch the information right now. Please try again later.")

# Run the chat function
asyncio.run(chat_with_bot())





# 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