import google.generativeai as genai
from config import GEMINI_API_KEY, GEMINI_MODEL

# 配置Gemini API
genai.configure(api_key=GEMINI_API_KEY)

def generate_content(prompt):
    """使用Gemini API生成内容"""
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini API调用失败: {e}")
        return f"生成内容时出错: {str(e)}"

def analyze_professional(professional_data):
    """分析医疗专业人员数据并生成见解"""
    prompt = f"""
    分析以下医疗专业人员的信息，并提供关于其专业背景、研究兴趣和潜在合作机会的见解:
    
    姓名: {professional_data.get('personal_info', {}).get('name', '未知')}
    性别: {professional_data.get('personal_info', {}).get('gender', '未知')}
    职称: {professional_data.get('professional_info', {}).get('title', '未知')}
    所属机构: {professional_data.get('professional_info', {}).get('affiliation', '未知')}
    研究兴趣: {', '.join(professional_data.get('academic_info', {}).get('research_interests', ['未知']))}
    成就: {professional_data.get('academic_info', {}).get('achievements', ['未知'])[0] if professional_data.get('academic_info', {}).get('achievements') else '未知'}
    
    请提供以下分析:
    1. 该专业人员的专业背景概述
    2. 他/她的研究领域的重要性和影响
    3. 潜在的研究合作方向和机会
    4. 基于其专业背景的未来发展建议
    """
    
    return generate_content(prompt)

def find_potential_collaborators(professional, all_professionals):
    """根据研究兴趣推荐潜在合作伙伴"""
    interests = professional.get('academic_info', {}).get('research_interests', [])
    name = professional.get('personal_info', {}).get('name', '未知专业人员')
    
    prompt = f"""
    为以下医疗专业人员推荐潜在的合作伙伴:
    
    专业人员姓名: {name}
    研究兴趣: {', '.join(interests)}
    
    基于数据库中的其他专业人员信息，请分析并推荐最适合与该专业人员合作的3-5位人选，
    说明推荐理由和可能的合作方向。
    """
    
    return generate_content(prompt)

def answer_medical_question(question):
    """回答医疗相关问题"""
    prompt = f"""
    作为医疗专业领域的AI助手，请回答以下问题:
    
    问题: {question}
    
    请提供专业、准确且详细的回答，尽可能引用相关的医学知识。
    """
    
    return generate_content(prompt)
