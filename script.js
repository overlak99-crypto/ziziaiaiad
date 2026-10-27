let currentUser = null;
let currentTrack = '';
let currentSubjectId = null;
let currentLectureId = null;
let activeQuiz = null;
let studentName = '';
let builderQuestions = [];

let subjects = JSON.parse(localStorage.getItem('kholasa_subjects')) || [];
let lectures = JSON.parse(localStorage.getItem('kholasa_lectures')) || [];
let quizzes = JSON.parse(localStorage.getItem('kholasa_quizzes')) || [];

window.addEventListener('DOMContentLoaded', () => {
    updateStats();
});

window.addEventListener('scroll', () => {
    const btn = document.getElementById('back-to-top');
    if (window.scrollY > 300) {
        btn.style.display = 'flex';
    } else {
        btn.style.display = 'none';
    }
});

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStats() {
    subjects = JSON.parse(localStorage.getItem('kholasa_subjects')) || [];
    lectures = JSON.parse(localStorage.getItem('kholasa_lectures')) || [];
    
    const subCountEl = document.getElementById('stat-subjects-count');
    const lecCountEl = document.getElementById('stat-lectures-count');

    if(subCountEl) subCountEl.innerText = subjects.length;
    if(lecCountEl) lecCountEl.innerText = lectures.length;
}

function showPage(pageId) {
    if(!currentUser) {
        openAuthModal();
        return;
    }
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(pageId).classList.add('active');
    
    if (pageId === 'antizam' || pageId === 'antisab') {
        renderSubjects(pageId === 'antizam' ? 'انتظام' : 'انتساب');
    }
    if (pageId === 'quizzes') {
        renderQuizzes();
    }
    if (pageId === 'home') {
        updateStats();
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const themeIcon = document.getElementById('theme-icon');
    if (html.getAttribute('data-theme') === 'dark') {
        html.setAttribute('data-theme', 'light');
        themeIcon.className = 'fa-solid fa-sun';
    } else {
        html.setAttribute('data-theme', 'dark');
        themeIcon.className = 'fa-solid fa-moon';
    }
}

function handleAuth() {
    const email = document.getElementById('auth-email').value.trim();
    const pass = document.getElementById('auth-pass').value.trim();

    if(!email) return;

    if(email === 'admin@alkholasa.com' && pass === 'Kholasa@2026') {
        currentUser = { email, isAdmin: true };
    } else {
        currentUser = { email, isAdmin: false };
    }

    updateUIForAuth();
    closeModal('auth-modal');
    showPage('home');
}

function updateUIForAuth() {
    const authBtnText = document.getElementById('auth-btn-text');
    const authBtn = document.getElementById('auth-btn');
    const userDisplay = document.getElementById('user-display');
    const adminControls = document.querySelectorAll('.admin-only');
    const adminNoticeControl = document.getElementById('admin-notice-control');

    if(currentUser) {
        authBtnText.innerText = 'خروج';
        authBtn.onclick = logout;
        userDisplay.innerText = currentUser.isAdmin ? '👑 أدمن' : `🎓 ${currentUser.email.split('@')[0]}`;
        userDisplay.style.display = 'inline';

        adminControls.forEach(el => el.style.display = currentUser.isAdmin ? 'flex' : 'none');
        if(adminNoticeControl) adminNoticeControl.style.display = currentUser.isAdmin ? 'block' : 'none';
    } else {
        authBtnText.innerText = 'تسجيل الدخول';
        authBtn.onclick = openAuthModal;
        userDisplay.style.display = 'none';
        adminControls.forEach(el => el.style.display = 'none');
        if(adminNoticeControl) adminNoticeControl.style.display = 'none';
    }
}

function logout() {
    currentUser = null;
    updateUIForAuth();
    openAuthModal();
}

function triggerUpdateProcess() {
    const banner = document.getElementById('update-progress-banner');
    const fill = document.getElementById('progress-bar-fill');
    banner.style.display = 'block';
    fill.style.width = '0%';

    let width = 0;
    let interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
            banner.style.display = 'none';
        } else {
            width += 2;
            fill.style.width = width + '%';
        }
    }, 30);
}

