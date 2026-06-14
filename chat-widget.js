/* ===== CHAT WIDGET JS ===== */
(function() {
  const currentUser = sessionStorage.getItem('username');
  if (!currentUser) return; // Do not show if not logged in

  const role = sessionStorage.getItem('role');

  // Load CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'chat-widget.css';
  document.head.appendChild(link);

  // Inject UI
  const widgetHtml = `
    <div class="chat-widget-btn" id="chatWidgetBtn">💬</div>
    <div class="chat-panel" id="chatPanel">
      <div class="chat-header">
        <div class="chat-header-title" id="chatHeaderTitle">Cộng đồng</div>
        <div class="chat-close" id="chatClose">✖</div>
      </div>
      <div class="chat-body">
        <div class="contact-list" id="contactList"></div>
        <div class="conversation-view" id="conversationView">
          <div class="chat-messages" id="chatMessages"></div>
          <div class="typing-indicator" id="typingIndicator">Đang soạn tin...</div>
          <div class="chat-input-area">
            <input type="text" id="chatInput" class="chat-input" placeholder="Nhập tin nhắn...">
            <button class="chat-send-btn" id="chatSendBtn">➤</button>
          </div>
        </div>
      </div>
    </div>
  `;
  const container = document.createElement('div');
  container.innerHTML = widgetHtml;
  document.body.appendChild(container);

  // Elements
  const btn = document.getElementById('chatWidgetBtn');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatClose');
  const contactListEl = document.getElementById('contactList');
  const convView = document.getElementById('conversationView');
  const messagesEl = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const headerTitle = document.getElementById('chatHeaderTitle');
  const typingInd = document.getElementById('typingIndicator');

  let activeChatUser = null;
  let editingMsgId = null;

  // DB init
  if (!localStorage.getItem('chat_messages')) {
    localStorage.setItem('chat_messages', JSON.stringify([]));
  }

  // Time formatter
  function formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const date = new Date(timestamp);
    const today = new Date();

    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    const isSameDay = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();

    if (diff < 3 * 3600 * 1000) { // Dưới 3 tiếng
      if (diff < 60000) return 'Vừa xong';
      const m = Math.floor(diff / 60000);
      const h = Math.floor(m / 60);
      if (h > 0) {
        const remM = m % 60;
        return remM > 0 ? `${h} tiếng ${remM} phút trước` : `${h} tiếng trước`;
      }
      return `${m} phút trước`;
    } else { // Trên 3 tiếng
      if (isSameDay) {
        return `${hours}g${mins}`;
      } else {
        const d = String(date.getDate()).padStart(2, '0');
        const mo = String(date.getMonth() + 1).padStart(2, '0');
        return `${hours}g${mins} ${d}/${mo}`;
      }
    }
  }

  // Open / Close
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.toggle('open');
    if (panel.classList.contains('open') && !activeChatUser) {
      renderContactList();
    } else if (panel.classList.contains('open') && activeChatUser) {
      renderMessages();
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  });
  
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.remove('open');
  });

  // Auto-collapse when clicking outside
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('open') && !panel.contains(e.target) && !btn.contains(e.target)) {
      panel.classList.remove('open');
    }
  });

  // Go back to contacts
  headerTitle.addEventListener('click', () => {
    if (activeChatUser) {
      activeChatUser = null;
      convView.style.display = 'none';
      contactListEl.style.display = 'block';
      headerTitle.textContent = 'Cộng đồng';
      renderContactList();
    }
  });

  // Render contacts (all users except self)
  function renderContactList() {
    contactListEl.innerHTML = '';
    const users = JSON.parse(localStorage.getItem('users_db')) || [];
    users.forEach(u => {
      if (u.user !== currentUser) {
        const div = document.createElement('div');
        div.className = 'contact-item';
        div.innerHTML = `
          <div class="contact-avatar">${u.name ? u.name.charAt(0).toUpperCase() : 'U'}</div>
          <div class="contact-info">
            <div class="contact-name">${u.name} (${u.role})</div>
          </div>
        `;
        div.addEventListener('click', () => openChat(u));
        contactListEl.appendChild(div);
      }
    });
  }

  function openChat(user) {
    activeChatUser = user.user;
    contactListEl.style.display = 'none';
    convView.style.display = 'flex';
    headerTitle.innerHTML = `← ${user.name}`;
    renderMessages();
    setTimeout(() => messagesEl.scrollTop = messagesEl.scrollHeight, 50);
  }

  function getMessages() {
    return JSON.parse(localStorage.getItem('chat_messages')) || [];
  }
  function saveMessages(msgs) {
    localStorage.setItem('chat_messages', JSON.stringify(msgs));
  }

  function checkLimits(msgs) {
    if (role === 'admin') return true; // Admin vô hạn
    // Nếu là bạn bè thì vô hạn (ở đây demo chưa có db bạn bè nên mặc định coi như người lạ)
    const today = new Date().toDateString();
    let sentToday = 0;
    msgs.forEach(m => {
      if (m.sender === currentUser && m.receiver === activeChatUser) {
        if (new Date(m.timestamp).toDateString() === today) sentToday++;
      }
    });
    return sentToday < 10;
  }

  function renderMessages() {
    if (!activeChatUser) return;
    messagesEl.innerHTML = '';
    const msgs = getMessages();
    let changed = false;

    msgs.forEach(m => {
      if ((m.sender === currentUser && m.receiver === activeChatUser) ||
          (m.sender === activeChatUser && m.receiver === currentUser)) {
        
        // Mark as read if I am the receiver
        if (m.receiver === currentUser && m.status === 'sent') {
          m.status = 'read';
          changed = true;
        }

        const isMine = m.sender === currentUser;
        let content = m.isRevoked ? '🚫 Tin nhắn đã bị thu hồi' : m.content;
        let editedStr = m.isEdited && !m.isRevoked ? ' (đã chỉnh sửa)' : '';
        let statusStr = '';
        if (isMine && !m.isRevoked) {
          statusStr = m.status === 'read' ? 'Đã xem' : 'Đã gửi';
        }

        const timeStr = formatTime(m.timestamp);
        
        const wrapper = document.createElement('div');
        wrapper.className = `msg-wrapper ${isMine ? 'mine' : 'theirs'}`;
        
        let actionsHtml = '';
        if (isMine && !m.isRevoked) {
          const age = Date.now() - m.timestamp;
          const canEdit = age < 60000; // 1 phút
          const canDelete = age < 12 * 3600 * 1000; // 12 tiếng

          actionsHtml = `<div class="msg-actions">`;
          if (canEdit) actionsHtml += `<button class="msg-action-btn" onclick="window.startEditMsg('${m.id}', '${m.content.replace(/'/g, "\\'")}')">Sửa</button>`;
          if (canDelete) actionsHtml += `<button class="msg-action-btn" onclick="window.revokeMsg('${m.id}')">Thu hồi</button>`;
          actionsHtml += `</div>`;
        }

        wrapper.innerHTML = `
          <div class="msg-bubble" style="${m.isRevoked ? 'background:transparent; border:1px solid var(--border); color:var(--text-muted);' : ''}">
            ${content}${editedStr}
          </div>
          <div class="msg-meta">${statusStr ? statusStr + ' • ' : ''}${timeStr}</div>
          ${actionsHtml}
        `;
        messagesEl.appendChild(wrapper);
      }
    });

    if (changed) saveMessages(msgs);
  }

  chatSendBtn.addEventListener('click', sendMsg);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMsg();
    else {
      // Typing indicator flag
      localStorage.setItem(`typing_${currentUser}_${activeChatUser}`, Date.now());
    }
  });

  function sendMsg() {
    const text = chatInput.value.trim();
    if (!text || !activeChatUser) return;

    const msgs = getMessages();
    if (!checkLimits(msgs) && !editingMsgId) {
      alert("Bạn đã đạt giới hạn gửi 10 tin nhắn/ngày cho người lạ này.");
      return;
    }

    if (editingMsgId) {
      const idx = msgs.findIndex(m => m.id === editingMsgId);
      if (idx > -1) {
        if (Date.now() - msgs[idx].timestamp < 60000) {
          msgs[idx].content = text;
          msgs[idx].isEdited = true;
        } else {
          alert("Đã quá 1 phút, không thể sửa.");
        }
      }
      editingMsgId = null;
    } else {
      msgs.push({
        id: 'msg_' + Date.now(),
        sender: currentUser,
        receiver: activeChatUser,
        content: text,
        timestamp: Date.now(),
        status: 'sent',
        isEdited: false,
        isRevoked: false
      });
    }

    saveMessages(msgs);
    chatInput.value = '';
    renderMessages();
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // Global functions for inline HTML buttons
  window.startEditMsg = function(id, currentText) {
    editingMsgId = id;
    chatInput.value = currentText;
    chatInput.focus();
  };

  window.revokeMsg = function(id) {
    const msgs = getMessages();
    const idx = msgs.findIndex(m => m.id === id);
    if (idx > -1) {
      if (Date.now() - msgs[idx].timestamp < 12 * 3600 * 1000) {
        msgs[idx].isRevoked = true;
        saveMessages(msgs);
        renderMessages();
      } else {
        alert("Đã quá 12 tiếng, không thể thu hồi.");
      }
    }
  };

  // Sync intervals
  setInterval(() => {
    if (panel.classList.contains('open') && activeChatUser) {
      renderMessages();
      
      // Check typing
      const typingTime = localStorage.getItem(`typing_${activeChatUser}_${currentUser}`);
      if (typingTime && (Date.now() - parseInt(typingTime) < 3000)) {
        typingInd.style.display = 'block';
      } else {
        typingInd.style.display = 'none';
      }
    }
  }, 1000); // 1s sync

})();
