from pydantic import BaseModel

# AI Processing Schemas
class ResearchQuery(BaseModel):
    question: str
    emotion: str

class SummarizeRequest(BaseModel):
    content: str

class ImagePayload(BaseModel):
    image_data: str  # Base64 data URL

# External Search Schemas
class SerperQuery(BaseModel):
    q: str

class SerperLensQuery(BaseModel):
    url: str

# Audio Schemas
class TTSRequest(BaseModel):
    text: str