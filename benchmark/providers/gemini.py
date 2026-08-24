import json
import time
from typing import Any, Dict, List, Optional, Tuple
import requests
from benchmark.schemas import BenchmarkRequest, NormalizedResponse
from benchmark.metrics import calculate_decode_time, calculate_generation_speed, calculate_latency, calculate_tpot, calculate_ttft
from .base import InferenceProvider, ProviderPricing

class GeminiProvider(InferenceProvider):

    def __init__(self, model: str='gemini-2.5-flash', api_key_env: str='GEMINI_API_KEY', api_key: Optional[str]=None, base_url: str='https://generativelanguage.googleapis.com/v1beta', timeout: int=300, requests_per_second_limit: Optional[float]=None, max_retries: int=3, initial_backoff: float=1.0, pricing: Optional[ProviderPricing]=None, extra_headers: Optional[Dict[str, str]]=None):
        super().__init__(name='gemini', model=model, api_key_env=api_key_env, api_key=api_key, base_url=base_url or 'https://generativelanguage.googleapis.com/v1beta', timeout=timeout, requests_per_second_limit=requests_per_second_limit, max_retries=max_retries, initial_backoff=initial_backoff, pricing=pricing, extra_headers=extra_headers)

    def _get_model_name(self, model: Optional[str]=None) -> str:
        m = (model or self.model).strip()
        if m.startswith('models/'):
            return m[7:]
        return m

    def health_check(self) -> Tuple[bool, str]:
        valid, msg = self.validate_credentials()
        if not valid:
            return (False, f'Gemini credential check failed: {msg}')
        url = f'{self.base_url}/models?key={self.api_key}'
        headers = {'Content-Type': 'application/json'}
        if self.extra_headers:
            headers.update(self.extra_headers)
        try:
            resp = self.session.get(url, headers=headers, timeout=min(self.timeout, 10))
            if resp.status_code == 200:
                return (True, f'Gemini API reachable and authenticated. Model: {self.model}')
            elif resp.status_code in (400, 403):
                return (False, f'Gemini API key is invalid or unauthorized (HTTP {resp.status_code}).')
            else:
                return (False, f'Gemini API returned status code {resp.status_code}: {resp.text}')
        except Exception as e:
            return (False, f'Failed to connect to Gemini API: {e}')

    def list_models(self) -> List[str]:
        valid, _ = self.validate_credentials()
        if not valid:
            return []
        url = f'{self.base_url}/models?key={self.api_key}'
        try:
            resp = self.session.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                models = []
                for m in data.get('models', []):
                    name = m.get('name', '')
                    if name.startswith('models/'):
                        name = name[7:]
                    if name:
                        models.append(name)
                return sorted(models)
        except Exception:
            pass
        return []

    def _build_payload(self, request: BenchmarkRequest) -> Dict[str, Any]:
        payload: Dict[str, Any] = {'contents': [{'role': 'user', 'parts': [{'text': request.prompt}]}], 'generationConfig': {'maxOutputTokens': request.max_output_tokens, 'temperature': request.temperature}}
        if request.system_prompt:
            payload['systemInstruction'] = {'parts': [{'text': request.system_prompt}]}
        return payload

    def _do_generate(self, request: BenchmarkRequest) -> NormalizedResponse:
        model_name = self._get_model_name(request.model)
        url = f'{self.base_url}/models/{model_name}:generateContent?key={self.api_key}'
        headers = {'Content-Type': 'application/json'}
        if self.extra_headers:
            headers.update(self.extra_headers)
        payload = self._build_payload(request)
        start_time = time.perf_counter()
        resp = self.session.post(url, headers=headers, json=payload, timeout=self.timeout)
        resp.raise_for_status()
        end_time = time.perf_counter()
        data = resp.json()
        candidates = data.get('candidates', [])
        text = ''
        finish_reason = None
        if candidates:
            parts = candidates[0].get('content', {}).get('parts', [])
            text = ''.join((p.get('text', '') for p in parts))
            finish_reason = candidates[0].get('finishReason')
        usage = data.get('usageMetadata', {})
        input_tokens = usage.get('promptTokenCount')
        output_tokens = usage.get('candidatesTokenCount')
        is_estimated = False
        if input_tokens is None:
            input_tokens = self.estimate_tokens(request.prompt)
            is_estimated = True
        if output_tokens is None:
            output_tokens = self.estimate_tokens(text)
            is_estimated = True
        latency = calculate_latency(start_time, end_time)
        return NormalizedResponse(provider=self.name, model=request.model or self.model, text=text, start_time=start_time, first_token_time=None, end_time=end_time, input_tokens=int(input_tokens), output_tokens=int(output_tokens), token_usage_estimated=is_estimated, finish_reason=finish_reason, raw_usage=usage, error=None, ttft=None, latency=latency, decode_time=None, tpot=None, generation_tokens_per_second=None)

    def _do_generate_stream(self, request: BenchmarkRequest) -> NormalizedResponse:
        model_name = self._get_model_name(request.model)
        url = f'{self.base_url}/models/{model_name}:streamGenerateContent?alt=sse&key={self.api_key}'
        headers = {'Content-Type': 'application/json'}
        if self.extra_headers:
            headers.update(self.extra_headers)
        payload = self._build_payload(request)
        start_time = time.perf_counter()
        resp = self.session.post(url, headers=headers, json=payload, stream=True, timeout=self.timeout)
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
            try:
                chunk = json.loads(data_content)
            except Exception:
                continue
            if 'usageMetadata' in chunk and chunk['usageMetadata']:
                raw_usage = chunk['usageMetadata']
            candidates = chunk.get('candidates', [])
            if candidates:
                parts = candidates[0].get('content', {}).get('parts', [])
                for p in parts:
                    t = p.get('text', '')
                    if t:
                        if first_token_time is None:
                            first_token_time = current_time
                        chunks.append(t)
                if candidates[0].get('finishReason'):
                    finish_reason = candidates[0]['finishReason']
        end_time = time.perf_counter()
        full_text = ''.join(chunks)
        is_estimated = False
        if raw_usage and 'promptTokenCount' in raw_usage and ('candidatesTokenCount' in raw_usage):
            input_tokens = raw_usage['promptTokenCount']
            output_tokens = raw_usage['candidatesTokenCount']
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
