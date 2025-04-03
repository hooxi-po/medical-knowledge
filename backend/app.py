from flask import Flask, request, jsonify
from flask_cors import CORS
import database
import gemini_service

app = Flask(__name__)
CORS(app)  # 启用跨域请求

@app.route('/api/professionals', methods=['GET'])
def get_professionals():
    """获取所有专业人员"""
    limit = int(request.args.get('limit', 20))
    skip = int(request.args.get('skip', 0))
    professionals = database.get_all_professionals(limit, skip)
    return jsonify(professionals)

@app.route('/api/professionals/<professional_id>', methods=['GET'])
def get_professional(professional_id):
    """获取单个专业人员"""
    professional = database.get_professional_by_id(professional_id)
    if professional:
        return jsonify(professional)
    return jsonify({"error": "专业人员不存在"}), 404

@app.route('/api/professionals/search', methods=['GET'])
def search_professionals():
    """搜索专业人员"""
    query = request.args.get('q', '')
    limit = int(request.args.get('limit', 20))
    results = database.search_professionals(query, limit)
    return jsonify(results)

@app.route('/api/ai/analyze/<professional_id>', methods=['GET'])
def analyze_professional(professional_id):
    """分析专业人员数据"""
    professional = database.get_professional_by_id(professional_id)
    if not professional:
        return jsonify({"error": "专业人员不存在"}), 404
    
    analysis = gemini_service.analyze_professional(professional)
    return jsonify({"analysis": analysis})

@app.route('/api/ai/recommend/<professional_id>', methods=['GET'])
def recommend_collaborators(professional_id):
    """推荐潜在合作伙伴"""
    professional = database.get_professional_by_id(professional_id)
    if not professional:
        return jsonify({"error": "专业人员不存在"}), 404
    
    other_professionals = database.get_all_professionals(20)
    recommendations = gemini_service.find_potential_collaborators(professional, other_professionals)
    return jsonify({"recommendations": recommendations})

@app.route('/api/ai/question', methods=['POST'])
def answer_question():
    """回答医疗相关问题"""
    data = request.json
    question = data.get('question', '')
    if not question:
        return jsonify({"error": "问题不能为空"}), 400
    
    answer = gemini_service.answer_medical_question(question)
    return jsonify({"answer": answer})

if __name__ == '__main__':
    app.run(debug=True, port=5000)