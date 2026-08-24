import json
import pandas as pd
from export_results import export_json_to_csv

def test_export_json_to_csv(tmp_path):
    sample_json = {'experiment_id': 'test_exp_001', 'model': {'name': 'qwen2.5:3b', 'framework': 'ollama'}, 'results': [{'experiment_id': 'test_exp_001', 'model': 'qwen2.5:3b', 'input_tokens': 128, 'concurrency': 1, 'completed': 5, 'failed': 0, 'throughput_tokens_per_second': 45.2, 'ttft_p50': 0.25, 'latency_p50': 1.1}, {'experiment_id': 'test_exp_001', 'model': 'qwen2.5:3b', 'input_tokens': 128, 'concurrency': 2, 'completed': 5, 'failed': 0, 'throughput_tokens_per_second': 78.5, 'ttft_p50': 0.32, 'latency_p50': 1.4}]}
    in_file = tmp_path / 'results.json'
    out_file = tmp_path / 'results.csv'
    with open(in_file, 'w', encoding='utf-8') as f:
        json.dump(sample_json, f)
    count = export_json_to_csv(in_file, out_file)
    assert count == 2
    assert out_file.exists()
    df = pd.read_csv(out_file)
    assert len(df) == 2
    assert 'throughput_tokens_per_second' in df.columns
    assert df['concurrency'].tolist() == [1, 2]
