# 🏪 SGEP - Sistema de Gestão de Estoque de Perecíveis

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![React](https://img.shields.io/badge/react-18.3+-blue.svg)
![MongoDB](https://img.shields.io/badge/mongodb-7.0+-green.svg)

Sistema completo de gestão de estoque para produtos perecíveis desenvolvido para a **Leroy Merlin**. O SGEP oferece controle de validade de lotes, dashboards analíticos, gestão de fornecedores e um assistente virtual inteligente para suporte aos usuários.

## 🎯 Visão Geral

O SGEP é uma solução completa para gerenciamento de estoque de produtos perecíveis, focado em:

- **Controle de Validade**: Rastreamento de lotes com alertas de vencimento
- **Gestão de Estoque**: Controle detalhado de produtos, lotes e fornecedores
- **Analytics**: Dashboards interativos com KPIs e métricas estratégicas
- **Assistente Virtual**: Chatbot com base de conhecimento para suporte aos usuários
- **Importação em Massa**: Upload de planilhas Excel para atualização rápida

### Arquitetura

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   React     │◄────►│   FastAPI    │◄────►│   MongoDB   │
│  Frontend   │      │   Backend    │      │   Database  │
└─────────────┘      └──────────────┘      └─────────────┘
```

## ✨ Funcionalidades

### 📊 Dashboard Analítico
- **KPIs em tempo real**: Valor total do estoque, lotes cadastrados, produtos em estoque
- **Alertas de vencimento**: Produtos próximos da data de validade (30, 60, 90 dias)
- **Distribuição de lotes**: Visualização gráfica por faixa de vencimento
- **Discrepâncias**: Identificação de produtos com estoque divergente

### 📦 Gestão de Estoque
- **CRUD completo** de produtos com validação de dados
- **Controle de lotes**: Data de fabricação, validade e quantidade
- **Cálculo automático**: Estoque total baseado em lotes ativos
- **Importação Excel**: Upload de planilhas para atualização em massa
- **Busca e filtros**: Pesquisa por nome, código ou EAN

### 🚚 Gestão de Fornecedores
- **Cadastro de fornecedores** com CNPJ, contato e política de devolução
- **Validação de CNPJ** com formatação automática
- **Vinculação com produtos** para rastreabilidade
- **Status ativo/inativo** para controle de parceiros

### 🤖 Assistente Virtual (Chatbot)
- **Base de conhecimento** com FAQs e tutoriais
- **Busca semântica** com score de similaridade
- **Sugestões inteligentes** baseadas em visualizações
- **Categorização** de conteúdo para melhor organização
- **Respostas contextuais** com destaque de termos encontrados

### 📈 Relatórios e Analytics
- **Valor em risco**: Produtos próximos ao vencimento por faixa de dias
- **Top 5 produtos**: Próximos do vencimento com alertas visuais
- **Produtos sem lotes**: Identificação de estoque não atribuído
- **Filtros por produto**: Visualização detalhada de distribuição de lotes

## 🛠️ Tecnologias

### Backend
- **Python 3.11+**
- **FastAPI 0.115+**: Framework web moderno e performático
- **MongoDB 7.0+**: Banco de dados NoSQL
- **Motor/PyMongo**: Driver assíncrono para MongoDB
- **Pydantic**: Validação de dados com type hints
- **Pandas**: Processamento de planilhas Excel
- **Python-dotenv**: Gerenciamento de variáveis de ambiente

### Frontend
- **React 18.3+**: Biblioteca JavaScript para UI
- **React Router DOM 6.28+**: Roteamento client-side
- **Axios 1.7+**: Cliente HTTP para requisições à API
- **Recharts 2.13+**: Biblioteca de gráficos interativos
- **React Icons 5.4+**: Ícones modernos e acessíveis
- **CSS Modules**: Estilização modular e isolada

### DevOps & Ferramentas
- **Git**: Controle de versão
- **npm**: Gerenciador de pacotes do frontend
- **pip**: Gerenciador de pacotes do Python
- **dotenv**: Variáveis de ambiente

## 📦 Pré-requisitos

- **Node.js** 18+ e **npm** 9+
- **Python** 3.11+
- **MongoDB** 7.0+ (local ou Atlas)
- **Git** 2.40+

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/xbgm08/leroy-sgep
cd leroy-sgep
```

### 2. Configuração do Backend

```bash
cd backend
pip install -r requirements.txt
```

### 3. Configuração do Frontend

```bash
cd frontend
npm install
```

## ⚙️ Configuração

### Backend - `.env`

Crie um arquivo `.env` na pasta `backend/`:

```env
# MongoDB Connection
DB_URI=mongodb://localhost:27017
DB_NAME=sgep_db

# CORS
FRONTEND_ORIGIN=http://localhost:3000

# Import Folders (opcional)
BASE_IMPORT_PATH=./imports
PENDING_FOLDER=./imports/pending
PROCESSED_FOLDER=./imports/processed
ERROR_FOLDER=./imports/errors
PROCESSING_FOLDER=./imports/processing
```

### Frontend - `.env`

Crie um arquivo `.env` na pasta `frontend/`:

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

### Execução

#### Backend (Terminal 1)

```bash
cd backend
uvicorn app.main:app --reload
```

O backend estará disponível em: `http://localhost:8000`

Documentação interativa: `http://localhost:8000/docs`

#### Frontend (Terminal 2)

```bash
cd frontend
npm start
```

O frontend estará disponível em: `http://localhost:3000`

## 📁 Estrutura do Projeto

```
leroy-sgep/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # Aplicação FastAPI principal
│   │   ├── configs/
│   │   │   └── config.py              # Configurações e variáveis de ambiente
│   │   ├── database/
│   │   │   └── client.py              # Conexão com MongoDB
│   │   ├── models/
│   │   │   ├── produto.py             # Modelos de Produto e Lote
│   │   │   ├── fornecedor.py          # Modelo de Fornecedor
│   │   │   ├── base_conhecimento.py   # Modelo da Base de Conhecimento
│   │   │   └── dashboard.py           # Modelos de métricas e KPIs
│   │   ├── routes/
│   │   │   ├── produto_router.py      # Endpoints de produtos e lotes
│   │   │   ├── fornecedor_router.py   # Endpoints de fornecedores
│   │   │   ├── base_conhecimento_router.py  # Endpoints do chatbot
│   │   │   └── dashboard_router.py    # Endpoints de analytics
│   │   └── services/
│   │       ├── produto_service.py     # Lógica de negócio de produtos
│   │       ├── fornecedor_service.py  # Lógica de fornecedores
│   │       ├── base_conhecimento_service.py  # Lógica do chatbot
│   │       └── dashboard_service.py   # Cálculo de KPIs e métricas
│   ├── .env                           # Variáveis de ambiente (não versionado)
│   ├── .env.example                   # Exemplo de configuração
│   ├── requirements.txt               # Dependências Python
│   └── README.md
│
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── index.js                   # Ponto de entrada do React
│   │   ├── api/
│   │   │   ├── produtoAPI.js          # Requisições de produtos
│   │   │   ├── fornecedorAPI.js       # Requisições de fornecedores
│   │   │   ├── conhecimentoAPI.js     # Requisições da base de conhecimento
│   │   │   ├── loteAPI.js             # Requisições de lotes
│   │   │   └── dashboardAPI.js        # Requisições de analytics
│   │   ├── components/
│   │   │   ├── Sidebar.js             # Menu lateral de navegação
│   │   │   ├── CadastrarProduto.js    # Formulário de produtos
│   │   │   ├── CadastrarLote.js       # Formulário de lotes
│   │   │   ├── CadastrarFornecedor.js # Formulário de fornecedores
│   │   │   ├── CadastrarConhecimento.js  # Formulário da base de conhecimento
│   │   │   ├── LotesModal.js          # Modal de gestão de lotes
│   │   │   ├── DetalheProdutoModal.js # Modal de detalhes
│   │   │   ├── ImportarProdutos.js    # Modal de importação Excel
│   │   │   ├── ConfirmDeleteModal.js  # Modal de confirmação
│   │   │   ├── ChatFAQ.js             # Chatbot assistente virtual
│   │   │   └── ChatButton.js          # Botão flutuante do chat
│   │   ├── pages/
│   │   │   ├── App.js                 # Componente raiz com rotas
│   │   │   ├── Dashboard.js           # Página de analytics e KPIs
│   │   │   ├── Estoque.js             # Página de gestão de estoque
│   │   │   ├── Fornecedor.js          # Página de gestão de fornecedores
│   │   │   ├── BaseConhecimento.js    # Página da base de conhecimento
│   │   │   └── APIReference.js        # Documentação da API
│   │   └── styles/
│   │       ├── App.css
│   │       ├── Dashboard.css
│   │       ├── Estoque.css
│   │       ├── Fornecedor.css
│   │       ├── BaseConhecimento.css
│   │       ├── Modal.css
│   │       ├── ChatFAQ.css
│   │       └── ...
│   ├── .env                           # Variáveis de ambiente (não versionado)
│   ├── .env.example                   # Exemplo de configuração
│   ├── package.json                   # Dependências Node.js
│   └── README.md
│
└── README.md                          # Este arquivo
```

## 📡 API Reference

### Base URL

```
http://localhost:8000
```

### Principais Endpoints

#### Produtos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/produtos/` | Lista todos os produtos com paginação |
| `GET` | `/produtos/{codigo_lm}` | Busca produto por código |
| `POST` | `/produtos/` | Cria novo produto |
| `PUT` | `/produtos/{codigo_lm}` | Atualiza produto existente |
| `DELETE` | `/produtos/{codigo_lm}` | Remove produto e seus lotes |
| `POST` | `/produtos/importar-upload` | Importa produtos via Excel |

#### Lotes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/produtos/{codigo_lm}/lotes` | Adiciona lote a um produto |
| `PUT` | `/produtos/{codigo_lm}/lotes/{codigo_lote}` | Atualiza lote |
| `DELETE` | `/produtos/{codigo_lm}/lotes/{codigo_lote}` | Remove lote |

#### Fornecedores

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/fornecedores/` | Lista todos os fornecedores |
| `GET` | `/fornecedores/{cnpj}` | Busca fornecedor por CNPJ |
| `POST` | `/fornecedores/` | Cria novo fornecedor |
| `PUT` | `/fornecedores/{cnpj}` | Atualiza fornecedor |
| `DELETE` | `/fornecedores/{cnpj}` | Remove fornecedor |

#### Base de Conhecimento (Chatbot)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/base-conhecimento/` | Lista todos os conhecimentos |
| `GET` | `/base-conhecimento/resposta/melhor` | Retorna melhor resposta para uma pergunta |
| `POST` | `/base-conhecimento/buscar` | Busca múltiplas respostas por similaridade |
| `POST` | `/base-conhecimento/` | Cria novo conhecimento |
| `PUT` | `/base-conhecimento/{id}` | Atualiza conhecimento |
| `DELETE` | `/base-conhecimento/{id}` | Remove conhecimento |

#### Dashboard

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/dashboard/kpis` | Retorna todos os KPIs e métricas |
| `GET` | `/dashboard/status-produto/{nome}` | Distribuição de lotes de um produto |

### Documentação Completa

Acesse a documentação interativa em: `http://localhost:8000/docs`

Ou consulte a página **API Reference** no próprio sistema.

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

Desenvolvido como **Projeto Integrador II** do curso de **Big Data** na **FATEC**.

**Equipe:**
- **Gabriel** - Desenvolvedor Full Stack
- **Glauber** - Desenvolvedor Full Stack
- **Heloisa** - Desenvolvedora Front-End
- **Lucas** - Desenvolvedor Front-End
- **Renan** - Desenvolvedor Front-End

---

## 🎓 Contexto Acadêmico

**Instituição**: FATEC (Faculdade de Tecnologia)  
**Curso**: Big Data  
**Disciplina**: Projeto Integrador II  
**Semestre**: 2º Semestre  
**Cliente**: Leroy Merlin Brasil

### Objetivo do Projeto

Desenvolver um sistema completo de gestão de estoque com foco em produtos perecíveis, aplicando conceitos de:

- Desenvolvimento Full Stack (React + FastAPI)
- Banco de Dados NoSQL (MongoDB)
- APIs RESTful
- Inteligência Artificial (Busca Semântica)
- Analytics e Business Intelligence
- UX/UI Design

---

<div align="center">

**🏪 SGEP - Sistema de Gestão de Estoque de Perecíveis**

Feito com ❤️ para a Leroy Merlin

</div>