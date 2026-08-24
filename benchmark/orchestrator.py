import csv
import json
import statistics
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
from .config import BenchmarkConfig, ProviderConfig
from .cost import calculate_cost_metrics
from .provider_factory import ProviderFactory
from .providers.base import InferenceProvider, ProviderPricing
from .runner import BenchmarkRunner
from .schemas import BenchmarkResult
from .system_metrics import SystemMonitor, get_system_snapshot
from .workload_loader import WorkloadLoader

class ExperimentOrchestrator:

    def __init__(self, config: BenchmarkConfig, backend: Optional[Union[InferenceProvider, Any]]=None, providers: Optional[List[InferenceProvider]]=None, workload_loader: Optional[WorkloadLoader]=None):
        self.config = config
        self.loader = workload_loader or WorkloadLoader(config.workload.workload_file)
        self.providers: List[InferenceProvider] = []
        if providers:
            self.providers = providers
        elif backend:
            self.providers = [backend]
        elif config.providers:
            for p_cfg in config.providers:
                pricing = None
                if p_cfg.pricing:
                    pricing = ProviderPricing(input_per_1m_tokens=p_cfg.pricing.input_per_1m_tokens, output_per_1m_tokens=p_cfg.pricing.output_per_1m_tokens, currency=p_cfg.pricing.currency)
                prov = ProviderFactory.get_provider(name=p_cfg.name, model=p_cfg.model, api_key_env=p_cfg.api_key_env, base_url=p_cfg.base_url, requests_per_second_limit=p_cfg.requests_per_second_limit, max_retries=p_cfg.max_retries, pricing=pricing, extra_headers=p_cfg.extra_headers)
                self.providers.append(prov)
        else:
            self.providers = [ProviderFactory.get_provider(name=config.model.framework, model=config.model.name, base_url=config.server.base_url, timeout=config.server.timeout_seconds)]
        self.backend = self.providers[0] if self.providers else None
        self.runner = BenchmarkRunner(self.backend) if self.backend else None

    def print_dry_run_matrix(self) -> List[Tuple[int, int, int]]:
        matrix: List[Tuple[int, int, int]] = []
        for in_tok in self.config.workload.input_tokens:
            for out_tok in self.config.workload.output_tokens:
                for conc in self.config.workload.concurrency:
                    matrix.append((in_tok, out_tok, conc))
        print('\n' + '=' * 70)
        print('InferBench - Dry Run Matrix Plan')
        print('=' * 70)
        print(f'Benchmark Mode: {self.config.mode}')
        print(f"Providers:      {len(self.providers)} ({', '.join((getattr(p, 'name', 'unknown') for p in self.providers))})")
        print(f'Requests:       {self.config.workload.benchmark_requests} per configuration')
        print(f'Warmup:         {self.config.workload.warmup_requests} requests per input level')
        print('-' * 70)
        print(f"{'Provider':<15} {'Model':<25} {'Input':<8} {'Output':<8} {'Conc':<6}")
        print('-' * 70)
        for prov in self.providers:
            prov_name = getattr(prov, 'name', self.config.model.framework)
            prov_model = getattr(prov, 'model', self.config.model.name)
            for in_tok, out_tok, conc in matrix:
                print(f'{prov_name:<15} {prov_model:<25} {in_tok:<8} {out_tok:<8} {conc:<6}')
        print('-' * 70)
        print(f'Total experiment configurations: {len(matrix) * len(self.providers)}\n')
        return matrix

    def run_warmup(self, runner: BenchmarkRunner, warmup_items: List[Dict[str, Any]], output_tokens: int) -> None:
        count = len(warmup_items)
        if count == 0:
            return
        print(f'  [Warmup] Running {count} warmup requests...', end=' ', flush=True)
        for i, item in enumerate(warmup_items):
            runner.run_single_request(request_id=f'warmup_{i + 1}', prompt=item.get('prompt', ''), output_tokens=output_tokens, input_tokens=item.get('actual_input_tokens', 0))
        print('done.')

    def run(self, output_json_path: Optional[Union[str, Path]]=None, output_csv_path: Optional[Union[str, Path]]=None, skip_unhealthy_providers: bool=False) -> Dict[str, Any]:
        experiment_id = datetime.now().strftime('%Y%m%d_%H%M%S')
        all_workloads = self.loader.load()
        print(f'Loaded {len(all_workloads)} total workload items from {self.loader.path}')
        print('\n' + '=' * 70)
        print('InferBench - Benchmark Matrix Execution')
        print('=' * 70)
        print(f'Experiment ID:  {experiment_id}')
        print(f'Mode:           {self.config.mode}')
        print(f"Providers:      {[getattr(p, 'name', 'unknown') for p in self.providers]}")
        print(f'Input Levels:   {self.config.workload.input_tokens}')
        print(f'Output Levels:  {self.config.workload.output_tokens}')
        print(f'Concurrency:    {self.config.workload.concurrency}')
        print('=' * 70)
        results: List[BenchmarkResult] = []
        for prov_idx, provider in enumerate(self.providers):
            prov_name = getattr(provider, 'name', self.config.model.framework)
            prov_model = getattr(provider, 'model', self.config.model.name)
            prov_quant = getattr(provider, 'quantization', self.config.model.quantization)
            print(f'\n[{prov_idx + 1}/{len(self.providers)}] Evaluating Provider: {prov_name} (Model: {prov_model})')
            print('-' * 70)
            is_healthy, health_msg = provider.health_check()
            print(f'Health check: {health_msg}')
            if not is_healthy:
                if len(self.providers) == 1 and (not skip_unhealthy_providers):
                    raise RuntimeError(f'Backend health check failed:\n{health_msg}')
                else:
                    print(f"  [Skipped] Provider '{prov_name}' unavailable. Continuing matrix.")
                    continue
            runner = BenchmarkRunner(provider)
            supports_streaming = provider.supports_streaming() if hasattr(provider, 'supports_streaming') else True
            supports_ttft = provider.supports_ttft() if hasattr(provider, 'supports_ttft') else supports_streaming
            for input_tokens in self.config.workload.input_tokens:
                workload_group = self.loader.filter_by_input_tokens(all_workloads, input_tokens)
                if not workload_group:
                    print(f'  [Warning] No workload items found for input_tokens={input_tokens}. Skipping.')
                    continue
                benchmark_items = workload_group[:self.config.workload.benchmark_requests]
                actual_input_tokens = [item.get('actual_input_tokens', input_tokens) for item in benchmark_items]
                avg_actual_input = statistics.mean(actual_input_tokens) if actual_input_tokens else float(input_tokens)
                warmup_count = min(self.config.workload.warmup_requests, len(workload_group))
                warmup_items = workload_group[:warmup_count]
                default_output_tokens = self.config.workload.output_tokens[0]
                self.run_warmup(runner, warmup_items, default_output_tokens)
                for output_tokens in self.config.workload.output_tokens:
                    for concurrency in self.config.workload.concurrency:
                        print(f'  >>> [{prov_name}/{prov_model}] in={input_tokens} (avg={avg_actual_input:.1f}), out={output_tokens}, conc={concurrency}, reqs={len(benchmark_items)}')
                        sys_monitor = SystemMonitor(interval_seconds=0.05).start() if self.config.monitoring.enabled else None
                        batch_res = runner.run_concurrent_batch(workload_items=benchmark_items, output_tokens=output_tokens, concurrency=concurrency, stream=supports_streaming)
                        sys_snapshot = sys_monitor.stop() if sys_monitor else None
                        total_in_tokens = int(avg_actual_input * batch_res['requests_completed'])
                        pricing_source = getattr(provider, 'pricing', None) or self.config.cost
                        cost_metrics = calculate_cost_metrics(cost_config=pricing_source, total_input_tokens=total_in_tokens, total_output_tokens=batch_res['total_output_tokens'], completed_requests=batch_res['requests_completed'], benchmark_duration_seconds=batch_res['benchmark_duration_seconds'])
                        ttft_p50 = round(batch_res['ttft']['p50'], 4) if supports_ttft and batch_res['requests_completed'] > 0 and (batch_res['ttft']['p50'] > 0) else None
                        ttft_p90 = round(batch_res['ttft']['p90'], 4) if supports_ttft and batch_res['requests_completed'] > 0 and (batch_res['ttft']['p90'] > 0) else None
                        ttft_p95 = round(batch_res['ttft']['p95'], 4) if supports_ttft and batch_res['requests_completed'] > 0 and (batch_res['ttft']['p95'] > 0) else None
                        ttft_p99 = round(batch_res['ttft']['p99'], 4) if supports_ttft and batch_res['requests_completed'] > 0 and (batch_res['ttft']['p99'] > 0) else None
                        dec_p50 = round(batch_res['decode_time']['p50'], 4) if batch_res['decode_time']['p50'] > 0 else None
                        dec_p95 = round(batch_res['decode_time']['p95'], 4) if batch_res['decode_time']['p95'] > 0 else None
                        tpot_p50 = round(batch_res['tpot']['p50'], 6) if batch_res['tpot']['p50'] > 0 else None
                        tpot_p95 = round(batch_res['tpot']['p95'], 6) if batch_res['tpot']['p95'] > 0 else None
                        gen_p50 = round(batch_res['generation_speed']['p50'], 2) if batch_res['generation_speed']['p50'] > 0 else None
                        gen_p95 = round(batch_res['generation_speed']['p95'], 2) if batch_res['generation_speed']['p95'] > 0 else None
                        b_res = BenchmarkResult(experiment_id=experiment_id, model=prov_model, framework=prov_name, quantization=prov_quant, input_tokens=input_tokens, actual_input_tokens_avg=round(avg_actual_input, 2), output_tokens_requested=output_tokens, concurrency=concurrency, requests=len(benchmark_items), completed=batch_res['requests_completed'], failed=batch_res['requests_failed'], benchmark_duration_seconds=round(batch_res['benchmark_duration_seconds'], 4), total_output_tokens=batch_res['total_output_tokens'], requests_per_second=round(batch_res['requests_per_second'], 2), throughput_tokens_per_second=round(batch_res['aggregate_tokens_per_second'], 2), ttft_p50=ttft_p50, ttft_p95=ttft_p95, latency_p50=round(batch_res['latency']['p50'], 4), latency_p95=round(batch_res['latency']['p95'], 4), decode_time_p50=dec_p50, decode_time_p95=dec_p95, tpot_p50=tpot_p50, tpot_p95=tpot_p95, generation_tokens_per_second_p50=gen_p50, generation_tokens_per_second_p95=gen_p95, timestamp=BenchmarkResult.now(), provider=prov_name, streaming_supported=supports_streaming, ttft_supported=supports_ttft, token_usage_estimated=batch_res.get('token_usage_estimated', False), ttft_p90=ttft_p90, ttft_p99=ttft_p99, latency_p90=round(batch_res['latency']['p90'], 4), latency_p99=round(batch_res['latency']['p99'], 4), retry_count=batch_res.get('retry_count', 0), rate_limited_count=batch_res.get('rate_limited_count', 0), error_summary=batch_res.get('error_summary'), input_cost=cost_metrics.get('input_cost_usd') if cost_metrics else None, output_cost=cost_metrics.get('output_cost_usd') if cost_metrics else None, total_cost=cost_metrics.get('total_cost_usd') if cost_metrics else None, cost_per_request=cost_metrics.get('cost_per_request_usd') if cost_metrics else None, cost_per_1m_output_tokens=cost_metrics.get('cost_per_1m_output_tokens_usd') if cost_metrics else None, cost_per_1m_total_tokens=cost_metrics.get('cost_per_1m_total_tokens_usd') if cost_metrics else None, benchmark_mode=self.config.mode, stats_raw={'ttft': batch_res['ttft'], 'latency': batch_res['latency'], 'decode_time': batch_res['decode_time'], 'tpot': batch_res['tpot'], 'generation_speed': batch_res['generation_speed']}, system_metrics=sys_snapshot, cost_metrics=cost_metrics)
                        results.append(b_res)
                        ttft_str = f'{b_res.ttft_p50:.3f}s' if b_res.ttft_p50 is not None else 'N/A'
                        cost_str = f'${b_res.total_cost:.4f}' if b_res.total_cost is not None else 'N/A'
                        print(f'      [Done] Completed: {b_res.completed}/{b_res.requests} | Throughput: {b_res.throughput_tokens_per_second:.1f} tok/s | TTFT P50: {ttft_str} | Latency P50: {b_res.latency_p50:.3f}s | Cost: {cost_str}')
        output_data = {'experiment_id': experiment_id, 'mode': self.config.mode, 'project': self.config.project.__dict__, 'model': self.config.model.__dict__, 'providers': [p.to_dict() for p in self.config.providers] if self.config.providers else [], 'workload': {'warmup_requests': self.config.workload.warmup_requests, 'benchmark_requests': self.config.workload.benchmark_requests, 'input_tokens': self.config.workload.input_tokens, 'output_tokens': self.config.workload.output_tokens, 'concurrency': self.config.workload.concurrency, 'seed': self.config.workload.seed}, 'benchmark_count': len(results), 'results': [r.to_dict() for r in results]}
        project_root = Path(__file__).resolve().parent.parent
        json_target = Path(output_json_path).resolve() if output_json_path else project_root / 'results' / 'concurrency.json'
        csv_target = Path(output_csv_path).resolve() if output_csv_path else project_root / 'results' / 'concurrency.csv'
        self.save_json(output_data, json_target)
        self.save_csv(results, csv_target)
        print('\n' + '=' * 70)
        print('InferBench - Benchmark Complete')
        print('=' * 70)
        print(f'Configurations evaluated: {len(results)}')
        print(f'Results JSON:             {json_target}')
        print(f'Results CSV:              {csv_target}')
        print('=' * 70 + '\n')
        return output_data

    @staticmethod
    def save_json(data: Dict[str, Any], path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)

    @staticmethod
    def save_csv(results: List[BenchmarkResult], path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        fieldnames = ['experiment_id', 'provider', 'model', 'framework', 'quantization', 'benchmark_mode', 'input_tokens', 'actual_input_tokens_avg', 'output_tokens_requested', 'concurrency', 'requests', 'completed', 'failed', 'benchmark_duration_seconds', 'total_output_tokens', 'requests_per_second', 'throughput_tokens_per_second', 'streaming_supported', 'ttft_supported', 'token_usage_estimated', 'ttft_p50', 'ttft_p90', 'ttft_p95', 'ttft_p99', 'latency_p50', 'latency_p90', 'latency_p95', 'latency_p99', 'decode_time_p50', 'decode_time_p95', 'tpot_p50', 'tpot_p95', 'generation_tokens_per_second_p50', 'generation_tokens_per_second_p95', 'retry_count', 'rate_limited_count', 'input_cost', 'output_cost', 'total_cost', 'cost_per_request', 'cost_per_1m_output_tokens', 'timestamp', 'error_summary']
        with open(path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
            writer.writeheader()
            for r in results:
                writer.writerow(r.to_dict())
