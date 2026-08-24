from unittest.mock import MagicMock, patch
import pytest
import requests
from benchmark.backends import OllamaClient, get_backend

def test_get_backend_factory():
    client = get_backend('ollama', model='qwen2.5:3b')
    assert isinstance(client, OllamaClient)
    assert client.model == 'qwen2.5:3b'
    with pytest.raises(ValueError, match='Unsupported framework'):
        get_backend('unsupported_backend')

@patch('requests.Session.get')
def test_ollama_health_check_success(mock_get):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {'models': [{'name': 'qwen2.5:3b:latest'}, {'name': 'llama3:latest'}]}
    mock_get.return_value = mock_resp
    client = OllamaClient(model='qwen2.5:3b')
    healthy, msg = client.health_check()
    assert healthy is True
    assert 'available' in msg

@patch('requests.Session.get')
def test_ollama_health_check_model_missing(mock_get):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {'models': [{'name': 'llama3:latest'}]}
    mock_get.return_value = mock_resp
    client = OllamaClient(model='nonexistent:model')
    healthy, msg = client.health_check()
    assert healthy is False
    assert 'ollama pull nonexistent:model' in msg

@patch('requests.Session.get')
def test_ollama_health_check_offline(mock_get):
    mock_get.side_effect = requests.exceptions.ConnectionError('Connection refused')
    client = OllamaClient(model='qwen2.5:3b')
    healthy, msg = client.health_check()
    assert healthy is False
    assert 'Ollama is not running' in msg

@patch('requests.Session.post')
def test_ollama_generate_stream_mock(mock_post):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.iter_lines.return_value = [b'{"response": "Hello", "done": false}', b'{"response": " world", "done": false}', b'{"response": "!", "done": true, "eval_count": 3}']
    mock_post.return_value = mock_resp
    client = OllamaClient(model='qwen2.5:3b')
    res = client.generate_stream(prompt='Hi', output_tokens=10)
    assert res['response'] == 'Hello world!'
    assert res['eval_count'] == 3
    assert res['first_token_time'] is not None
    assert res['end_time'] >= res['first_token_time']
