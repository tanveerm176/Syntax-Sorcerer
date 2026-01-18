# Syntax-Sorcerer

An AI-powered RAG (Retrieval-Augmented Generation) web app that lets you chat with your JavaScript codebase using OpenAI's GPT and vector embeddings.

## Features

- 🤖 **AI Code Analysis** - Chat with ChatGPT about your code
- 🔍 **Semantic Search** - Uses cosine similarity to find relevant code segments
- 📦 **Codebase Upload** - Upload JavaScript projects via .zip file URLs
- 💾 **Session Persistence** - Conversation history cached in Redis
- 🎯 **RAG Pipeline** - Retrieves relevant code context before generating responses

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API Routes
- **LLM**: OpenAI GPT-4
- **Vector DB**: Pinecone
- **Cache**: Redis
- **Code Parsing**: Tree-sitter

## Prerequisites

- Node.js 16+ 
- npm or yarn
- OpenAI API key (with billing enabled)
- Pinecone API key
- Redis instance (Redis Cloud recommended)

## Setup

1. **Clone or download** this repository

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env.local`** with your API keys:
   ```env
   OPENAI_API_KEY=sk-proj-...
   PINECONE_API_KEY=pcsk_...
   REDIS_HOST=your-redis-host.com
   REDIS_PORT=10420
   REDIS_PASSWORD=your-password
   NEXT_PUBLIC_URL=http://localhost:3000
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

### Upload a Codebase
1. Paste a **direct link to a .zip file** in the top input box
2. The app will download, extract, and index your JavaScript files
3. Embeddings are generated and stored in Pinecone

### Chat with Your Code
- **Regular messages**: Press `Enter` to chat with ChatGPT
- **Query codebase**: Click `Query codebase` button to:
  - Find the 3 most relevant code segments using cosine similarity
  - Include those segments in the ChatGPT context
  - Get an informed answer about your code

### Supported Files
- Currently supports **JavaScript (.js) files only**
- One codebase per session (upload a new one to replace the current)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for ChatGPT access |
| `PINECONE_API_KEY` | Pinecone vector database API key |
| `REDIS_HOST` | Redis host URL |
| `REDIS_PORT` | Redis port number |
| `REDIS_PASSWORD` | Redis password |
| `NEXT_PUBLIC_URL` | Frontend URL (for API calls) |

## Project Structure

```
src/
├── app/
│   ├── chat/route.js           # Chat endpoint
│   ├── config/                 # Configuration files
│   ├── database/               # Database & embedding services
│   ├── codebase/route.js       # Codebase upload/query endpoint
│   └── page.js                 # Main page
├── components/                 # React components
└── utils/                      # Utility functions
```

## API Endpoints

- `POST /chat` - Send a message to ChatGPT
- `POST /codebase` - Upload a codebase
- `GET /codebase` - Get current codebase info
- `DELETE /codebase` - Remove current codebase
- `GET /config/seed` - Seed database configuration

## Limitations

- Only JavaScript files are indexed
- One codebase per session
- Requires active OpenAI billing
- Tree-sitter parsing limited to JavaScript syntax

## Future Enhancements

- Support for multiple programming languages
- Multi-codebase session support
- Custom system prompts
- Code summary generation
- Performance optimizations

## License

MIT

## Support

For issues or questions, check the [OpenAI Docs](https://platform.openai.com/docs) or [Pinecone Docs](https://docs.pinecone.io).