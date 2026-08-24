from dashboard.app import extract_dataframe

def test_extract_dataframe_empty():
    df = extract_dataframe({})
    assert df.empty

def test_extract_dataframe_valid():
    sample_data = {'experiment_id': 'exp_dash_1', 'model': {'name': 'qwen2.5:3b', 'framework': 'ollama'}, 'results': [{'input_tokens': 128, 'output_tokens_requested': 128, 'concurrency': 2, 'completed': 5, 'failed': 0, 'throughput_tokens_per_second': 50.0, 'requests_per_second': 0.5, 'ttft_p50': 0.4, 'ttft_p95': 0.6, 'latency_p50': 2.0, 'latency_p95': 2.5, 'decode_time_p50': 1.6, 'decode_time_p95': 1.9, 'tpot_p50': 0.0125, 'tpot_p95': 0.015, 'generation_tokens_per_second_p50': 80.0, 'generation_tokens_per_second_p95': 70.0}]}
    df = extract_dataframe(sample_data)
    assert not df.empty
    assert len(df) == 1
    assert df['model'].iloc[0] == 'qwen2.5:3b'
    assert df['concurrency'].iloc[0] == 2
    assert df['throughput_tok_per_s'].iloc[0] == 50.0
    assert df['tpot_p50_ms'].iloc[0] == 12.5
