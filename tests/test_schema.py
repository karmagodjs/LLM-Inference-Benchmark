import json
from benchmark.schemas import BenchmarkResult, RequestResult

def test_request_result():
    res = RequestResult(request_id='req_1', success=True, start_time=10.0, end_time=15.0, latency=5.0, input_tokens=128, output_tokens=64, first_token_time=10.5, ttft=0.5, decode_time=4.5, tpot=0.0714, generation_tokens_per_second=14.0)
    d = res.to_dict()
    assert d['request_id'] == 'req_1'
    assert d['success'] is True
    assert d['ttft'] == 0.5
    assert d['output_tokens'] == 64

def test_benchmark_result_serialization():
    b_res = BenchmarkResult(experiment_id='exp_20260823', model='qwen2.5:3b', framework='ollama', quantization='default', input_tokens=128, actual_input_tokens_avg=127.5, output_tokens_requested=128, concurrency=2, requests=10, completed=10, failed=0, benchmark_duration_seconds=12.5, total_output_tokens=1280, requests_per_second=0.8, throughput_tokens_per_second=102.4, ttft_p50=0.45, ttft_p95=0.55, latency_p50=1.2, latency_p95=1.4, decode_time_p50=0.75, decode_time_p95=0.85, tpot_p50=0.0059, tpot_p95=0.0067, generation_tokens_per_second_p50=169.3, generation_tokens_per_second_p95=149.4)
    d = b_res.to_dict()
    assert d['experiment_id'] == 'exp_20260823'
    assert d['concurrency'] == 2
    assert d['throughput_tokens_per_second'] == 102.4
    json_str = json.dumps(d)
    assert 'exp_20260823' in json_str
