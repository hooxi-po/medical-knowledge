# Medical Knowledge Base & AI Assistant

这是一个基于Web的医疗专业人员知识库应用，结合了数据管理、关系可视化和AI智能分析功能。用户可以浏览、搜索医疗专业人员信息，查看他们的详细资料，探索基于研究兴趣的关系网络，并与AI助手进行交互以获取分析、推荐和问答。

## 主要功能

* **专业人员列表与搜索:**
    * 分页展示存储在MongoDB数据库中的医疗专业人员列表。
    * 支持按姓名、所属机构、职称或研究兴趣进行模糊搜索。
* **详细信息展示:**
    * 点击列表中的卡片可在弹窗中查看专业人员的详细信息（个人、专业、学术等）。
* **关系网络可视化:**
    * 使用D3.js动态生成并展示选定专业人员的关系网络。
    * 关系基于共享的“研究兴趣”进行连接。
    * 中心节点为选定人员，相关人员和共同兴趣点作为连接节点。
    * 提供缩放和平移控制。
* **AI 智能分析:**
    * 利用 Google Gemini API 对选定专业人员的背景、研究领域进行分析。
    * 根据专业人员的研究兴趣，推荐潜在的合作伙伴。
* **AI 问答助手:**
    * 提供一个聊天界面，用户可以向 AI 助手提问。
    * AI 助手能够尝试理解问题意图，并结合数据库中检索到的相关专业人员信息来生成更具上下文的回答。

## 技术栈

* **后端:**
    * Python 3
    * Flask (Web框架)
    * Flask-CORS (处理跨域请求)
    * PyMongo (MongoDB 驱动)
    * python-dotenv (环境变量管理)
    * Google Generative AI SDK (`google-generativeai`) (与 Gemini API 交互)
* **前端:**
    * HTML5
    * CSS3
    * JavaScript (ES6+)
    * D3.js (数据可视化库)
* **数据库:**
    * MongoDB
* **AI 模型:**
    * Google Gemini (例如：`gemini-1.5-flash-001`)

## 先决条件

* Python 3.x
* pip (Python 包管理器)
* MongoDB 数据库实例 (本地或远程)
* Google Gemini API 密钥
* (可选) Node.js 和 npm (如果需要更复杂的构建流程或包管理)

## 安装与设置

1.  **克隆仓库 (如果适用):**
    ```bash
    git clone <your-repository-url>
    cd medical-knowledge
    ```

2.  **后端设置:**
    * 导航到后端目录:
        ```bash
        cd backend
        ```
    * (推荐) 创建并激活虚拟环境:
        ```bash
        python -m venv venv
        # Windows
        .\venv\Scripts\activate
        # macOS/Linux
        source venv/bin/activate
        ```
    * 安装依赖项:
        ```bash
        pip install -r requirements.txt
        ```
    * **配置环境变量:**
        * 在 `backend` 目录下创建一个名为 `.env` 的文件。
        * **重要:** `backend/config.py` 文件中目前硬编码了 `GEMINI_API_KEY`。**强烈建议**将其从代码中移除，并通过环境变量进行配置。
        * 编辑 `.env` 文件，至少包含以下内容 (根据您的实际情况修改):
          ```dotenv
          # .env 文件内容示例
          MONGO_URI=mongodb://localhost:27017/
          DB_NAME=medical_database
          COLLECTION_NAME=professionals
          GEMINI_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY 
          # GEMINI_MODEL=models/gemini-1.5-flash-001 # 模型可以在 config.py 中设置，或在这里覆盖
          ```
        * 确保您的 MongoDB 服务正在运行，并且 `MONGO_URI` 指向正确的地址。

3.  **前端设置:**
    * 前端文件位于 `frontend/` 目录下。
    * 通常不需要额外的构建步骤，可以直接在浏览器中打开 `frontend/index.html`。
    * **注意:** 直接从文件系统 (`file://...`) 打开 `index.html` 可能会因为浏览器的安全策略（CORS）而阻止向本地运行的后端API (`http://localhost:5000`) 发送请求。建议使用简单的HTTP服务器来托管 `frontend` 目录。

## 运行应用

1.  **启动后端服务器:**
    * 确保您在 `backend` 目录下，并且虚拟环境已激活。
    * 运行 Flask 应用:
        ```bash
        python app.py
        ```
    * 后端服务默认将在 `http://localhost:5000` 上运行。

2.  **启动前端:**
    * **方法一 (使用 Python 简单服务器):**
        * 打开一个新的终端。
        * 导航到 `frontend` 目录:
            ```bash
            cd ../frontend 
            ```
        * 启动一个简单的 HTTP 服务器 (Python 3):
            ```bash
            python -m http.server 8080 
            ```
            (您可以使用不同的端口，如 8000)
        * 在浏览器中访问 `http://localhost:8080` (或其他您选择的端口)。
    * **方法二 (直接打开文件 - 可能遇到 CORS 问题):**
        * 在文件浏览器中找到 `frontend/index.html` 并用网页浏览器打开它。如果 API 调用失败，请检查浏览器控制台是否有 CORS 错误，并考虑使用方法一。

## 使用说明

1.  **浏览列表:** 打开应用后，左侧面板会加载专业人员列表。
2.  **搜索:** 在顶部的搜索框中输入关键词，然后点击“搜索”按钮或按 Enter 键。列表将更新为搜索结果。
3.  **查看详情与分析:** 点击左侧列表中的任意专业人员卡片：
    * 右侧的**关系网络**面板会更新，显示该人员及其基于共同研究兴趣的联系。
    * 一个**模态弹窗**会打开，显示该人员的详细信息。
    * 弹窗下方会加载 **AI 分析**和**推荐合作伙伴**的内容（由 Gemini API 生成）。
    * 关闭弹窗可点击右上角的 '×' 或弹窗外的区域。
4.  **与 AI 助手交互:**
    * 在右下角的 **AI 助手**面板中，您可以在底部的输入框中输入问题（例如，“介绍一下XXX的研究方向？”，“查找心脏病领域的专家”）。
    * 点击“发送”按钮或按 Enter 键。
    * AI 会尝试理解您的问题，可能利用数据库信息，并在聊天窗口中显示回答。

## 注意事项

* **API 密钥安全:** 切勿将您的 `GEMINI_API_KEY` 直接提交到版本控制系统（如 Git）。务必使用 `.env` 文件或其他安全方式管理密钥。
* **数据填充:** 需要先向 MongoDB 数据库 (`medical_database` 库的 `professionals` 集合) 中填充符合数据结构（包含 `personal_info`, `professional_info`, `academic_info` 等字段）的专业人员数据，应用才能正常显示和搜索。
* **错误处理:** 应用包含基本的错误处理，但可能需要根据实际部署情况进行增强。
* **性能:** 对于非常大量的专业人员数据，前端可视化和后端查询可能需要进行性能优化。
