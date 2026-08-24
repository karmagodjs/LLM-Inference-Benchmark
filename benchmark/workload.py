import json
from pathlib import Path
from typing import Any, Dict, List, Optional
DEFAULT_TEXT_POOL = '\nArtificial intelligence is changing the way software systems are designed and deployed.\nLarge language models use transformer architectures to process sequences of tokens and generate predictions.\nModern AI infrastructure requires efficient inference systems that can provide low latency and high throughput.\nGPU memory, batching, scheduling, quantization, and hardware utilization all affect inference performance.\nLarge language model serving systems must balance response latency with aggregate throughput.\nInteractive applications usually care about time to first token while large batch workloads often prioritize total generated tokens per second.\nPerformance benchmarking requires controlled workloads so different systems can be compared fairly.\nThe model, hardware, input length, output length, concurrency, and benchmark methodology should remain consistent across experiments.\nDeep learning models rely heavily on matrix operations executed across specialized accelerators such as tensor cores and vector processing units.\nOptimizing memory bandwidth and cache locality is paramount for achieving peak operational intensity during the auto-regressive decode phase.\nDistributed inference techniques including tensor parallelism and pipeline parallelism enable serving models that exceed the capacity of a single device.\n'

class FallbackTokenizer:

    def encode(self, text: str, add_special_tokens: bool=False) -> List[int]:
        words = text.split()
        return [hash(w) % 100000 for w in words]

    def decode(self, token_ids: List[int], skip_special_tokens: bool=True) -> str:
        return ' '.join([f'word_{tid}' for tid in token_ids])

class WorkloadGenerator:

    def __init__(self, model_name: str='Qwen/Qwen2.5-3B-Instruct', seed: int=42, text_pool: str=DEFAULT_TEXT_POOL, tokenizer: Optional[Any]=None):
        self.model_name = model_name
        self.seed = seed
        self.text_pool = text_pool
        self.tokenizer = tokenizer if tokenizer is not None else self._load_tokenizer(model_name)

    def _load_tokenizer(self, model_name: str) -> Any:
        try:
            from transformers import AutoTokenizer
            try:
                return AutoTokenizer.from_pretrained(model_name, local_files_only=True)
            except Exception:
                return AutoTokenizer.from_pretrained(model_name, local_files_only=False, trust_remote_code=True)
        except Exception:
            return FallbackTokenizer()

    def generate_dataset(self, input_token_levels: List[int]=[128, 256, 512], requests_per_level: int=10) -> List[Dict[str, Any]]:
        pool_tokens = self.tokenizer.encode(self.text_pool, add_special_tokens=False)
        if not pool_tokens:
            raise ValueError('Text pool could not be tokenized.')
        workloads: List[Dict[str, Any]] = []
        for target_tokens in input_token_levels:
            for req_idx in range(requests_per_level):
                start = req_idx * target_tokens % len(pool_tokens)
                selected_ids = []
                for i in range(target_tokens):
                    selected_ids.append(pool_tokens[(start + i) % len(pool_tokens)])
                prompt = self.tokenizer.decode(selected_ids, skip_special_tokens=True).strip()
                actual_tokens = len(self.tokenizer.encode(prompt, add_special_tokens=False))
                workloads.append({'request_id': f'{target_tokens}_{req_idx + 1}', 'requested_input_tokens': target_tokens, 'actual_input_tokens': actual_tokens, 'prompt': prompt})
        return workloads

    def save(self, workloads: List[Dict[str, Any]], output_path: str | Path='results/workload.json') -> Path:
        target = Path(output_path).resolve()
        target.parent.mkdir(parents=True, exist_ok=True)
        with open(target, 'w', encoding='utf-8') as f:
            json.dump(workloads, f, indent=4, ensure_ascii=False)
        return target

def main():
    import argparse
    from .config import load_config, get_default_config_path
    parser = argparse.ArgumentParser(description='InferBench Workload Generator')
    parser.add_argument('--config', type=str, default=None, help='Path to YAML config file (default: configs/benchmark.yaml)')
    parser.add_argument('--output', type=str, default=None, help='Path to output workload.json file')
    parser.add_argument('--requests', type=int, default=None, help='Number of requests per input token level')
    args = parser.parse_args()
    cfg = load_config(args.config)
    output_path = args.output or cfg.workload.workload_file
    requests_per_level = args.requests or cfg.workload.benchmark_requests
    print(f'Generating workload for levels: {cfg.workload.input_tokens}')
    print(f'Requests per level: {requests_per_level}')
    generator = WorkloadGenerator(model_name='Qwen/Qwen2.5-3B-Instruct', seed=cfg.workload.seed)
    workloads = generator.generate_dataset(input_token_levels=cfg.workload.input_tokens, requests_per_level=requests_per_level)
    saved_file = generator.save(workloads, output_path)
    print(f'Successfully generated {len(workloads)} requests -> {saved_file}')
if __name__ == '__main__':
    main()
