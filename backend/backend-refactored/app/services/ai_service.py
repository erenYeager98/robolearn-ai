import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import ollama
from app.core.config import settings
import os

def load_hf_models():
    """Loads and returns the Hugging Face tokenizer and models."""
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")
    print(f"Loading Hugging Face model: {settings.HF_MODEL_ID}")

    tokenizer = AutoTokenizer.from_pretrained(settings.HF_MODEL_ID)
    dtype = torch.float16 if device == "cuda" else torch.float32

    model_research = AutoModelForCausalLM.from_pretrained(settings.HF_MODEL_ID, torch_dtype=dtype).to(device)
    model_summarize = AutoModelForCausalLM.from_pretrained(settings.HF_MODEL_ID, torch_dtype=dtype).to(device)
    
    print("Hugging Face models loaded.")
    return tokenizer, model_research, model_summarize, device

def _clean_hf_output(decoded_text: str) -> str:
    """Helper to extract the assistant's response."""
    if "<|start_header_id|>assistant<|end_header_id|>" in decoded_text:
        answer = decoded_text.split("<|start_header_id|>assistant<|end_header_id|>")[-1]
    else:
        answer = decoded_text
    
    if "<|eot_id|>" in answer:
        answer = answer.split("<|eot_id|>")[0]
        
    return answer.strip()

def generate_research_response(tokenizer, model, device, question: str, emotion: str) -> str:
    """Generates a response from the research model."""
    if emotion.lower() in ["neutral", "sad"]:
        emotion_instruction = (
            "The user is in a calm or low mood, so explain the topic thoroughly but in a gentle and easy-to-follow manner."
        )
    elif emotion.lower() in ["happy", "excited", "joy"]:
        emotion_instruction = (
            "The user is in a good mood, so you can explain the topic with enthusiasm, depth, and engaging details."
        )
    else:
        emotion_instruction = (
            "Adjust your response tone to suit the user's emotion. Prioritize clarity and depth."
        )

    dynamic_instruction = (
        f"You are a knowledgeable, friendly teacher who explains topics thoroughly.\n"
        f"Always respond with a detailed, structured explanation of about 500–600 words.\n"
        f"Break the content into clear sections or paragraphs, and use examples when appropriate.\n"
        f"If the query is vague, ask for clarification before explaining.\n"
        f"{emotion_instruction}\n"
        f"Your tone should remain helpful, supportive, engaging, and educational."
    )

    prompt = (
        f"<|start_header_id|>system<|end_header_id|>\n{dynamic_instruction}<|eot_id|>\n"
        f"<|start_header_id|>user<|end_header_id|>\nQuery: {question}\nEmotion: {emotion}<|eot_id|>\n"
        f"<|start_header_id|>assistant<|end_header_id|>\n"
    )
    
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=1024,  # Increased for longer output
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.1,
            eos_token_id=tokenizer.eos_token_id
        )
    
    decoded = tokenizer.decode(output[0], skip_special_tokens=False)
    return _clean_hf_output(decoded)


def generate_summary(tokenizer, model, device, content: str) -> str:
    """Generates a summary from the summarize model."""
    instruction = (
        "You are an expert academic assistant.\nSummarize the given content in about 50 words, even if the given content is shorter, you have to make up some stuff and make about 50 words\n"
        "The summary must start with: 'This article states that'.\nWrite clearly and professionally. Do not add notes, opinions, or extra commentary, do not respond with bold text formatters or any other formatting.\n"
    )
    prompt = f"<|start_header_id|>system<|end_header_id|>\n{instruction}<|eot_id|>\n<|start_header_id|>user<|end_header_id|>\n{content.strip()}<|eot_id|>\n<|start_header_id|>assistant<|end_header_id|>\nThis article states that "
    
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    with torch.no_grad():
        output = model.generate(**inputs, max_new_tokens=200, do_sample=False, temperature=0.7, top_p=0.9, repetition_penalty=1.1, eos_token_id=tokenizer.eos_token_id)

    decoded = tokenizer.decode(output[0], skip_special_tokens=False)
    return _clean_hf_output(decoded)

def analyze_image_with_ollama(image_path: str) -> str:
    """Analyzes an image using Ollama by sending image bytes."""
    instruction = "answer the question shown in the image."
    print(f"🤖 Analyzing {os.path.basename(image_path)} with model '{settings.OLLAMA_MODEL_NAME}'...")
    
    try:
        # Read the file content as bytes
        with open(image_path, "rb") as f:
            image_bytes = f.read()

        # Call the model with the image bytes
        response = ollama.chat(
            model=settings.OLLAMA_MODEL_NAME,
            messages=[{
                'role': 'user', 
                'content': instruction, 
                'images': [image_bytes]  # <-- Pass the bytes directly
            }]
        )
        return response['message']['content']
    except Exception as e:
        # Re-raise the exception to be handled by the endpoint
        print(f"Error during Ollama analysis: {e}")
        raise e
