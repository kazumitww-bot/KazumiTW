import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDlr9f2rGiknSMQPrKPooKkedkUP7ZkqQg",
  authDomain: "kazumitv-e641b.firebaseapp.com",
  projectId: "kazumitv-e641b",
  storageBucket: "kazumitv-e641b.firebasestorage.app",
  messagingSenderId: "913159849870",
  appId: "1:913159849870:web:06c078455097cc64f246df",
  measurementId: "G-XMFWJJW2TH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 1. Улучшенная загрузка аниме (больше данных, как на AnimeGo)
async function loadAnime() {
    // Увеличили лимит до 50 и добавили сортировку по популярности
    const res = await fetch('https://shikimori.one/api/animes?limit=50&order=popularity&kind=tv');
    const data = await res.json();
    const list = document.getElementById('anime-list');
    list.innerHTML = '';
    
    data.forEach(anime => {
        const div = document.createElement('div');
        div.className = 'card';
        // Вытягиваем чистое русское название и рейтинг
        const title = anime.russian || anime.name;
        const rating = anime.score || "0.0";
        
        div.innerHTML = `
            <div style="position: relative;">
                <img src="https://shikimori.one${anime.image.original}" loading="lazy">
                <span style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); padding: 2px 8px; border-radius: 5px; font-size: 12px; color: #ffca28;">⭐ ${rating}</span>
            </div>
            <h4>${title}</h4>
            <button onclick="window.openPlayer('${anime.id}', '${title}')" style="margin-bottom:15px; width:85%;">Смотреть</button>
        `;
        list.appendChild(div);
    });
}

// 2. Плеер с автоматическим выбором озвучек
window.openPlayer = (id, title) => {
    const container = document.getElementById('player-container');
    container.style.display = 'flex';
    
    // Используем зеркало, которое реже блокируют
    const playerUrl = `https://kodik.info/find-player?shikimori_id=${id}`;

    container.innerHTML = `
        <div class="modal-content" style="max-width: 900px; width: 95%; background: #0d1117;">
            <span class="close" onclick="this.parentElement.parentElement.style.display='none'">&times;</span>
            <h2 style="margin-top:0; color:#58a6ff;">${title}</h2>
            <div class="video-wrapper" style="background: #000; border-radius: 8px; position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
                <iframe 
                    src="${playerUrl}" 
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
                    frameborder="0" 
                    allowfullscreen
                    referrerpolicy="no-referrer"
                ></iframe>
            </div>
            <div style="margin-top:15px; display: flex; justify-content: center; gap: 10px;">
                <button onclick="document.querySelector('iframe').src='https://api.bhf.im/shikimori/${id}'" style="width: auto; background: #21262d; padding: 8px 15px;">Запасной сервер</button>
            </div>
        </div>
    `;
}
// 3. Остальная логика (Выход/Вход) остается без изменений
window.logout = () => {
    signOut(auth).then(() => {
        location.reload();
    }).catch((error) => {
        alert("Ошибка при выходе: " + error.message);
    });
};

let isReg = false;
const authToggle = document.getElementById('auth-toggle');
const authTitle = document.getElementById('auth-title');

if (authToggle) {
    authToggle.onclick = () => {
        isReg = !isReg;
        authTitle.innerText = isReg ? "Регистрация" : "Вход";
        authToggle.innerText = isReg ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Регистрация";
    };
}

document.getElementById('auth-submit').onclick = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;
    if(pass.length < 6) return alert("Пароль должен быть от 6 символов!");
    try {
        if (isReg) {
            const res = await createUserWithEmailAndPassword(auth, email, pass);
            await setDoc(doc(db, "users", res.user.uid), { favorites: [] });
        } else {
            await signInWithEmailAndPassword(auth, email, pass);
        }
        document.getElementById('auth-modal').style.display = 'none';
    } catch (e) { alert("Ошибка: " + e.message); }
};

onAuthStateChanged(auth, user => {
    const nav = document.getElementById('auth-nav');
    if (user) {
        nav.innerHTML = `<span style="font-size:14px; color:#aaa; margin-right:10px;">${user.email}</span> <button onclick="logout()" style="width:auto; padding: 5px 15px; background:#ff4757;">Выход</button>`;
    } else {
        nav.innerHTML = `<button onclick="document.getElementById('auth-modal').style.display='flex'">Вход</button>`;
    }
});

loadAnime();