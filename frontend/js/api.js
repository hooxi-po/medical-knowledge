// API调用函数
const API_BASE_URL = 'http://localhost:5000/api';

// 获取所有专业人员
async function fetchProfessionals(limit = 1000, skip = 0) {
    try {
        const response = await fetch(`${API_BASE_URL}/professionals?limit=${limit}&skip=${skip}`);
        if (!response.ok) throw new Error('获取数据失败');
        return await response.json();
    } catch (error) {
        console.error('获取专业人员列表错误:', error);
        return [];
    }
}

// 搜索专业人员
async function searchProfessionals(query, limit = 20) {
    try {
        const response = await fetch(`${API_BASE_URL}/professionals/search?q=${encodeURIComponent(query)}&limit=${limit}`);
        if (!response.ok) throw new Error('搜索失败');
        return await response.json();
    } catch (error) {
        console.error('搜索专业人员错误:', error);
        return [];
    }
}

// 获取单个专业人员详情
async function fetchProfessionalDetails(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/professionals/${id}`);
        if (!response.ok) throw new Error('获取详情失败');
        return await response.json();
    } catch (error) {
        console.error('获取专业人员详情错误:', error);
        return null;
    }
}

// 获取专业人员AI分析
async function fetchProfessionalAnalysis(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/ai/analyze/${id}`);
        if (!response.ok) throw new Error('获取分析失败');
        return await response.json();
    } catch (error) {
        console.error('获取AI分析错误:', error);
        return { analysis: '无法获取分析结果' };
    }
}

// 获取推荐合作伙伴
async function fetchRecommendations(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/ai/recommend/${id}`);
        if (!response.ok) throw new Error('获取推荐失败');
        return await response.json();
    } catch (error) {
        console.error('获取推荐合作伙伴错误:', error);
        return { recommendations: '无法获取推荐结果' };
    }
}

// 向AI助手提问
async function askQuestion(question) {
    try {
        const response = await fetch(`${API_BASE_URL}/ai/question`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question })
        });
        if (!response.ok) throw new Error('提问失败');
        return await response.json();
    } catch (error) {
        console.error('向AI助手提问错误:', error);
        return { answer: '抱歉，无法处理您的问题。请稍后再试。' };
    }
}
