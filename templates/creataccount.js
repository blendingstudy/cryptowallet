// creataccount.js

// 회원가입 폼 선택
const signupForm = document.querySelector('#signup-form');

// 회원가입 폼 제출 이벤트 핸들러
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // 기본 동작 방지

  // 폼 데이터 가져오기
  const formData = new FormData(signupForm);
  const name = formData.get('name');
  const birthday = formData.get('birthday');
  const username = formData.get('username');
  const email = formData.get('email');
  const password = formData.get('password');
  const confirmPassword = formData.get('confirm-password');
  const phone = formData.get('phone');
  const referralCode = formData.get('referral-code');

  // 비밀번호 확인
  if (password !== confirmPassword) {
    alert('비밀번호가 일치하지 않습니다.');
    return;
  }

  const response = await fetch('http://127.0.0.1:5000/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, birthday, username, email, password, phone, referralCode })
  });

  if (response.ok) {
    alert('회원가입이 완료되었습니다.');
    window.location.href = 'cryptowallet.html';
  } else {
    const data = await response.json();
    alert(`회원가입 실패: ${data.message}`);
  }
});