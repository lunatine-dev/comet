# 🌙 comet

> ✨ Self-hosted webhook server to auto‑deploy your GitHub projects, built with Fastify

![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js)
![Fastify](https://img.shields.io/badge/Fastify-%F0%9F%90%8D-lightgrey?logo=fastify)
![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Issues](https://img.shields.io/github/issues/lunatine-dev/comet)
![Stars](https://img.shields.io/github/stars/lunatine-dev/comet?style=social)

## 🚀 Purpose

`comet` is a lightweight Node.js server that listens to GitHub webhooks and automatically pulls & restarts your services when the main branch updates.

I built it to easily manage my personal projects — but others can adapt it too!

---

## ⚙️ Technical stack

-   **Backend**: [Fastify](https://fastify.dev)
-   **Database**: MongoDB
-   **Webhooks**: GitHub → Fastify → local process manager (PM2 / Docker / etc.)

---

## 📦 Installation & Deployment

> 📝 _Detailed instructions coming soon_

```bash
git clone https://github.com/lunatine-dev/comet.git
cd comet
npm install
# Add environment variables (MongoDB URI, GitHub secrets, etc.)
npm run start
```
