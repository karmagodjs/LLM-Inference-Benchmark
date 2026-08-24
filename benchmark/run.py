import argparse
import sys
from pathlib import Path
from typing import List, Optional
from .config import BenchmarkConfig, ProviderConfig, load_config
from .orchestrator import ExperimentOrchestrator
from .provider_factory import PROVIDER_REGISTRY, ProviderFactory
from .providers.base import InferenceProvider
from .workload_loader import WorkloadLoader

def parse_args(args: Optional[List[str]]=None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog='InferBench', description='Provider-Agnostic LLM Inference Benchmarking and Optimization Platform')
    parser.add_argument('--config', '-c', type=str, default=None, help='Path to YAML configuration file (default: configs/benchmark.yaml)')
    parser.add_argument('--provider', '-p', type=str, default=None, help='Target provider (e.g. ollama, openai, gemini, anthropic, grok, huggingface, openrouter, custom)')
    parser.add_argument('--all-providers', action='store_true', help='Benchmark across all supported providers that have valid credentials configured.')
    parser.add_argument('--mode', '-m', type=str, choices=['model_comparison', 'serving_comparison'], default=None, help="Benchmark mode: 'model_comparison' (compare models/APIs) or 'serving_comparison' (compare serving engines for same model)")
    parser.add_argument('--dry-run', action='store_true', help='Display the planned experiment matrix without running inference requests.')
    parser.add_argument('--input-tokens', nargs='+', type=int, help='Override input token sizes to test (e.g. --input-tokens 128 256 512)')
    parser.add_argument('--output-tokens', nargs='+', type=int, help='Override output token lengths to generate (e.g. --output-tokens 128)')
    parser.add_argument('--concurrency', nargs='+', type=int, help='Override concurrency levels (e.g. --concurrency 1 2 4 8)')
    parser.add_argument('--requests', '-n', type=int, help='Override number of benchmark requests per configuration')
    parser.add_argument('--warmup', type=int, help='Override number of warmup requests per input token group')
    parser.add_argument('--model', type=str, help='Override model name (e.g. --model gpt-4o-mini or --model qwen2.5:3b)')
    parser.add_argument('--framework', type=str, help='Alias for provider (e.g. --framework ollama)')
    parser.add_argument('--base-url', type=str, help='Override backend server base URL (e.g. --base-url http://localhost:11434)')
    parser.add_argument('--workload-file', type=str, help='Path to pre-generated workload.json file')
    parser.add_argument('--output-json', type=str, help='Custom output path for results JSON file')
    parser.add_argument('--output-csv', type=str, help='Custom output path for results CSV file')
    parser.add_argument('--measure-startup', type=str, default=None, help="Command to launch server process and measure cold startup time (e.g. 'ollama serve' or 'vllm serve ...')")
    parser.add_argument('--health-check-url', type=str, default=None, help='Health check URL to poll when measuring startup time (e.g. http://localhost:11434/api/tags)')
    parser.add_argument('--measure-model-load', action='store_true', help='Measure initial cold model loading time before running benchmark matrix.')
    return parser.parse_args(args)

def main(args: Optional[List[str]]=None) -> int:
    try:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
    parsed = parse_args(args)
    try:
        config = load_config(parsed.config)
    except Exception as e:
        print(f'[Error] Failed to load configuration: {e}', file=sys.stderr)
        return 1
    if parsed.mode:
        config.mode = parsed.mode
    if parsed.input_tokens:
        config.workload.input_tokens = parsed.input_tokens
    if parsed.output_tokens:
        config.workload.output_tokens = parsed.output_tokens
    if parsed.concurrency:
        config.workload.concurrency = parsed.concurrency
    if parsed.requests is not None:
        config.workload.benchmark_requests = parsed.requests
    if parsed.warmup is not None:
        config.workload.warmup_requests = parsed.warmup
    if parsed.workload_file:
        config.workload.workload_file = parsed.workload_file
    active_providers: List[InferenceProvider] = []
    if parsed.all_providers:
        print('\n' + '=' * 70)
        print('InferBench - Discovering Available Providers for Multi-Provider Benchmark')
        print('=' * 70)
        for key in PROVIDER_REGISTRY.keys():
            prov = ProviderFactory.get_provider(key)
            is_valid, msg = prov.validate_credentials()
            if is_valid:
                print(f'  [+] Provider: {prov.name:<15} (Model: {prov.model}) - Credential verified.')
                active_providers.append(prov)
            else:
                print(f'  [-] Provider: {prov.name:<15} - {msg} -> Skipping.')
        if not active_providers:
            print('\n[Error] No providers available with valid credentials. Exiting.', file=sys.stderr)
            return 1
    elif parsed.provider or parsed.framework:
        target_prov_name = parsed.provider or parsed.framework
        prov = ProviderFactory.get_provider(name=target_prov_name, model=parsed.model or config.model.name, base_url=parsed.base_url or config.server.base_url, timeout=config.server.timeout_seconds)
        active_providers.append(prov)
    elif config.providers:
        for p_cfg in config.providers:
            prov = ProviderFactory.get_provider(name=p_cfg.name, model=parsed.model or p_cfg.model, api_key_env=p_cfg.api_key_env, base_url=parsed.base_url or p_cfg.base_url, timeout=config.server.timeout_seconds, requests_per_second_limit=p_cfg.requests_per_second_limit, max_retries=p_cfg.max_retries, extra_headers=p_cfg.extra_headers)
            active_providers.append(prov)
    else:
        prov = ProviderFactory.get_provider(name=config.model.framework, model=parsed.model or config.model.name, base_url=parsed.base_url or config.server.base_url, timeout=config.server.timeout_seconds)
        active_providers.append(prov)
    loader = WorkloadLoader(config.workload.workload_file)
    orchestrator = ExperimentOrchestrator(config=config, providers=active_providers, workload_loader=loader)
    if parsed.dry_run:
        orchestrator.print_dry_run_matrix()
        return 0
    if parsed.measure_startup:
        from .serving_bench import measure_server_startup
        health_url = parsed.health_check_url or f'{config.server.base_url}/api/tags'
        print(f"\n[Serving Benchmark] Measuring cold server startup: '{parsed.measure_startup}'...")
        startup_res = measure_server_startup(parsed.measure_startup, health_url)
        if startup_res['success']:
            print(f"  [+] Server initialized in {startup_res['startup_time_seconds']:.2f} seconds.")
        else:
            print(f"  [-] Server startup measurement failed: {startup_res['error']}", file=sys.stderr)
    if parsed.measure_model_load and active_providers:
        from .serving_bench import measure_model_loading_time
        print('\n[Serving Benchmark] Measuring cold model load time...')
        for p in active_providers:
            m_res = measure_model_loading_time(p)
            if m_res['success']:
                print(f"  [+] Provider {p.name} loaded model in {m_res['model_loading_time_seconds']:.2f} seconds.")
            else:
                print(f"  [-] Model load measurement for {p.name} failed: {m_res['error']}")
    try:
        orchestrator.run(output_json_path=parsed.output_json, output_csv_path=parsed.output_csv, skip_unhealthy_providers=parsed.all_providers or len(active_providers) > 1)
        return 0
    except Exception as e:
        print(f'\n[Execution Error] Benchmark failed: {e}', file=sys.stderr)
        return 1
if __name__ == '__main__':
    sys.exit(main())
