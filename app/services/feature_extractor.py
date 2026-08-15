import re
import json
import os

def extract_profile_pic_status(user_data: dict) -> int:
    """
    Determines if the profile picture is standard (1) or default/anonymous (0).
    """
    is_anonymous = user_data.get("has_anonymous_profile_picture")
    
    if is_anonymous is True:
        return 0
    elif is_anonymous is False:
        return 1
    
    # Fallback check on standard CDN default hashes/filenames
    pic_url = user_data.get("profile_pic_url", "")
    if not pic_url or "default_user" in pic_url or "44884218_345707102882519" in pic_url:
        return 0
        
    return 1


def extract_features_from_json(user_data: dict, target_username: str) -> list:
    """
    Parses a raw user data dictionary and extracts the exact feature vector 
    required for the ML model.
    """
    # 1. Profile Pic Status
    has_profile_pic = extract_profile_pic_status(user_data)
    
    # 2. Username numerical ratios
    username_len = len(target_username)
    username_digits = len(re.findall(r'\d', target_username))
    user_num_ratio = username_digits / username_len if username_len > 0 else 0.0

    # 3. Full name analysis
    full_name = user_data.get("full_name", "") or ""
    fullname_words = len(full_name.split())
    fullname_len = len(full_name)
    fullname_digits = len(re.findall(r'\d', full_name))
    fullname_num_ratio = fullname_digits / fullname_len if fullname_len > 0 else 0.0
    
    # 4. Name vs Username comparison
    clean_fullname = full_name.lower().replace(" ", "")
    name_equals_username = 1 if clean_fullname == target_username.lower() else 0

    # 5. Biography length & External URL
    bio = user_data.get("biography", "") or ""
    description_length = len(bio)
    has_external_url = 1 if user_data.get("external_url") else 0

    # 6. Metadata counts
    is_private = 1 if user_data.get("is_private") else 0
    posts = user_data.get("media_count", 0)
    followers = user_data.get("follower_count", 0)
    follows = user_data.get("following_count", 0)

    # Return structured numerical vector matching model training schema
    return [
        int(has_profile_pic),
        float(round(user_num_ratio, 4)),
        int(fullname_words),
        float(round(fullname_num_ratio, 4)),
        int(name_equals_username),
        int(description_length),
        int(has_external_url),
        int(is_private),
        int(posts),
        int(followers),
        int(follows)
    ]


def load_and_extract_from_file(filepath: str, target_username: str) -> list:
    """
    Helper function to extract features directly from a saved JSON file on disk.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"JSON file at {filepath} not found.")
        
    with open(filepath, 'r', encoding='utf-8') as f:
        raw_data = json.load(f)
        
    return extract_features_from_json(raw_data, target_username)