function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

/**
 * community-app.js
 * Handles community dynamic rendering for search, friends, requests, and dashboard.
 */

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = sessionStorage.getItem('username');
  const role = sessionStorage.getItem('role');
  if (!currentUser) return;

  const usersDb = JSON.parse(localStorage.getItem('users_db')) || [];
  const classesDb = JSON.parse(localStorage.getItem('classes_db')) || [];
  let friendRequests = JSON.parse(localStorage.getItem('friend_requests_db')) || [];

  // --- Lắng nghe thay đổi từ tab khác / Firebase ---
  window.addEventListener('storage', (e) => {
    if (e.key === 'friend_requests_db') {
      friendRequests = JSON.parse(localStorage.getItem('friend_requests_db')) || [];
      // Nếu không có ô tìm kiếm đang focus thì reload mượt
      if (!document.activeElement || document.activeElement.id !== 'userSearchInput') {
        window.location.reload();
      }
    }
  });

  function saveRequests() {
    localStorage.setItem('friend_requests_db', JSON.stringify(friendRequests));
    window.dispatchEvent(new Event('storage'));
  }

  function getFriendStatus(otherUser) {
    const req = friendRequests.find(r => 
      (r.sender === currentUser && r.receiver === otherUser) ||
      (r.sender === otherUser && r.receiver === currentUser)
    );
    if (!req) return 'none';
    if (req.status === 'accepted') return 'friend';
    if (req.status === 'pending') {
      return req.sender === currentUser ? 'sent' : 'received';
    }
    return 'none';
  }

  // =====================
  // search.html Logic
  // =====================
  if (window.location.pathname.includes('search.html') || window.location.pathname.includes('admin-search.html')) {
    const main = document.querySelector('.dashboard-main');
    
    const myClasses = classesDb.filter(c => c.enrolled && c.enrolled.includes(currentUser));
    let suggestions = usersDb.filter(u => u.user !== currentUser && u.role !== 'admin');
    
    if (role === 'student') {
      suggestions = suggestions.map(u => {
        let score = 0;
        let overlap = [];
        if (u.role === 'teacher') score += 10;
        if (u.role === 'admin') score += 5;
        const theirClasses = classesDb.filter(c => c.enrolled && c.enrolled.includes(u.user));
        overlap = theirClasses.filter(c => myClasses.includes(c)).map(c => c.name);
        score += overlap.length * 5;
        return { ...u, score, overlap };
      }).sort((a, b) => b.score - a.score);
    }

    let html = `
      <div style="display:flex; align-items:center; gap:10px; margin-bottom: 1.5rem;">
        <button onclick="window.location.href='${window.location.pathname.includes('admin') ? 'admin-community.html' : 'community.html'}'" style="background:var(--glass-bg); border:1px solid var(--border); font-size:1.2rem; cursor:pointer; color:var(--text); display:flex; align-items:center; justify-content:center; width:35px; height:35px; border-radius:50%; box-shadow:var(--glass-shadow); transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" aria-label="Quay lại">🔙</button>
        <h1 id="searchTitle" style="margin-bottom:0;">Gợi ý kết bạn</h1>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <input type="text" id="userSearchInput" placeholder="Tìm kiếm theo tên hoặc tài khoản..." 
               style="width:100%; padding:0.8rem 1rem; border-radius:12px; border:1px solid var(--border); background:var(--glass-bg); font-size:0.95rem; box-shadow:var(--glass-shadow); outline:none; color:var(--text);">
      </div>
      
      <div id="userGrid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
      </div>
    `;
    
    main.innerHTML = html;
    
    const userGrid = document.getElementById('userGrid');
    const searchInput = document.getElementById('userSearchInput');
    const searchTitle = document.getElementById('searchTitle');
    
    function renderUsers(usersList) {
      if (usersList.length === 0) {
        userGrid.innerHTML = `
<div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
<div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.7;">📭</div>
<h3 style="color: var(--text); margin-bottom: 0.5rem;">Chưa có dữ liệu</h3>
<p class="text-muted" style="margin: 0;">Hiện tại không có mục nào ở đây. Hãy thử lại sau nhé!</p>
</div>
`;
        return;
      }
      
      let gridHtml = '';
      usersList.forEach(u => {
        const status = getFriendStatus(u.user);
        let btnHtml = '';
        if (status === 'none') {
          btnHtml = `<button class="btn-primary btn-add-friend" data-user="${u.user}" style="padding: 0.4rem 1rem; font-size: 0.85rem; border-radius: 20px;">Kết bạn</button>`;
        } else if (status === 'friend') {
          btnHtml = `<button class="btn-ghost" disabled style="padding: 0.4rem 1rem; font-size: 0.85rem;">Đã là bạn bè</button>`;
        } else if (status === 'sent') {
          btnHtml = `<button class="btn-ghost text-muted" disabled style="padding: 0.4rem 1rem; font-size: 0.85rem;">Đã gửi lời mời</button>`;
        } else if (status === 'received') {
          btnHtml = `<button class="btn-ghost btn-accept-friend" data-user="${u.user}" style="color: #28a745; border-color: rgba(40,167,69,0.3); padding: 0.4rem 1rem; font-size: 0.85rem;">Chấp nhận</button>`;
        }
  
        let overlapText = u.overlap && u.overlap.length > 0 ? `<p style="font-size: 0.8rem; color:var(--primary); margin-bottom:0.5rem;">📚 Cùng lớp: ${u.overlap.join(', ')}</p>` : '';
        
        gridHtml += `
          <div class="user-card" style="background:var(--glass-bg); padding:1rem; border-radius:12px; border:1px solid var(--border); box-shadow:var(--glass-shadow); text-align:center;">
            <div style="width:60px; height:60px; border-radius:50%; background:linear-gradient(135deg, var(--primary), var(--secondary)); color:white; display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:bold; margin:0 auto 10px; overflow:hidden;">
              ${u.avatar ? `<img src="${u.avatar}" style="width:100%;height:100%;object-fit:cover;">` : (u.name || 'U').charAt(0).toUpperCase()}
            </div>
            <h3 style="font-size:1rem; margin-bottom:0.2rem; cursor:pointer;" class="user-name-click" data-user="${u.user}">${u.name}</h3>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.5rem;">${u.role === 'teacher' ? '👨‍🏫 Giáo viên' : u.role === 'admin' ? '🛡️ Admin' : '👨‍🎓 Học viên'}</p>
            ${overlapText}
            ${btnHtml}
          </div>
        `;
      });
      userGrid.innerHTML = gridHtml;
    }
    
    renderUsers(suggestions);
    
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      if (query === '') {
        searchTitle.innerText = 'Gợi ý kết bạn';
        renderUsers(suggestions);
      } else {
        searchTitle.innerText = 'Kết quả tìm kiếm';
        const results = usersDb.filter(u => 
          u.user !== currentUser && 
          (u.name.toLowerCase().includes(query) || u.user.toLowerCase().includes(query))
        );
        renderUsers(results);
      }
    });
  }

  // =====================
  // friends.html Logic
  // =====================
  if (window.location.pathname.includes('friends.html') || window.location.pathname.includes('admin-friends.html')) {
    const main = document.querySelector('.dashboard-main');
    
    const myFriends = friendRequests.filter(r => r.status === 'accepted' && (r.sender === currentUser || r.receiver === currentUser));
    
    let html = `
      <div style="display:flex; align-items:center; gap:10px; margin-bottom: 1.5rem;">
        <button onclick="window.location.href='${window.location.pathname.includes("admin") ? "admin-community.html" : "community.html"}'" style="background:var(--glass-bg); border:1px solid var(--border); font-size:1.2rem; cursor:pointer; color:var(--text); display:flex; align-items:center; justify-content:center; width:35px; height:35px; border-radius:50%; box-shadow:var(--glass-shadow); transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" aria-label="Quay lại">🔙</button>
        <h1 style="margin-bottom:0;">Danh sách bạn bè</h1>
      </div>
      <div class="user-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
    `;

    if (myFriends.length === 0) {
      html += `
<div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
<div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.7;">📭</div>
<h3 style="color: var(--text); margin-bottom: 0.5rem;">Chưa có dữ liệu</h3>
<p class="text-muted" style="margin: 0;">Hiện tại không có mục nào ở đây. Hãy thử lại sau nhé!</p>
</div>
`;
    }

    myFriends.forEach(r => {
      const friendUsername = r.sender === currentUser ? r.receiver : r.sender;
      const u = usersDb.find(user => user.user === friendUsername);
      if (!u) return;

      html += `
        <div class="user-card" style="background:var(--glass-bg); padding:1rem; border-radius:12px; border:1px solid var(--border); box-shadow:var(--glass-shadow); display:flex; align-items:center; gap:1rem;">
          <div style="width:50px; height:50px; border-radius:50%; background:linear-gradient(135deg, var(--primary), var(--secondary)); color:white; display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:bold;">
            ${(u.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style="font-size:1rem; margin-bottom:0.2rem; cursor:pointer;" class="user-name-click" data-user="${u.user}">${u.name}</h3>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0;">${u.role === 'teacher' ? '👨‍🏫 Giáo viên' : u.role === 'admin' ? '🛡️ Admin' : '👨‍🎓 Học viên'}</p>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    main.innerHTML = html;
  }

  // =====================
  // friend-requests.html Logic
  // =====================
  if (window.location.pathname.includes('friend-requests.html') || window.location.pathname.includes('admin-friend-requests.html')) {
    const main = document.querySelector('.dashboard-main');
    
    const pendingReqs = friendRequests.filter(r => r.receiver === currentUser && r.status === 'pending');
    
    let html = `
      <div style="display:flex; align-items:center; gap:10px; margin-bottom: 1.5rem;">
        <button onclick="window.location.href='${window.location.pathname.includes("admin") ? "admin-community.html" : "community.html"}'" style="background:var(--glass-bg); border:1px solid var(--border); font-size:1.2rem; cursor:pointer; color:var(--text); display:flex; align-items:center; justify-content:center; width:35px; height:35px; border-radius:50%; box-shadow:var(--glass-shadow); transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" aria-label="Quay lại">🔙</button>
        <h1 style="margin-bottom:0;">Lời mời kết bạn</h1>
      </div>
      <div class="user-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
    `;

    if (pendingReqs.length === 0) {
      html += `
<div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
<div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.7;">📭</div>
<h3 style="color: var(--text); margin-bottom: 0.5rem;">Chưa có dữ liệu</h3>
<p class="text-muted" style="margin: 0;">Hiện tại không có mục nào ở đây. Hãy thử lại sau nhé!</p>
</div>
`;
    }

    pendingReqs.forEach(r => {
      const u = usersDb.find(user => user.user === r.sender);
      if (!u) return;

      html += `
        <div class="user-card" style="background:var(--glass-bg); padding:1rem; border-radius:12px; border:1px solid var(--border); box-shadow:var(--glass-shadow); text-align:center;">
          <div style="width:60px; height:60px; border-radius:50%; background:linear-gradient(135deg, var(--primary), var(--secondary)); color:white; display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:bold; margin:0 auto 10px;">
            ${(u.name || 'U').charAt(0).toUpperCase()}
          </div>
          <h3 style="font-size:1rem; margin-bottom:0.2rem; cursor:pointer;" class="user-name-click" data-user="${u.user}">${u.name}</h3>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.5rem;">${u.role === 'teacher' ? '👨‍🏫 Giáo viên' : u.role === 'admin' ? '🛡️ Admin' : '👨‍🎓 Học viên'}</p>
          <div style="display:flex; gap:10px; justify-content:center;">
            <button class="btn-ghost btn-accept-friend" data-user="${u.user}" style="color: #28a745; border-color: rgba(40,167,69,0.3); padding: 0.4rem 0.8rem; font-size: 0.85rem;">Chấp nhận</button>
            <button class="btn-ghost btn-reject-friend" data-user="${u.user}" style="color: #ff3b30; border-color: rgba(255,59,48,0.3); padding: 0.4rem 0.8rem; font-size: 0.85rem;">Từ chối</button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    main.innerHTML = html;
  }

  // Add/Accept/Reject friend buttons via Event Delegation
  document.body.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-add-friend')) {
      const targetUser = e.target.getAttribute('data-user');
      friendRequests.push({
        id: Date.now().toString(),
        sender: currentUser,
        receiver: targetUser,
        status: 'pending',
        timestamp: Date.now()
      });
      saveRequests();
      e.target.classList.remove('btn-primary');
      e.target.classList.add('btn-ghost', 'text-muted');
      e.target.innerText = 'Đã gửi lời mời';
      e.target.disabled = true;
    } else if (e.target.classList.contains('btn-accept-friend')) {
      const targetUser = e.target.getAttribute('data-user');
      const req = friendRequests.find(r => r.sender === targetUser && r.receiver === currentUser && r.status === 'pending');
      if (req) {
        req.status = 'accepted';
        saveRequests();
        e.target.parentElement.innerHTML = '<span style="color:#28a745; font-weight:bold; font-size:0.9rem;">Đã chấp nhận</span>';
      }
    } else if (e.target.classList.contains('btn-reject-friend')) {
      const targetUser = e.target.getAttribute('data-user');
      const reqIndex = friendRequests.findIndex(r => r.sender === targetUser && r.receiver === currentUser && r.status === 'pending');
      if (reqIndex !== -1) {
        friendRequests[reqIndex].status = 'rejected';
        saveRequests();
        e.target.parentElement.innerHTML = '<span class="text-muted" style="font-size:0.9rem;">Đã từ chối</span>';
      }
    }
  });

  // =====================
  // User Info Modal
  // =====================
  document.body.addEventListener('click', (e) => {
    if (e.target.classList.contains('user-name-click')) {
      const targetUser = e.target.getAttribute('data-user');
      const u = usersDb.find(user => user.user === targetUser);
      if (!u) return;

      const mask = (val, isPublic) => {
        if (!val) return 'Chưa cập nhật';
        return isPublic ? val : '***';
      };

      // Find classes
      let userClassesHtml = '';
      if (u.role === 'teacher') {
        const tClasses = classesDb.filter(c => c.teacherUser === u.user);
        if (tClasses.length > 0) {
          userClassesHtml = `
            <div style="margin-top:1rem; text-align:left;">
              <p style="font-weight:bold; font-size:0.9rem; margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center;">
                Đang giảng dạy (${tClasses.length} lớp):
                <button class="btn btn-expand-classes" style="font-size:0.7rem; padding:0.2rem 0.5rem; border-radius:8px;">Mở rộng</button>
              </p>
              <ul class="class-list-expandable" style="font-size:0.85rem; color:var(--text-muted); padding-left:20px; max-height:60px; overflow:hidden; transition:max-height 0.3s ease; margin-bottom:0;">
                ${tClasses.map(c => `<li>${c.name} (${c.id})</li>`).join('')}
              </ul>
            </div>
          `;
        }
      } else if (u.role === 'student') {
        const sClasses = classesDb.filter(c => c.enrolled && c.enrolled.includes(u.user));
        if (sClasses.length > 0) {
          userClassesHtml = `
            <div style="margin-top:1rem; text-align:left;">
              <p style="font-weight:bold; font-size:0.9rem; margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center;">
                Lớp đang học (${sClasses.length} lớp):
                <button class="btn btn-expand-classes" style="font-size:0.7rem; padding:0.2rem 0.5rem; border-radius:8px;">Mở rộng</button>
              </p>
              <ul class="class-list-expandable" style="font-size:0.85rem; color:var(--text-muted); padding-left:20px; max-height:60px; overflow:hidden; transition:max-height 0.3s ease; margin-bottom:0;">
                ${sClasses.map(c => `<li>${c.name}</li>`).join('')}
              </ul>
            </div>
          `;
        }
      }

      const modalHtml = `
        <div id="userInfoModal" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); backdrop-filter:blur(5px); z-index:99999; display:flex; align-items:center; justify-content:center;">
          <div style="background:var(--bg-color); padding:2rem; border-radius:16px; width:90%; max-width:450px; box-shadow:0 10px 30px rgba(0,0,0,0.3); text-align:left; position:relative;">
            <button onclick="document.getElementById('userInfoModal').remove()" style="position:absolute; top:10px; right:15px; background:none; border:none; font-size:1.5rem; cursor:pointer; color:var(--text-muted);">&times;</button>
            
            <div style="display:flex; gap:15px; align-items:center; margin-bottom:15px;">
              <div style="width:80px; height:80px; border-radius:50%; background:linear-gradient(135deg, var(--primary), var(--secondary)); color:white; display:flex; align-items:center; justify-content:center; font-size:2rem; font-weight:bold; overflow:hidden; flex-shrink:0;">
                ${u.avatar ? \`<img src="\${u.avatar}" style="width:100%;height:100%;object-fit:cover;">\` : (u.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style="margin:0; font-size:1.3rem;">👤 Thông tin cá nhân</h2>
                <p style="color:var(--text-muted); margin:0; font-size:0.9rem;">${u.role === 'teacher' ? '👨‍🏫 Giáo viên' : u.role === 'admin' ? '🛡️ Admin' : '👨‍🎓 Học viên'}</p>
              </div>
            </div>

            <div style="font-size:0.9rem; line-height:1.6; margin-bottom:1rem;">
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border); padding:5px 0;">
                <span style="color:var(--text-muted);">Họ và tên</span><strong>${u.name || 'Chưa cập nhật'}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border); padding:5px 0;">
                <span style="color:var(--text-muted);">Tên tài khoản</span><strong>${u.user}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border); padding:5px 0;">
                <span style="color:var(--text-muted);">Email</span><strong>${mask(u.email, u.privacy && u.privacy.email)}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border); padding:5px 0;">
                <span style="color:var(--text-muted);">Số điện thoại</span><strong>${mask(u.phone, u.privacy && u.privacy.phone)}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border); padding:5px 0;">
                <span style="color:var(--text-muted);">Ngày sinh</span><strong>${mask(u.dob, u.privacy && u.privacy.dob)}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border); padding:5px 0;">
                <span style="color:var(--text-muted);">Trường / Nơi công tác</span><strong>${mask(u.school, u.privacy && u.privacy.school)}</strong>
              </div>
            </div>

            ${userClassesHtml}

            <div style="margin-top:1.5rem;">
              <h3 style="font-size:1rem; margin-bottom:10px; border-bottom:1px solid var(--border); padding-bottom:5px;">🏆 Thành tích & Huy hiệu</h3>
              <div style="display:flex; flex-direction:column; gap:5px; font-size:0.9rem; color:var(--text);">
                <div>🎓 Học viên mới</div>
                <div>✅ Hoàn thành 10 bài</div>
                <div>🔥 Chuỗi 7 ngày học</div>
                <div>💡 Đặt câu hỏi đầu tiên</div>
                <div>📚 Đăng ký 3 khóa học</div>
              </div>
            </div>

          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      
      const expandBtn = document.querySelector('#userInfoModal .btn-expand-classes');
      if (expandBtn) {
        expandBtn.addEventListener('click', (e) => {
          const list = e.target.parentElement.nextElementSibling;
          if (list.style.maxHeight === '60px') {
            list.style.maxHeight = '300px';
            list.style.overflowY = 'auto';
            e.target.innerText = 'Thu gọn';
          } else {
            list.style.maxHeight = '60px';
            list.style.overflowY = 'hidden';
            e.target.innerText = 'Mở rộng';
          }
        });
      }
    }
  });

  // =====================
  // community.html logic (Dashboard)
  // =====================
  if (window.location.pathname.includes('community.html') || window.location.pathname.includes('admin-community.html')) {
    const requestsCount = friendRequests.filter(r => r.receiver === currentUser && r.status === 'pending').length;
    const friendsCount = friendRequests.filter(r => r.status === 'accepted' && (r.sender === currentUser || r.receiver === currentUser)).length;
    
    const badges = document.querySelectorAll('.clc-badge');
    if (badges.length >= 2) {
      badges[0].textContent = requestsCount > 0 ? `${requestsCount} mới` : 'Không có';
      badges[1].textContent = `${friendsCount} bạn`;
    }

    // Dynamic Activity Feed
    const feedContainer = document.querySelector('.activity-feed');
    if (feedContainer) {
      let myActivities = [];
      friendRequests.filter(r => r.receiver === currentUser || r.sender === currentUser).forEach(r => {
        const otherUsername = r.sender === currentUser ? r.receiver : r.sender;
        const otherUser = usersDb.find(u => u.user === otherUsername);
        if(!otherUser) return;
        
        if (r.status === 'pending' && r.receiver === currentUser) {
          myActivities.push({
            time: r.timestamp,
            html: `
              <div class="activity-item">
                <div class="activity-avatar">${(otherUser.name || 'U').charAt(0).toUpperCase()}</div>
                <div class="activity-text">
                  <strong class="user-name-click" data-user="${otherUser.user}" style="cursor:pointer; color:var(--primary);">${otherUser.name}</strong>
                  <p>đã gửi cho bạn lời mời kết bạn</p>
                </div>
              </div>
            `
          });
        } else if (r.status === 'accepted') {
          myActivities.push({
            time: r.timestamp,
            html: `
              <div class="activity-item">
                <div class="activity-avatar">${(otherUser.name || 'U').charAt(0).toUpperCase()}</div>
                <div class="activity-text">
                  <strong class="user-name-click" data-user="${otherUser.user}" style="cursor:pointer; color:var(--primary);">${otherUser.name}</strong>
                  <p>đã trở thành bạn bè với bạn</p>
                </div>
              </div>
            `
          });
        }
      });
      
      let communityPosts = JSON.parse(localStorage.getItem('community_posts_db')) || [];

      communityPosts.forEach(p => {
        const authorObj = usersDb.find(u => u.user === p.author);
        if (!authorObj) return;
        myActivities.push({
          time: p.timestamp,
          html: `
            <div class="activity-item">
              <div class="activity-avatar">${(authorObj.name || 'U').charAt(0).toUpperCase()}</div>
              <div class="activity-text">
                <strong class="user-name-click" data-user="${authorObj.user}" style="cursor:pointer; color:var(--primary);">${authorObj.name}</strong> <span class="activity-time" style="margin-left: 5px;">${new Date(p.timestamp).toLocaleString('vi-VN')}</span>
                <p style="color: var(--text); font-size: 0.95rem; margin-top: 0.4rem; white-space: pre-wrap;">${escapeHtml(p.content)}</p>
              </div>
            </div>
          `
        });
      });
      
      myActivities.sort((a,b) => b.time - a.time);
      if (myActivities.length === 0) {
        feedContainer.innerHTML = `
<div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
<div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.7;">📭</div>
<h3 style="color: var(--text); margin-bottom: 0.5rem;">Chưa có dữ liệu</h3>
<p class="text-muted" style="margin: 0;">Hiện tại không có mục nào ở đây. Hãy thử lại sau nhé!</p>
</div>
`;
      } else {
        feedContainer.innerHTML = myActivities.map(a => a.html).join('');
      }

      // Handle Posting
      const btnPost = document.getElementById('btnPostCommunity');
      const inputPost = document.getElementById('communityPostInput');
      if (btnPost && inputPost) {
        btnPost.addEventListener('click', () => {
          const content = inputPost.value.trim();
          if (!content) return;
          
          let postsDb = JSON.parse(localStorage.getItem('community_posts_db')) || [];
          postsDb.push({
            id: Date.now().toString(),
            author: currentUser,
            content: content,
            timestamp: Date.now()
          });
          localStorage.setItem('community_posts_db', JSON.stringify(postsDb));
          
          inputPost.value = '';
          window.location.reload();
        });
      }
    }
  }
});
