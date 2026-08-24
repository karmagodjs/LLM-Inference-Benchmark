import json
import shutil
import subprocess
import threading
import time
from typing import Any, Dict, List, Optional
import psutil

def get_gpu_metrics() -> Dict[str, Any]:
    metrics: Dict[str, Any] = {'gpu_available': False, 'gpu_name': None, 'gpu_utilization': None, 'gpu_memory_used_mb': None, 'gpu_memory_total_mb': None, 'gpu_power_watts': None}
    if shutil.which('nvidia-smi'):
        try:
            res = subprocess.run(['nvidia-smi', '--query-gpu=name,utilization.gpu,memory.used,memory.total,power.draw', '--format=csv,noheader,nounits'], capture_output=True, text=True, timeout=2)
            if res.returncode == 0 and res.stdout.strip():
                lines = res.stdout.strip().split('\n')
                first_gpu = lines[0].split(',')
                if len(first_gpu) >= 4:
                    gpu_name = first_gpu[0].strip()
                    gpu_util = float(first_gpu[1].strip())
                    mem_used = float(first_gpu[2].strip())
                    mem_total = float(first_gpu[3].strip())
                    power_draw = None
                    if len(first_gpu) >= 5:
                        try:
                            power_draw = float(first_gpu[4].strip())
                        except Exception:
                            power_draw = None
                    metrics['gpu_available'] = True
                    metrics['gpu_name'] = gpu_name
                    metrics['gpu_utilization'] = gpu_util
                    metrics['gpu_memory_used_mb'] = round(mem_used, 2)
                    metrics['gpu_memory_total_mb'] = round(mem_total, 2)
                    metrics['gpu_power_watts'] = round(power_draw, 2) if power_draw is not None else None
                    return metrics
        except Exception:
            pass
    if shutil.which('rocm-smi'):
        try:
            res = subprocess.run(['rocm-smi', '--showuse', '--showmeminfo', 'vram', '--showpower', '--json'], capture_output=True, text=True, timeout=2)
            if res.returncode == 0 and res.stdout.strip():
                data = json.loads(res.stdout)
                metrics['gpu_available'] = True
                metrics['gpu_name'] = 'AMD Radeon (ROCm)'
                if isinstance(data, dict):
                    card = next(iter(data.values())) if data else {}
                    if 'GPU use (%)' in card:
                        metrics['gpu_utilization'] = float(card['GPU use (%)'])
                    if 'VRAM Total Memory (B)' in card and 'VRAM Total Used Memory (B)' in card:
                        used_mb = float(card['VRAM Total Used Memory (B)']) / (1024 * 1024)
                        total_mb = float(card['VRAM Total Memory (B)']) / (1024 * 1024)
                        metrics['gpu_memory_used_mb'] = round(used_mb, 2)
                        metrics['gpu_memory_total_mb'] = round(total_mb, 2)
                    if 'Average Graphics Package Power (W)' in card:
                        metrics['gpu_power_watts'] = float(card['Average Graphics Package Power (W)'])
                return metrics
        except Exception:
            pass
    try:
        import torch
        if torch.cuda.is_available():
            metrics['gpu_available'] = True
            metrics['gpu_name'] = torch.cuda.get_device_name(0)
            mem_alloc = torch.cuda.memory_allocated(0) / (1024 * 1024)
            mem_total = torch.cuda.get_device_properties(0).total_memory / (1024 * 1024)
            metrics['gpu_memory_used_mb'] = round(mem_alloc, 2)
            metrics['gpu_memory_total_mb'] = round(mem_total, 2)
            return metrics
    except Exception:
        pass
    return metrics

def get_system_snapshot() -> Dict[str, Any]:
    cpu_percent = psutil.cpu_percent(interval=None)
    vm = psutil.virtual_memory()
    ram_percent = vm.percent
    ram_used_gb = round(vm.used / 1024 ** 3, 2)
    ram_total_gb = round(vm.total / 1024 ** 3, 2)
    gpu_info = get_gpu_metrics()
    return {'cpu_percent': cpu_percent, 'ram_percent': ram_percent, 'ram_used_gb': ram_used_gb, 'ram_total_gb': ram_total_gb, 'gpu_available': gpu_info['gpu_available'], 'gpu_name': gpu_info['gpu_name'], 'gpu_utilization': gpu_info['gpu_utilization'], 'gpu_memory_used_mb': gpu_info['gpu_memory_used_mb'], 'gpu_memory_total_mb': gpu_info['gpu_memory_total_mb'], 'gpu_power_watts': gpu_info['gpu_power_watts']}

