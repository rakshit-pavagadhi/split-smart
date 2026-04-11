import httpx
from io import BytesIO

async def download_image(url: str) -> bytes:
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=10.0)
        response.raise_for_status()
        return response.content
