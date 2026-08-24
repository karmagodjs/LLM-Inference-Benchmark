import json
import os
import time
from unittest.mock import MagicMock, patch
import pytest
import requests
from benchmark.provider_factory import ProviderFactory, PROVIDER_REGISTRY
from benchmark.providers.base import InferenceProvider, ProviderPricing
from benchmark.providers.openai import OpenAIProvider
from benchmark.providers.gemini import GeminiProvider
from benchmark.providers.anthropic import AnthropicProvider
from benchmark.providers.grok import GrokProvider
from benchmark.providers.huggingface import HuggingFaceProvider
from benchmark.providers.openrouter import OpenRouterProvider
from benchmark.providers.ollama import OllamaProvider
from benchmark.providers.openai_compatible import OpenAICompatibleProvider
from benchmark.schemas import BenchmarkRequest, NormalizedResponse

def test_provider_factory_instantiation():
    openai_p = ProviderFactory.get_provider('openai', model='gpt-4o-mini')
    assert isinstance(openai_p, OpenAIProvider)
    assert openai_p.name == 'openai'
    assert openai_p.model == 'gpt-4o-mini'
    gemini_p = ProviderFactory.get_provider('google_gemini', model='gemini-2.5-flash')
    assert isinstance(gemini_p, GeminiProvider)
    assert gemini_p.name == 'gemini'
    claude_p = ProviderFactory.get_provider('claude', model='claude-3-5-sonnet-20241022')
    assert isinstance(claude_p, AnthropicProvider)
    assert claude_p.name == 'anthropic'
    grok_p = ProviderFactory.get_provider('grok', model='grok-2-latest')
    assert isinstance(grok_p, GrokProvider)
    hf_p = ProviderFactory.get_provider('huggingface')
    assert isinstance(hf_p, HuggingFaceProvider)
    or_p = ProviderFactory.get_provider('openrouter')
    assert isinstance(or_p, OpenRouterProvider)
    ollama_p = ProviderFactory.get_provider('ollama')
    assert isinstance(ollama_p, OllamaProvider)
    custom_p = ProviderFactory.get_provider('custom_engine', model='custom-m', base_url='http://vllm:8000/v1')
    assert isinstance(custom_p, OpenAICompatibleProvider)
    assert custom_p.model == 'custom-m'

def test_credential_validation():
    with patch.dict(os.environ, {}, clear=True):
        p = OpenAIProvider(api_key_env='OPENAI_API_KEY')
        valid, msg = p.validate_credentials()
        assert valid is False
        assert 'OPENAI_API_KEY' in msg
        ollama = OllamaProvider()
        valid, _ = ollama.validate_credentials()
        assert valid is True
    with patch.dict(os.environ, {'OPENAI_API_KEY': 'sk-test12345'}):
        p = OpenAIProvider(api_key_env='OPENAI_API_KEY')
        valid, msg = p.validate_credentials()
        assert valid is True
        assert p.api_key == 'sk-test12345'

def test_provider_discovery_all_credentials():
    statuses = ProviderFactory.check_all_credentials()
    assert isinstance(statuses, list)
    prov_keys = [s['provider'] for s in statuses]
    assert 'ollama' in prov_keys
    assert 'openai' in prov_keys
    assert 'gemini' in prov_keys
    assert 'anthropic' in prov_keys

@patch('requests.Session.post')
def test_openai_generate_non_streaming(mock_post):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {'choices': [{'message': {'content': 'Hello from OpenAI!'}, 'finish_reason': 'stop'}], 'usage': {'prompt_tokens': 15, 'completion_tokens': 6, 'total_tokens': 21}}
    mock_post.return_value = mock_resp
    provider = OpenAIProvider(api_key='mock_key')
    req = BenchmarkRequest(provider='openai', model='gpt-4o-mini', prompt='Hi', max_output_tokens=10)
    res = provider.generate(req)
    assert res.success is True
    assert res.text == 'Hello from OpenAI!'
    assert res.input_tokens == 15
    assert res.output_tokens == 6
    assert res.token_usage_estimated is False
    assert res.ttft is None

@patch('requests.Session.post')
def test_openai_generate_stream(mock_post):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.iter_lines.return_value = [b'data: {"choices": [{"delta": {"content": "Hello"}}]}', b'data: {"choices": [{"delta": {"content": " world"}}]}', b'data: {"choices": [{"delta": {}, "finish_reason": "stop"}], "usage": {"prompt_tokens": 12, "completion_tokens": 2}}', b'data: [DONE]']
    mock_post.return_value = mock_resp
    provider = OpenAIProvider(api_key='mock_key')
    req = BenchmarkRequest(provider='openai', model='gpt-4o-mini', prompt='Hi', max_output_tokens=10)
    res = provider.generate_stream(req)
    assert res.success is True
    assert res.text == 'Hello world'
    assert res.input_tokens == 12
    assert res.output_tokens == 2
    assert res.ttft is not None
    assert res.ttft >= 0.0
    assert res.token_usage_estimated is False

