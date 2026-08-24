from benchmark.run import main, parse_args

def test_parse_args_defaults():
    args = parse_args([])
    assert args.config is None
    assert args.dry_run is False
    assert args.input_tokens is None

def test_parse_args_custom():
    args = parse_args(['--config', 'custom_config.yaml', '--dry-run', '--input-tokens', '128', '256', '--output-tokens', '64', '--concurrency', '1', '2', '4', '--requests', '10', '--warmup', '3', '--model', 'llama3:8b'])
    assert args.config == 'custom_config.yaml'
    assert args.dry_run is True
    assert args.input_tokens == [128, 256]
    assert args.output_tokens == [64]
    assert args.concurrency == [1, 2, 4]
    assert args.requests == 10
    assert args.warmup == 3
    assert args.model == 'llama3:8b'

def test_cli_dry_run():
    exit_code = main(['--dry-run', '--input-tokens', '128', '--concurrency', '1'])
    assert exit_code == 0
