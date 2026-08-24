import time
from typing import Any, Dict, Tuple
import pytest
from benchmark.backends.base import InferenceBackend
from benchmark.runner import BenchmarkRunner

class MockBackend(InferenceBackend):

    def __init__(self, failure_rate: float=0.0, simulated_ttft: float=0.05, simulated_decode: float=0.1):
        super().__init__(model='mock_model')
        self.failure_rate = failure_rate
        self.simulated_ttft = simulated_ttft
        self.simulated_decode = simulated_decode
        self.call_count = 0

    def health_check(self) -> Tuple[bool, str]:
        return (True, 'Mock backend is healthy.')

    def generate(self, prompt: str, output_tokens: int=128) -> str:
        return 'mock output response'

    def generate_stream(self, prompt: str, output_tokens: int=128) -> Dict[str, Any]:
        self.call_count += 1
        start_time = time.perf_counter()
        if self.failure_rate > 0 and self.call_count % int(1.0 / self.failure_rate) == 0:
            raise ConnectionResetError('Simulated socket connection reset')
        time.sleep(self.simulated_ttft)
        first_token_time = time.perf_counter()
        time.sleep(self.simulated_decode)
        end_time = time.perf_counter()
        return {'response': 'mock generated response text', 'start_time': start_time, 'first_token_time': first_token_time, 'end_time': end_time, 'final_data': {'eval_count': output_tokens}, 'eval_count': output_tokens}

def test_runner_single_request_success():
    backend = MockBackend(simulated_ttft=0.01, simulated_decode=0.02)
    runner = BenchmarkRunner(backend)
    res = runner.run_single_request('req_1', 'Test prompt', output_tokens=10)
    assert res.success is True
    assert res.request_id == 'req_1'
    assert res.output_tokens == 10
    assert res.ttft is not None and res.ttft > 0
    assert res.latency > 0
    assert res.decode_time is not None and res.decode_time > 0
    assert res.tpot is not None and res.tpot > 0
    assert res.generation_tokens_per_second is not None and res.generation_tokens_per_second > 0

def test_runner_single_request_failure():
    backend = MockBackend(failure_rate=1.0)
    runner = BenchmarkRunner(backend)
    res = runner.run_single_request('req_fail', 'Test prompt', output_tokens=10)
    assert res.success is False
    assert res.request_id == 'req_fail'
    assert 'Simulated socket connection reset' in (res.error_message or '')

def test_runner_concurrent_batch():
    backend = MockBackend(simulated_ttft=0.01, simulated_decode=0.02)
    runner = BenchmarkRunner(backend)
    workload = [{'request_id': f'req_{i}', 'prompt': f'Prompt {i}', 'actual_input_tokens': 50} for i in range(6)]
    batch_res = runner.run_concurrent_batch(workload_items=workload, output_tokens=16, concurrency=2)
    assert batch_res['concurrency'] == 2
    assert batch_res['requests_total'] == 6
    assert batch_res['requests_completed'] == 6
    assert batch_res['requests_failed'] == 0
    assert batch_res['total_output_tokens'] == 6 * 16
    assert batch_res['aggregate_tokens_per_second'] > 0
    assert batch_res['requests_per_second'] > 0
    assert batch_res['ttft']['count'] == 6
    assert len(batch_res['request_results']) == 6

def test_runner_concurrency_with_partial_failures():
    backend = MockBackend(failure_rate=0.5, simulated_ttft=0.005, simulated_decode=0.005)
    runner = BenchmarkRunner(backend)
    workload = [{'request_id': f'req_{i}', 'prompt': f'Prompt {i}'} for i in range(4)]
    batch_res = runner.run_concurrent_batch(workload_items=workload, output_tokens=10, concurrency=2)
    assert batch_res['requests_total'] == 4
    assert batch_res['requests_completed'] == 2
    assert batch_res['requests_failed'] == 2

def test_runner_invalid_concurrency():
    backend = MockBackend()
    runner = BenchmarkRunner(backend)
    with pytest.raises(ValueError, match='Concurrency must be >= 1'):
        runner.run_concurrent_batch([], output_tokens=10, concurrency=0)
