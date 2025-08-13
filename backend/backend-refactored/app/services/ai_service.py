import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import ollama
from app.core.config import settings
import os
import json
import requests
import re

torch.cuda.empty_cache()

def remove_markdown(text: str) -> str:
    # Remove headers, bold/italic markers, links, and bullet symbols
    text = re.sub(r'(\*{1,2}|_{1,2}|`|~{1,2})', '', text)  # bold/italic/code
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)   # links
    text = re.sub(r'(^|\n)\s*[-*+]\s+', r'\1', text)       # bullet points
    text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE) # headers
    return text.strip()

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


def generate_research_response(tokenizer, model, device, question: str, emotion: str, level: int) -> str:
    """Generates a response from the research model with teaching levels."""
    
    # Emotion tone
    if emotion.lower() in ["neutral", "sad"]:
        emotion_instruction = "Be calm, gentle, and supportive."
    elif emotion.lower() in ["happy", "excited", "joy"]:
        emotion_instruction = "Be engaging, energetic, and detailed."
    else:
        emotion_instruction = "Be clear and adaptive to the user's tone."

    # Level-specific teaching approach
    if level == 1:
        level_instruction = (
            "Teach this topic as if to a beginner. "
            "Focus on basic definitions, key concepts, and simple examples. "
            "Avoid jargon and keep explanations clear."
        )
    elif level == 2:
        level_instruction = (
            "Teach the intermediate aspects of this topic. "
            "Explain important processes, relationships, and use cases. "
            "Introduce moderate technical terms and explain them."
        )
    elif level == 3:
        level_instruction = (
            "Teach the advanced aspects of this topic. "
            "Include in-depth technical details, complexities, and real-world applications. "
            "Use domain-specific terminology and assume prior knowledge."
        )
    else:
        raise ValueError("Level must be 1, 2, or 3.")

    # Final system instruction
    dynamic_instruction = (
        f"You are a knowledgeable teacher.\n"
        f"Always respond with a very detailed, structured explanation. Use as much depth as necessary, ideally several thousand words, until the topic is thoroughly explained.\n"
        f"Organize the content into clear sections or bullet points.\n"
        f"{level_instruction}\n"
        f"{emotion_instruction}\n"
        f"If the question is vague, ask for clarification before explaining."
    )

    prompt = (
        f"<|start_header_id|>system<|end_header_id|>\n{dynamic_instruction}<|eot_id|>\n"
        f"<|start_header_id|>user<|end_header_id|>\nQuery: {question}\nEmotion: {emotion}<|eot_id|>\n"
        f"<|start_header_id|>assistant<|end_header_id|>\n"
    )
    if level==1:
        level_tokens=1024
        dynamic_instruction = (
        f"You are a knowledgeable teacher.\n"
        f"Always respond with a very detailed, structured explanation. Use as much depth as necessary, ideally several thousand words, until the topic is thoroughly explained.\n"
        f"Organize the content into clear sections or bullet points.\n"
        f"{level_instruction}\n"
        f"{emotion_instruction}\n"
        f"If the question is vague, ask for clarification before explaining."
    )
    elif level==2:
        level_tokens=2048
        dynamic_instruction = (
        f"You are a knowledgeable teacher.\n"
        f"Always respond with a very detailed, structured explanation. Use as much depth as necessary, ideally several thousand words, until the topic is thoroughly explained.\n"
        f"Organize the content into clear sections or bullet points.\n"
        f"{level_instruction}\n"
        f"{emotion_instruction}\n"
        f"If the question is vague, ask for clarification before explaining."
    )
    
    else:
        level_tokens=3000
        dynamic_instruction = (
        f"You are a knowledgeable teacher.\n"
        f"Always respond with a very detailed, structured explanation. Use as much depth as necessary, ideally several thousand words, until the topic is thoroughly explained.\n"
        f"Organize the content into clear sections or bullet points.\n"
        f"{level_instruction}\n"
        f"{emotion_instruction}\n"
        f"If the question is vague, ask for clarification before explaining."
    )

    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=2000,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.1,
            eos_token_id=tokenizer.eos_token_id
        )
    
    decoded = tokenizer.decode(output[0], skip_special_tokens=False)
    return  remove_markdown(_clean_hf_output(decoded))


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
    return remove_markdown(_clean_hf_output(decoded))

