import os
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional, Tuple
import requests
from benchmark.schemas import BenchmarkRequest, NormalizedResponse
from benchmark.metrics import calculate_decode_time, calculate_generation_speed, calculate_latency, calculate_tpot, calculate_ttft

@dataclass
class ProviderPricing:
    input_per_1m_tokens: float = 0.0
    output_per_1m_tokens: float = 0.0
    currency: str = 'USD'

class InferenceProvider(ABC):

    def __init__(self, name: str, model: str, api_key_env: Optional[str]=None, api_key: Optional[str]=None, base_url: Optional[str]=None, timeout: int=300, requests_per_second_limit: Optional[float]=None, max_retries: int=3, initial_backoff: float=1.0, pricing: Optional[ProviderPricing]=None, extra_headers: Optional[Dict[str, str]]=None):
        self.name = name.lower().strip()
        self.model = model.strip()
        self.api_key_env = api_key_env
        self.api_key = api_key or (os.environ.get(api_key_env, '') if api_key_env else '')
        self.base_url = (base_url or '').rstrip('/')
        self.timeout = timeout
        self.rps_limit = requests_per_second_limit
        self.max_retries = max(0, max_retries)
        self.initial_backoff = initial_backoff
        self.pricing = pricing
        self.extra_headers = extra_headers or {}
        self._last_request_time = 0.0
        self._session: Optional[requests.Session] = None

    def _create_session(self) -> requests.Session:
        session = requests.Session()
        adapter = requests.adapters.HTTPAdapter(pool_connections=100, pool_maxsize=100, max_retries=0)
        session.mount('http://', adapter)
        session.mount('https://', adapter)
        return session

    @property
    def session(self) -> requests.Session:
        if self._session is None:
            self._session = self._create_session()
        return self._session

    def close(self) -> None:
        if self._session is not None:
            self._session.close()
            self._session = None

    def validate_credentials(self) -> Tuple[bool, str]:
        if self.api_key_env:
            val = os.environ.get(self.api_key_env, '').strip()
            if not val and (not self.api_key):
                return (False, f"API key environment variable '{self.api_key_env}' is not set or empty.")
        return (True, 'Credentials valid.')

    @abstractmethod
    def health_check(self) -> Tuple[bool, str]:
        pass

    @abstractmethod
    def list_models(self) -> List[str]:
        pass

    def supports_streaming(self) -> bool:
        return True

    def supports_ttft(self) -> bool:
        return self.supports_streaming()

    def estimate_tokens(self, text: str) -> int:
        if not text:
            return 0
        char_estimate = max(1, len(text) // 4)
        word_estimate = max(1, int(len(text.split()) * 1.3))
        return max(char_estimate, word_estimate)

    def _apply_rate_limit(self) -> None:
        if self.rps_limit and self.rps_limit > 0:
            min_interval = 1.0 / self.rps_limit
            now = time.perf_counter()
            elapsed = now - self._last_request_time
            if elapsed < min_interval:
                time.sleep(min_interval - elapsed)
            self._last_request_time = time.perf_counter()

    def execute_with_retry(self, request_fn: Callable[[BenchmarkRequest], NormalizedResponse], request: BenchmarkRequest) -> NormalizedResponse:
        self._apply_rate_limit()
        retries = 0
        backoff = self.initial_backoff
        rate_limited = False
        last_error_type = None
        while True:
            try:
                resp = request_fn(request)
                resp.retry_count = retries
                resp.rate_limited = rate_limited
                if resp.error:
                    resp.latency = calculate_latency(resp.start_time, resp.end_time)
                return resp
            except Exception as e:
                err_msg = str(e)
                status_code = None
                if isinstance(e, requests.HTTPError) and e.response is not None:
                    status_code = e.response.status_code
                is_rate_limit = status_code == 429 or '429' in err_msg or 'rate limit' in err_msg.lower()
                is_transient = is_rate_limit or (status_code is not None and status_code >= 500) or isinstance(e, (requests.ConnectionError, requests.Timeout)) or ('timeout' in err_msg.lower())
                if is_rate_limit:
                    rate_limited = True
                    last_error_type = 'RateLimitExceeded (429)'
                elif status_code is not None:
                    last_error_type = f'HTTPStatus_{status_code}'
                else:
                    last_error_type = type(e).__name__
                if is_transient and retries < self.max_retries:
                    retries += 1
                    sleep_time = backoff
                    if isinstance(e, requests.HTTPError) and e.response is not None:
                        retry_after = e.response.headers.get('Retry-After')
                        if retry_after and retry_after.isdigit():
                            sleep_time = max(sleep_time, float(retry_after))
                    time.sleep(sleep_time)
                    backoff *= 2.0
                    continue
                end_time = time.perf_counter()
                return NormalizedResponse(provider=self.name, model=self.model, text='', start_time=time.perf_counter(), first_token_time=None, end_time=end_time, input_tokens=0, output_tokens=0, token_usage_estimated=False, finish_reason='error', raw_usage=None, error=err_msg, retry_count=retries, rate_limited=rate_limited, error_type=last_error_type, ttft=None, latency=0.0, decode_time=None, tpot=None, generation_tokens_per_second=None)

    @abstractmethod
    def _do_generate(self, request: BenchmarkRequest) -> NormalizedResponse:
        pass

    @abstractmethod
    def _do_generate_stream(self, request: BenchmarkRequest) -> NormalizedResponse:
        pass

    def generate(self, request: BenchmarkRequest) -> NormalizedResponse:
        return self.execute_with_retry(self._do_generate, request)

    def generate_stream(self, request: BenchmarkRequest) -> NormalizedResponse:
        if not self.supports_streaming():
            res = self.generate(request)
            res.first_token_time = None
            res.ttft = None
            return res
        return self.execute_with_retry(self._do_generate_stream, request)
