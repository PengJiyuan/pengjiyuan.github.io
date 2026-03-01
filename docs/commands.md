# AI 开发常用命令

## Ollama 本地运行

```bash
# 安装 Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 列出可用模型
ollama list

# 运行模型
ollama run llama2
ollama run qwen
ollama run deepseek-coder

# 拉取模型
ollama pull mistral
ollama pull codellama

# 自定义模型
ollama create mymodel -f Modelfile
```

## Python 环境

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate

# 安装常用库
pip install openai langchain llama-index
pip install python-dotenv tiktoken

# 向量数据库
pip install pymilvus chromadb qdrant-client
```

## API Keys 配置

```bash
# .env 文件示例
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
QDRANT_API_KEY=xxx
PINECONE_API_KEY=xxx
```

## Docker 运行

```bash
# 运行 Milvus
docker run -d --name milvus -p 19530:19530 milvusdb/milvus:latest

# 运行 Qdrant
docker run -d --name qdrant -p 6333:6333 qdrant/qdrant:latest
```

## Hugging Face

```bash
# 登录
huggingface-cli login

# 下载模型
huggingface-cli download meta-llama/Llama-2-7b-chat-hf

# 上传模型
huggingface-cli upload my-model ./model-files
```
