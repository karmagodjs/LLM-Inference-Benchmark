import json
import time
from typing import Any, Dict, List, Optional, Tuple
import requests
from benchmark.schemas import BenchmarkRequest, NormalizedResponse
from benchmark.metrics import calculate_decode_time, calculate_generation_speed, calculate_latency, calculate_tpot, calculate_ttft
from .base import InferenceProvider, ProviderPricing

class AnthropicProvider(InferenceProvider):

    def __init__(self, model: str='claude-3-5-sonnet-20241022', api_key_env: str='ANTHROPIC_API_KEY', api_key: Optional[str]=None, base_url: str='https://api.anthropic.com/v1', timeout: int=300, requests_per_second_limit: Optional[float]=None, max_retries: int=3, initial_backoff: float=1.0, pricing: Optional[ProviderPricing]=None, extra_headers: Optional[Dict[str, str]]=None):
        super().__init__(name='anthropic', model=model, api_key_env=api_key_env, api_key=api_key, base_url=base_url or 'https://api.anthropic.com/v1', timeout=timeout, requests_per_second_limit=requests_per_second_limit, max_retries=max_retries, initial_backoff=initial_backoff, pricing=pricing, extra_headers=extra_headers)

    def _get_headers(self) -> Dict[str, str]:
        headers = {'Content-Type': 'application/json', 'x-api-key': self.api_key, 'anthropic-version': '2023-06-01'}
        if self.extra_headers:
            headers.update(self.extra_headers)
        return headers

    def health_check(self) -> Tuple[bool, str]:
        valid, msg = self.validate_credentials()
        if not valid:
            return (False, f'Anthropic credential check failed: {msg}')
        url = f'{self.base_url}/models'
        try:
            resp = self.session.get(url, headers=self._get_headers(), timeout=min(self.timeout, 10))
            if resp.status_code == 200:
                return (True, f'Anthropic API reachable and authenticated. Model: {self.model}')
            elif resp.status_code == 401:
                return (False, 'Anthropic API key is invalid or unauthorized (HTTP 401).')
            elif resp.status_code == 404:
                return (True, f'Anthropic API credentials valid. Model: {self.model}')
            else:
                return (False, f'Anthropic API returned status code {resp.status_code}: {resp.text}')
        except Exception as e:
            return (False, f'Failed to connect to Anthropic API at {self.base_url}: {e}')

    def list_models(self) -> List[str]:
        valid, _ = self.validate_credentials()
        if not valid:
            return []
        url = f'{self.base_url}/models'
        try:
            resp = self.session.get(url, headers=self._get_headers(), timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                return sorted([m.get('id', '') for m in data.get('data', []) if m.get('id')])
        except Exception:
            pass
        return ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229']

    def _build_payload(self, request: BenchmarkRequest, stream: bool=False) -> Dict[str, Any]:
        payload: Dict[str, Any] = {'model': request.model or self.model, 'messages': [{'role': 'user', 'content': request.prompt}], 'max_tokens': request.max_output_tokens, 'temperature': request.temperature, 'stream': stream}
        if request.system_prompt:
            payload['system'] = request.system_prompt
        return payload

    def _do_generate(self, request: BenchmarkRequest) -> NormalizedResponse:
        url = f'{self.base_url}/messages'
        payload = self._build_payload(request, stream=False)
        start_time = time.perf_counter()
        resp = self.session.post(url, headers=self._get_headers(), json=payload, timeout=self.timeout)
        resp.raise_for_status()
        end_time = time.perf_counter()
        data = resp.json()
        content = data.get('content', [])
        text = ''.join((b.get('text', '') for b in content if b.get('type') == 'text'))
        finish_reason = data.get('stop_reason')
        usage = data.get('usage', {})
        input_tokens = usage.get('input_tokens')
        output_tokens = usage.get('output_tokens')
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
        url = f'{self.base_url}/messages'
        payload = self._build_payload(request, stream=True)
        start_time = time.perf_counter()
        resp = self.session.post(url, headers=self._get_headers(), json=payload, stream=True, timeout=self.timeout)
        resp.raise_for_status()
        first_token_time: Optional[float] = None
        chunks: List[str] = []
        finish_reason: Optional[str] = None
        input_tokens: Optional[int] = None
        output_tokens: Optional[int] = None
        raw_usage: Dict[str, Any] = {}
        for line in resp.iter_lines():
            if not line:
                continue
            current_time = time.perf_counter()
            line_str = line.decode('utf-8') if isinstance(line, bytes) else line
            if line_str.startswith('data: '):
                data_content = line_str[6:].strip()
                try:
                    event_data = json.loads(data_content)
                except Exception:
                    continue
                event_type = event_data.get('type')
                if event_type == 'message_start':
                    msg = event_data.get('message', {})
                    usage = msg.get('usage', {})
                    if 'input_tokens' in usage:
                        input_tokens = usage['input_tokens']
                        raw_usage['input_tokens'] = input_tokens
                elif event_type == 'content_block_delta':
                    delta = event_data.get('delta', {})
                    if delta.get('type') == 'text_delta':
                        t = delta.get('text', '')
                        if t:
                            if first_token_time is None:
                                first_token_time = current_time
                            chunks.append(t)
                elif event_type == 'message_delta':
                    usage = event_data.get('usage', {})
                    if 'output_tokens' in usage:
                        output_tokens = usage['output_tokens']
                        raw_usage['output_tokens'] = output_tokens
                    delta = event_data.get('delta', {})
                    if delta.get('stop_reason'):
                        finish_reason = delta['stop_reason']
        end_time = time.perf_counter()
        full_text = ''.join(chunks)
        is_estimated = False
        if input_tokens is None:
            input_tokens = self.estimate_tokens(request.prompt)
            is_estimated = True
        if output_tokens is None:
            output_tokens = len(chunks) if chunks else self.estimate_tokens(full_text)
            is_estimated = True
        ttft = calculate_ttft(start_time, first_token_time)
        latency = calculate_latency(start_time, end_time)
        decode_time = calculate_decode_time(first_token_time, end_time)
        tpot = calculate_tpot(decode_time, output_tokens)
        gen_speed = calculate_generation_speed(decode_time, output_tokens)
        return NormalizedResponse(provider=self.name, model=request.model or self.model, text=full_text, start_time=start_time, first_token_time=first_token_time, end_time=end_time, input_tokens=int(input_tokens), output_tokens=int(output_tokens), token_usage_estimated=is_estimated, finish_reason=finish_reason, raw_usage=raw_usage, error=None, ttft=ttft, latency=latency, decode_time=decode_time, tpot=tpot, generation_tokens_per_second=gen_speed)
