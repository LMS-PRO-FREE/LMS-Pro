// --- Theme Restore ---
const savedTheme = localStorage.getItem('theme');
if (savedTheme) document.body.dataset.theme = savedTheme;

﻿
// --- UI Components Injector ---
document.addEventListener("DOMContentLoaded", function() {
  const header = document.querySelector('header.navbar');
  const mobileMenu = document.querySelector('nav.nav-mobile-menu');
  const footer = document.querySelector('footer.footer');

  const styleStr = `
    .nav-dropdown-wrapper { position: relative; display: inline-block; }
    .nav-dropdown-content { 
      display: none; position: absolute; top: 100%; left: 0; 
      background: var(--bg-color, #fff); border: 1px solid var(--border, #eee); 
      box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 12px; 
      padding: 0.5rem; min-width: 220px; z-index: 9999; 
    }
    .nav-dropdown-wrapper:hover .nav-dropdown-content { display: block; }
    .nav-dropdown-content a { display: block; padding: 0.8rem 1rem; color: var(--text, #333); text-decoration: none; border-radius: 8px; transition: background 0.2s; }
    .nav-dropdown-content a:hover { background: rgba(0,122,255,0.1); color: var(--primary, #007aff); }
  `;
  if (!document.getElementById('navStylesDynamic')) {
    document.head.insertAdjacentHTML('beforeend', `<style id="navStylesDynamic">${styleStr}</style>`);
  }

  const navHtml = `
    <a href="Index.html" class="nav-logo">
      <span class="logo-text">LMS EDU PRO</span>
    </a>

    <!-- Desktop nav (>=1200px) -->
    <nav class="nav-right" id="navRight" aria-label="Menu chính">
      <a href="Index.html"    class="nav-link active">Trang chủ</a>
      <a href="about-us.html" class="nav-link">Về chúng tôi</a>
      <a href="courses.html"  class="nav-link">Chương trình học</a>
      <a href="contact.html"  class="nav-link">Liên hệ</a>
      
      <a href="#" class="nav-link nav-dashboard">Bảng điều khiển</a>
      <!-- Avatar (shown when logged in) -->
      <a href="#" class="nav-avatar" title="Trang cá nhân">
        <div class="avatar-circle">U</div>
        <span class="avatar-name">User</span>
      </a>
      <!-- Auth buttons -->
      <a href="auth.html" class="btn-auth-login">Đăng nhập / Đăng ký</a>
      <a href="#" class="btn-auth-logout">Đăng xuất</a>
    </nav>

    <!-- Hamburger (mobile <1200px) -->
    <button class="nav-hamburger" id="navHamburger" aria-label="Mở menu">
      <span></span><span></span><span></span>
    </button>
  `;
  const mobileHtml = `
    <a href="Index.html"    class="nav-link active">Trang chủ</a>
    <a href="about-us.html" class="nav-link">Về chúng tôi</a>
    <a href="courses.html"  class="nav-link">Chương trình học</a>
    <a href="contact.html"  class="nav-link">Liên hệ</a>

    <a href="#" class="nav-link nav-dashboard">Bảng điều khiển</a>
    <a href="#" class="nav-avatar" title="Trang cá nhân">
      <div class="avatar-circle">U</div>
      <span class="avatar-name">User</span>
    </a>
    <a href="auth.html" class="btn-auth-login">Đăng nhập / Đăng ký</a>
    <a href="#" class="btn-auth-logout">Đăng xuất</a>
  `;
  const footerHtml = `
    <div class="footer-content">
      <div class="footer-col">
        <h3>LMS EDU PRO</h3>
        <p>Nền tảng học tập trực tuyến chuyên nghiệp, hỗ trợ mọi cấp độ học viên.</p>
      </div>
      <div class="footer-col">
        <h3>Liên kết nhanh</h3>
        <a href="about-us.html">Về chúng tôi</a>
        <a href="courses.html">Chương trình học</a>
        <a href="contact.html">Liên hệ</a>
      </div>
      <div class="footer-col">
        <h3>Liên hệ</h3>
        <p>Email: support@lmsedupro.vn</p>
        <p>SĐT: 0123 456 789</p>
      </div>
    </div>
    <div class="footer-bottom">© 2026 LMS EDU PRO. All rights reserved.</div>
  `;

  if (header && !header.hasAttribute('data-injected')) {
    header.innerHTML = navHtml;
    header.setAttribute('data-injected', 'true');
  }
  if (mobileMenu && !mobileMenu.hasAttribute('data-injected')) {
    mobileMenu.innerHTML = mobileHtml;
    mobileMenu.setAttribute('data-injected', 'true');
  }
  if (footer && !footer.hasAttribute('data-injected')) {
    footer.innerHTML = footerHtml;
    footer.setAttribute('data-injected', 'true');
  }

  // --- Inject Dynamic Sidebar ---
  const sidebar = document.querySelector('.dashboard-sidebar');
  const roleStr = sessionStorage.getItem('role');
  if (sidebar && roleStr) {
    const curPath = window.location.pathname.split('/').pop() || 'Index.html';
    
    let subMenuHtml = `
      <div class="community-submenu" style="display: ${curPath.includes('friend') || curPath.includes('search') || curPath.includes('community') ? 'flex' : 'none'}; flex-direction: column; gap: 0.2rem; padding-left: 2rem; margin-top: 0.2rem; margin-bottom: 0.5rem;">
        <a href="community.html" class="sidebar-link ${curPath.includes('community') ? 'active' : ''}" style="font-size: 0.9rem; padding: 0.5rem 1rem;">🏠 Bảng tin</a>
        <a href="friend-requests.html" class="sidebar-link ${curPath.includes('friend-requests') ? 'active' : ''}" style="font-size: 0.9rem; padding: 0.5rem 1rem;">📩 Lời mời kết bạn</a>
        <a href="friends.html" class="sidebar-link ${curPath.includes('friends') ? 'active' : ''}" style="font-size: 0.9rem; padding: 0.5rem 1rem;">👥 Bạn bè</a>
        <a href="search.html" class="sidebar-link ${curPath.includes('search') ? 'active' : ''}" style="font-size: 0.9rem; padding: 0.5rem 1rem;">🔍 Tìm người dùng</a>
      </div>
    `;

    const commHtml = `
      <div>
        <a href="#" class="sidebar-link nav-community-toggle" style="justify-content: space-between;">
          <span>🌐 Cộng đồng</span>
          <span style="font-size:0.8rem;">${curPath.includes('friend') || curPath.includes('search') || curPath.includes('community') ? '▲' : '▼'}</span>
        </a>
        ${subMenuHtml}
      </div>
    `;

    let sidebarHtml = '';
    if (roleStr === 'admin') {
      sidebarHtml = `
        <h2>Quản lý</h2>
        <a href="admin-dashboard.html" class="sidebar-link">👥 Quản lý người dùng</a>
        <a href="manage-classes.html" class="sidebar-link">📚 Quản lý lớp học</a>
        <a href="manage-lessons.html" class="sidebar-link">📝 Quản lý bài học</a>
        <a href="profile.html" class="sidebar-link">👤 Thông tin cá nhân</a>
        <a href="settings.html" class="sidebar-link">⚙️ Cài đặt</a>
        <a href="payment-history.html" class="sidebar-link">💳 Lịch sử thanh toán</a>
        ${commHtml}
      `;
    } else if (roleStr === 'teacher') {
      sidebarHtml = `
        <h2>Giáo viên</h2>
        <a href="manage-lessons.html" class="sidebar-link">📝 Quản lý bài học</a>
        <a href="manage-classes.html" class="sidebar-link">📚 Quản lý lớp học</a>
        <a href="profile.html" class="sidebar-link">👤 Thông tin cá nhân</a>
        <a href="settings.html" class="sidebar-link">⚙️ Cài đặt</a>
        ${commHtml}
      `;
    } else if (roleStr === 'student') {
      sidebarHtml = `
        <h2>Học sinh</h2>
        <a href="current-courses.html" class="sidebar-link">📚 Khóa học hiện tại</a>
        <a href="payment-history.html" class="sidebar-link">💳 Lịch sử thanh toán</a>
        <a href="profile.html" class="sidebar-link">👤 Thông tin cá nhân</a>
        <a href="settings.html" class="sidebar-link">⚙️ Cài đặt</a>
        ${commHtml}
      `;
    }
    sidebar.innerHTML = sidebarHtml;
  }

  // Set active class based on URL
  const path = window.location.pathname.split('/').pop() || 'Index.html';
    document.querySelectorAll('.navbar .nav-link, .nav-mobile-menu .nav-link, .sidebar-link').forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href && (href === path)) {
        link.classList.add('active');
        // If it's a submenu item, also highlight the parent toggle
        if (link.closest('.community-submenu')) {
          const toggle = link.closest('div').querySelector('.nav-community-toggle');
          if (toggle) toggle.classList.add('active');
        }
      }
    });
  
  
  // Re-run Auth Visibility Logic after injection
  const role = sessionStorage.getItem('role');
  const DASH_MAP_LOC = {
    admin:   'admin-dashboard.html',
    teacher: 'teacher-dashboard.html',
    student: 'student-dashboard.html',
  };
  const COM_MAP_LOC = {
    admin:   'community.html',
    teacher: 'community.html',
    student: 'community.html',
  };
  const name = sessionStorage.getItem('name') || 'User';
  const username = sessionStorage.getItem('username');
  const db = JSON.parse(localStorage.getItem('users_db')) || [];
  const userRecord = db.find(u => u.user === username);
  if (userRecord && userRecord.name) {
    sessionStorage.setItem('name', userRecord.name);
    document.querySelectorAll('.nav-avatar .avatar-name').forEach(el => {
      el.textContent = userRecord.name;
    });
    document.querySelectorAll('#mobileUserName').forEach(el => {
      el.textContent = userRecord.name;
    });
  }
  const avatarSrc = userRecord ? userRecord.avatar : null;
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const apply = (sel, fn) => document.querySelectorAll(sel).forEach(fn);
  if (role) {
    apply('.btn-auth-login', el => el.style.display = 'none');
    apply('.btn-auth-logout', el => el.style.display = 'inline-block');
    apply('.nav-dashboard', el => {
      el.href = DASH_MAP_LOC[role] || 'Index.html';
      el.style.display = 'inline';
    });
      apply('.nav-avatar', el => {
        el.style.display = 'flex';
        const circle = el.querySelector('.avatar-circle');
        const namEl = el.querySelector('.avatar-name');
        if (circle) {
          if (avatarSrc) {
            circle.style.padding = '0';
            circle.style.overflow = 'hidden';
            circle.innerHTML = `<img src="${avatarSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
          } else {
            circle.textContent = initials;
          }
        }
        if (namEl)  namEl.textContent = name;
        el.href = DASH_MAP_LOC[role] || '#';
      });
  } else {
    apply('.nav-dashboard', el => el.style.display = 'none');
    apply('.nav-avatar', el => el.style.display = 'none');
    apply('.btn-auth-login', el => el.style.display = 'inline-flex');
    apply('.btn-auth-logout', el => el.style.display = 'none');
  }

  // Re-bind hamburger menu
  const navHamburger = document.getElementById('navHamburger');
  const navMobileMenu = document.getElementById('navMobileMenu');
  if (navHamburger && navMobileMenu) {
    navHamburger.addEventListener('click', () => {
      navMobileMenu.classList.toggle('active');
      navHamburger.classList.toggle('active');
    });
  }
});


// --- Custom UI Modals ---
document.addEventListener("DOMContentLoaded", function() {
  document.body.insertAdjacentHTML('beforeend', `
<style>
/* Custom Alert & Confirm Modals */
.custom-modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
  display: flex; justify-content: center; align-items: center;
  z-index: 99999; opacity: 0; pointer-events: none; transition: opacity 0.2s ease;
}
.custom-modal-overlay.active { opacity: 1; pointer-events: auto; }
.custom-modal-box {
  background: var(--bg); color: var(--text); padding: 2rem; border-radius: 20px;
  max-width: 400px; width: 90%; text-align: center;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2); transform: translateY(20px); transition: transform 0.2s ease;
}
.custom-modal-overlay.active .custom-modal-box { transform: translateY(0); }
.custom-modal-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; color: var(--primary); }
.custom-modal-msg { margin-bottom: 2rem; color: var(--text-muted); }
.custom-modal-actions { display: flex; gap: 1rem; justify-content: center; }
.btn-custom-modal {
  padding: 0.75rem 1.5rem; border-radius: 12px; border: none; font-weight: 600; cursor: pointer;
  background: var(--primary); color: #fff; transition: opacity 0.2s;
}
.btn-custom-modal:hover { opacity: 0.9; }
.btn-custom-cancel { background: rgba(0,0,0,0.1); color: var(--text); }
.btn-custom-cancel:hover { background: rgba(0,0,0,0.2); }
</style>
<div id="sysAlertOverlay" class="custom-modal-overlay">
  <div class="custom-modal-box">
    <div class="custom-modal-title">Thông báo</div>
    <div class="custom-modal-msg" id="sysAlertMsg"></div>
    <button class="btn-custom-modal" id="sysAlertBtn">Đóng</button>
  </div>
</div>
<div id="sysConfirmOverlay" class="custom-modal-overlay">
  <div class="custom-modal-box">
    <div class="custom-modal-title">Xác nhận</div>
    <div class="custom-modal-msg" id="sysConfirmMsg"></div>
    <div class="custom-modal-actions">
      <button class="btn-custom-modal btn-custom-cancel" id="sysConfirmCancel">Hủy</button>
      <button class="btn-custom-modal" id="sysConfirmOk" style="background: #ef4444;">Xác nhận</button>
    </div>
  </div>
</div>
`);
  
  window.customAlert = function(msg) {
    const overlay = document.getElementById('sysAlertOverlay');
    document.getElementById('sysAlertMsg').textContent = msg;
    overlay.classList.add('active');
    document.getElementById('sysAlertBtn').onclick = () => overlay.classList.remove('active');
  };

  // Override default alert
  window.alert = window.customAlert;

  window.customConfirm = function(msg) {
    return new Promise((resolve) => {
      const overlay = document.getElementById('sysConfirmOverlay');
      document.getElementById('sysConfirmMsg').textContent = msg;
      overlay.classList.add('active');
      
      document.getElementById('sysConfirmOk').onclick = () => {
        overlay.classList.remove('active');
        resolve(true);
      };
      document.getElementById('sysConfirmCancel').onclick = () => {
        overlay.classList.remove('active');
        resolve(false);
      };
    });
  };
});
