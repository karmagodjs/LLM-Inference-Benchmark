import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

class WorkloadLoader:

    def __init__(self, path: Optional[Union[str, Path]]=None):
        if path is None:
            project_root = Path(__file__).resolve().parent.parent
            self.path = project_root / 'results' / 'workload.json'
        else:
            self.path = Path(path).resolve()

    def load(self) -> List[Dict[str, Any]]:
        if not self.path.exists():
            raise FileNotFoundError(f"Workload file not found: {self.path}. Run 'python -m benchmark.generate_workload' to create it.")
        try:
            with open(self.path, 'r', encoding='utf-8') as file:
                workloads = json.load(file)
        except json.JSONDecodeError as e:
            raise ValueError(f'Workload file {self.path} contains invalid JSON: {e}') from e
        if not isinstance(workloads, list) or len(workloads) == 0:
            raise ValueError(f'Workload file {self.path} is empty or is not a JSON list.')
        required_keys = {'request_id', 'requested_input_tokens', 'actual_input_tokens', 'prompt'}
        for i, item in enumerate(workloads):
            if not isinstance(item, dict):
                raise ValueError(f'Workload entry #{i} must be a JSON object.')
            missing = required_keys - set(item.keys())
            if missing:
                raise ValueError(f"Workload entry #{i} ({item.get('request_id', 'unknown')}) is missing required keys: {missing}")
        return workloads

    def filter_by_input_tokens(self, workloads: List[Dict[str, Any]], input_tokens: int) -> List[Dict[str, Any]]:
        return [item for item in workloads if item.get('requested_input_tokens') == input_tokens]

    def get_prompts(self, workloads: List[Dict[str, Any]]) -> List[str]:
        return [item['prompt'] for item in workloads if 'prompt' in item]

    def get_actual_input_tokens(self, workloads: List[Dict[str, Any]]) -> List[int]:
        return [item['actual_input_tokens'] for item in workloads if 'actual_input_tokens' in item]
