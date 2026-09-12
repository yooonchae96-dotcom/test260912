// ===================================================
// 우리 반 담벼락 - 시작점
//
// 메모를 쓰면 올린 순서대로 담벼락에 붙습니다.
// 지금은 데이터가 아래 배열에만 들어 있어서,
// 브라우저를 새로고침하면 전부 사라집니다.
// ===================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxGFa5iQbFG12YdSlyo10vYuE3Ejhh0Rg",
  authDomain: "jjindb-e42fe.firebaseapp.com",
  projectId: "jjindb-e42fe",
  storageBucket: "jjindb-e42fe.firebasestorage.app",
  messagingSenderId: "900119604103",
  appId: "1:900119604103:web:8a597b9ab9a52266e60122"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  updateAuthUI();
  render(); // 로그인 상태가 바뀌면 지우기 버튼을 다시 그리기 위해 렌더링
});

function updateAuthUI() {
  const userArea = document.getElementById("userArea");
  if (currentUser) {
    userArea.innerHTML = `
      <span>로그인 완료 </span>
      <button id="logoutBtn">로그아웃</button>
    `;
    document.getElementById("logoutBtn").addEventListener("click", () => {
      signOut(auth);
    });
  } else {
    userArea.innerHTML = `
      <button id="loginBtn">구글로 로그인</button>
    `;
    document.getElementById("loginBtn").addEventListener("click", () => {
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider);
    });
  }
}

// ===================================================
// 데이터를 다루는 함수 세 개
// 백엔드 1 시간에 이 세 개가 Firestore를 쓰는 코드로 바뀝니다.
// ===================================================

// 메모를 읽어 옵니다.
// 백엔드 1: 여기가 Firestore에서 가져오는 코드로 바뀝니다.
//           순서는 orderBy("createdAt") 으로 맞춥니다.
async function loadMemos() {
  const q = query(collection(db, "memos"), orderBy("createdAt"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 메모를 새로 씁니다.
// 백엔드 2: 여기에 "누가 썼는지"(uid)를 함께 저장하게 됩니다.
async function addMemo(text) {
  if (!currentUser) {
    alert("로그인 후 이용해 주세요.");
    return;
  }
  await addDoc(collection(db, "memos"), {
    text: text,
    uid: currentUser.uid,
    createdAt: Date.now()
  });
}

// 메모를 지웁니다.
// 백엔드 2: 지금은 누구든 남의 메모를 지울 수 있습니다. 이걸 막는 것이 과제입니다.
async function deleteMemo(id) {
  await deleteDoc(doc(db, "memos", id));
}


// ===================================================
// 화면 그리기
// ===================================================

async function render() {
  const wall = document.getElementById("wall");
  wall.innerHTML = "";

  const memos = await loadMemos();
  memos.forEach(function (memo) {
    wall.appendChild(makeMemo(memo));
  });
}

// 메모 한 장 만들기
function makeMemo(memo) {
  const div = document.createElement("div");
  div.className = "memo";

  // 현재 로그인한 사람과 메모 작성자가 같을 때만 × 버튼 표시
  if (currentUser && currentUser.uid === memo.uid) {
    const del = document.createElement("button");
    del.textContent = "×";
    del.addEventListener("click", async function () {
      await deleteMemo(memo.id);
      render();
    });
    div.appendChild(del);
  }

  const span = document.createElement("span");
  span.textContent = memo.text;
  div.appendChild(span);

  return div;
}


// ===================================================
// 메모 쓰는 칸
// 엔터를 누르면 담벼락에 붙습니다 (줄바꿈은 Shift + 엔터)
// ===================================================

const input = document.getElementById("input");

input.addEventListener("keydown", async function (e) {
  if (e.isComposing || e.keyCode === 229) return;
  
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();

    if (!currentUser) {
      alert("로그인 후 이용해 주세요.");
      return;
    }

    const text = input.value.trim();
    if (text === "") return;

    if (text.length < 5) {
      alert("메모는 5글자 이상 입력해 주세요.");
      return;
    }

    await addMemo(text);
    input.value = "";
    render();
  }
});


// 첫 화면 그리기
render();
input.focus();
