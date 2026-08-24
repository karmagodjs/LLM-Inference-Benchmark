import json
from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
st.set_page_config(page_title='InferBench Dashboard', page_icon='⚡', layout='wide', initial_sidebar_state='expanded')

def get_results_path() -> Path:
    project_root = Path(__file__).resolve().parent.parent
    return project_root / 'results' / 'concurrency.json'

@st.cache_data(ttl=5)
def load_benchmark_data(file_path_str: str) -> Optional[Dict[str, Any]]:
    path = Path(file_path_str)
    if not path.exists():
        return None
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        st.error(f'Error loading JSON data: {e}')
        return None

def extract_dataframe(data: Dict[str, Any]) -> pd.DataFrame:
    results = data.get('results', [])
    if not results:
        return pd.DataFrame()
    rows = []
    exp_id = data.get('experiment_id', '')
    mode = data.get('mode', 'model_comparison')
    model_info = data.get('model', {})
    for r in results:
        prov = r.get('provider') or r.get('framework') or model_info.get('framework', 'unknown')
        mod = r.get('model') or model_info.get('name', 'unknown')
        b_mode = r.get('benchmark_mode', mode)
        sys_metrics = r.get('system_metrics') or {}
        cost_metrics = r.get('cost_metrics') or {}
        ttft_val = r.get('ttft_p50')
        ttft_p95_val = r.get('ttft_p95')
        row = {'experiment_id': r.get('experiment_id', exp_id), 'benchmark_mode': b_mode, 'provider': prov, 'model': mod, 'provider_model': f'{prov} / {mod}', 'framework': r.get('framework', prov), 'quantization': r.get('quantization', model_info.get('quantization', 'default')), 'input_tokens': r.get('input_tokens', 0), 'actual_input_tokens_avg': r.get('actual_input_tokens_avg', 0.0), 'output_tokens': r.get('output_tokens_requested', 0), 'concurrency': r.get('concurrency', 1), 'requests': r.get('requests', 0), 'completed': r.get('completed', 0), 'failed': r.get('failed', 0), 'duration_s': r.get('benchmark_duration_seconds', 0.0), 'total_output_tokens': r.get('total_output_tokens', 0), 'throughput_tok_per_s': r.get('throughput_tokens_per_second', 0.0), 'req_per_s': r.get('requests_per_second', 0.0), 'streaming_supported': r.get('streaming_supported', True), 'ttft_supported': r.get('ttft_supported', True), 'token_usage_estimated': r.get('token_usage_estimated', False), 'token_status': 'Estimated' if r.get('token_usage_estimated') else 'Exact (API)', 'ttft_p50_s': ttft_val if ttft_val is not None else None, 'ttft_p95_s': ttft_p95_val if ttft_p95_val is not None else None, 'latency_p50_s': r.get('latency_p50', 0.0), 'latency_p95_s': r.get('latency_p95', 0.0), 'decode_time_p50_s': r.get('decode_time_p50'), 'decode_time_p95_s': r.get('decode_time_p95'), 'tpot_p50_ms': r.get('tpot_p50') * 1000.0 if r.get('tpot_p50') is not None else None, 'tpot_p95_ms': r.get('tpot_p95') * 1000.0 if r.get('tpot_p95') is not None else None, 'gen_speed_p50_tok_s': r.get('generation_tokens_per_second_p50'), 'gen_speed_p95_tok_s': r.get('generation_tokens_per_second_p95'), 'cost_total_usd': r.get('total_cost') or cost_metrics.get('total_cost_usd'), 'cost_per_request_usd': r.get('cost_per_request') or cost_metrics.get('cost_per_request_usd'), 'cost_per_1m_out_usd': r.get('cost_per_1m_output_tokens') or cost_metrics.get('cost_per_1m_output_tokens_usd'), 'startup_time_seconds': r.get('startup_time_seconds'), 'model_loading_time_seconds': r.get('model_loading_time_seconds'), 'cpu_percent': sys_metrics.get('cpu_percent'), 'cpu_percent_peak': sys_metrics.get('cpu_percent_peak'), 'ram_used_gb': sys_metrics.get('ram_used_gb'), 'ram_used_gb_peak': sys_metrics.get('ram_used_gb_peak'), 'ram_percent': sys_metrics.get('ram_percent'), 'gpu_available': sys_metrics.get('gpu_available', False), 'gpu_name': sys_metrics.get('gpu_name'), 'gpu_utilization': sys_metrics.get('gpu_utilization'), 'gpu_utilization_peak': sys_metrics.get('gpu_utilization_peak'), 'gpu_memory_used_mb': sys_metrics.get('gpu_memory_used_mb'), 'gpu_memory_used_mb_peak': sys_metrics.get('gpu_memory_used_mb_peak'), 'gpu_power_watts': sys_metrics.get('gpu_power_watts') or r.get('gpu_power_watts'), 'retry_count': r.get('retry_count', 0), 'rate_limited_count': r.get('rate_limited_count', 0), 'timestamp': r.get('timestamp', '')}
        rows.append(row)
    return pd.DataFrame(rows)

