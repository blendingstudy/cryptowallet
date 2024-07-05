
// 페이지 로드 시 로그인 상태 확인
window.onload = function() {
  checkLoginStatus();
  toggleLoginSection();
  fetchCoinPrices(); // 코인 가격 정보 초기 로딩
}

function checkLoginStatus() {
  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  if (!isLoggedIn) {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userId');
  }
}

// 로그아웃 함수
async function logout() {
  sessionStorage.removeItem('isLoggedIn');
  sessionStorage.removeItem('userId');
  toggleLoginSection();
  window.location.href = '/';
}

// 로그인 기능
const loginForm = document.querySelector('#login form');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.querySelector('#username').value;
    const password = document.querySelector('#password').value;

    try {
      const response = await fetch('{{ url_for("login_page") }}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      if (response.status === 200) {
        alert('로그인 성공!');
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userId', result.userId);
        toggleLoginSection();
        window.location.href = "/";
      } else {
        alert(result.message || '잘못된 사용자 이름 또는 비밀번호입니다.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('로그인 중 오류가 발생했습니다.');
    }
  });
}

function toggleLoginSection() {
  const loginSection = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logoutBtn');
  const walletSection = document.querySelector('#wallet-section');
  const transactionSection = document.querySelector('#transaction-section');

  // sessionStorage에서 isLoggedIn 값을 가져옵니다.
  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  console.log('로그인 상태 확인:', isLoggedIn);
    
  if (isLoggedIn) {
    loginSection.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    walletSection.style.display = 'block';
    transactionSection.style.display = 'block'; // 거래내역 섹션 표시

    const userId = sessionStorage.getItem('userId');
    fetchWallet(userId);
    fetchTransactions(userId);
  } else {
    loginSection.style.display = 'block';
    logoutBtn.style.display = 'none';
    walletSection.style.display = 'none';
    transactionSection.style.display = 'none'; // 거래내역 섹션 숨기기
  }
}

// 네비게이션 메뉴
const navLinks = document.querySelectorAll('nav ul li a');
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = document.querySelector(link.getAttribute('href'));
    document.querySelectorAll('main section').forEach(sec => sec.style.display = 'none');
    section.style.display = 'block';
  });
});

//-----------------------------------------------------------------------

// 코인 가격 정보 가져오기
async function fetchCoinPrices() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
    const data = await response.json();
    const prices = {
      bitcoin: data.bitcoin.usd,
      ethereum: data.ethereum.usd
    };

    document.getElementById('btc-price').textContent = `BTC: $${prices.bitcoin}`;
    document.getElementById('eth-price').textContent = `ETH: $${prices.ethereum}`;
  } catch (error) {
    console.error('코인 가격 정보를 가져오는 중 오류 발생:', error);
  }
}

// 초기 가격 표시 및 주기적으로 가격 업데이트
fetchCoinPrices();
setInterval(fetchCoinPrices, 60000); // 1분마다 업데이트

//-------------------------------------------------------------

// 지갑 정보 가져오기
async function fetchWallet(userId) {
  try {
    const response = await fetch(`http://127.0.0.1:5000/get_wallet?user_id=${userId}`);
    const data = await response.json();
    const { balance, coins } = data;

    document.getElementById('wallet-balance').textContent = `잔액: $${balance}`;
    const coinList = document.getElementById('coin-list');
    coinList.innerHTML = '';
    coins.forEach(coin => {
      const listItem = document.createElement('li');
      listItem.textContent = `${coin.coin}: ${coin.amount}`;
      coinList.appendChild(listItem);
    });
  } catch (error) {
    console.error('지갑 정보를 가져오는 중 오류 발생:', error);
  }
}

//--------------------------------------------------------------------

// 거래내역 가져오기
async function fetchTransactions(userId) {
  try {
    const response = await fetch(`http://127.0.0.1:5000/transactions?user_id=${userId}`);
    const data = await response.json();
    const { transactions } = data;

    const transactionList = document.getElementById('transaction-list');
    transactionList.innerHTML = '';
    transactions.forEach(transaction => {
      const listItem = document.createElement('li');
      listItem.textContent = `${transaction.date}: ${transaction.type} ${transaction.amount} ${transaction.coin}`;
      transactionList.appendChild(listItem);
    });
  } catch (error) {
    console.error('거래내역을 가져오는 중 오류 발생:', error);
  }
}
