import argparse
import csv
import json
from pathlib import Path
import sys
from typing import Any, Dict, List

def flatten_benchmark_result(result: Dict[str, Any], exp_meta: Dict[str, Any]) -> Dict[str, Any]:
    flat: Dict[str, Any] = {'experiment_id': result.get('experiment_id', exp_meta.get('experiment_id', '')), 'provider': result.get('provider', result.get('framework', exp_meta.get('model', {}).get('framework', ''))), 'model': result.get('model', exp_meta.get('model', {}).get('name', '')), 'framework': result.get('framework', exp_meta.get('model', {}).get('framework', '')), 'quantization': result.get('quantization', exp_meta.get('model', {}).get('quantization', '')), 'benchmark_mode': result.get('benchmark_mode', exp_meta.get('mode', 'model_comparison')), 'input_tokens': result.get('input_tokens', 0), 'actual_input_tokens_avg': result.get('actual_input_tokens_avg', 0.0), 'output_tokens_requested': result.get('output_tokens_requested', 0), 'concurrency': result.get('concurrency', 1), 'requests': result.get('requests', 0), 'completed': result.get('completed', 0), 'failed': result.get('failed', 0), 'benchmark_duration_seconds': result.get('benchmark_duration_seconds', 0.0), 'total_output_tokens': result.get('total_output_tokens', 0), 'requests_per_second': result.get('requests_per_second', 0.0), 'throughput_tokens_per_second': result.get('throughput_tokens_per_second', 0.0), 'streaming_supported': result.get('streaming_supported', True), 'ttft_supported': result.get('ttft_supported', True), 'token_usage_estimated': result.get('token_usage_estimated', False), 'ttft_p50': result.get('ttft_p50'), 'ttft_p90': result.get('ttft_p90'), 'ttft_p95': result.get('ttft_p95'), 'ttft_p99': result.get('ttft_p99'), 'latency_p50': result.get('latency_p50', 0.0), 'latency_p90': result.get('latency_p90'), 'latency_p95': result.get('latency_p95', 0.0), 'latency_p99': result.get('latency_p99'), 'decode_time_p50': result.get('decode_time_p50'), 'decode_time_p95': result.get('decode_time_p95'), 'tpot_p50': result.get('tpot_p50'), 'tpot_p95': result.get('tpot_p95'), 'generation_tokens_per_second_p50': result.get('generation_tokens_per_second_p50'), 'generation_tokens_per_second_p95': result.get('generation_tokens_per_second_p95'), 'retry_count': result.get('retry_count', 0), 'rate_limited_count': result.get('rate_limited_count', 0), 'input_cost': result.get('input_cost'), 'output_cost': result.get('output_cost'), 'total_cost': result.get('total_cost'), 'cost_per_request': result.get('cost_per_request'), 'cost_per_1m_output_tokens': result.get('cost_per_1m_output_tokens'), 'cost_per_1m_total_tokens': result.get('cost_per_1m_total_tokens'), 'startup_time_seconds': result.get('startup_time_seconds'), 'model_loading_time_seconds': result.get('model_loading_time_seconds'), 'timestamp': result.get('timestamp', ''), 'error_summary': result.get('error_summary')}
    sys_metrics = result.get('system_metrics')
    if isinstance(sys_metrics, dict):
        flat['cpu_percent'] = sys_metrics.get('cpu_percent')
        flat['cpu_percent_peak'] = sys_metrics.get('cpu_percent_peak')
        flat['ram_percent'] = sys_metrics.get('ram_percent')
        flat['ram_used_gb'] = sys_metrics.get('ram_used_gb')
        flat['ram_used_gb_peak'] = sys_metrics.get('ram_used_gb_peak')
        flat['gpu_available'] = sys_metrics.get('gpu_available')
        flat['gpu_name'] = sys_metrics.get('gpu_name')
        flat['gpu_utilization'] = sys_metrics.get('gpu_utilization')
        flat['gpu_utilization_peak'] = sys_metrics.get('gpu_utilization_peak')
        flat['gpu_memory_used_mb'] = sys_metrics.get('gpu_memory_used_mb')
        flat['gpu_memory_used_mb_peak'] = sys_metrics.get('gpu_memory_used_mb_peak')
        flat['gpu_power_watts'] = sys_metrics.get('gpu_power_watts')
        flat['gpu_power_watts_peak'] = sys_metrics.get('gpu_power_watts_peak')
    cost_metrics = result.get('cost_metrics')
    if isinstance(cost_metrics, dict):
        flat['cost_per_request_usd'] = cost_metrics.get('cost_per_request_usd')
        flat['cost_per_1m_output_tokens_usd'] = cost_metrics.get('cost_per_1m_output_tokens_usd')
        flat['total_cost_usd'] = cost_metrics.get('total_cost_usd')
    return flat

def export_json_to_csv(json_path: Path, csv_path: Path) -> int:
    if not json_path.exists():
        raise FileNotFoundError(f'Input JSON file not found: {json_path}')
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    if isinstance(data, dict):
        results = data.get('results', [])
        exp_meta = data
    elif isinstance(data, list):
        results = data
        exp_meta = {}
    else:
        raise ValueError('JSON file root must be an object or a list.')
    if not results:
        print(f'[Warning] No benchmark results found in {json_path}')
        return 0
    flattened = [flatten_benchmark_result(r, exp_meta) for r in results]
    primary_order = ['experiment_id', 'provider', 'model', 'framework', 'quantization', 'benchmark_mode', 'input_tokens', 'actual_input_tokens_avg', 'output_tokens_requested', 'concurrency', 'requests', 'completed', 'failed', 'benchmark_duration_seconds', 'total_output_tokens', 'requests_per_second', 'throughput_tokens_per_second', 'streaming_supported', 'ttft_supported', 'token_usage_estimated', 'ttft_p50', 'ttft_p90', 'ttft_p95', 'ttft_p99', 'latency_p50', 'latency_p90', 'latency_p95', 'latency_p99', 'decode_time_p50', 'decode_time_p95', 'tpot_p50', 'tpot_p95', 'generation_tokens_per_second_p50', 'generation_tokens_per_second_p95', 'retry_count', 'rate_limited_count', 'input_cost', 'output_cost', 'total_cost', 'cost_per_request', 'cost_per_1m_output_tokens', 'timestamp', 'error_summary']
    all_keys = set()
    for row in flattened:
        all_keys.update(row.keys())
    remaining_keys = [k for k in all_keys if k not in primary_order]
    fieldnames = primary_order + sorted(remaining_keys)
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(flattened)
    print(f'Successfully exported {len(flattened)} rows from {json_path} -> {csv_path}')
    return len(flattened)

def main():
    parser = argparse.ArgumentParser(description='Export InferBench JSON results to CSV')
    parser.add_argument('--input', '-i', type=str, default='results/concurrency.json', help='Input JSON file path (default: results/concurrency.json)')
    parser.add_argument('--output', '-o', type=str, default='results/concurrency.csv', help='Output CSV file path (default: results/concurrency.csv)')
    args = parser.parse_args()
    in_path = Path(args.input).resolve()
    out_path = Path(args.output).resolve()
    try:
        export_json_to_csv(in_path, out_path)
    except Exception as e:
        print(f'[Error] CSV export failed: {e}', file=sys.stderr)
        sys.exit(1)
if __name__ == '__main__':
    main()