def analyze_image_with_ollama(image_path: str) -> str:
    """Analyzes an image using Ollama by sending image bytes."""
    instruction = "answer the question shown in the image, IMPORTANT: Do not use any Markdown formatting. The entire response must be plain text. Do not use headers (like ##), bullet points (like * or -), or bold/italics.\n"
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
        return remove_markdown(response['message']['content'])
    except Exception as e:
        # Re-raise the exception to be handled by the endpoint
        print(f"Error during Ollama analysis: {e}")
        raise e


KEYWORDS_FOLDER = 'local_keywords'
KEYWORDS_FILE = os.path.join(KEYWORDS_FOLDER, 'keywords.txt')

def load_local_keywords(file_path: str) -> set:
    """Loads keywords from the specified file into a set for efficient lookup."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            # Read lines, strip whitespace, convert to lowercase, and filter out empty lines
            keywords = {line.strip().lower() for line in f if line.strip()}
        print(f"✅ Successfully loaded {len(keywords)} keywords from your local library.")
        return keywords
    except FileNotFoundError:
        print(f"⚠️ Warning: Keyword file not found at '{file_path}'. No local content will be matched.")
        return set() # Return an empty set if the file doesn't exist

# --- MODIFIED ENDPOINT FUNCTION ---
def generate_local_research_response(tokenizer, model, device, question: str, emotion: str) -> str:
    """
    Checks if the question matches local keywords. If yes, generates a response
    from the research model. If not, returns a specific message.
    """
    # --- NEW LOGIC START ---

    # 1. Load keywords from your local library
    local_keywords = load_local_keywords(KEYWORDS_FILE)

    # 2. Process the user's query and check for a match
    # Split the question into words, convert to lowercase for case-insensitive matching
    query_words = set(question.lower().split())

    # Use set intersection to find any common words efficiently
    if not local_keywords.intersection(query_words):
        # If the intersection is empty (no matching keywords), return the specific message
        return "This content is not available in your local library, please learn globally"

    # --- NEW LOGIC END ---

    # If a match was found, proceed with generating the LLM response as before.
    print("✅ Keyword match found! Generating a detailed response from your local library context...")
    
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
        f"Always respond with a detailed, structured explanation of about 500 to 600 words.\n"
        f"Break the content into clear sections or paragraphs, and use examples when appropriate.\n"
        f"IMPORTANT: Do not use any Markdown formatting. The entire response must be plain text. Do not use headers (like ##), bullet points (like * or -), or bold/italics.\n"
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
            max_new_tokens=1024,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.1,
            eos_token_id=tokenizer.eos_token_id
        )
    
    decoded = tokenizer.decode(output[0], skip_special_tokens=False)
    return remove_markdown(_clean_hf_output(decoded))

def gen_keywords(tokenizer, model, device, question: str, emotion: str) -> list:
    """Generates image URLs based on question by getting search keywords from LLM and fetching images."""

    # Instruction to LLM: only return keywords
    emotion_instruction = "You are an assistant that only outputs 3 to 5 short, comma-separated keywords for image search. Do NOT explain, just return keywords."

    dynamic_instruction = (
        f"{emotion_instruction} The user will ask a question. Think about the most relevant keywords for image search related to their query."
    )

    prompt = (
        f"<|start_header_id|>system<|end_header_id|>\n{dynamic_instruction}<|eot_id|>\n"
        f"<|start_header_id|>user<|end_header_id|>\nQuery: {question}\nEmotion: {emotion}<|eot_id|>\n"
        f"<|start_header_id|>assistant<|end_header_id|>\n"
    )

    # Get keywords from LLM
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=50,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.1,
            eos_token_id=tokenizer.eos_token_id
        )

    decoded = tokenizer.decode(output[0], skip_special_tokens=True).strip()
    keywords = decoded.split("\n")[5].strip()  # Use first line only

    # Call Serper API to get image URLs
    url = "https://google.serper.dev/images"
    payload = json.dumps({"q": question})
    print(keywords,decoded.split("\n")[6].strip() )
    headers = {
        'X-API-KEY': 'c8fa1043c013a0719fb8cdbc8b254c6f18d0c864',
        'Content-Type': 'application/json'
    }

    response = requests.post(url, headers=headers, data=payload)
    data = response.json()

    # Extract top 10 image URLs
    image_urls = [item["imageUrl"] for item in data.get("images", [])[:10]]

    return image_urls
