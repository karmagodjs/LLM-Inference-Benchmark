from typing import Any, Dict, Optional
from .openai_compatible import OpenAICompatibleProvider
from .base import ProviderPricing

class OpenRouterProvider(OpenAICompatibleProvider):

    def __init__(self, model: str='meta-llama/llama-3.3-70b-instruct', api_key_env: str='OPENROUTER_API_KEY', api_key: Optional[str]=None, base_url: str='https://openrouter.ai/api/v1', timeout: int=300, requests_per_second_limit: Optional[float]=None, max_retries: int=3, initial_backoff: float=1.0, pricing: Optional[ProviderPricing]=None, extra_headers: Optional[Dict[str, str]]=None):
        headers = {'HTTP-Referer': 'https://github.com/inferbench/inferbench', 'X-Title': 'InferBench'}
        if extra_headers:
            headers.update(extra_headers)
        super().__init__(name='openrouter', model=model, base_url=base_url or 'https://openrouter.ai/api/v1', api_key_env=api_key_env, api_key=api_key, timeout=timeout, requests_per_second_limit=requests_per_second_limit, max_retries=max_retries, initial_backoff=initial_backoff, pricing=pricing, extra_headers=headers)
