import json
import time
from typing import Any, Dict, List, Optional, Tuple
import requests
from .base import InferenceBackend

class OllamaClient(InferenceBackend):

    def __init__(self, model: str='qwen2.5:3b', base_url: str='http://localhost:11434', timeout: int=300):
        super().__init__(model=model, base_url=base_url, timeout=timeout)
        self.session = requests.Session()
        adapter = requests.adapters.HTTPAdapter(pool_connections=100, pool_maxsize=100, max_retries=0)
        self.session.mount('http://', adapter)
        self.session.mount('https://', adapter)

    def health_check(self) -> Tuple[bool, str]:
        url = f'{self.base_url}/api/tags'
        try:
            response = self.session.get(url, timeout=5)
            if response.status_code != 200:
                return (False, f'Ollama server returned status code {response.status_code}. Please check your Ollama instance.')
            data = response.json()
            models_list = data.get('models', [])
            installed_names = [m.get('name', '') for m in models_list]
            target = self.model.strip()
            target_base = target[:-7] if target.endswith(':latest') else target
            found = False
            for name in installed_names:
                name_clean = name.strip()
                name_base = name_clean[:-7] if name_clean.endswith(':latest') else name_clean
                if name_clean == target or name_base == target_base or name_clean == f'{target}:latest' or (target == f'{name_clean}:latest') or name_clean.startswith(f'{target}:'):
                    found = True
                    break
            if not found:
                available_str = ', '.join(installed_names) if installed_names else 'None'
                return (False, f"Model '{self.model}' is not available in Ollama.\nInstalled models: {available_str}\nRun: ollama pull {self.model}")
            return (True, f"Ollama is running and model '{self.model}' is available.")
        except requests.exceptions.ConnectionError:
            return (False, 'Ollama is not running. Please start Ollama with: ollama serve')
        except Exception as e:
            return (False, f'Ollama health check failed with error: {e}')

    def generate(self, prompt: str, output_tokens: int=128) -> str:
        url = f'{self.base_url}/api/generate'
        payload = {'model': self.model, 'prompt': prompt, 'stream': False, 'options': {'num_predict': output_tokens}}
        start_time = time.perf_counter()
        response = self.session.post(url, json=payload, timeout=self.timeout)
        response.raise_for_status()
        data = response.json()
        return data.get('response', '')

    def generate_stream(self, prompt: str, output_tokens: int=128) -> Dict[str, Any]:
        url = f'{self.base_url}/api/generate'
        payload = {'model': self.model, 'prompt': prompt, 'stream': True, 'options': {'num_predict': output_tokens}}
        start_time = time.perf_counter()
        response = self.session.post(url, json=payload, stream=True, timeout=self.timeout)
        response.raise_for_status()
        first_token_time: Optional[float] = None
        chunks: List[str] = []
        final_data: Optional[Dict[str, Any]] = None
        for line in response.iter_lines():
            if not line:
                continue
            current_time = time.perf_counter()
            data = json.loads(line.decode('utf-8') if isinstance(line, bytes) else line)
            token = data.get('response', '')
            if token and first_token_time is None:
                first_token_time = current_time
            if token:
                chunks.append(token)
            if data.get('done', False):
                final_data = data
                if first_token_time is None:
                    first_token_time = current_time
        end_time = time.perf_counter()
        eval_count = 0
        if final_data:
            eval_count = final_data.get('eval_count', len(chunks))
        else:
            eval_count = len(chunks)
        return {'response': ''.join(chunks), 'start_time': start_time, 'first_token_time': first_token_time, 'end_time': end_time, 'final_data': final_data, 'eval_count': eval_count}
