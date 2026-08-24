import json
import time
from typing import Any, Dict, List, Optional, Tuple
import requests
from benchmark.schemas import BenchmarkRequest, NormalizedResponse
from benchmark.metrics import calculate_decode_time, calculate_generation_speed, calculate_latency, calculate_tpot, calculate_ttft
from .base import InferenceProvider, ProviderPricing

class OllamaProvider(InferenceProvider):

    def __init__(self, model: str='qwen2.5:3b', base_url: str='http://localhost:11434', timeout: int=300, requests_per_second_limit: Optional[float]=None, max_retries: int=3, initial_backoff: float=1.0, pricing: Optional[ProviderPricing]=None, extra_headers: Optional[Dict[str, str]]=None):
        super().__init__(name='ollama', model=model, api_key_env=None, api_key=None, base_url=base_url or 'http://localhost:11434', timeout=timeout, requests_per_second_limit=requests_per_second_limit, max_retries=max_retries, initial_backoff=initial_backoff, pricing=pricing, extra_headers=extra_headers)

    def health_check(self) -> Tuple[bool, str]:
        url = f'{self.base_url}/api/tags'
        try:
            response = self.session.get(url, timeout=5)
            if response.status_code != 200:
                return (False, f'Ollama server returned status code {response.status_code}. Please check your Ollama instance.')
            data = response.json()
            models_list = data.get('models', [])
            installed_names = [m.get('name', '') for m in models_list]
            target = self.model.strip()
            target_base = target[:-7] if target.endswith(':latest') else target
            found = False
            for name in installed_names:
                name_clean = name.strip()
                name_base = name_clean[:-7] if name_clean.endswith(':latest') else name_clean
                if name_clean == target or name_base == target_base or name_clean == f'{target}:latest' or (target == f'{name_clean}:latest') or name_clean.startswith(f'{target}:'):
                    found = True
                    break
            if not found:
                available_str = ', '.join(installed_names) if installed_names else 'None'
                return (False, f"Model '{self.model}' is not available in Ollama.\nInstalled models: {available_str}\nRun: ollama pull {self.model}")
            return (True, f"Ollama is running and model '{self.model}' is available.")
        except requests.exceptions.ConnectionError:
            return (False, 'Ollama is not running. Please start Ollama with: ollama serve')
        except Exception as e:
            return (False, f'Ollama health check failed with error: {e}')

    def list_models(self) -> List[str]:
        url = f'{self.base_url}/api/tags'
        try:
            resp = self.session.get(url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                return sorted([m.get('name', '') for m in data.get('models', []) if m.get('name')])
        except Exception:
            pass
        return []

    def _do_generate(self, request: BenchmarkRequest) -> NormalizedResponse:
        url = f'{self.base_url}/api/generate'
        payload = {'model': request.model or self.model, 'prompt': request.prompt, 'stream': False, 'options': {'num_predict': request.max_output_tokens, 'temperature': request.temperature}}
        if request.system_prompt:
            payload['system'] = request.system_prompt
        start_time = time.perf_counter()
        response = self.session.post(url, json=payload, timeout=self.timeout)
        response.raise_for_status()
        end_time = time.perf_counter()
        data = response.json()
        text = data.get('response', '')
        eval_count = data.get('eval_count', 0)
        prompt_eval_count = data.get('prompt_eval_count', 0)
        is_estimated = False
        if eval_count == 0:
            eval_count = self.estimate_tokens(text)
            is_estimated = True
        if prompt_eval_count == 0:
            prompt_eval_count = self.estimate_tokens(request.prompt)
        latency = calculate_latency(start_time, end_time)
        return NormalizedResponse(provider=self.name, model=request.model or self.model, text=text, start_time=start_time, first_token_time=None, end_time=end_time, input_tokens=prompt_eval_count, output_tokens=eval_count, token_usage_estimated=is_estimated, finish_reason=data.get('done_reason', 'stop' if data.get('done') else None), raw_usage=data, error=None, ttft=None, latency=latency, decode_time=None, tpot=None, generation_tokens_per_second=None)

    def _do_generate_stream(self, request: BenchmarkRequest) -> NormalizedResponse:
        url = f'{self.base_url}/api/generate'
        payload = {'model': request.model or self.model, 'prompt': request.prompt, 'stream': True, 'options': {'num_predict': request.max_output_tokens, 'temperature': request.temperature}}
        if request.system_prompt:
            payload['system'] = request.system_prompt
        start_time = time.perf_counter()
        response = self.session.post(url, json=payload, stream=True, timeout=self.timeout)
        response.raise_for_status()
        first_token_time: Optional[float] = None
        chunks: List[str] = []
        final_data: Optional[Dict[str, Any]] = None
        for line in response.iter_lines():
            if not line:
                continue
            current_time = time.perf_counter()
            data = json.loads(line.decode('utf-8') if isinstance(line, bytes) else line)
            token = data.get('response', '')
            if token and first_token_time is None:
                first_token_time = current_time
            if token:
                chunks.append(token)
            if data.get('done', False):
                final_data = data
                if first_token_time is None:
                    first_token_time = current_time
        end_time = time.perf_counter()
        full_text = ''.join(chunks)
        eval_count = 0
        prompt_eval_count = 0
        is_estimated = False
        if final_data:
            eval_count = final_data.get('eval_count', len(chunks))
            prompt_eval_count = final_data.get('prompt_eval_count', 0)
        else:
            eval_count = len(chunks)
            is_estimated = True
        if prompt_eval_count == 0:
            prompt_eval_count = self.estimate_tokens(request.prompt)
        ttft = calculate_ttft(start_time, first_token_time)
        latency = calculate_latency(start_time, end_time)
        decode_time = calculate_decode_time(first_token_time, end_time)
        tpot = calculate_tpot(decode_time, eval_count)
        gen_speed = calculate_generation_speed(decode_time, eval_count)
        return NormalizedResponse(provider=self.name, model=request.model or self.model, text=full_text, start_time=start_time, first_token_time=first_token_time, end_time=end_time, input_tokens=prompt_eval_count, output_tokens=eval_count, token_usage_estimated=is_estimated, finish_reason='stop' if final_data and final_data.get('done') else None, raw_usage=final_data, error=None, ttft=ttft, latency=latency, decode_time=decode_time, tpot=tpot, generation_tokens_per_second=gen_speed)
