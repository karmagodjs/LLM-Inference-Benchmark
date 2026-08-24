from benchmark.config import CostConfig
from benchmark.cost import calculate_cost_metrics

def test_cost_disabled():
    cfg = CostConfig(enabled=False)
    metrics = calculate_cost_metrics(cost_config=cfg, total_input_tokens=1000, total_output_tokens=1000, completed_requests=10, benchmark_duration_seconds=60.0)
    assert metrics is None

def test_cost_calculation():
    cfg = CostConfig(enabled=True, gpu_hourly_cost=3.6, input_cost_per_1m_tokens=0.5, output_cost_per_1m_tokens=1.5)
    metrics = calculate_cost_metrics(cost_config=cfg, total_input_tokens=1000000, total_output_tokens=1000000, completed_requests=100, benchmark_duration_seconds=3600.0)
    assert metrics is not None
    assert metrics['enabled'] is True
    assert metrics['token_cost_usd'] == 2.0
    assert metrics['gpu_compute_cost_usd'] == 3.6
    assert metrics['total_cost_usd'] == 5.6
    assert metrics['cost_per_request_usd'] == 0.056
    assert metrics['cost_per_1m_output_tokens_usd'] == 5.6
    assert metrics['cost_per_1m_total_tokens_usd'] == 2.8