@patch('requests.Session.post')
def test_gemini_generate_stream(mock_post):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.iter_lines.return_value = [b'data: {"candidates": [{"content": {"parts": [{"text": "Gemini response "}]}}]}', b'data: {"candidates": [{"content": {"parts": [{"text": "streamed!"}], "finishReason": "STOP"}}], "usageMetadata": {"promptTokenCount": 20, "candidatesTokenCount": 4}}']
    mock_post.return_value = mock_resp
    provider = GeminiProvider(api_key='mock_gemini_key')
    req = BenchmarkRequest(provider='gemini', model='gemini-2.5-flash', prompt='Test Gemini', max_output_tokens=10)
    res = provider.generate_stream(req)
    assert res.success is True
    assert res.text == 'Gemini response streamed!'
    assert res.input_tokens == 20
    assert res.output_tokens == 4
    assert res.ttft is not None
    assert res.token_usage_estimated is False

@patch('requests.Session.post')
def test_anthropic_generate_stream(mock_post):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.iter_lines.return_value = [b'data: {"type": "message_start", "message": {"usage": {"input_tokens": 35}}}', b'data: {"type": "content_block_delta", "delta": {"type": "text_delta", "text": "Claude "}}', b'data: {"type": "content_block_delta", "delta": {"type": "text_delta", "text": "answers."}}', b'data: {"type": "message_delta", "delta": {"stop_reason": "end_turn"}, "usage": {"output_tokens": 3}}', b'data: {"type": "message_stop"}']
    mock_post.return_value = mock_resp
    provider = AnthropicProvider(api_key='mock_anthropic_key')
    req = BenchmarkRequest(provider='anthropic', model='claude-3-5-sonnet', prompt='Test Claude', max_output_tokens=10)
    res = provider.generate_stream(req)
    assert res.success is True
    assert res.text == 'Claude answers.'
    assert res.input_tokens == 35
    assert res.output_tokens == 3
    assert res.ttft is not None
    assert res.token_usage_estimated is False

@patch('requests.Session.post')
def test_retry_on_429_rate_limit(mock_post):
    rate_limit_resp = MagicMock()
    rate_limit_resp.status_code = 429
    rate_limit_resp.headers = {'Retry-After': '0'}
    rate_limit_error = requests.HTTPError('429 Client Error: Too Many Requests', response=rate_limit_resp)
    success_resp = MagicMock()
    success_resp.status_code = 200
    success_resp.json.return_value = {'choices': [{'message': {'content': 'Recovered from 429!'}}], 'usage': {'prompt_tokens': 10, 'completion_tokens': 4}}
    mock_post.side_effect = [rate_limit_error, success_resp]
    provider = OpenAIProvider(api_key='mock_key', initial_backoff=0.01)
    req = BenchmarkRequest(provider='openai', model='gpt-4o-mini', prompt='Hi')
    res = provider.generate(req)
    assert res.success is True
    assert res.retry_count == 1
    assert res.rate_limited is True
    assert res.text == 'Recovered from 429!'

@patch('requests.Session.post')
def test_permanent_error_no_infinite_retry(mock_post):
    perm_resp = MagicMock()
    perm_resp.status_code = 401
    perm_error = requests.HTTPError('401 Unauthorized', response=perm_resp)
    mock_post.side_effect = perm_error
    provider = OpenAIProvider(api_key='bad_key', max_retries=3, initial_backoff=0.01)
    req = BenchmarkRequest(provider='openai', model='gpt-4o-mini', prompt='Hi')
    res = provider.generate(req)
    assert res.success is False
    assert res.retry_count == 0
    assert '401' in res.error

@patch('requests.Session.post')
def test_openai_compatible_custom_provider(mock_post):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {'choices': [{'message': {'content': 'Custom vLLM output'}}], 'usage': {'prompt_tokens': 50, 'completion_tokens': 25}}
    mock_post.return_value = mock_resp
    pricing = ProviderPricing(input_per_1m_tokens=0.5, output_per_1m_tokens=1.5)
    provider = OpenAICompatibleProvider(name='vllm_local', model='llama-3-8b', base_url='http://localhost:8000/v1', api_key=None, pricing=pricing)
    req = BenchmarkRequest(provider='vllm_local', model='llama-3-8b', prompt='Hello custom')
    res = provider.generate(req)
    assert res.success is True
    assert res.text == 'Custom vLLM output'
    assert res.input_tokens == 50
    assert res.output_tokens == 25
    assert provider.pricing.input_per_1m_tokens == 0.5

@patch('requests.Session.post')
def test_fallback_token_estimation_when_unreported(mock_post):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {'choices': [{'message': {'content': 'This is a long response without usage tokens reported.'}}]}
    mock_post.return_value = mock_resp
    provider = OpenAICompatibleProvider(model='unreported-tokens-model', base_url='http://mock:8000')
    req = BenchmarkRequest(provider='openai_compatible', model='test', prompt='Short prompt')
    res = provider.generate(req)
    assert res.success is True
    assert res.token_usage_estimated is True
    assert res.input_tokens > 0
    assert res.output_tokens > 0
