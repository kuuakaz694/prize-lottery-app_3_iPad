// app.js
let currentCourse = null;
let courses = {};
let deleteMode = false;

// 複数アニメ＆音声ペアを賞ごとに用意
const prizeMedia = {
  "特賞": [
    { animation: "anime/T1.json", audio: "sound/T1.mp3" },
    { animation: "anime/T2.json", audio: "sound/T2.mp3" },

  ],
  "A賞": [
    { animation: "anime/A1.json", audio: "sound/A1.mp3" },
    { animation: "anime/A2.json", audio: "sound/A2.mp3" },

  ],
  "B賞": [
    { animation: "anime/B1.json", audio: "sound/B1.mp3" },
    { animation: "anime/B2.json", audio: "sound/B2.mp3" },
 
  ],
  "C賞": [
    { animation: "anime/C1.json", audio: "sound/C1.mp3" },
    { animation: "anime/C2.json", audio: "sound/C2.mp3" },

  ],
  // 他の賞も必要に応じて追加してね
};

// 便利なID取得関数
function $(id) {
  return document.getElementById(id);
}

// 「景品登録」ボタン押したとき、登録画面を表示してトップ画面を非表示にする
$('register-button').onclick = () => {
  $('top-screen').style.display = 'none';
  $('register-screen').style.display = 'block';
};

// 「保存」ボタン押したときの処理
$('save-button').onclick = () => {
  const courseName = $('course-name').value.trim();
  if (!courseName) {
    alert("コース名を入力してね！");
    return;
  }
  const rows = document.querySelectorAll('#sheet-table tbody tr');
  const data = [];
  let loaded = 0;
  const total = rows.length;

  // ファイルの読み込みは非同期なので完了をカウントして最後に保存
  rows.forEach((row) => {
    const cells = row.querySelectorAll('input');
    const prize = cells[0].value;
    const text = cells[1].value;
    const imgFile = cells[2].files[0];
    const quantity = parseInt(cells[3].value);

    const finalize = (imgResult) => {
      data.push({ prize, text, image: imgResult, quantity });
      loaded++;
      if (loaded === total) {
        saveCourse(courseName, data);
      }
    };

    if (imgFile) {
      const reader = new FileReader();
      reader.onload = (e) => finalize(e.target.result);
      reader.readAsDataURL(imgFile);
    } else {
      finalize('');
    }
  });
};

// コースデータを保存し、画面を切り替え、ボタン再描画もする
function saveCourse(courseName, data) {
  courses[courseName] = data;
  try {
    localStorage.setItem("courses", JSON.stringify(courses));
  } catch (e) {
    alert("保存に失敗しました。容量がいっぱいかもしれません。");
    console.error(e);
    return;
  }
  renderCourses();
  $('register-screen').style.display = 'none';
  $('top-screen').style.display = 'block';
  $('course-name').value = '';
  $('start-button').disabled = true; // 新規登録時はスタートボタンは無効にしておく
  currentCourse = null;
}

// 画面トップのコースボタンを描画する関数
function renderCourses() {
  const container = $('course-buttons');
  container.innerHTML = '';

  Object.keys(courses).forEach(name => {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.margin = '5px';

    const btn = document.createElement('button');
    btn.textContent = name;
    btn.className = 'course-button'; // CSSでサイズ調整用クラス
    btn.onclick = () => {
      if (deleteMode) return; // 削除モード中は押しても何もしない
      currentCourse = name;
      $('start-button').disabled = false;
      $('start-button').style.background = 'red';
    };
    wrapper.appendChild(btn);

    if (deleteMode) {
      const close = document.createElement('span');
      close.textContent = '×';
      close.style.position = 'absolute';
      close.style.top = '0';
      close.style.right = '0';
      close.style.cursor = 'pointer';
      close.style.color = 'red';
      close.style.fontWeight = 'bold';
      close.onclick = () => {
        if (confirm(`${name} を削除する？`)) {
          delete courses[name];
          try {
            localStorage.setItem("courses", JSON.stringify(courses));
          } catch (e) {
            alert("削除後の保存に失敗しました。");
            console.error(e);
          }
          if(currentCourse === name) {
            currentCourse = null;
            $('start-button').disabled = true;
            $('start-button').style.background = '';
          }
          renderCourses();
        }
      };
      wrapper.appendChild(close);
    }

    container.appendChild(wrapper);
  });
}

// 「スタート」ボタン押したときの処理
$('start-button').onclick = () => {
  if (!currentCourse || !courses[currentCourse]) {
    alert("コースを選んでね！");
    return;
  }
  const list = courses[currentCourse].filter(item => item.quantity > 0);
  if (list.length === 0) {
    alert("在庫切れっぽい！");
    return;
  }
  const selected = list[Math.floor(Math.random() * list.length)];
  selected.quantity--;
  try {
    localStorage.setItem("courses", JSON.stringify(courses));
  } catch (e) {
    alert("データ保存に失敗しました。");
    console.error(e);
  }
  showAnimationScreen(selected);
};

// 抽選アニメーション＆音声の表示処理
function showAnimationScreen(item) {
  const mediaList = prizeMedia[item.prize];

  const selectedMedia = mediaList
    ? mediaList[Math.floor(Math.random() * mediaList.length)]
    : { animation: `anime/${item.prize}.json`, audio: `sound/${item.prize}.mp3` };

  let animScreen = document.getElementById('anime-screen');
  if (!animScreen) {
    animScreen = document.createElement('div');
    animScreen.id = 'anime-screen';
    animScreen.style.position = 'fixed';
    animScreen.style.top = '0';
    animScreen.style.left = '0';
    animScreen.style.width = '100vw';
    animScreen.style.height = '100vh';
    animScreen.style.background = '#fff';
    animScreen.style.display = 'flex';
    animScreen.style.alignItems = 'center';
    animScreen.style.justifyContent = 'center';
    animScreen.style.zIndex = '9999';
    document.body.appendChild(animScreen);
  } else {
    animScreen.innerHTML = '';
    animScreen.style.display = 'flex';
  }

  const lottieDiv = document.createElement('div');
  lottieDiv.style.width = '100%';
  lottieDiv.style.height = '80%';
  animScreen.appendChild(lottieDiv);

  lottie.loadAnimation({
    container: lottieDiv,
    renderer: 'svg',
    loop: false,
    autoplay: true,
    path: selectedMedia.animation
  });

  const audio = new Audio(selectedMedia.audio);
  audio.play();

  audio.onended = () => {
    animScreen.style.display = 'none';
    showResult(item);
  };
}

// 抽選結果の表示
function showResult(item) {
  $('top-screen').style.display = 'none';
  $('register-screen').style.display = 'none';
  $('result-screen').style.display = 'block';

  $('result-prize').textContent = item.prize;
  $('result-strings').textContent = item.text;

  if (item.image) {
    $('result-image').src = item.image;
    $('result-image').style.display = 'block';
  } else {
    $('result-image').style.display = 'none';
  }
}

// 結果画面の「戻る」ボタン押下時
$('result-back-button').onclick = () => {
  $('result-screen').style.display = 'none';
  $('top-screen').style.display = 'block';
};

// 「景品在庫」ボタン押下時
$('stock-button').onclick = () => {
  let msg = '';
  Object.keys(courses).forEach(name => {
    courses[name].forEach(item => {
      msg += `${item.prize}（残り ${item.quantity}）\n`;
    });
  });
  alert(msg);
};

// 「削除モード」切り替えボタン押下時
$('delete-toggle-button')?.addEventListener('click', () => {
  deleteMode = !deleteMode;
  renderCourses();
});

// 「景品登録画面」の「戻る」ボタン押下時
$('register-back-button').onclick = () => {
  $('register-screen').style.display = 'none';
  $('top-screen').style.display = 'block';
  // 登録中の内容は消したいならここで初期化もOK
  $('course-name').value = '';
};

// ページ読み込み時に保存データを読み込み、コースボタンを描画
window.onload = () => {
  const saved = localStorage.getItem("courses");
  if (saved) {
    courses = JSON.parse(saved);
    renderCourses();
  }
  $('start-button').disabled = true;
};
