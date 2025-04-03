# backend/gemini_service.py
import google.generativeai as genai
from config import GEMINI_API_KEY, GEMINI_MODEL
import database  # 导入数据库模块以便查询
import re # 导入正则表达式模块用于简单意图识别

# 配置Gemini API
genai.configure(api_key=GEMINI_API_KEY)

def generate_content(prompt):
    """使用Gemini API生成内容"""
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(prompt)
        # 检查是否有有效的响应内容
        if response.parts:
            return response.text
        else:
            # 处理没有有效内容的情况，可能是由于安全设置等原因
            print("Gemini API 响应为空或被阻止。检查安全设置。")
            # 可以尝试获取并打印详细的响应信息（如果可用）
            # print(f"Full Response: {response}") 
            return "抱歉，无法生成回复。可能触发了内容安全规则。"
            
    except Exception as e:
        print(f"Gemini API调用失败: {e}")
        # 尝试打印更详细的错误信息
        # import traceback
        # print(traceback.format_exc())
        return f"生成内容时出错: {str(e)}"

# --- !! 确保这两个函数存在 !! ---
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
    
    # 将所有专业人员信息格式化以便放入 Prompt (限制数量避免过长)
    other_professionals_context = "数据库中的其他专业人员示例:\n"
    for i, prof in enumerate(all_professionals):
        if i >= 10: # 限制最多显示10个其他人员信息
             other_professionals_context += "...等其他多位专业人员。\n"
             break
        if prof.get('personal_info', {}).get('name') == name: # 跳过自己
            continue
        other_professionals_context += f"- {prof.get('personal_info', {}).get('name', '未知')}: "
        other_professionals_context += f"研究兴趣({', '.join(prof.get('academic_info', {}).get('research_interests', ['未知']))})\n"


    prompt = f"""
    为以下医疗专业人员推荐潜在的合作伙伴:
    
    目标专业人员姓名: {name}
    目标研究兴趣: {', '.join(interests)}
    
    {other_professionals_context}
    
    请基于以上信息，分析并推荐最适合与目标专业人员合作的3-5位人选 (从数据库示例或其他你了解的专业人员中考虑)，
    请说明推荐理由和具体的可能合作方向。
    """
    
    return generate_content(prompt)

# --- 新增的数据库问答函数 (包含改进的意图识别) ---

def format_professionals_for_prompt(professionals):
    """将数据库查询结果格式化为适合Prompt的文本"""
    if not professionals:
        return "数据库中未找到完全匹配的相关信息。\n" # 修改提示语
    
    context = "根据数据库信息，找到以下可能相关的专业人员：\n\n" # 修改提示语
    for prof in professionals[:5]: # 只取前5个结果以控制prompt长度
        context += f"- 姓名: {prof.get('personal_info', {}).get('name', '未知')}\n"
        context += f"  职称: {prof.get('professional_info', {}).get('title', '未知')}\n"
        context += f"  机构: {prof.get('professional_info', {}).get('affiliation', '未知')}\n"
        interests = prof.get('academic_info', {}).get('research_interests', [])
        context += f"  研究兴趣: {', '.join(interests) if interests else '未知'}\n\n"
    if len(professionals) > 5:
        context += "...以及其他一些可能相关的结果。\n"
    return context

def answer_question_with_db_context(question):
    """
    回答用户问题，尝试结合数据库上下文。
    """
    print(f"接收到问题: {question}") # 增加接收日志

    # 1. 改进的意图识别和关键词提取
    search_query = None
    
    # 尝试匹配明确提到的姓名 (2-4个中文字符)
    # 使用更宽松的匹配，允许名字前后有其他文字
    name_match = re.search(r"([\u4e00-\u9fa5]{2,4})", question) 
    
    # 检查是否包含明确的查询意图词
    keywords = ["谁是", "查找", "寻找", "介绍", "关于", "研究兴趣", "研究方向", "个人信息", "联系方式", "所属机构", "在哪里工作"]
    has_keyword_intent = any(keyword in question for keyword in keywords)

    if name_match and has_keyword_intent:
        # 如果匹配到名字并且包含关键词，很可能是针对特定人物的查询
        search_query = name_match.group(1).strip()
        print(f"检测到针对 '{search_query}' 的查询意图")
    elif "查找" in question or "寻找" in question or "推荐" in question:
         # 如果是查找类问题，提取查找目标
         match = re.search(r"(?:查找|寻找|推荐)(?:一位|一个)?\s*(.*?)\s*(?:专家|医生|教授|方面|领域)?(?:的)?(?:人员|信息)?", question)
         if match:
             search_query = match.group(1).strip()
             # 避免提取到 "专家" 等词本身
             if search_query in ["专家", "医生", "教授"]:
                 search_query = None # 如果只提取到职位词，则认为无效
             else:
                print(f"检测到查找类查询: {search_query}")
         
    # 如果上面的规则都没匹配到，但问题比较短且包含名字，也尝试搜索
    elif name_match and len(question) < 15: 
        potential_query = name_match.group(1).strip()
        print(f"问题较短且包含名字 '{potential_query}', 尝试作为搜索词")
        search_query = potential_query


    db_context = ""
    if search_query:
        # 2. 如果识别到可能的数据库查询意图，查询数据库
        print(f"正在数据库中搜索: '{search_query}'")
        try:
            search_results = database.search_professionals(search_query, limit=5) # 限制结果数量
            print(f"数据库查询到 {len(search_results)} 条结果。") # 打印查询结果数量
            db_context = format_professionals_for_prompt(search_results)
        except Exception as e:
            print(f"数据库查询失败: {e}")
            db_context = "数据库查询时发生错误。\n"

    # 3. 构建Prompt
    prompt = f"""
    你是一个医疗专业领域的AI助手。请根据用户的提问，结合下面可能相关的“数据库上下文信息”（如果提供的话）来回答。

    数据库上下文信息:
    {db_context if db_context else "没有从数据库获取到特定上下文信息。"}
    ---
    用户问题: {question}
    ---
    请回答：
    """
    
    print(f"--- Sending Prompt to Gemini ---\n{prompt}\n------------------------------") # 调试输出

    # 4. 调用Gemini
    return generate_content(prompt)