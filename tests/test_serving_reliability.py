import json
from unittest.mock import MagicMock, patch
import pytest
from benchmark.providers.base import InferenceProvider
from benchmark.providers.openai import OpenAIProvider
from benchmark.providers.huggingface import HuggingFaceProvider
from benchmark.schemas import BenchmarkRequest, NormalizedResponse
from benchmark.system_metrics import SystemMonitor, get_gpu_metrics, get_system_snapshot
from benchmark.serving_bench import measure_server_startup, measure_model_loading_time

def test_provider_session_pooling():
    provider = OpenAIProvider(api_key='test-key')
    session = provider.session
    assert session is not None
    assert 'https://' in session.adapters
    adapter = session.adapters['https://']
    assert adapter._pool_connections == 100
    assert adapter._pool_maxsize == 100
    provider.close()
    assert provider._session is None

def test_huggingface_dedicated_endpoint_support():
    provider = HuggingFaceProvider(model='meta-llama/Llama-3.2-3B-Instruct', base_url='https://custom-id.endpoints.huggingface.cloud', api_key='hf_test_token', endpoint_type='text-generation')
    assert not provider._is_chat_router()
    req = BenchmarkRequest(provider='huggingface', model='meta-llama/Llama-3.2-3B-Instruct', prompt='Tell me a quick joke.', max_output_tokens=32)
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = [{'generated_text': 'Why did the LLM cross the road? To optimize latency!'}]
    with patch.object(provider.session, 'post', return_value=mock_resp) as mock_post:
        res = provider.generate(req)
        assert res.success
        assert 'latency' in res.text
        assert res.token_usage_estimated is True
        mock_post.assert_called_once()
        _, kwargs = mock_post.call_args
        assert 'inputs' in kwargs['json']
        assert kwargs['json']['inputs'] == 'Tell me a quick joke.'
        assert kwargs['json']['parameters']['max_new_tokens'] == 32

def test_system_monitor_continuous_sampling():
    monitor = SystemMonitor(interval_seconds=0.02)
    monitor.start()
    import time
    time.sleep(0.1)
    stats = monitor.stop()
    assert stats['samples_count'] >= 2
    assert 'cpu_percent' in stats
    assert 'cpu_percent_peak' in stats
    assert 'ram_used_gb' in stats
    assert 'ram_used_gb_peak' in stats
    assert stats['cpu_percent_peak'] >= stats['cpu_percent']
    assert stats['ram_used_gb_peak'] >= stats['ram_used_gb']

def test_gpu_metrics_nvidia_smi_parsing():
    mock_nvidia_out = 'NVIDIA GeForce RTX 4090, 78.5, 4520, 24564, 215.3\n'
    mock_subproc = MagicMock()
    mock_subproc.returncode = 0
    mock_subproc.stdout = mock_nvidia_out
    with patch('shutil.which', return_value='/usr/bin/nvidia-smi'):
        with patch('subprocess.run', return_value=mock_subproc):
            gpu_info = get_gpu_metrics()
            assert gpu_info['gpu_available'] is True
            assert gpu_info['gpu_name'] == 'NVIDIA GeForce RTX 4090'
            assert gpu_info['gpu_utilization'] == 78.5
            assert gpu_info['gpu_memory_used_mb'] == 4520.0
            assert gpu_info['gpu_memory_total_mb'] == 24564.0
            assert gpu_info['gpu_power_watts'] == 215.3

def test_gpu_metrics_rocm_parsing():
    rocm_json = json.dumps({'card0': {'GPU use (%)': '64.0', 'VRAM Total Memory (B)': str(16 * 1024 * 1024 * 1024), 'VRAM Total Used Memory (B)': str(4 * 1024 * 1024 * 1024), 'Average Graphics Package Power (W)': '145.2'}})
    mock_subproc = MagicMock()
    mock_subproc.returncode = 0
    mock_subproc.stdout = rocm_json

    def mock_which(cmd):
        return '/opt/rocm/bin/rocm-smi' if cmd == 'rocm-smi' else None
    with patch('shutil.which', side_effect=mock_which):
        with patch('subprocess.run', return_value=mock_subproc):
            gpu_info = get_gpu_metrics()
            assert gpu_info['gpu_available'] is True
            assert gpu_info['gpu_name'] == 'AMD Radeon (ROCm)'
            assert gpu_info['gpu_utilization'] == 64.0
            assert gpu_info['gpu_memory_used_mb'] == 4096.0
            assert gpu_info['gpu_memory_total_mb'] == 16384.0
            assert gpu_info['gpu_power_watts'] == 145.2

def test_gpu_metrics_unavailable_honesty():
    with patch('shutil.which', return_value=None):
        with patch('torch.cuda.is_available', return_value=False, create=True):
            gpu_info = get_gpu_metrics()
            assert gpu_info['gpu_available'] is False
            assert gpu_info['gpu_name'] is None
            assert gpu_info['gpu_utilization'] is None
            assert gpu_info['gpu_memory_used_mb'] is None
            assert gpu_info['gpu_power_watts'] is None

def test_measure_server_startup_success():
    mock_proc = MagicMock()
    mock_proc.pid = 12345
    mock_proc.poll.return_value = None
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    with patch('subprocess.Popen', return_value=mock_proc):
        with patch('requests.get', return_value=mock_resp):
            res = measure_server_startup('ollama serve', 'http://localhost:11434/api/tags', timeout_seconds=5)
            assert res['success'] is True
            assert res['startup_time_seconds'] is not None
            assert res['startup_time_seconds'] >= 0.0
            assert res['process_id'] == 12345

def test_measure_server_startup_timeout():
    mock_proc = MagicMock()
    mock_proc.pid = 12345
    mock_proc.poll.return_value = None
    with patch('subprocess.Popen', return_value=mock_proc):
        with patch('requests.get', side_effect=Exception('Connection refused')):
            res = measure_server_startup('ollama serve', 'http://localhost:11434/api/tags', timeout_seconds=0.1, poll_interval=0.05)
            assert res['success'] is False
            assert res['startup_time_seconds'] is None
            assert 'timed out' in res['error'].lower()

def test_measure_model_loading_time():
    mock_provider = MagicMock(spec=InferenceProvider)
    mock_provider.name = 'mock_engine'
    mock_provider.model = 'qwen2.5:3b'
    mock_res = NormalizedResponse(provider='mock_engine', model='qwen2.5:3b', text='Ready', start_time=0.0, first_token_time=None, end_time=0.5, input_tokens=5, output_tokens=1, token_usage_estimated=False, finish_reason='stop', raw_usage=None, error=None, ttft=None, latency=0.5, decode_time=None, tpot=None, generation_tokens_per_second=None)
    mock_provider.generate.return_value = mock_res
    timing_res = measure_model_loading_time(mock_provider)
    assert timing_res['success'] is True
    assert timing_res['model_loading_time_seconds'] is not None
    assert timing_res['model_loading_time_seconds'] >= 0.0
