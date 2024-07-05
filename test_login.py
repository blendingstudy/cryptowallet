import requests  #필요없음

def test_login():
    url = "http://127.0.0.1:5000/login"
    headers = {
        'Content-Type': 'application/json',
    }
    
    # 올바른 자격 증명으로 테스트
    data = {
        "username": "testuser",
        "password": "testpassword"
    }
    response = requests.post(url, json=data, headers=headers)
    assert response.status_code == 200, f"Failed: {response.json()}"

    # 잘못된 비밀번호로 테스트
    data = {
        "username": "testuser",
        "password": "wrongpassword"
    }
    response = requests.post(url, json=data, headers=headers)
    assert response.status_code == 401, f"Failed: {response.json()}"

    # 존재하지 않는 사용자명으로 테스트
    data = {
        "username": "nonexistinguser",
        "password": "somepassword"
    }
    response = requests.post(url, json=data, headers=headers)
    assert response.status_code == 401, f"Failed: {response.json()}"

    print("All tests passed")

if __name__ == "__main__":
    test_login()