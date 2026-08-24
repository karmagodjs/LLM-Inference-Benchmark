from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Any, Dict, List, Optional

@dataclass
class BenchmarkRequest:
    provider: str
    model: str
    prompt: str
    max_output_tokens: int = 128
    temperature: float = 0.7
    stream: bool = True
    system_prompt: Optional[str] = None
    request_id: Optional[str] = None
    extra_params: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class NormalizedResponse:
    provider: str
    model: str
    text: str = ''
    start_time: float = 0.0
    first_token_time: Optional[float] = None
    end_time: float = 0.0
    input_tokens: int = 0
    output_tokens: int = 0
    token_usage_estimated: bool = False
    finish_reason: Optional[str] = None
    raw_usage: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    retry_count: int = 0
    rate_limited: bool = False
    error_type: Optional[str] = None
    ttft: Optional[float] = None
    latency: float = 0.0
    decode_time: Optional[float] = None
    tpot: Optional[float] = None
    generation_tokens_per_second: Optional[float] = None

    @property
    def success(self) -> bool:
        return self.error is None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class RequestResult:
    request_id: str
    success: bool
    start_time: float
    end_time: float
    latency: float
    input_tokens: int = 0
    output_tokens: int = 0
    token_usage_estimated: bool = False
    first_token_time: Optional[float] = None
    ttft: Optional[float] = None
    decode_time: Optional[float] = None
    tpot: Optional[float] = None
    generation_tokens_per_second: Optional[float] = None
    error_message: Optional[str] = None
    retry_count: int = 0
    rate_limited: bool = False
    error_type: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class BenchmarkResult:
    experiment_id: str
    model: str
    framework: str
    quantization: str
    input_tokens: int
    actual_input_tokens_avg: float
    output_tokens_requested: int
    concurrency: int
    requests: int
    completed: int
    failed: int
    benchmark_duration_seconds: float
    total_output_tokens: int
    requests_per_second: float
    throughput_tokens_per_second: float
    ttft_p50: Optional[float]
    ttft_p95: Optional[float]
    latency_p50: float
    latency_p95: float
    decode_time_p50: Optional[float]
    decode_time_p95: Optional[float]
    tpot_p50: Optional[float]
    tpot_p95: Optional[float]
    generation_tokens_per_second_p50: Optional[float]
    generation_tokens_per_second_p95: Optional[float]
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    provider: str = 'ollama'
    streaming_supported: bool = True
    ttft_supported: bool = True
    token_usage_estimated: bool = False
    ttft_p90: Optional[float] = None
    ttft_p99: Optional[float] = None
    latency_p90: Optional[float] = None
    latency_p99: Optional[float] = None
    retry_count: int = 0
    rate_limited_count: int = 0
    error_summary: Optional[str] = None
    input_cost: Optional[float] = None
    output_cost: Optional[float] = None
    total_cost: Optional[float] = None
    cost_per_request: Optional[float] = None
    cost_per_1m_output_tokens: Optional[float] = None
    cost_per_1m_total_tokens: Optional[float] = None
    startup_time_seconds: Optional[float] = None
    model_loading_time_seconds: Optional[float] = None
    gpu_power_watts: Optional[float] = None
    benchmark_mode: str = 'model_comparison'
    stats_raw: Optional[Dict[str, Any]] = None
    system_metrics: Optional[Dict[str, Any]] = None
    cost_metrics: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        if self.stats_raw is None:
            data.pop('stats_raw', None)
        if self.system_metrics is None:
            data.pop('system_metrics', None)
        if self.cost_metrics is None:
            data.pop('cost_metrics', None)
        return data

    @staticmethod
    def now() -> str:
        return datetime.now().isoformat()
