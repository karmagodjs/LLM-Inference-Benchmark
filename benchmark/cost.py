from typing import Any, Dict, Optional, Union
from .config import CostConfig, PricingConfig
from .providers.base import ProviderPricing

def calculate_cost_metrics(cost_config: Optional[Union[CostConfig, PricingConfig, ProviderPricing]], total_input_tokens: int, total_output_tokens: int, completed_requests: int, benchmark_duration_seconds: float) -> Optional[Dict[str, Any]]:
    if cost_config is None:
        return None
    if isinstance(cost_config, CostConfig):
        if not cost_config.enabled:
            return None
        input_rate = cost_config.input_cost_per_1m_tokens
        output_rate = cost_config.output_cost_per_1m_tokens
        gpu_hourly = cost_config.gpu_hourly_cost
        currency = 'USD'
    elif isinstance(cost_config, (PricingConfig, ProviderPricing)):
        input_rate = cost_config.input_per_1m_tokens
        output_rate = cost_config.output_per_1m_tokens
        gpu_hourly = 0.0
        currency = cost_config.currency
        if input_rate == 0.0 and output_rate == 0.0:
            return None
    else:
        return None
    input_cost = total_input_tokens / 1000000.0 * input_rate
    output_cost = total_output_tokens / 1000000.0 * output_rate
    token_cost = input_cost + output_cost
    duration_hours = benchmark_duration_seconds / 3600.0
    gpu_cost = duration_hours * gpu_hourly
    total_cost = token_cost + gpu_cost
    total_tokens = total_input_tokens + total_output_tokens
    cost_per_request = total_cost / completed_requests if completed_requests > 0 else 0.0
    cost_per_1m_output_tokens = total_cost / total_output_tokens * 1000000.0 if total_output_tokens > 0 else 0.0
    cost_per_1m_total_tokens = total_cost / total_tokens * 1000000.0 if total_tokens > 0 else 0.0
    return {'enabled': True, 'currency': currency, 'input_cost_usd': round(input_cost, 6), 'output_cost_usd': round(output_cost, 6), 'total_cost_usd': round(total_cost, 6), 'token_cost_usd': round(token_cost, 6), 'gpu_compute_cost_usd': round(gpu_cost, 6), 'cost_per_request_usd': round(cost_per_request, 6), 'cost_per_1m_output_tokens_usd': round(cost_per_1m_output_tokens, 4), 'cost_per_1m_total_tokens_usd': round(cost_per_1m_total_tokens, 4)}
