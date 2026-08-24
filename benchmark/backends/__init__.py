from typing import Optional
from .base import InferenceBackend
from .ollama import OllamaClient

def get_backend(framework: str='ollama', model: str='qwen2.5:3b', base_url: str='http://localhost:11434', timeout: int=300) -> InferenceBackend:
    fw = framework.lower().strip()
    if fw in ('ollama', 'ollama_client'):
        return OllamaClient(model=model, base_url=base_url, timeout=timeout)
    else:
        raise ValueError(f"Unsupported framework: '{framework}'. Currently supported backends: 'ollama'. (llama.cpp, vllm, sglang, tensorrt-llm can be added via InferenceBackend).")
__all__ = ['InferenceBackend', 'OllamaClient', 'get_backend']
