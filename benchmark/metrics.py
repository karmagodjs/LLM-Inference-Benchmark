import statistics
from typing import Any, Dict, List, Optional

def percentile(values: List[float], p: float) -> float:
    if not values:
        return 0.0
    if p <= 0:
        return float(min(values))
    if p >= 100:
        return float(max(values))
    sorted_values = sorted(values)
    n = len(sorted_values)
    if n == 1:
        return float(sorted_values[0])
    position = (n - 1) * (p / 100.0)
    lower = int(position)
    upper = min(lower + 1, n - 1)
    fraction = position - lower
    return float(sorted_values[lower] + (sorted_values[upper] - sorted_values[lower]) * fraction)

def calculate_statistics(values: List[float]) -> Dict[str, Any]:
    if not values:
        return {'count': 0, 'mean': 0.0, 'min': 0.0, 'max': 0.0, 'p50': 0.0, 'p90': 0.0, 'p95': 0.0, 'p99': 0.0}
    return {'count': len(values), 'mean': float(statistics.mean(values)), 'min': float(min(values)), 'max': float(max(values)), 'p50': percentile(values, 50.0), 'p90': percentile(values, 90.0), 'p95': percentile(values, 95.0), 'p99': percentile(values, 99.0)}

def calculate_ttft(start_time: float, first_token_time: Optional[float]) -> Optional[float]:
    if first_token_time is None or first_token_time < start_time:
        return None
    return first_token_time - start_time

def calculate_latency(start_time: float, end_time: float) -> float:
    if end_time < start_time:
        return 0.0
    return end_time - start_time

def calculate_decode_time(first_token_time: Optional[float], end_time: float) -> Optional[float]:
    if first_token_time is None or end_time < first_token_time:
        return None
    return end_time - first_token_time

def calculate_tpot(decode_time: Optional[float], output_tokens: int) -> Optional[float]:
    if decode_time is None or decode_time <= 0:
        return 0.0
    if output_tokens <= 1:
        return 0.0
    return decode_time / (output_tokens - 1)

def calculate_generation_speed(decode_time: Optional[float], output_tokens: int) -> Optional[float]:
    if decode_time is None or decode_time <= 0:
        return 0.0
    if output_tokens <= 1:
        return 0.0
    return (output_tokens - 1) / decode_time

def calculate_aggregate_throughput(total_output_tokens: int, benchmark_duration_seconds: float) -> float:
    if benchmark_duration_seconds <= 0:
        return 0.0
    return total_output_tokens / benchmark_duration_seconds

def calculate_request_throughput(completed_requests: int, benchmark_duration_seconds: float) -> float:
    if benchmark_duration_seconds <= 0:
        return 0.0
    return completed_requests / benchmark_duration_seconds
