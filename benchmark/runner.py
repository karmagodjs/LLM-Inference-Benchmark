import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Dict, List, Optional, Union
from .metrics import calculate_aggregate_throughput, calculate_decode_time, calculate_generation_speed, calculate_latency, calculate_request_throughput, calculate_statistics, calculate_tpot, calculate_ttft
from .providers.base import InferenceProvider
from .schemas import BenchmarkRequest, NormalizedResponse, RequestResult

class BenchmarkRunner:

    def __init__(self, provider: Union[InferenceProvider, Any]):
        self.provider = provider

    def run_single_request(self, request_id: str, prompt: str, output_tokens: int, input_tokens: int=0, temperature: float=0.7, stream: bool=True, system_prompt: Optional[str]=None) -> RequestResult:
        start_time = time.perf_counter()
        if isinstance(self.provider, InferenceProvider):
            req = BenchmarkRequest(provider=self.provider.name, model=self.provider.model, prompt=prompt, max_output_tokens=output_tokens, temperature=temperature, stream=stream, system_prompt=system_prompt, request_id=request_id)
            try:
                norm_resp: NormalizedResponse = self.provider.generate_stream(req) if stream and self.provider.supports_streaming() else self.provider.generate(req)
                if norm_resp.error:
                    return RequestResult(request_id=request_id, success=False, start_time=norm_resp.start_time or start_time, end_time=norm_resp.end_time or time.perf_counter(), latency=calculate_latency(start_time, norm_resp.end_time or time.perf_counter()), input_tokens=norm_resp.input_tokens or input_tokens, output_tokens=norm_resp.output_tokens, token_usage_estimated=norm_resp.token_usage_estimated, first_token_time=norm_resp.first_token_time, ttft=norm_resp.ttft, decode_time=norm_resp.decode_time, tpot=norm_resp.tpot, generation_tokens_per_second=norm_resp.generation_tokens_per_second, error_message=norm_resp.error, retry_count=norm_resp.retry_count, rate_limited=norm_resp.rate_limited, error_type=norm_resp.error_type, provider=self.provider.name, model=self.provider.model)
                return RequestResult(request_id=request_id, success=True, start_time=norm_resp.start_time, end_time=norm_resp.end_time, latency=norm_resp.latency, input_tokens=norm_resp.input_tokens or input_tokens, output_tokens=norm_resp.output_tokens, token_usage_estimated=norm_resp.token_usage_estimated, first_token_time=norm_resp.first_token_time, ttft=norm_resp.ttft, decode_time=norm_resp.decode_time, tpot=norm_resp.tpot, generation_tokens_per_second=norm_resp.generation_tokens_per_second, error_message=None, retry_count=norm_resp.retry_count, rate_limited=norm_resp.rate_limited, error_type=None, provider=self.provider.name, model=self.provider.model)
            except Exception as e:
                end_time = time.perf_counter()
                return RequestResult(request_id=request_id, success=False, start_time=start_time, end_time=end_time, latency=calculate_latency(start_time, end_time), input_tokens=input_tokens, output_tokens=0, token_usage_estimated=False, first_token_time=None, ttft=None, decode_time=None, tpot=None, generation_tokens_per_second=None, error_message=str(e), provider=getattr(self.provider, 'name', 'unknown'), model=getattr(self.provider, 'model', 'unknown'))
        try:
            stream_result = self.provider.generate_stream(prompt=prompt, output_tokens=output_tokens)
            end_time = stream_result.get('end_time', time.perf_counter())
            first_token_time = stream_result.get('first_token_time')
            eval_count = stream_result.get('eval_count', 0)
            if first_token_time is None:
                return RequestResult(request_id=request_id, success=False, start_time=start_time, end_time=end_time, latency=calculate_latency(start_time, end_time), input_tokens=input_tokens, output_tokens=eval_count, first_token_time=None, ttft=None, decode_time=None, tpot=None, generation_tokens_per_second=None, error_message='No token chunks received before stream completion.')
            ttft = calculate_ttft(start_time, first_token_time)
            latency = calculate_latency(start_time, end_time)
            decode_time = calculate_decode_time(first_token_time, end_time)
            tpot = calculate_tpot(decode_time, eval_count)
            gen_speed = calculate_generation_speed(decode_time, eval_count)
            return RequestResult(request_id=request_id, success=True, start_time=start_time, end_time=end_time, latency=latency, input_tokens=input_tokens, output_tokens=eval_count, first_token_time=first_token_time, ttft=ttft, decode_time=decode_time, tpot=tpot, generation_tokens_per_second=gen_speed, error_message=None)
        except Exception as e:
            end_time = time.perf_counter()
            return RequestResult(request_id=request_id, success=False, start_time=start_time, end_time=end_time, latency=calculate_latency(start_time, end_time), input_tokens=input_tokens, output_tokens=0, first_token_time=None, ttft=None, decode_time=None, tpot=None, generation_tokens_per_second=None, error_message=str(e))

    def run_concurrent_batch(self, workload_items: List[Dict[str, Any]], output_tokens: int, concurrency: int, temperature: float=0.7, stream: bool=True, system_prompt: Optional[str]=None) -> Dict[str, Any]:
        if concurrency < 1:
            raise ValueError(f'Concurrency must be >= 1, got {concurrency}')
        max_workers = max(1, min(concurrency, len(workload_items)))
        results: List[RequestResult] = []
        batch_start_time = time.perf_counter()
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(self.run_single_request, request_id=str(item.get('request_id', f'req_{idx}')), prompt=item.get('prompt', ''), output_tokens=output_tokens, input_tokens=item.get('actual_input_tokens', 0), temperature=temperature, stream=stream, system_prompt=system_prompt) for idx, item in enumerate(workload_items)]
            for future in as_completed(futures):
                try:
                    res = future.result()
                    results.append(res)
                except Exception as e:
                    results.append(RequestResult(request_id='unknown', success=False, start_time=batch_start_time, end_time=time.perf_counter(), latency=0.0, error_message=str(e)))
        batch_end_time = time.perf_counter()
        duration = batch_end_time - batch_start_time
        successful_results = [r for r in results if r.success]
        failed_results = [r for r in results if not r.success]
        total_output_tokens = sum((r.output_tokens for r in successful_results))
        completed_count = len(successful_results)
        failed_count = len(failed_results)
        retry_count = sum((r.retry_count for r in results))
        rate_limited_count = sum((1 for r in results if r.rate_limited))
        token_usage_estimated = any((r.token_usage_estimated for r in successful_results))
        ttfts = [r.ttft for r in successful_results if r.ttft is not None]
        latencies = [r.latency for r in successful_results]
        decode_times = [r.decode_time for r in successful_results if r.decode_time is not None]
        tpots = [r.tpot for r in successful_results if r.tpot is not None]
        gen_speeds = [r.generation_tokens_per_second for r in successful_results if r.generation_tokens_per_second is not None]
        ttft_stats = calculate_statistics(ttfts)
        latency_stats = calculate_statistics(latencies)
        decode_time_stats = calculate_statistics(decode_times)
        tpot_stats = calculate_statistics(tpots)
        gen_speed_stats = calculate_statistics(gen_speeds)
        token_throughput = calculate_aggregate_throughput(total_output_tokens, duration)
        request_throughput = calculate_request_throughput(completed_count, duration)
        errors = [r.error_message for r in failed_results if r.error_message]
        error_summary = '; '.join(set(errors)) if errors else None
        return {'concurrency': concurrency, 'output_tokens_requested': output_tokens, 'requests_total': len(workload_items), 'requests_completed': completed_count, 'requests_failed': failed_count, 'benchmark_duration_seconds': duration, 'total_output_tokens': total_output_tokens, 'aggregate_tokens_per_second': token_throughput, 'requests_per_second': request_throughput, 'ttft': ttft_stats, 'latency': latency_stats, 'decode_time': decode_time_stats, 'tpot': tpot_stats, 'generation_speed': gen_speed_stats, 'retry_count': retry_count, 'rate_limited_count': rate_limited_count, 'token_usage_estimated': token_usage_estimated, 'error_summary': error_summary, 'request_results': [r.to_dict() for r in results]}
