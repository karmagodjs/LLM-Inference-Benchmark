from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional
import yaml

@dataclass
class ProjectConfig:
    name: str = 'InferBench'
    version: str = '0.1'

@dataclass
class ModelConfig:
    name: str = 'qwen2.5:3b'
    framework: str = 'ollama'
    quantization: str = 'default'

@dataclass
class ServerConfig:
    base_url: str = 'http://localhost:11434'
    timeout_seconds: int = 300

@dataclass
class WorkloadConfig:
    warmup_requests: int = 2
    benchmark_requests: int = 5
    concurrency: List[int] = field(default_factory=lambda: [1, 2, 4])
    input_tokens: List[int] = field(default_factory=lambda: [128, 256, 512])
    output_tokens: List[int] = field(default_factory=lambda: [128])
    seed: int = 42
    workload_file: str = 'results/workload.json'

@dataclass
class CostConfig:
    enabled: bool = False
    gpu_hourly_cost: float = 0.0
    input_cost_per_1m_tokens: float = 0.0
    output_cost_per_1m_tokens: float = 0.0

@dataclass
class PricingConfig:
    input_per_1m_tokens: float = 0.0
    output_per_1m_tokens: float = 0.0
    currency: str = 'USD'

@dataclass
class ProviderConfig:
    name: str = 'ollama'
    model: str = 'qwen2.5:3b'
    api_key_env: Optional[str] = None
    base_url: Optional[str] = None
    type: Optional[str] = None
    pricing: Optional[PricingConfig] = None
    requests_per_second_limit: Optional[float] = None
    max_retries: int = 3
    extra_headers: Optional[Dict[str, str]] = None
    quantization: str = 'default'
    framework: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {'name': self.name, 'model': self.model, 'api_key_env': self.api_key_env, 'base_url': self.base_url, 'type': self.type, 'pricing': {'input_per_1m_tokens': self.pricing.input_per_1m_tokens, 'output_per_1m_tokens': self.pricing.output_per_1m_tokens, 'currency': self.pricing.currency} if self.pricing else None, 'requests_per_second_limit': self.requests_per_second_limit, 'max_retries': self.max_retries, 'extra_headers': self.extra_headers, 'quantization': self.quantization, 'framework': self.framework or self.name}

@dataclass
class SystemMonitoringConfig:
    enabled: bool = True
    monitor_cpu: bool = True
    monitor_ram: bool = True
    monitor_gpu: bool = True

@dataclass
class BenchmarkConfig:
    project: ProjectConfig = field(default_factory=ProjectConfig)
    model: ModelConfig = field(default_factory=ModelConfig)
    server: ServerConfig = field(default_factory=ServerConfig)
    workload: WorkloadConfig = field(default_factory=WorkloadConfig)
    cost: CostConfig = field(default_factory=CostConfig)
    monitoring: SystemMonitoringConfig = field(default_factory=SystemMonitoringConfig)
    providers: List[ProviderConfig] = field(default_factory=list)
    mode: str = 'model_comparison'
    config_path: Optional[Path] = None

    def to_dict(self) -> Dict[str, Any]:
        return {'mode': self.mode, 'project': {'name': self.project.name, 'version': self.project.version}, 'model': {'name': self.model.name, 'framework': self.model.framework, 'quantization': self.model.quantization}, 'server': {'base_url': self.server.base_url, 'timeout_seconds': self.server.timeout_seconds}, 'workload': {'warmup_requests': self.workload.warmup_requests, 'benchmark_requests': self.workload.benchmark_requests, 'concurrency': self.workload.concurrency, 'input_tokens': self.workload.input_tokens, 'output_tokens': self.workload.output_tokens, 'seed': self.workload.seed, 'workload_file': self.workload.workload_file}, 'cost': {'enabled': self.cost.enabled, 'gpu_hourly_cost': self.cost.gpu_hourly_cost, 'input_cost_per_1m_tokens': self.cost.input_cost_per_1m_tokens, 'output_cost_per_1m_tokens': self.cost.output_cost_per_1m_tokens}, 'monitoring': {'enabled': self.monitoring.enabled, 'monitor_cpu': self.monitoring.monitor_cpu, 'monitor_ram': self.monitoring.monitor_ram, 'monitor_gpu': self.monitoring.monitor_gpu}, 'providers': [p.to_dict() for p in self.providers]}

def get_default_config_path() -> Path:
    project_root = Path(__file__).resolve().parent.parent
    return project_root / 'configs' / 'benchmark.yaml'