function timeAgo(timestamp) {
    const seconds = Math.floor((new Date() - timestamp) / 1000);
    if (seconds < 60) return 'منذ ثوانٍ قليلة';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    return `منذ ${days} يوم`;
}

function renderSubjects(track) {
    currentTrack = track;
    const grid = document.getElementById(track === 'انتظام' ? 'antizam-grid' : 'antisab-grid');
    grid.innerHTML = '';

    subjects = JSON.parse(localStorage.getItem('kholasa_subjects')) || [];
    const trackSubjects = subjects.filter(s => s.track === track);

    if(trackSubjects.length === 0) {
        grid.innerHTML = `<p style="color:var(--text-muted); grid-column:1/-1; text-align:center; padding:2rem;">لا يوجد مواد مضافة بعد لحساب ${track}.</p>`;
        return;
    }

    trackSubjects.forEach(sub => {
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.innerHTML = `
            ${currentUser && currentUser.isAdmin ? `<button class="delete-btn" onclick="deleteSubject(event, ${sub.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
            <div class="subject-icon-box"><i class="fa-solid fa-book-bookmark"></i></div>
            <h3>${sub.name}</h3>
            <span class="time-ago">تمت الإضافة ${timeAgo(sub.id)}</span>
            <span style="color:var(--primary-gold); font-size:0.85rem; margin-top:0.4rem; font-weight:bold;">تصفح المحتوى ←</span>
        `;
        card.onclick = () => openSubjectDetail(sub);
        grid.appendChild(card);
    });
}

function openAddSubjectModal(track) {
    currentTrack = track;
    document.getElementById('new-subject-name').value = '';
    document.getElementById('subject-modal').style.display = 'flex';
}

function saveSubject() {
    const name = document.getElementById('new-subject-name').value.trim();
    if(!name) return;

    const newSub = { id: Date.now(), track: currentTrack, name };
    subjects.push(newSub);
    localStorage.setItem('kholasa_subjects', JSON.stringify(subjects));
    updateStats();

    closeModal('subject-modal');
    renderSubjects(currentTrack);
}

function deleteSubject(e, id) {
    e.stopPropagation();
    subjects = subjects.filter(s => s.id !== id);
    lectures = lectures.filter(l => l.subjectId !== id);
    localStorage.setItem('kholasa_subjects', JSON.stringify(subjects));
    localStorage.setItem('kholasa_lectures', JSON.stringify(lectures));
    updateStats();
    renderSubjects(currentTrack);
}

function openSubjectDetail(sub) {
    currentSubjectId = sub.id;
    document.getElementById('current-subject-title').innerText = sub.name;
    document.getElementById('current-subject-name-bar').innerText = sub.name;
    showPage('subject-detail');
    renderLectures();
}

function goBackToTrack() {
    showPage(currentTrack === 'انتظام' ? 'antizam' : 'antisab');
}

function openAddLectureModal() {
    document.getElementById('new-lecture-title').value = '';
    document.getElementById('lecture-images').value = '';
    document.getElementById('lecture-videos').value = '';
    document.getElementById('lecture-files').value = '';
    document.getElementById('lecture-modal').style.display = 'flex';
}

function saveLectureData() {
    const title = document.getElementById('new-lecture-title').value.trim();
    const imageInput = document.getElementById('lecture-images');
    const videoInput = document.getElementById('lecture-videos');
    const fileInput = document.getElementById('lecture-files');

    if(!title) return;
    if(imageInput.files.length > 20) return;
    if(videoInput.files.length > 2) return;

    const lectureId = Date.now();
    let imagesData = [];
    let videosData = [];
    let filesData = [];

    const processFiles = (files, targetArray, callback) => {
        if(files.length === 0) {
            callback();
            return;
        }
        let processed = 0;
        for(let file of files) {
            const reader = new FileReader();
            reader.onload = function(e) {
                targetArray.push({ name: file.name, data: e.target.result });
                processed++;
                if(processed === files.length) callback();
            };
            reader.readAsDataURL(file);
        }
    };

    processFiles(imageInput.files, imagesData, () => {
        processFiles(videoInput.files, videosData, () => {
            processFiles(fileInput.files, filesData, () => {
                const newLecture = {
                    id: lectureId,
                    subjectId: currentSubjectId,
                    title,
                    images: imagesData,
                    videos: videosData,
                    files: filesData
                };
                lectures.push(newLecture);
                localStorage.setItem('kholasa_lectures', JSON.stringify(lectures));
                updateStats();
                closeModal('lecture-modal');
                renderLectures();
            });
        });
    });
}

function renderLectures() {
    const list = document.getElementById('lectures-list');
    list.innerHTML = '';

    lectures = JSON.parse(localStorage.getItem('kholasa_lectures')) || [];
    const subLectures = lectures.filter(l => l.subjectId === currentSubjectId);

    if(subLectures.length === 0) {
        list.innerHTML = `<p style="color:var(--text-muted); grid-column:1/-1; text-align:center; padding:2rem;">لا توجد محاضرات مضافة لهذه المادة بعد.</p>`;
        return;
    }

    subLectures.forEach(lec => {
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.innerHTML = `
            ${currentUser && currentUser.isAdmin ? `<button class="delete-btn" onclick="deleteLecture(event, ${lec.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
            <div class="subject-icon-box"><i class="fa-solid fa-file-lines"></i></div>
            <h3>${lec.title}</h3>
            <span class="time-ago">تمت الإضافة ${timeAgo(lec.id)}</span>
            <span style="color:var(--primary-gold); font-size:0.85rem; margin-top:0.4rem; font-weight:bold;">فتح المحاضرة ←</span>
        `;
        card.onclick = () => openLectureDetail(lec);
        list.appendChild(card);
    });
}

function deleteLecture(e, id) {
    e.stopPropagation();
    lectures = lectures.filter(l => l.id !== id);
    localStorage.setItem('kholasa_lectures', JSON.stringify(lectures));
    updateStats();
    renderLectures();
}

function openLectureDetail(lec) {
    currentLectureId = lec.id;
    document.getElementById('current-lecture-title').innerText = lec.title;
    showPage('lecture-detail');

    const contentList = document.getElementById('lecture-content-list');
    contentList.innerHTML = '';

    let htmlContent = '';

    if(lec.images && lec.images.length > 0) {
        htmlContent += `<h3 style="color:var(--primary-gold); margin-bottom:1rem;"><i class="fa-solid fa-image"></i> الصور المرفقة (${lec.images.length})</h3>`;
        htmlContent += `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:1rem; margin-bottom:2rem;">`;
        lec.images.forEach((img) => {
            htmlContent += `
                <div style="background:var(--card-bg); border:1px solid var(--card-border); border-radius:12px; padding:0.8rem; text-align:center;">
                    <img src="${img.data}" alt="${img.name}" style="width:100%; height:140px; border-radius:8px; object-fit:cover; margin-bottom:0.8rem;">
                    <button onclick="viewMedia('image', '${img.data}', '${img.name}')" style="background:var(--accent-cyan); color:#000; border:none; padding:0.4rem 0.8rem; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.8rem; width:100%;"><i class="fa-solid fa-eye"></i> مشاهدة مباشرة</button>
                </div>`;
        });
        htmlContent += `</div>`;
    }

    if(lec.videos && lec.videos.length > 0) {
        htmlContent += `<h3 style="color:var(--primary-gold); margin-bottom:1rem;"><i class="fa-solid fa-video"></i> فيديوهات الشرح (${lec.videos.length})</h3>`;
        htmlContent += `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:1rem; margin-bottom:2rem;">`;
        lec.videos.forEach((vid) => {
            htmlContent += `
                <div style="background:var(--card-bg); border:1px solid var(--card-border); border-radius:12px; padding:0.8rem; text-align:center;">
                    <p style="font-weight:bold; margin-bottom:0.6rem; font-size:0.9rem;">${vid.name}</p>
                    <button onclick="viewMedia('video', '${vid.data}', '${vid.name}')" style="background:var(--accent-cyan); color:#000; border:none; padding:0.4rem 0.9rem; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.8rem; width:100%;"><i class="fa-solid fa-play"></i> مشاهدة مباشرة</button>
                </div>`;
        });
        htmlContent += `</div>`;
    }

    if(lec.files && lec.files.length > 0) {
        htmlContent += `<h3 style="color:var(--primary-gold); margin-bottom:1rem;"><i class="fa-solid fa-file"></i> الملفات والـ PDF (${lec.files.length})</h3>`;
        htmlContent += `<div style="display:flex; flex-direction:column; gap:0.8rem; margin-bottom:2rem;">`;
        lec.files.forEach(file => {
            htmlContent += `
                <div style="background:var(--card-bg); border:1px solid var(--card-border); border-radius:12px; padding:1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                    <span style="font-weight:bold;">${file.name}</span>
                    <button onclick="viewMedia('pdf', '${file.data}', '${file.name}')" style="background:var(--accent-cyan); color:#000; border:none; padding:0.4rem 0.9rem; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.8rem;"><i class="fa-solid fa-eye"></i> معاينة بالموقع</button>
                </div>`;
        });
        htmlContent += `</div>`;
    }

    if(!htmlContent) {
        htmlContent = `<p style="color:var(--text-muted); text-align:center; padding:2rem;">لا توجد محتويات مرفقة في هذه المحاضرة.</p>`;
    }

    contentList.innerHTML = htmlContent;
}

/* Quizzes System Functions */
function renderQuizzes() {
    const grid = document.getElementById('quizzes-grid');
    grid.innerHTML = '';

    quizzes = JSON.parse(localStorage.getItem('kholasa_quizzes')) || [];

    if(quizzes.length === 0) {
        grid.innerHTML = `<p style="color:var(--text-muted); grid-column:1/-1; text-align:center; padding:2rem;">لا يوجد اختبارات مضافة بعد.</p>`;
        return;
    }

    quizzes.forEach(quiz => {
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.innerHTML = `
            ${currentUser && currentUser.isAdmin ? `<button class="delete-btn" onclick="deleteQuiz(event, ${quiz.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
            <div class="subject-icon-box"><i class="fa-solid fa-pen-to-square"></i></div>
            <h3>${quiz.title}</h3>
            <span class="time-ago">تمت الإضافة ${timeAgo(quiz.id)}</span>
            <span style="color:var(--primary-gold); font-size:0.85rem; margin-top:0.4rem; font-weight:bold;">دخول للاختبار ←</span>
        `;
        card.onclick = () => openStudentNameModal(quiz);
        grid.appendChild(card);
    });
}

function openAddQuizModal() {
    document.getElementById('quiz-title-input').value = '';
    document.getElementById('quiz-image-input').value = '';
    document.getElementById('quiz-builder-area').innerHTML = '';
    builderQuestions = [];
    addQuestionField();
    document.getElementById('quiz-modal').style.display = 'flex';
}

function addQuestionField() {
    const area = document.getElementById('quiz-builder-area');
    const qIndex = builderQuestions.length + 1;
    const quizType = document.getElementById('quiz-type-select').value;

    const qBox = document.createElement('div');
    qBox.style.background = 'var(--input-bg)';
    qBox.style.padding = '0.8rem';
    qBox.style.borderRadius = '8px';
    qBox.style.marginBottom = '0.8rem';

    let answersHTML = '';
    if(quizType === 'tf') {
        answersHTML = `
            <div class="form-group" style="margin-bottom:0.5rem;">
                <label>الإجابة الصحيحة</label>
                <select class="q-correct">
                    <option value="صح">صح (✅)</option>
                    <option value="غلط">غلط (❌)</option>
                </select>
            </div>`;
    } else if(quizType === 'mcq') {
        answersHTML = `
            <div class="form-group" style="margin-bottom:0.5rem;">
                <label>الإجابة الصحيحة (رقم الخيار)</label>
                <select class="q-correct">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                </select>
            </div>
            <input type="text" class="q-opt1" placeholder="الخيار 1" style="margin-bottom:0.3rem;">
            <input type="text" class="q-opt2" placeholder="الخيار 2" style="margin-bottom:0.3rem;">
            <input type="text" class="q-opt3" placeholder="الخيار 3" style="margin-bottom:0.3rem;">
            <input type="text" class="q-opt4" placeholder="الخيار 4">
        `;
    } else {
        answersHTML = `
            <div class="form-group" style="margin-bottom:0.5rem;">
                <label>الإجابة النموذجية (للمراجعة)</label>
                <input type="text" class="q-correct" placeholder="الإجابة النموذجية">
            </div>
        `;
    }

    qBox.innerHTML = `
        <div class="form-group" style="margin-bottom:0.5rem;">
            <label>السؤال ${qIndex}</label>
            <input type="text" class="q-text" placeholder="نص السؤال">
        </div>
        ${answersHTML}
    `;
    area.appendChild(qBox);
    builderQuestions.push(qBox);
}

function saveQuizData() {
    const title = document.getElementById('quiz-title-input').value.trim();
    const type = document.getElementById('quiz-type-select').value;
    const imgInput = document.getElementById('quiz-image-input');

    if(!title) return;

    let questions = [];
    const boxes = document.querySelectorAll('#quiz-builder-area > div');

    boxes.forEach((box, i) => {
        const text = box.querySelector('.q-text').value.trim();
        const correctEl = box.querySelector('.q-correct');
        const correct = correctEl ? correctEl.value : '';
        
        let opt1 = '', opt2 = '', opt3 = '', opt4 = '';
        if(type === 'mcq') {
            opt1 = box.querySelector('.q-opt1').value.trim();
            opt2 = box.querySelector('.q-opt2').value.trim();
            opt3 = box.querySelector('.q-opt3').value.trim();
            opt4 = box.querySelector('.q-opt4').value.trim();
        }

        if(text) {
            questions.push({
                id: i + 1,
                text,
                correct,
                options: type === 'mcq' ? [opt1, opt2, opt3, opt4].filter(o => o !== '') : []
            });
        }
    });

    const quizId = Date.now();
    
    if(imgInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const newQuiz = { id: quizId, title, type, image: e.target.result, questions };
            quizzes.push(newQuiz);
            localStorage.setItem('kholasa_quizzes', JSON.stringify(quizzes));
            closeModal('quiz-modal');
            renderQuizzes();
        };
        reader.readAsDataURL(imgInput.files[0]);
    } else {
        const newQuiz = { id: quizId, title, type, image: null, questions };
        quizzes.push(newQuiz);
        localStorage.setItem('kholasa_quizzes', JSON.stringify(quizzes));
        closeModal('quiz-modal');
        renderQuizzes();
    }
}

function deleteQuiz(e, id) {
    e.stopPropagation();
    quizzes = quizzes.filter(q => q.id !== id);
    localStorage.setItem('kholasa_quizzes', JSON.stringify(quizzes));
    renderQuizzes();
}

function openStudentNameModal(quiz) {
    activeQuiz = quiz;
    document.getElementById('student-full-name').value = '';
    document.getElementById('student-name-modal').style.display = 'flex';
}

function startQuizWithStudentName() {
    const name = document.getElementById('student-full-name').value.trim();
    if(!name) return;
    studentName = name;
    closeModal('student-name-modal');
    renderQuizSolvePage();
}

function renderQuizSolvePage() {
    document.getElementById('quiz-solve-title').innerText = activeQuiz.title;
    showPage('quiz-solve');

    const body = document.getElementById('quiz-questions-body');
    body.innerHTML = '';

    let html = '';

    if(activeQuiz.image) {
        html += `<div style="text-align:center; margin-bottom:1.5rem;"><img src="${activeQuiz.image}" style="max-width:100%; border-radius:12px; border:1px solid var(--card-border);"></div>`;
    }

    activeQuiz.questions.forEach((q, idx) => {
        html += `<div class="quiz-item-box">
            <h4 style="color:var(--primary-gold); margin-bottom:0.8rem;">سـ ${idx + 1}: ${q.text}</h4>`;

        if(activeQuiz.type === 'tf') {
            html += `
                <label class="quiz-option-label"><input type="radio" name="q_${q.id}" value="صح"> (✅) صح</label>
                <label class="quiz-option-label"><input type="radio" name="q_${q.id}" value="غلط"> (❌) غلط</label>
            `;
        } else if(activeQuiz.type === 'mcq') {
            q.options.forEach((opt, optIdx) => {
                html += `<label class="quiz-option-label"><input type="radio" name="q_${q.id}" value="${optIdx + 1}"> ${optIdx + 1}. ${opt}</label>`;
            });
        } else {
            html += `<textarea name="q_${q.id}" placeholder="اكتب إجابتك هنا..." rows="2" style="width:100%; padding:0.8rem; background:var(--input-bg); border:1px solid var(--card-border); border-radius:8px; color:var(--text-main); outline:none; margin-top:0.5rem;"></textarea>`;
        }

        html += `</div>`;
    });

    html += `<button class="btn-submit" style="padding:1rem; font-size:1.1rem; margin-top:1rem;" onclick="submitQuizAnswers()">ارسال الحل والتصحيح التلقائي</button>`;
    html += `<div id="quiz-results-area" style="margin-top:1.5rem;"></div>`;

    body.innerHTML = html;
}

function submitQuizAnswers() {
    let score = 0;
    const total = activeQuiz.questions.length;
    let reviewHTML = `<div style="background:var(--card-bg); border:1px solid var(--card-border); border-radius:16px; padding:1.5rem; margin-top:1.5rem;">`;
    
    reviewHTML += `<h3 style="color:var(--accent-cyan); text-align:center;">نتيجة الطالب: ${studentName}</h3>`;

    activeQuiz.questions.forEach((q) => {
        let userAns = '';
        if(activeQuiz.type === 'essay') {
            const txt = document.querySelector(`textarea[name="q_${q.id}"]`);
            userAns = txt ? txt.value.trim() : '';
            if(userAns) score++;
        } else {
            const selected = document.querySelector(`input[name="q_${q.id}"]:checked`);
            userAns = selected ? selected.value : 'لم يتم الحل';
            if(userAns === q.correct) score++;
        }

        const isCorrect = (activeQuiz.type === 'essay') ? true : (userAns === q.correct);

        reviewHTML += `
            <div style="border-bottom:1px dashed var(--card-border); padding:0.8rem 0; text-align:right;">
                <p style="font-weight:bold;">${q.text}</p>
                <p style="font-size:0.85rem; color:${isCorrect ? 'var(--primary-gold)' : 'var(--danger)'};">
                    إجابتك: ${userAns || 'فارغ'} ${activeQuiz.type === 'essay' ? '' : (isCorrect ? '✔ (إجابة صحيحة)' : `✖ (الإجابة الصحيحة هي: ${q.correct})`)}
                </p>
                ${activeQuiz.type === 'essay' ? `<p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">الإجابة النموذجية: ${q.correct}</p>` : ''}
            </div>
        `;
    });

    reviewHTML += `<h2 style="text-align:center; color:var(--primary-gold); margin-top:1rem;">الدرجة النهائية: ${score} من ${total}</h2></div>`;

    document.getElementById('quiz-results-area').innerHTML = reviewHTML;
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

function viewMedia(type, data, name) {
    const modal = document.getElementById('media-view-modal');
    const title = document.getElementById('media-modal-title');
    const body = document.getElementById('media-modal-body');

    title.innerText = name;
    body.innerHTML = '';

    if (type === 'image') {
        body.innerHTML = `<img src="${data}" alt="${name}" style="width:100%; max-height:70vh; object-fit:contain; border-radius:8px;">`;
    } else if (type === 'video') {
        body.innerHTML = `<video controls autoplay src="${data}" style="width:100%; max-height:70vh; border-radius:8px;"></video>`;
    } else if (type === 'pdf') {
        body.innerHTML = `<iframe src="${data}" style="width:100%; height:65vh; border:none; border-radius:8px;"></iframe>`;
    }

    modal.style.display = 'flex';
}

function goBackToSubject() {
    const sub = subjects.find(s => s.id === currentSubjectId);
    if(sub) openSubjectDetail(sub);
}

function openAuthModal() { document.getElementById('auth-modal').style.display = 'flex'; }
function openWhatsAppModal() { document.getElementById('whatsapp-modal').style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }