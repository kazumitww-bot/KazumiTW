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

window.openPlayer = (id, title) => {
    const container = document.getElementById('player-container');
    container.style.display = 'flex';
    
    // Используем качественный балансировщик Collaps
    // Он дает выбор серий и озвучек прямо внутри
    const playerUrl = `https://api.bhf.im/anime/shikimori/${id}`;

    container.innerHTML = `
        <div class="modal-content" style="max-width: 900px; width: 95%; background: #0d1117; border: 1px solid #30363d; border-radius: 12px; overflow: hidden;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: #161b22;">
                <h2 style="margin:0; color:#58a6ff; font-size: 1.1rem;">${title}</h2>
                <span class="close" onclick="this.parentElement.parentElement.parentElement.style.display='none'" style="cursor:pointer; color:#8b949e; font-size:24px;">&times;</span>
            </div>
            <div class="video-wrapper" style="background: #000; position: relative; padding-bottom: 56.25%; height: 0;">
                <iframe 
                    src="${playerUrl}" 
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
                    frameborder="0" 
                    allowfullscreen
                    referrerpolicy="no-referrer"
                ></iframe>
            </div>
            <div style="padding: 10px; background: #161b22; display: flex; justify-content: center; gap: 10px;">
                <button onclick="document.querySelector('iframe').src='https://kodik.info/find-player?shikimori_id=${id}'" style="background:#21262d; border:1px solid #30363d; color:#c9d1d9; padding: 5px 10px; border-radius: 6px; font-size: 12px; cursor:pointer;">Сервер 2 (Kodik)</button>
                <button onclick="document.querySelector('iframe').src='https://v1.bazon.site/api/v1/get_player?shikimori_id=${id}'" style="background:#21262d; border:1px solid #30363d; color:#c9d1d9; padding: 5px 10px; border-radius: 6px; font-size: 12px; cursor:pointer;">Сервер 3 (Bazon)</button>
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