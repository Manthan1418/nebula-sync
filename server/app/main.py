from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Nebula Sync Backend (scaffold)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Item(BaseModel):
    id: int
    name: str
    description: str = ""


# In-memory store for demonstration/testing only
_DB: List[Item] = []


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/items", response_model=List[Item])
async def list_items():
    return _DB


@app.post("/items", response_model=Item)
async def create_item(item: Item):
    _DB.append(item)
    return item