def main():
    st.title('⚡ InferBench: Provider-Agnostic LLM Benchmarking Platform')
    st.caption('Cross-provider performance, latency, TTFT, TPOT, cost, and serving infrastructure analytics.')
    results_file = get_results_path()
    st.sidebar.header('Data Source & Filters')
    custom_path = st.sidebar.text_input('Results JSON Path', str(results_file))
    if st.sidebar.button('🔄 Refresh Data'):
        st.cache_data.clear()
    raw_data = load_benchmark_data(custom_path)
    if raw_data is None or 'results' not in raw_data or (not raw_data['results']):
        st.warning(f'No benchmark results found at `{custom_path}`.\n\nRun a benchmark first with:\n```bash\npython -m benchmark.run --provider openai\n# or\npython -m benchmark.run --all-providers\n```')
        return
    df = extract_dataframe(raw_data)
    if df.empty:
        st.info('The benchmark file contains no result rows.')
        return
    st.sidebar.markdown('---')
    st.sidebar.markdown(f"**Experiment ID:** `{raw_data.get('experiment_id', 'N/A')}`")
    st.sidebar.markdown(f"**Mode:** `{raw_data.get('mode', 'model_comparison')}`")
    providers = sorted(df['provider'].unique().tolist())
    selected_providers = st.sidebar.multiselect('Providers', providers, default=providers)
    models = sorted(df['model'].unique().tolist())
    selected_models = st.sidebar.multiselect('Models', models, default=models)
    input_sizes = sorted(df['input_tokens'].unique().tolist())
    selected_inputs = st.sidebar.multiselect('Input Tokens', input_sizes, default=input_sizes)
    output_sizes = sorted(df['output_tokens'].unique().tolist())
    selected_outputs = st.sidebar.multiselect('Output Tokens', output_sizes, default=output_sizes)
    concurrency_levels = sorted(df['concurrency'].unique().tolist())
    selected_concurrency = st.sidebar.multiselect('Concurrency', concurrency_levels, default=concurrency_levels)
    filtered_df = df[df['provider'].isin(selected_providers) & df['model'].isin(selected_models) & df['input_tokens'].isin(selected_inputs) & df['output_tokens'].isin(selected_outputs) & df['concurrency'].isin(selected_concurrency)]
    if filtered_df.empty:
        st.warning('No data matching the selected filter criteria.')
        return
    st.subheader('📊 Key Performance Indicators')
    c1, c2, c3, c4 = st.columns(4)
    c5, c6, c7, c8 = st.columns(4)
    valid_ttfts = filtered_df['ttft_p50_s'].dropna()
    avg_ttft = valid_ttfts.mean() if not valid_ttfts.empty else None
    avg_lat = filtered_df['latency_p50_s'].mean()
    p95_lat = filtered_df['latency_p95_s'].max()
    max_tok_tput = filtered_df['throughput_tok_per_s'].max()
    avg_tok_tput = filtered_df['throughput_tok_per_s'].mean()
    max_req_tput = filtered_df['req_per_s'].max()
    valid_speeds = filtered_df['gen_speed_p50_tok_s'].dropna()
    avg_gen_speed = valid_speeds.mean() if not valid_speeds.empty else 0.0
    c1.metric('Evaluated Providers', len(filtered_df['provider'].unique()))
    c2.metric('Evaluated Models', len(filtered_df['model'].unique()))
    c3.metric('Median Latency (Avg)', f'{avg_lat:.3f} s')
    c4.metric('P95 Latency (Peak)', f'{p95_lat:.3f} s')
    ttft_display = f'{avg_ttft:.3f} s' if avg_ttft is not None else 'N/A (Non-streaming)'
    c5.metric('Median TTFT (Avg)', ttft_display)
    c6.metric('Peak Token Throughput', f'{max_tok_tput:.1f} tok/s')
    c7.metric('Peak Request Rate', f'{max_req_tput:.2f} req/s')
    c8.metric('Avg Generation Speed', f'{avg_gen_speed:.1f} tok/s')
    st.markdown('---')
    main_tabs = st.tabs(['🏆 Model / API Comparison', '⚙️ Serving / Infrastructure Comparison', '📈 Concurrency & Scaling Curves', '📋 Raw Results & Export'])
    with main_tabs[0]:
        st.markdown('### 🏆 Model & LLM Provider Benchmark Comparison')
        st.caption('Comparing different LLM providers & models using the SAME reproducible workload.')
        col_a, col_b = st.columns(2)
        with col_a:
            ttft_df = filtered_df.dropna(subset=['ttft_p50_s'])
            if not ttft_df.empty:
                fig_ttft = px.bar(ttft_df, x='provider_model', y='ttft_p50_s', color='provider', barmode='group', title='1. Provider vs. TTFT (Time to First Token - Lower is Better)', labels={'ttft_p50_s': 'TTFT P50 (seconds)', 'provider_model': 'Provider / Model'})
                st.plotly_chart(fig_ttft, use_container_width=True)
            else:
                st.info('TTFT is not available (streaming not enabled or unsupported).')
        with col_b:
            fig_lat95 = px.bar(filtered_df, x='provider_model', y='latency_p95_s', color='provider', barmode='group', title='2. Provider vs. P95 Latency (Lower is Better)', labels={'latency_p95_s': 'Latency P95 (seconds)', 'provider_model': 'Provider / Model'})
            st.plotly_chart(fig_lat95, use_container_width=True)
        col_c, col_d = st.columns(2)
        with col_c:
            fig_tput = px.bar(filtered_df, x='provider_model', y='throughput_tok_per_s', color='provider', barmode='group', title='3. Provider vs. Aggregate Throughput (Higher is Better)', labels={'throughput_tok_per_s': 'Throughput (Tokens / sec)', 'provider_model': 'Provider / Model'})
            st.plotly_chart(fig_tput, use_container_width=True)
        with col_d:
            gen_df = filtered_df.dropna(subset=['gen_speed_p50_tok_s'])
            if not gen_df.empty:
                fig_gen = px.bar(gen_df, x='provider_model', y='gen_speed_p50_tok_s', color='provider', barmode='group', title='4. Provider vs. Single-Stream Generation Speed (Higher is Better)', labels={'gen_speed_p50_tok_s': 'Generation Speed (Tokens / sec)', 'provider_model': 'Provider / Model'})
                st.plotly_chart(fig_gen, use_container_width=True)
        cost_df = filtered_df.dropna(subset=['cost_per_1m_out_usd'])
        if not cost_df.empty:
            st.markdown('#### 💰 Cost vs. Throughput Efficiency')
            fig_cost = px.scatter(cost_df, x='throughput_tok_per_s', y='cost_per_1m_out_usd', color='provider', size='concurrency', hover_name='provider_model', title='5. Cost per 1M Output Tokens vs. Throughput', labels={'throughput_tok_per_s': 'Throughput (Tokens / sec)', 'cost_per_1m_out_usd': 'Cost per 1M Output Tokens (USD)'})
            st.plotly_chart(fig_cost, use_container_width=True)
        st.markdown('#### 📊 Provider Comparison Matrix')
        summary_cols = ['provider', 'model', 'ttft_p50_s', 'latency_p95_s', 'tpot_p50_ms', 'throughput_tok_per_s', 'cost_per_1m_out_usd', 'token_status', 'streaming_supported']
        comp_df = filtered_df[summary_cols].drop_duplicates()
        st.dataframe(comp_df.rename(columns={'ttft_p50_s': 'TTFT P50 (s)', 'latency_p95_s': 'P95 Latency (s)', 'tpot_p50_ms': 'TPOT P50 (ms)', 'throughput_tok_per_s': 'Throughput (tok/s)', 'cost_per_1m_out_usd': 'Cost / 1M Out ($)', 'token_status': 'Token Usage', 'streaming_supported': 'Streaming'}), use_container_width=True)
    with main_tabs[1]:
        st.markdown('### ⚙️ Serving & Infrastructure Engine Comparison')
        st.caption('Comparing how the SAME MODEL is served across Ollama, llama.cpp, vLLM, SGLang, TGI, and TensorRT-LLM.')
        serving_cols1, serving_cols2 = st.columns(2)
        with serving_cols1:
            fig_serv_tput = px.bar(filtered_df, x='framework', y='throughput_tok_per_s', color='framework', title='Serving Engine vs. Throughput (Tokens/sec)', labels={'throughput_tok_per_s': 'Throughput (tok/s)', 'framework': 'Serving Engine'})
            st.plotly_chart(fig_serv_tput, use_container_width=True)
        with serving_cols2:
            fig_serv_lat = px.bar(filtered_df, x='framework', y='latency_p95_s', color='framework', title='Serving Engine vs. P95 Latency (seconds)', labels={'latency_p95_s': 'P95 Latency (s)', 'framework': 'Serving Engine'})
            st.plotly_chart(fig_serv_lat, use_container_width=True)
        st.markdown('#### 💻 System & Compute Resource Footprint')
        res_col1, res_col2 = st.columns(2)
        with res_col1:
            if 'cpu_percent' in filtered_df.columns and filtered_df['cpu_percent'].notna().any():
                fig_cpu = px.bar(filtered_df, x='framework', y='cpu_percent', color='framework', title='CPU Utilization (%) by Serving Engine', labels={'cpu_percent': 'CPU Utilization (%)', 'framework': 'Serving Engine'})
                st.plotly_chart(fig_cpu, use_container_width=True)
        with res_col2:
            if 'ram_used_gb' in filtered_df.columns and filtered_df['ram_used_gb'].notna().any():
                fig_ram = px.bar(filtered_df, x='framework', y='ram_used_gb', color='framework', title='RAM Usage (GB) by Serving Engine', labels={'ram_used_gb': 'RAM Used (GB)', 'framework': 'Serving Engine'})
                st.plotly_chart(fig_ram, use_container_width=True)
        gpu_detected = filtered_df['gpu_available'].any() if 'gpu_available' in filtered_df.columns else False
        if gpu_detected:
            gpu_name_str = filtered_df['gpu_name'].dropna().iloc[0] if not filtered_df['gpu_name'].dropna().empty else 'GPU Active'
            st.success(f'GPU Hardware Detected: {gpu_name_str}')
            gpu_col1, gpu_col2 = st.columns(2)
            with gpu_col1:
                if 'gpu_memory_used_mb' in filtered_df.columns and filtered_df['gpu_memory_used_mb'].notna().any():
                    fig_vram = px.bar(filtered_df, x='framework', y='gpu_memory_used_mb', color='framework', title='GPU VRAM Usage (MB)', labels={'gpu_memory_used_mb': 'VRAM (MB)', 'framework': 'Serving Engine'})
                    st.plotly_chart(fig_vram, use_container_width=True)
            with gpu_col2:
                if 'gpu_power_watts' in filtered_df.columns and filtered_df['gpu_power_watts'].notna().any():
                    fig_pwr = px.bar(filtered_df, x='framework', y='gpu_power_watts', color='framework', title='GPU Power Draw (Watts)', labels={'gpu_power_watts': 'Power (Watts)', 'framework': 'Serving Engine'})
                    st.plotly_chart(fig_pwr, use_container_width=True)
        else:
            st.info('GPU Hardware Telemetry: No CUDA/NVML/ROCm GPU metrics available on current system (honestly reported as null).')
        if 'startup_time_seconds' in filtered_df.columns and filtered_df['startup_time_seconds'].notna().any():
            st.markdown('#### ⏱️ Engine Cold Startup & Initialization Time')
            fig_startup = px.bar(filtered_df.dropna(subset=['startup_time_seconds']), x='framework', y='startup_time_seconds', color='framework', title='Cold Server Startup Time (seconds)', labels={'startup_time_seconds': 'Startup Time (s)', 'framework': 'Serving Engine'})
            st.plotly_chart(fig_startup, use_container_width=True)
    with main_tabs[2]:
        st.markdown('### 📈 Concurrency Scaling Curves')
        filtered_df['Config_Label'] = filtered_df['provider_model'] + ' | In:' + filtered_df['input_tokens'].astype(str) + ' Out:' + filtered_df['output_tokens'].astype(str)
        sub_tab1, sub_tab2, sub_tab3, sub_tab4 = st.tabs(['Throughput vs Concurrency', 'Latency vs Concurrency', 'TTFT vs Concurrency', 'TPOT vs Concurrency'])
        with sub_tab1:
            fig_tput_scale = px.line(filtered_df, x='concurrency', y='throughput_tok_per_s', color='Config_Label', markers=True, title='Throughput Scaling vs. Concurrency', labels={'concurrency': 'Concurrency Level', 'throughput_tok_per_s': 'Tokens / sec'})
            st.plotly_chart(fig_tput_scale, use_container_width=True)
        with sub_tab2:
            fig_lat_scale = px.line(filtered_df, x='concurrency', y='latency_p50_s', color='Config_Label', markers=True, title='P50 Latency vs. Concurrency', labels={'concurrency': 'Concurrency Level', 'latency_p50_s': 'Latency P50 (s)'})
            st.plotly_chart(fig_lat_scale, use_container_width=True)
        with sub_tab3:
            ttft_sub_df = filtered_df.dropna(subset=['ttft_p50_s'])
            if not ttft_sub_df.empty:
                fig_ttft_scale = px.line(ttft_sub_df, x='concurrency', y='ttft_p50_s', color='Config_Label', markers=True, title='P50 TTFT vs. Concurrency', labels={'concurrency': 'Concurrency Level', 'ttft_p50_s': 'TTFT P50 (s)'})
                st.plotly_chart(fig_ttft_scale, use_container_width=True)
            else:
                st.info('TTFT scaling data is not available.')
        with sub_tab4:
            tpot_sub_df = filtered_df.dropna(subset=['tpot_p50_ms'])
            if not tpot_sub_df.empty:
                fig_tpot_scale = px.line(tpot_sub_df, x='concurrency', y='tpot_p50_ms', color='Config_Label', markers=True, title='P50 TPOT vs. Concurrency', labels={'concurrency': 'Concurrency Level', 'tpot_p50_ms': 'TPOT P50 (ms)'})
                st.plotly_chart(fig_tpot_scale, use_container_width=True)
    with main_tabs[3]:
        st.markdown('### 📋 Full Benchmark Results Table')
        display_cols = ['provider', 'model', 'input_tokens', 'actual_input_tokens_avg', 'output_tokens', 'concurrency', 'completed', 'failed', 'throughput_tok_per_s', 'req_per_s', 'ttft_p50_s', 'ttft_p95_s', 'latency_p50_s', 'latency_p95_s', 'tpot_p50_ms', 'gen_speed_p50_tok_s', 'cost_per_1m_out_usd', 'token_status', 'streaming_supported']
        st.dataframe(filtered_df[display_cols].sort_values(by=['provider', 'input_tokens', 'output_tokens', 'concurrency']), use_container_width=True)
        csv_bytes = filtered_df.to_csv(index=False).encode('utf-8')
        st.download_button(label='📥 Download Filtered Results as CSV', data=csv_bytes, file_name='inferbench_comparison_results.csv', mime='text/csv')
if __name__ == '__main__':
    main()
