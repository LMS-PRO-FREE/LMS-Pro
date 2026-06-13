/**
 * nav.js – Shared navigation auth logic for LMS EDU PRO
 * Include this BEFORE </body> on every page.
 *
 * Expected HTML structure inside .navbar:
 *   .nav-avatar           – avatar shown when logged in
 *   .nav-link.nav-community – community link (hidden until login)
 *   .nav-link.nav-dashboard – dashboard link (hidden until login)
 *   .btn-auth-login       – Login/Register button (hidden when logged in)
 *   .btn-auth-logout      – Logout button (hidden when not logged in)
 *
 * sessionStorage keys:
 *   role  : 'admin' | 'teacher' | 'student'
 *   name  : display name (optional)
 */
(function () {
  const DASH_MAP = {
    admin:   'admin-dashboard.html',
    teacher: 'teacher-dashboard.html',
    student: 'student-dashboard.html',
  };
  const COMMUNITY_MAP = {
    admin:   'community.html',
    teacher: 'community.html',
    student: 'community.html',
  };

  const role = sessionStorage.getItem('role');
  const name = sessionStorage.getItem('name') || 'User';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  /* ---- Helper: apply to both desktop & mobile versions ---- */
  function applyToAll(selector, fn) {
    document.querySelectorAll(selector).forEach(fn);
  }

  if (role) {
    /* === LOGGED IN === */

    /* Dashboard links → correct page */
    applyToAll('.nav-dashboard', el => {
      el.href = DASH_MAP[role] || 'Index.html';
      el.style.display = 'inline';
    });

    /* Community links → correct page */
    applyToAll('.nav-community', el => {
      el.href = COMMUNITY_MAP[role] || '#';
      el.style.display = 'inline';
    });

    /* Avatars */
    applyToAll('.nav-avatar', el => {
      el.style.display = 'flex';
      const circle = el.querySelector('.avatar-circle');
      const namEl = el.querySelector('.avatar-name');
      if (circle) circle.textContent = initials;
      if (namEl)  namEl.textContent = name;
      /* Clicking avatar goes to dashboard */
      el.href = DASH_MAP[role] || '#';
    });

    /* Show logout buttons */
    applyToAll('.btn-auth-logout', el => {
      el.style.display = 'inline-flex';
      el.addEventListener('click', e => {
        e.preventDefault();
        sessionStorage.clear();
        window.location.href = 'Index.html';
      });
    });

    /* Hide login buttons */
    applyToAll('.btn-auth-login', el => { el.style.display = 'none'; });

    /* RBAC: redirect if wrong role page */
    const path = window.location.pathname.split('/').pop();
    const adminPages   = ['admin-dashboard.html', 'admin-friend-requests.html', 'admin-friends.html', 'admin-search.html'];
    const teacherPages = ['teacher-dashboard.html', 'teacher-friend-requests.html', 'teacher-friends.html', 'teacher-search.html'];
    const studentPages = ['student-dashboard.html', 'student-friend-requests.html', 'student-friends.html', 'student-search.html'];

    if (role !== 'admin'   && adminPages.includes(path))   window.location.replace(DASH_MAP[role]);
    if (role !== 'teacher' && teacherPages.includes(path)) window.location.replace(DASH_MAP[role]);
    if (role !== 'student' && studentPages.includes(path)) window.location.replace(DASH_MAP[role]);

    /* Suspend restriction */
    const status = sessionStorage.getItem('status');
    const coursePages = ['courses.html', 'current-courses.html', 'manage-classes.html', 'manage-lessons.html'];
    if (status === 'suspended' && coursePages.includes(path)) {
      alert('Tài khoản của bạn đang bị TẠM NGƯNG. Bạn không thể truy cập nội dung Khóa học / Lớp học.');
      window.location.replace(DASH_MAP[role] || 'Index.html');
    }

  } else {
    /* === NOT LOGGED IN === */

    /* Hide dashboard, community, avatar */
    applyToAll('.nav-dashboard', el => { el.style.display = 'none'; });
    applyToAll('.nav-community', el => { el.style.display = 'none'; });
    applyToAll('.nav-avatar',    el => { el.style.display = 'none'; });
    applyToAll('.btn-auth-logout', el => { el.style.display = 'none'; });

    /* Show login button with explicit value */
    applyToAll('.btn-auth-login', el => { el.style.display = 'inline-flex'; });
  }

  /* ---- Inactivity Auto-Logout (12 Hours) ---- */
  const INACTIVITY_LIMIT = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
  let activityTimer = null;

  function updateActivity() {
    localStorage.setItem('last_activity', Date.now());
  }

  function checkActivity() {
    const lastActivity = localStorage.getItem('last_activity');
    if (sessionStorage.getItem('role') && lastActivity) {
      if (Date.now() - parseInt(lastActivity) > INACTIVITY_LIMIT) {
        alert('Phiên đăng nhập đã hết hạn do không có hoạt động nào trong 12 tiếng. Vui lòng đăng nhập lại.');
        sessionStorage.clear();
        localStorage.removeItem('last_activity');
        window.location.href = 'auth.html';
      }
    } else if (sessionStorage.getItem('role') && !lastActivity) {
      updateActivity(); // Khởi tạo thời gian nếu vừa mới đăng nhập
    }
  }

  if (sessionStorage.getItem('role')) {
    checkActivity();
    
    // Throttle updateActivity to avoid bombarding localStorage
    const events = ['click', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(evt => {
      document.addEventListener(evt, () => {
        if (!activityTimer) {
          activityTimer = setTimeout(() => {
            updateActivity();
            activityTimer = null;
          }, 5000); // Only update at most once every 5 seconds
        }
      }, { passive: true });
    });

    setInterval(checkActivity, 60000); // Check every minute
  }

  /* ---- Hamburger toggle (mobile navbar) ---- */
  const hamburger = document.getElementById('navHamburger');
  const mobileMenu = document.getElementById('navMobileMenu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      /* animate bars */
      hamburger.classList.toggle('open');
    });
  }

  /* ---- Sidebar toggle (Desktop & Mobile) ---- */
  const desktopSidebarToggle = document.getElementById('desktopSidebarToggle');
  const dashboardSidebar = document.querySelector('.dashboard-sidebar');
  if (desktopSidebarToggle && dashboardSidebar) {
    desktopSidebarToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      dashboardSidebar.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (dashboardSidebar.classList.contains('open') && !dashboardSidebar.contains(e.target)) {
        dashboardSidebar.classList.remove('open');
      }
    });
  }

  /* ---- View Switcher for Admin ---- */
  const originalRole = sessionStorage.getItem('originalRole');
  if (originalRole === 'admin') {
    const switcher = document.createElement('div');
    switcher.className = 'glass-card';
    switcher.style.cssText = "position:fixed; bottom:20px; right:20px; z-index:10000; padding:0.8rem 1rem; border-radius:20px; display:flex; flex-direction:column; gap:0.6rem; box-shadow:0 10px 40px rgba(0,0,0,0.15); transition:transform 0.3s;";
    
    switcher.innerHTML = `
      <div style="font-weight:800; font-size:0.8rem; color:var(--text); text-transform:uppercase; letter-spacing:0.5px; margin-bottom: 0.2rem;">👀 Góc nhìn mô phỏng</div>
      <div class="role-chips" style="gap:0.6rem;">
        <label class="role-chip" style="padding:0.6rem 0.8rem; border-radius:12px; font-size:0.8rem;"><input type="radio" name="adminView" value="admin" ${role === 'admin' ? 'checked' : ''}>🛡️ Admin</label>
        <label class="role-chip" style="padding:0.6rem 0.8rem; border-radius:12px; font-size:0.8rem;"><input type="radio" name="adminView" value="teacher" ${role === 'teacher' ? 'checked' : ''}>👨‍🏫 GV</label>
        <label class="role-chip" style="padding:0.6rem 0.8rem; border-radius:12px; font-size:0.8rem;"><input type="radio" name="adminView" value="student" ${role === 'student' ? 'checked' : ''}>👨‍🎓 HS</label>
      </div>
    `;
    
    document.body.appendChild(switcher);

    switcher.querySelectorAll('input[name="adminView"]').forEach(radio => {
      radio.addEventListener('change', function(e) {
        sessionStorage.setItem('role', e.target.value);
        window.location.href = DASH_MAP[e.target.value];
      });
    });
    
    switcher.addEventListener('mouseenter', () => { switcher.style.transform = 'scale(1.03) translateY(-2px)'; });
    switcher.addEventListener('mouseleave', () => { switcher.style.transform = 'scale(1) translateY(0)'; });
  }
})();
