from pymongo import MongoClient
from config import MONGO_URI, DB_NAME, COLLECTION_NAME
from bson.objectid import ObjectId

def get_database_connection():
    """连接到MongoDB数据库并返回集合对象"""
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        print("成功连接到MongoDB数据库")
        return collection
    except Exception as e:
        print(f"连接MongoDB失败: {e}")
        return None

def get_all_professionals(limit=20, skip=0):
    """获取所有医疗专业人员记录"""
    collection = get_database_connection()
    if collection is not None:
        professionals = list(collection.find({}).limit(limit).skip(skip))
        # 将MongoDB的ObjectId转换为字符串
        for prof in professionals:
            prof['_id'] = str(prof['_id'])
        return professionals
    return []

def get_professional_by_id(professional_id):
    """通过ID获取医疗专业人员"""
    collection = get_database_connection()
    if collection is not None:
        professional = collection.find_one({"_id": ObjectId(professional_id)})
        if professional:
            professional['_id'] = str(professional['_id'])
        return professional
    return None

def search_professionals(query, limit=20):
    """搜索医疗专业人员"""
    collection = get_database_connection()
    if collection is not None:
        search_query = {
            "$or": [
                {"personal_info.name": {"$regex": query, "$options": "i"}},
                {"professional_info.affiliation": {"$regex": query, "$options": "i"}},
                {"professional_info.title": {"$regex": query, "$options": "i"}},
                {"academic_info.research_interests": {"$regex": query, "$options": "i"}}
            ]
        }
        professionals = list(collection.find(search_query).limit(limit))
        for prof in professionals:
            prof['_id'] = str(prof['_id'])
        return professionals
    return []
