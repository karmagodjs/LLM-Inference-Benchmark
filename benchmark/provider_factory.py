import os
import sys
from typing import Any, Dict, List, Optional, Tuple, Type
from .providers.base import InferenceProvider, ProviderPricing
from .providers.openai import OpenAIProvider
from .providers.gemini import GeminiProvider
from .providers.anthropic import AnthropicProvider
from .providers.grok import GrokProvider
from .providers.huggingface import HuggingFaceProvider
from .providers.openrouter import OpenRouterProvider
from .providers.ollama import OllamaProvider
from .providers.openai_compatible import OpenAICompatibleProvider
PROVIDER_REGISTRY: Dict[str, Dict[str, Any]] = {'ollama': {'class': OllamaProvider, 'display_name': 'Ollama', 'default_model': 'qwen2.5:3b', 'api_key_env': None, 'default_base_url': 'http://localhost:11434'}, 'openai': {'class': OpenAIProvider, 'display_name': 'OpenAI', 'default_model': 'gpt-4o-mini', 'api_key_env': 'OPENAI_API_KEY', 'default_base_url': 'https://api.openai.com/v1'}, 'gemini': {'class': GeminiProvider, 'display_name': 'Gemini', 'default_model': 'gemini-2.5-flash', 'api_key_env': 'GEMINI_API_KEY', 'default_base_url': 'https://generativelanguage.googleapis.com/v1beta'}, 'anthropic': {'class': AnthropicProvider, 'display_name': 'Anthropic', 'default_model': 'claude-3-5-sonnet-20241022', 'api_key_env': 'ANTHROPIC_API_KEY', 'default_base_url': 'https://api.anthropic.com/v1'}, 'grok': {'class': GrokProvider, 'display_name': 'Grok', 'default_model': 'grok-2-latest', 'api_key_env': 'XAI_API_KEY', 'default_base_url': 'https://api.x.ai/v1'}, 'huggingface': {'class': HuggingFaceProvider, 'display_name': 'Hugging Face', 'default_model': 'meta-llama/Llama-3.2-3B-Instruct', 'api_key_env': 'HF_TOKEN', 'default_base_url': 'https://router.huggingface.co/hf-inference/v1'}, 'openrouter': {'class': OpenRouterProvider, 'display_name': 'OpenRouter', 'default_model': 'meta-llama/llama-3.3-70b-instruct', 'api_key_env': 'OPENROUTER_API_KEY', 'default_base_url': 'https://openrouter.ai/api/v1'}, 'openai_compatible': {'class': OpenAICompatibleProvider, 'display_name': 'OpenAI Compatible', 'default_model': 'default-model', 'api_key_env': 'CUSTOM_API_KEY', 'default_base_url': 'http://localhost:8000/v1'}}
ALIAS_MAP: Dict[str, str] = {'google': 'gemini', 'google_gemini': 'gemini', 'claude': 'anthropic', 'xai': 'grok', 'hf': 'huggingface', 'custom': 'openai_compatible', 'vllm': 'openai_compatible', 'llama.cpp': 'openai_compatible', 'llamacpp': 'openai_compatible', 'sglang': 'openai_compatible', 'tgi': 'openai_compatible', 'tensorrt-llm': 'openai_compatible', 'tensorrt': 'openai_compatible'}

class ProviderFactory:

    @classmethod
    def resolve_provider_name(cls, name: str) -> str:
        clean = name.lower().strip()
        return ALIAS_MAP.get(clean, clean)

    @classmethod
    def get_provider(cls, name: str='ollama', model: Optional[str]=None, api_key_env: Optional[str]=None, api_key: Optional[str]=None, base_url: Optional[str]=None, timeout: int=300, requests_per_second_limit: Optional[float]=None, max_retries: int=3, initial_backoff: float=1.0, pricing: Optional[ProviderPricing]=None, extra_headers: Optional[Dict[str, str]]=None, **kwargs: Any) -> InferenceProvider:
        canonical_name = cls.resolve_provider_name(name)
        if canonical_name not in PROVIDER_REGISTRY:
            return OpenAICompatibleProvider(name=name, model=model or 'default-model', api_key_env=api_key_env, api_key=api_key, base_url=base_url or 'http://localhost:8000/v1', timeout=timeout, requests_per_second_limit=requests_per_second_limit, max_retries=max_retries, initial_backoff=initial_backoff, pricing=pricing, extra_headers=extra_headers)
        reg = PROVIDER_REGISTRY[canonical_name]
        provider_cls: Type[InferenceProvider] = reg['class']
        chosen_model = model or reg['default_model']
        chosen_api_key_env = api_key_env or reg['api_key_env']
        chosen_base_url = base_url or reg['default_base_url']
        if canonical_name == 'ollama':
            return OllamaProvider(model=chosen_model, base_url=chosen_base_url, timeout=timeout, requests_per_second_limit=requests_per_second_limit, max_retries=max_retries, initial_backoff=initial_backoff, pricing=pricing, extra_headers=extra_headers)
        return provider_cls(model=chosen_model, api_key_env=chosen_api_key_env, api_key=api_key, base_url=chosen_base_url, timeout=timeout, requests_per_second_limit=requests_per_second_limit, max_retries=max_retries, initial_backoff=initial_backoff, pricing=pricing, extra_headers=extra_headers)

    @classmethod
    def list_supported_providers(cls) -> List[str]:
        return list(PROVIDER_REGISTRY.keys())

    @classmethod
    def check_all_credentials(cls) -> List[Dict[str, Any]]:
        statuses = []
        for key, info in PROVIDER_REGISTRY.items():
            env_var = info['api_key_env']
            display = info['display_name']
            if env_var is None:
                provider = cls.get_provider(key)
                is_valid, msg = provider.validate_credentials()
                statuses.append({'provider': key, 'display_name': display, 'has_credentials': True, 'env_var': None, 'status_message': 'Local provider (No API key required)'})
            else:
                val = os.environ.get(env_var, '').strip()
                has_key = bool(val)
                msg = f'{env_var} is configured' if has_key else f'API key missing ({env_var} not set)'
                statuses.append({'provider': key, 'display_name': display, 'has_credentials': has_key, 'env_var': env_var, 'status_message': msg})
        return statuses

def print_provider_discovery() -> None:
    try:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
    check = '[OK]'
    cross = '[MISSING]'
    print('\n' + '=' * 60)
    print('InferBench - Provider Discovery & Credential Status')
    print('=' * 60)
    print('\nAvailable providers:\n')
    for key, info in PROVIDER_REGISTRY.items():
        print(f"  {check} {info['display_name']} ({key})")
    print('\nCredential status:\n')
    statuses = ProviderFactory.check_all_credentials()
    for s in statuses:
        if s['has_credentials']:
            print(f"  {check} {s['display_name']:<20} : {s['status_message']}")
        else:
            print(f"  {cross} {s['display_name']:<20} : {s['status_message']}")
    print('=' * 60 + '\n')
if __name__ == '__main__':
    print_provider_discovery()
