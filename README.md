# Quant ML Labs

[Live Demo](https://quantmllabs.vercel.app) | [Python Backend Repo](https://github.com/PhilipWilliamVentura/RAGChatbot-and-Diffusion-model)

Quant ML Labs is an **educational AI platform** that allows users to create their **personal AI companion**. This companion can interact with users in **real-time conversations**, answer questions using advanced **Retrieval-Augmented Generation (RAG)**, and generate **custom visual diagrams** with a **Diffusion model built from scratch**.

The platform is designed for students, professionals, and enthusiasts in **quantitative finance and machine learning**, providing an immersive and interactive way to learn complex concepts.

---

## Features

- **Custom AI Companion:** Build and personalize your own AI assistant that talks to you in real time.
- **RAG-Powered Q&A:** Ask questions and get answers grounded in your own documents or study material.
- **Diffusion-Based Visuals:** Generate diagrams or visualizations to support learning, all via AI.
- **Interactive & Real-Time:** Seamless conversational experience with instant responses.

---

## Technologies Used

- **Frontend:** React, TypeScript, TailwindCSS
- **Backend:** Python, FastAPI, PyTorch
- **AI & ML:** VAPI, Custom Diffusion Model built from scratch, RAG with FAISS + Langchain + Gemini API
- **Database & Auth:** Supabase
- **Monitoring & Logging:** Sentry
- **Deployment:** Vercel

---

## Getting Started

### Frontend

Clone the repo and install dependencies:

```bash
git clone https://github.com/PhilipWilliamVentura/quant-ml-labs-frontend.git
cd quant-ml-labs-frontend
npm install
npm run dev
```

Backend

```bash
git clone https://github.com/PhilipWilliamVentura/RAGChatbot-and-Diffusion-model.git
cd RAGChatbot-and-Diffusion-model
source venv/bin/activate  # if using virtualenv
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Experience the AI companion and explore Quant ML Labs here: https://quantmllabs.vercel.app

