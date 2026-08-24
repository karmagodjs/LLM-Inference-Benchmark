from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Tuple

class InferenceBackend(ABC):

    def __init__(self, model: str, base_url: str='', timeout: int=300):
        self.model = model
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout

    @abstractmethod
    def health_check(self) -> Tuple[bool, str]:
        pass

    @abstractmethod
    def generate(self, prompt: str, output_tokens: int=128) -> str:
        pass

    @abstractmethod
    def generate_stream(self, prompt: str, output_tokens: int=128) -> Dict[str, Any]:
        pass