def validate_config_dict(data: Dict[str, Any]) -> None:
    if not isinstance(data, dict):
        raise ValueError('Configuration must be a dictionary.')
    if 'providers' in data:
        provs = data['providers']
        if not isinstance(provs, list) or len(provs) == 0:
            raise ValueError("'providers' section must be a non-empty list of provider configurations.")
        for idx, p in enumerate(provs):
            if not isinstance(p, dict):
                raise ValueError(f'Provider entry #{idx + 1} must be a dictionary.')
            if 'name' not in p or not p['name']:
                raise ValueError(f"Provider entry #{idx + 1} must have a non-empty 'name'.")
    elif 'model' in data:
        if not isinstance(data['model'], dict):
            raise ValueError("'model' section must be a dictionary.")
        if 'name' not in data['model'] or not data['model']['name']:
            raise ValueError("'model.name' is required and cannot be empty.")
    else:
        raise ValueError("Missing required 'model' section in configuration.")
    if 'workload' in data:
        wl = data['workload']
        if not isinstance(wl, dict):
            raise ValueError("'workload' section must be a dictionary.")
        for list_field in ['concurrency', 'input_tokens', 'output_tokens']:
            if list_field in wl:
                val = wl[list_field]
                if not isinstance(val, list) or len(val) == 0:
                    raise ValueError(f"'workload.{list_field}' must be a non-empty list of integers.")
                for item in val:
                    if not isinstance(item, int) or item <= 0:
                        raise ValueError(f"Items in 'workload.{list_field}' must be positive integers, got {item}.")

def parse_provider_entry(p_data: Dict[str, Any]) -> ProviderConfig:
    pricing_data = p_data.get('pricing')
    pricing = None
    if isinstance(pricing_data, dict):
        pricing = PricingConfig(input_per_1m_tokens=float(pricing_data.get('input_per_1m_tokens', 0.0)), output_per_1m_tokens=float(pricing_data.get('output_per_1m_tokens', 0.0)), currency=str(pricing_data.get('currency', 'USD')))
    return ProviderConfig(name=str(p_data.get('name', 'ollama')).lower().strip(), model=str(p_data.get('model', 'qwen2.5:3b')), api_key_env=p_data.get('api_key_env'), base_url=p_data.get('base_url'), type=p_data.get('type'), pricing=pricing, requests_per_second_limit=float(p_data['requests_per_second_limit']) if 'requests_per_second_limit' in p_data and p_data['requests_per_second_limit'] is not None else None, max_retries=int(p_data.get('max_retries', 3)), extra_headers=p_data.get('extra_headers'), quantization=str(p_data.get('quantization', 'default')), framework=p_data.get('framework'))

def load_config(path: Optional[str | Path]=None) -> BenchmarkConfig:
    if path is None:
        resolved_path = get_default_config_path()
    else:
        resolved_path = Path(path).resolve()
    if not resolved_path.exists():
        raise FileNotFoundError(f'Configuration file not found: {resolved_path}')
    try:
        with open(resolved_path, 'r', encoding='utf-8') as file:
            data = yaml.safe_load(file) or {}
    except yaml.YAMLError as e:
        raise ValueError(f'Invalid YAML in configuration file {resolved_path}: {e}') from e
    validate_config_dict(data)
    mode = str(data.get('mode', 'model_comparison')).lower().strip()
    proj_data = data.get('project', {})
    project = ProjectConfig(name=proj_data.get('name', 'InferBench'), version=str(proj_data.get('version', '0.1')))
    providers_list: List[ProviderConfig] = []
    if 'providers' in data and isinstance(data['providers'], list):
        for p in data['providers']:
            providers_list.append(parse_provider_entry(p))
    model_data = data.get('model', {})
    if model_data:
        model = ModelConfig(name=model_data.get('name', 'qwen2.5:3b'), framework=model_data.get('framework', 'ollama').lower(), quantization=model_data.get('quantization', 'default'))
    elif providers_list:
        model = ModelConfig(name=providers_list[0].model, framework=providers_list[0].name, quantization=providers_list[0].quantization)
    else:
        model = ModelConfig()
    server_data = data.get('server', {})
    server = ServerConfig(base_url=server_data.get('base_url', 'http://localhost:11434'), timeout_seconds=server_data.get('timeout_seconds', 300))
    if not providers_list:
        providers_list.append(ProviderConfig(name=model.framework, model=model.name, base_url=server.base_url, quantization=model.quantization))
    wl_data = data.get('workload', {})
    workload = WorkloadConfig(warmup_requests=int(wl_data.get('warmup_requests', 2)), benchmark_requests=int(wl_data.get('benchmark_requests', 5)), concurrency=[int(c) for c in wl_data.get('concurrency', [1, 2, 4])], input_tokens=[int(t) for t in wl_data.get('input_tokens', [128, 256, 512])], output_tokens=[int(t) for t in wl_data.get('output_tokens', [128])], seed=int(wl_data.get('seed', 42)), workload_file=wl_data.get('workload_file', 'results/workload.json'))
    cost_data = data.get('cost', {})
    cost = CostConfig(enabled=bool(cost_data.get('enabled', False)), gpu_hourly_cost=float(cost_data.get('gpu_hourly_cost', 0.0)), input_cost_per_1m_tokens=float(cost_data.get('input_cost_per_1m_tokens', 0.0)), output_cost_per_1m_tokens=float(cost_data.get('output_cost_per_1m_tokens', 0.0)))
    mon_data = data.get('monitoring', {})
    monitoring = SystemMonitoringConfig(enabled=bool(mon_data.get('enabled', True)), monitor_cpu=bool(mon_data.get('monitor_cpu', True)), monitor_ram=bool(mon_data.get('monitor_ram', True)), monitor_gpu=bool(mon_data.get('monitor_gpu', True)))
    return BenchmarkConfig(project=project, model=model, server=server, workload=workload, cost=cost, monitoring=monitoring, providers=providers_list, mode=mode, config_path=resolved_path)
