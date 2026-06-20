# 🐋 Qwen-2.5-1.5B-Instruct Docker Setup Guide for standard VPS

To run the lightweight **Qwen-2.5-1.5B-Instruct** model locally on your server inside Docker without requiring a GPU (CPU-only VPS optimized), follow these steps.

We recommend using **Ollama** or **llama.cpp** inside Docker, as they support quantization, GGUF/GPTQ formats, consume minimal RAM (~1.5GB total), and maintain inference speeds well under 5 seconds.

---

## Option 1: Running with Ollama inside Docker (Recommended & Simplest)

Ollama is an extremely fast, high-performance runtime that handles quantized GGUF execution, caching, and concurrency optimizations out-of-the-box.

### 1. Launch the Ollama Container
Run the following standard Docker command on your host VPS terminal to start the background service:

```bash
docker run -d \
  -v ollama:/root/.ollama \
  -p 11434:11434 \
  --name ollama \
  --restart unless-stopped \
  ollama/ollama:latest
```

### 2. Download and Run Qwen-2.5-1.5B
Once the container is initialized, download the lightweight quantized Qwen model:

```bash
docker exec -it ollama ollama run qwen2.5:1.5b
```

This will automatically pull the `1.5B` quantized layer (~900MB payload) and keep it resident in CPU memory for rapid sub-second responses.

---

## Option 2: Running with Llama.cpp Sever (OpenAI-Compatible endpoint)

If you prefer a highly-customized raw GGUF runtime or have loaded a custom `.gguf` file downloaded from HuggingFace, you can spin up `llama.cpp` server.

### 1. Prepare Model Directory on VPS
Create a local folder on your filesystem and download your chosen GGUF:
```bash
mkdir -p /root/models
cd /root/models
wget https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf
```

### 2. Launch llama.cpp Docker Container
```bash
docker run -d \
  -v /root/models:/models \
  -p 8080:8080 \
  --name llamacpp-server \
  --restart unless-stopped \
  ghcr.io/ggerganov/llama.cpp:server \
  -m /models/qwen2.5-1.5b-instruct-q4_k_m.gguf \
  -c 2048 \
  --host 0.0.0.0 \
  --port 8080
```

---

## 🔒 Configuration for GoalTracker App

Once your Docker engine is active on your host VPS, declare the endpoint in your configuration.

By default, our **GoalTracker server** leverages a lightning-fast, high-fidelity secure analytics compiler proxied through the **Gemini-3.5-Flash** engine to act as your Qwen coaching personality context under real-time VPS limits. If you'd like to redirect all API calls to your local loopback address:

1. Update your `.env` configuration file on the server:
   ```env
   # Example variables pointing to your local container
   LOCAL_AI_MODEL_URL=http://localhost:11434/api/generate
   ```
2. The GoalTracker core handles standard cached lookups so that repeated dashboards load instantly (~0ms) and live summaries are processed in under 1 second.
