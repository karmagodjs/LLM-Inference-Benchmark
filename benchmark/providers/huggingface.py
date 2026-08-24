import json
import time
from typing import Any, Dict, List, Optional, Tuple
import requests
from benchmark.schemas import BenchmarkRequest, NormalizedResponse
from benchmark.metrics import calculate_decode_time, calculate_generation_speed, calculate_latency, calculate_tpot, calculate_ttft
from .base import InferenceProvider, ProviderPricing

class HuggingFaceProvider(InferenceProvider):

    def __init__(self, model: str='meta-llama/Llama-3.2-3B-Instruct', api_key_env: str='HF_TOKEN', api_key: Optional[str]=None, base_url: str='https://router.huggingface.co/hf-inference/v1', timeout: int=300, requests_per_second_limit: Optional[float]=None, max_retries: int=3, initial_backoff: float=1.0, pricing: Optional[ProviderPricing]=None, extra_headers: Optional[Dict[str, str]]=None, endpoint_type: str='auto'):
        super().__init__(name='huggingface', model=model, base_url=base_url or 'https://router.huggingface.co/hf-inference/v1', api_key_env=api_key_env, api_key=api_key, timeout=timeout, requests_per_second_limit=requests_per_second_limit, max_retries=max_retries, initial_backoff=initial_backoff, pricing=pricing, extra_headers=extra_headers)
        self.endpoint_type = endpoint_type

    def _is_chat_router(self) -> bool:
        if self.endpoint_type == 'chat':
            return True
        if self.endpoint_type == 'text-generation':
            return False
        return 'router.huggingface.co' in self.base_url or self.base_url.endswith('/v1')

    def _get_headers(self) -> Dict[str, str]:
        headers = {'Content-Type': 'application/json'}
        if self.api_key:
            headers['Authorization'] = f'Bearer {self.api_key}'
        if self.extra_headers:
            headers.update(self.extra_headers)
        return headers

    def health_check(self) -> Tuple[bool, str]:
        valid, msg = self.validate_credentials()
        if not valid:
            return (False, f'Hugging Face credential check failed: {msg}')
        if self._is_chat_router():
            url = f"{self.base_url.rstrip('/')}/models"
        else:
            url = f"{self.base_url.rstrip('/')}/info" if 'endpoints.huggingface.cloud' in self.base_url else f'https://api-inference.huggingface.co/models/{self.model}'
        try:
            resp = self.session.get(url, headers=self._get_headers(), timeout=min(self.timeout, 10))
            if resp.status_code in (200, 404):
                return (True, f'Hugging Face endpoint reachable at {self.base_url}. Model: {self.model}')
            elif resp.status_code == 401:
                return (False, 'Hugging Face token is invalid or unauthorized (HTTP 401).')
            else:
                return (True, f'Hugging Face endpoint status {resp.status_code}. Model: {self.model}')
        except Exception as e:
            return (False, f'Failed to connect to Hugging Face endpoint: {e}')

    def list_models(self) -> List[str]:
        valid, _ = self.validate_credentials()
        if not valid:
            return []
        if self._is_chat_router():
            url = f"{self.base_url.rstrip('/')}/models"
            try:
                resp = self.session.get(url, headers=self._get_headers(), timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    return sorted([m.get('id', '') for m in data.get('data', []) if m.get('id')])
            except Exception:
                pass
        return [self.model]

    def _do_generate(self, request: BenchmarkRequest) -> NormalizedResponse:
        start_time = time.perf_counter()
        if self._is_chat_router():
            url = f"{self.base_url.rstrip('/')}/chat/completions"
            messages = []
            if request.system_prompt:
                messages.append({'role': 'system', 'content': request.system_prompt})
            messages.append({'role': 'user', 'content': request.prompt})
            payload: Dict[str, Any] = {'model': request.model or self.model, 'messages': messages, 'max_tokens': request.max_output_tokens, 'temperature': request.temperature, 'stream': False}
        else:
            url = self.base_url.rstrip('/') if 'endpoints.huggingface.cloud' in self.base_url else f'https://api-inference.huggingface.co/models/{self.model}'
            payload = {'inputs': request.prompt, 'parameters': {'max_new_tokens': request.max_output_tokens, 'temperature': request.temperature, 'return_full_text': False}}
        resp = self.session.post(url, headers=self._get_headers(), json=payload, timeout=self.timeout)
        resp.raise_for_status()
        end_time = time.perf_counter()
        data = resp.json()
        raw_usage = None
        finish_reason = None
        is_estimated = False
        if isinstance(data, dict) and 'choices' in data:
            choice = data['choices'][0]
            text = choice.get('message', {}).get('content', '')
            finish_reason = choice.get('finish_reason')
            raw_usage = data.get('usage', {})
            input_tokens = raw_usage.get('prompt_tokens')
            output_tokens = raw_usage.get('completion_tokens')
        elif isinstance(data, list) and len(data) > 0 and ('generated_text' in data[0]):
            text = data[0]['generated_text']
            input_tokens = None
            output_tokens = None
        elif isinstance(data, dict) and 'generated_text' in data:
            text = data['generated_text']
            input_tokens = None
            output_tokens = None
        else:
            text = str(data)
            input_tokens = None
            output_tokens = None
        if input_tokens is None:
            input_tokens = self.estimate_tokens(request.prompt)
            is_estimated = True
        if output_tokens is None:
            output_tokens = self.estimate_tokens(text)
            is_estimated = True
        latency = calculate_latency(start_time, end_time)
        return NormalizedResponse(provider=self.name, model=request.model or self.model, text=text, start_time=start_time, first_token_time=None, end_time=end_time, input_tokens=int(input_tokens), output_tokens=int(output_tokens), token_usage_estimated=is_estimated, finish_reason=finish_reason, raw_usage=raw_usage, error=None, ttft=None, latency=latency, decode_time=None, tpot=None, generation_tokens_per_second=None)

    def _do_generate_stream(self, request: BenchmarkRequest) -> NormalizedResponse:
        start_time = time.perf_counter()
        if self._is_chat_router():
            url = f"{self.base_url.rstrip('/')}/chat/completions"
            messages = []
            if request.system_prompt:
                messages.append({'role': 'system', 'content': request.system_prompt})
            messages.append({'role': 'user', 'content': request.prompt})
            payload: Dict[str, Any] = {'model': request.model or self.model, 'messages': messages, 'max_tokens': request.max_output_tokens, 'temperature': request.temperature, 'stream': True, 'stream_options': {'include_usage': True}}
        else:
            url = self.base_url.rstrip('/') if 'endpoints.huggingface.cloud' in self.base_url else f'https://api-inference.huggingface.co/models/{self.model}'
            payload = {'inputs': request.prompt, 'parameters': {'max_new_tokens': request.max_output_tokens, 'temperature': request.temperature, 'return_full_text': False}, 'stream': True}
        resp = self.session.post(url, headers=self._get_headers(), json=payload, stream=True, timeout=self.timeout)
        resp.raise_for_status()
        first_token_time: Optional[float] = None
        chunks: List[str] = []
        finish_reason: Optional[str] = None
        raw_usage: Optional[Dict[str, Any]] = None
        for line in resp.iter_lines():
            if not line:
                continue
            current_time = time.perf_counter()
            line_str = line.decode('utf-8') if isinstance(line, bytes) else line
            if not line_str.startswith('data: '):
                continue
            data_content = line_str[6:].strip()
            if data_content == '[DONE]':
                break
            try:
                chunk = json.loads(data_content)
            except Exception:
                continue
            if isinstance(chunk, dict):
                if 'usage' in chunk and chunk['usage']:
                    raw_usage = chunk['usage']
                if 'choices' in chunk and chunk['choices']:
                    delta = chunk['choices'][0].get('delta', {})
                    content = delta.get('content', '')
                    if content:
                        if first_token_time is None:
                            first_token_time = current_time
                        chunks.append(content)
                    if chunk['choices'][0].get('finish_reason'):
                        finish_reason = chunk['choices'][0]['finish_reason']
                elif 'token' in chunk and isinstance(chunk['token'], dict):
                    token_text = chunk['token'].get('text', '')
                    if token_text:
                        if first_token_time is None:
                            first_token_time = current_time
                        chunks.append(token_text)
        end_time = time.perf_counter()
        full_text = ''.join(chunks)
        is_estimated = False
        if raw_usage and 'prompt_tokens' in raw_usage and ('completion_tokens' in raw_usage):
            input_tokens = raw_usage['prompt_tokens']
            output_tokens = raw_usage['completion_tokens']
        else:
            input_tokens = self.estimate_tokens(request.prompt)
            output_tokens = len(chunks) if chunks else self.estimate_tokens(full_text)
            is_estimated = True
        ttft = calculate_ttft(start_time, first_token_time)
        latency = calculate_latency(start_time, end_time)
        decode_time = calculate_decode_time(first_token_time, end_time)
        tpot = calculate_tpot(decode_time, output_tokens)
        gen_speed = calculate_generation_speed(decode_time, output_tokens)
        return NormalizedResponse(provider=self.name, model=request.model or self.model, text=full_text, start_time=start_time, first_token_time=first_token_time, end_time=end_time, input_tokens=int(input_tokens), output_tokens=int(output_tokens), token_usage_estimated=is_estimated, finish_reason=finish_reason, raw_usage=raw_usage, error=None, ttft=ttft, latency=latency, decode_time=decode_time, tpot=tpot, generation_tokens_per_second=gen_speed)
