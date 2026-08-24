import pytest
from benchmark.metrics import calculate_aggregate_throughput, calculate_decode_time, calculate_generation_speed, calculate_latency, calculate_request_throughput, calculate_statistics, calculate_tpot, calculate_ttft, percentile

def test_percentile_empty():
    assert percentile([], 50) == 0.0

def test_percentile_single_value():
    assert percentile([10.0], 50) == 10.0
    assert percentile([10.0], 99) == 10.0

def test_percentile_bounds():
    vals = [1.0, 2.0, 3.0, 4.0, 5.0]
    assert percentile(vals, 0) == 1.0
    assert percentile(vals, 100) == 5.0
    assert percentile(vals, 50) == 3.0

def test_calculate_statistics_empty():
    stats = calculate_statistics([])
    assert stats['count'] == 0
    assert stats['mean'] == 0.0
    assert stats['p50'] == 0.0
    assert stats['p90'] == 0.0
    assert stats['p95'] == 0.0
    assert stats['p99'] == 0.0
    assert stats['min'] == 0.0
    assert stats['max'] == 0.0

def test_calculate_statistics_standard():
    vals = [10.0, 20.0, 30.0, 40.0, 50.0]
    stats = calculate_statistics(vals)
    assert stats['count'] == 5
    assert stats['mean'] == 30.0
    assert stats['min'] == 10.0
    assert stats['max'] == 50.0
    assert stats['p50'] == 30.0
    assert stats['p90'] == 46.0

def test_calculate_ttft():
    assert calculate_ttft(10.0, 10.5) == 0.5
    assert calculate_ttft(10.0, None) is None
    assert calculate_ttft(10.0, 9.5) is None

def test_calculate_latency():
    assert calculate_latency(10.0, 15.0) == 5.0
    assert calculate_latency(15.0, 10.0) == 0.0

def test_calculate_decode_time():
    assert calculate_decode_time(10.5, 15.0) == 4.5
    assert calculate_decode_time(None, 15.0) is None
    assert calculate_decode_time(15.0, 10.0) is None

def test_calculate_tpot():
    assert calculate_tpot(2.0, 5) == 0.5
    assert calculate_tpot(2.0, 1) == 0.0
    assert calculate_tpot(2.0, 0) == 0.0
    assert calculate_tpot(None, 5) == 0.0
    assert calculate_tpot(0.0, 5) == 0.0

def test_calculate_generation_speed():
    assert calculate_generation_speed(2.0, 5) == 2.0
    assert calculate_generation_speed(2.0, 1) == 0.0
    assert calculate_generation_speed(None, 5) == 0.0
    assert calculate_generation_speed(0.0, 5) == 0.0

def test_calculate_throughputs():
    assert calculate_aggregate_throughput(500, 10.0) == 50.0
    assert calculate_aggregate_throughput(500, 0.0) == 0.0
    assert calculate_request_throughput(20, 10.0) == 2.0
    assert calculate_request_throughput(20, 0.0) == 0.0