class SystemMonitor:

    def __init__(self, interval_seconds: float=0.1):
        self.interval_seconds = max(0.02, interval_seconds)
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self.cpu_samples: List[float] = []
        self.ram_used_gb_samples: List[float] = []
        self.ram_percent_samples: List[float] = []
        self.gpu_util_samples: List[float] = []
        self.gpu_mem_samples: List[float] = []
        self.gpu_power_samples: List[float] = []
        self.gpu_available = False
        self.gpu_name: Optional[str] = None
        self.gpu_memory_total_mb: Optional[float] = None

    def _sample_loop(self) -> None:
        psutil.cpu_percent(interval=None)
        while not self._stop_event.is_set():
            try:
                cpu = psutil.cpu_percent(interval=None)
                vm = psutil.virtual_memory()
                ram_gb = vm.used / 1024 ** 3
                ram_pct = vm.percent
                self.cpu_samples.append(cpu)
                self.ram_used_gb_samples.append(ram_gb)
                self.ram_percent_samples.append(ram_pct)
                gpu = get_gpu_metrics()
                if gpu['gpu_available']:
                    self.gpu_available = True
                    self.gpu_name = gpu['gpu_name']
                    self.gpu_memory_total_mb = gpu['gpu_memory_total_mb']
                    if gpu['gpu_utilization'] is not None:
                        self.gpu_util_samples.append(gpu['gpu_utilization'])
                    if gpu['gpu_memory_used_mb'] is not None:
                        self.gpu_mem_samples.append(gpu['gpu_memory_used_mb'])
                    if gpu['gpu_power_watts'] is not None:
                        self.gpu_power_samples.append(gpu['gpu_power_watts'])
            except Exception:
                pass
            time.sleep(self.interval_seconds)

    def start(self) -> 'SystemMonitor':
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._sample_loop, daemon=True)
        self._thread.start()
        return self

    def stop(self) -> Dict[str, Any]:
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2.0)
        sample_count = len(self.cpu_samples)
        if sample_count == 0:
            return get_system_snapshot()
        cpu_avg = round(sum(self.cpu_samples) / sample_count, 2)
        cpu_peak = round(max(self.cpu_samples), 2)
        ram_gb_avg = round(sum(self.ram_used_gb_samples) / sample_count, 2)
        ram_gb_peak = round(max(self.ram_used_gb_samples), 2)
        ram_pct_avg = round(sum(self.ram_percent_samples) / sample_count, 2)
        gpu_util_avg = round(sum(self.gpu_util_samples) / len(self.gpu_util_samples), 2) if self.gpu_util_samples else None
        gpu_util_peak = round(max(self.gpu_util_samples), 2) if self.gpu_util_samples else None
        gpu_mem_avg = round(sum(self.gpu_mem_samples) / len(self.gpu_mem_samples), 2) if self.gpu_mem_samples else None
        gpu_mem_peak = round(max(self.gpu_mem_samples), 2) if self.gpu_mem_samples else None
        gpu_power_avg = round(sum(self.gpu_power_samples) / len(self.gpu_power_samples), 2) if self.gpu_power_samples else None
        gpu_power_peak = round(max(self.gpu_power_samples), 2) if self.gpu_power_samples else None
        return {'samples_count': sample_count, 'cpu_percent': cpu_avg, 'cpu_percent_peak': cpu_peak, 'ram_percent': ram_pct_avg, 'ram_used_gb': ram_gb_avg, 'ram_used_gb_peak': ram_gb_peak, 'gpu_available': self.gpu_available, 'gpu_name': self.gpu_name, 'gpu_utilization': gpu_util_avg, 'gpu_utilization_peak': gpu_util_peak, 'gpu_memory_used_mb': gpu_mem_avg, 'gpu_memory_used_mb_peak': gpu_mem_peak, 'gpu_memory_total_mb': self.gpu_memory_total_mb, 'gpu_power_watts': gpu_power_avg, 'gpu_power_watts_peak': gpu_power_peak}
