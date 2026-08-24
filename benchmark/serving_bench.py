import subprocess
import time
from typing import Any, Dict, Optional, Tuple
import requests
from .providers.base import InferenceProvider
from .schemas import BenchmarkRequest

def measure_server_startup(start_command: str, health_check_url: str, timeout_seconds: int=120, poll_interval: float=0.5) -> Dict[str, Any]:
    t_start = time.perf_counter()
    proc = None
    try:
        proc = subprocess.Popen(start_command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        while True:
            t_now = time.perf_counter()
            elapsed = t_now - t_start
            if elapsed > timeout_seconds:
                return {'success': False, 'startup_time_seconds': None, 'error': f'Server startup timed out after {timeout_seconds} seconds.', 'process_id': proc.pid if proc else None}
            poll_ret = proc.poll()
            if poll_ret is not None and poll_ret != 0:
                stderr_msg = proc.stderr.read().decode('utf-8', errors='replace') if proc.stderr else ''
                return {'success': False, 'startup_time_seconds': None, 'error': f'Server process exited prematurely with code {poll_ret}. Stderr: {stderr_msg}', 'process_id': proc.pid}
            try:
                resp = requests.get(health_check_url, timeout=2)
                if resp.status_code == 200:
                    t_ready = time.perf_counter()
                    startup_time = round(t_ready - t_start, 4)
                    return {'success': True, 'startup_time_seconds': startup_time, 'error': None, 'process_id': proc.pid}
            except Exception:
                pass
            time.sleep(poll_interval)
    except Exception as e:
        return {'success': False, 'startup_time_seconds': None, 'error': str(e), 'process_id': proc.pid if proc else None}

def measure_model_loading_time(provider: InferenceProvider, model_name: Optional[str]=None) -> Dict[str, Any]:
    target_model = model_name or provider.model
    req = BenchmarkRequest(provider=provider.name, model=target_model, prompt='Ping model load.', max_output_tokens=1, stream=False)
    t0 = time.perf_counter()
    try:
        res = provider.generate(req)
        t1 = time.perf_counter()
        elapsed = round(t1 - t0, 4)
        return {'success': res.success, 'model_loading_time_seconds': elapsed if res.success else None, 'error': res.error}
    except Exception as e:
        t1 = time.perf_counter()
        return {'success': False, 'model_loading_time_seconds': None, 'error': str(e)}
