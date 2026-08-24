import json
import pytest
from benchmark.workload import FallbackTokenizer, WorkloadGenerator
from benchmark.workload_loader import WorkloadLoader

def test_fallback_tokenizer():
    tok = FallbackTokenizer()
    text = 'InferBench LLM inference benchmark'
    ids = tok.encode(text)
    assert len(ids) == 4
    dec = tok.decode(ids)
    assert 'word_' in dec

def test_workload_generator(tmp_path):
    gen = WorkloadGenerator(seed=42, tokenizer=FallbackTokenizer())
    workloads = gen.generate_dataset(input_token_levels=[10, 20], requests_per_level=2)
    assert len(workloads) == 4
    for item in workloads:
        assert 'request_id' in item
        assert 'requested_input_tokens' in item
        assert 'actual_input_tokens' in item
        assert 'prompt' in item
        assert item['actual_input_tokens'] > 0
        assert len(item['prompt']) > 0
    out_file = tmp_path / 'workload.json'
    gen.save(workloads, out_file)
    assert out_file.exists()

def test_workload_loader_valid(tmp_path):
    sample_data = [{'request_id': '128_1', 'requested_input_tokens': 128, 'actual_input_tokens': 126, 'prompt': 'Test prompt 1'}, {'request_id': '128_2', 'requested_input_tokens': 128, 'actual_input_tokens': 128, 'prompt': 'Test prompt 2'}, {'request_id': '256_1', 'requested_input_tokens': 256, 'actual_input_tokens': 250, 'prompt': 'Test prompt 3'}]
    file_path = tmp_path / 'workload.json'
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(sample_data, f)
    loader = WorkloadLoader(file_path)
    loaded = loader.load()
    assert len(loaded) == 3
    filtered_128 = loader.filter_by_input_tokens(loaded, 128)
    assert len(filtered_128) == 2
    filtered_256 = loader.filter_by_input_tokens(loaded, 256)
    assert len(filtered_256) == 1
    filtered_512 = loader.filter_by_input_tokens(loaded, 512)
    assert len(filtered_512) == 0
    prompts = loader.get_prompts(filtered_128)
    assert prompts == ['Test prompt 1', 'Test prompt 2']
    actuals = loader.get_actual_input_tokens(filtered_128)
    assert actuals == [126, 128]

def test_workload_loader_missing_file():
    loader = WorkloadLoader('non_existent_workload_path_xyz.json')
    with pytest.raises(FileNotFoundError):
        loader.load()

def test_workload_loader_corrupted_file(tmp_path):
    bad_file = tmp_path / 'corrupted.json'
    bad_file.write_text('{bad_json: [', encoding='utf-8')
    loader = WorkloadLoader(bad_file)
    with pytest.raises(ValueError, match='invalid JSON'):
        loader.load()

def test_workload_loader_missing_keys(tmp_path):
    bad_data = [{'request_id': '1', 'prompt': 'Hello'}]
    bad_file = tmp_path / 'bad.json'
    with open(bad_file, 'w', encoding='utf-8') as f:
        json.dump(bad_data, f)
    loader = WorkloadLoader(bad_file)
    with pytest.raises(ValueError, match='missing required keys'):
        loader.load()
