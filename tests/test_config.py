from pathlib import Path
import pytest
import yaml
from benchmark.config import BenchmarkConfig, load_config, validate_config_dict

def test_load_default_config(tmp_path):
    config_file = tmp_path / 'benchmark.yaml'
    yaml_content = '\n    project:\n      name: InferBenchTest\n      version: "1.0"\n    model:\n      name: qwen2.5:3b\n      framework: ollama\n      quantization: Q4_K_M\n    server:\n      base_url: http://localhost:11434\n      timeout_seconds: 120\n    workload:\n      warmup_requests: 1\n      benchmark_requests: 3\n      concurrency: [1, 2]\n      input_tokens: [128, 256]\n      output_tokens: [64]\n      seed: 123\n      workload_file: test_workload.json\n    cost:\n      enabled: true\n      gpu_hourly_cost: 1.5\n      input_cost_per_1m_tokens: 0.2\n      output_cost_per_1m_tokens: 0.4\n    monitoring:\n      enabled: false\n    '
    config_file.write_text(yaml_content, encoding='utf-8')
    cfg = load_config(config_file)
    assert isinstance(cfg, BenchmarkConfig)
    assert cfg.project.name == 'InferBenchTest'
    assert cfg.model.name == 'qwen2.5:3b'
    assert cfg.model.framework == 'ollama'
    assert cfg.model.quantization == 'Q4_K_M'
    assert cfg.server.base_url == 'http://localhost:11434'
    assert cfg.server.timeout_seconds == 120
    assert cfg.workload.warmup_requests == 1
    assert cfg.workload.benchmark_requests == 3
    assert cfg.workload.concurrency == [1, 2]
    assert cfg.workload.input_tokens == [128, 256]
    assert cfg.workload.output_tokens == [64]
    assert cfg.workload.seed == 123
    assert cfg.workload.workload_file == 'test_workload.json'
    assert cfg.cost.enabled is True
    assert cfg.cost.gpu_hourly_cost == 1.5
    assert cfg.cost.input_cost_per_1m_tokens == 0.2
    assert cfg.cost.output_cost_per_1m_tokens == 0.4
    assert cfg.monitoring.enabled is False

def test_missing_config_file():
    with pytest.raises(FileNotFoundError):
        load_config('non_existent_config_file_xyz.yaml')

def test_invalid_yaml_file(tmp_path):
    bad_yaml = tmp_path / 'bad.yaml'
    bad_yaml.write_text('model: [invalid yaml structure: {', encoding='utf-8')
    with pytest.raises(ValueError, match='Invalid YAML'):
        load_config(bad_yaml)

def test_missing_model_section():
    with pytest.raises(ValueError, match="Missing required 'model' section"):
        validate_config_dict({'project': {'name': 'Test'}})

def test_invalid_model_name():
    with pytest.raises(ValueError, match="'model.name' is required"):
        validate_config_dict({'model': {'name': ''}})

def test_invalid_workload_fields():
    with pytest.raises(ValueError, match="'workload.concurrency' must be a non-empty list"):
        validate_config_dict({'model': {'name': 'test'}, 'workload': {'concurrency': []}})
    with pytest.raises(ValueError, match='must be positive integers'):
        validate_config_dict({'model': {'name': 'test'}, 'workload': {'concurrency': [-1]}})

def test_config_to_dict(tmp_path):
    config_file = tmp_path / 'b.yaml'
    config_file.write_text('model:\n  name: qwen2.5:3b\n', encoding='utf-8')
    cfg = load_config(config_file)
    d = cfg.to_dict()
    assert isinstance(d, dict)
    assert d['model']['name'] == 'qwen2.5:3b'
