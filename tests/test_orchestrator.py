import json
from pathlib import Path
from typing import Any, Dict, List, Tuple
import pytest
from benchmark.backends.base import InferenceBackend
from benchmark.config import BenchmarkConfig, ModelConfig, ServerConfig, WorkloadConfig
from benchmark.orchestrator import ExperimentOrchestrator
from benchmark.workload_loader import WorkloadLoader

class MockOrchestratorBackend(InferenceBackend):

    def __init__(self, is_healthy: bool=True):
        super().__init__(model='mock_qwen')
        self.is_healthy = is_healthy

    def health_check(self) -> Tuple[bool, str]:
        if self.is_healthy:
            return (True, 'Mock backend ready.')
        return (False, 'Mock backend offline.')

    def generate(self, prompt: str, output_tokens: int=128) -> str:
        return 'mock output'

    def generate_stream(self, prompt: str, output_tokens: int=128) -> Dict[str, Any]:
        return {'response': 'mock generated response', 'start_time': 10.0, 'first_token_time': 10.1, 'end_time': 10.5, 'final_data': {'eval_count': output_tokens}, 'eval_count': output_tokens}

@pytest.fixture
def mock_workload_loader(tmp_path):
    workload_data = [{'request_id': '128_1', 'requested_input_tokens': 128, 'actual_input_tokens': 125, 'prompt': 'P1'}, {'request_id': '128_2', 'requested_input_tokens': 128, 'actual_input_tokens': 127, 'prompt': 'P2'}, {'request_id': '256_1', 'requested_input_tokens': 256, 'actual_input_tokens': 254, 'prompt': 'P3'}, {'request_id': '256_2', 'requested_input_tokens': 256, 'actual_input_tokens': 256, 'prompt': 'P4'}]
    file_path = tmp_path / 'workload.json'
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(workload_data, f)
    return WorkloadLoader(file_path)

def test_dry_run_matrix(mock_workload_loader):
    config = BenchmarkConfig(workload=WorkloadConfig(input_tokens=[128, 256, 512], output_tokens=[128], concurrency=[1, 2, 4]))
    backend = MockOrchestratorBackend(is_healthy=True)
    orch = ExperimentOrchestrator(config=config, backend=backend, workload_loader=mock_workload_loader)
    matrix = orch.print_dry_run_matrix()
    assert len(matrix) == 9
    assert (128, 128, 1) in matrix
    assert (512, 128, 4) in matrix

def test_health_check_failure(mock_workload_loader):
    config = BenchmarkConfig()
    backend = MockOrchestratorBackend(is_healthy=False)
    orch = ExperimentOrchestrator(config=config, backend=backend, workload_loader=mock_workload_loader)
    with pytest.raises(RuntimeError, match='Backend health check failed'):
        orch.run()

def test_full_orchestrator_execution(tmp_path, mock_workload_loader):
    config = BenchmarkConfig(workload=WorkloadConfig(warmup_requests=1, benchmark_requests=2, input_tokens=[128, 256], output_tokens=[32], concurrency=[1, 2]))
    backend = MockOrchestratorBackend(is_healthy=True)
    orch = ExperimentOrchestrator(config=config, backend=backend, workload_loader=mock_workload_loader)
    json_path = tmp_path / 'concurrency.json'
    csv_path = tmp_path / 'concurrency.csv'
    out = orch.run(output_json_path=json_path, output_csv_path=csv_path)
    assert out['benchmark_count'] == 4
    assert len(out['results']) == 4
    assert json_path.exists()
    assert csv_path.exists()
    with open(json_path, 'r', encoding='utf-8') as f:
        saved_json = json.load(f)
    assert saved_json['benchmark_count'] == 4
