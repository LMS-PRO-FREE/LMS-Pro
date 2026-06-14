(function() {
  const firebaseConfig = {
    apiKey: "AIzaSyDMmEpv-CIA4nrwcbTP0To5zzyoqFDKA6g",
    authDomain: "learning-english-a4f40.firebaseapp.com",
    databaseURL: "https://learning-english-a4f40-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "learning-english-a4f40",
    storageBucket: "learning-english-a4f40.firebasestorage.app",
    messagingSenderId: "1016503357862",
    appId: "1:1016503357862:web:37042739fa0687d03d3f67",
    measurementId: "G-GTDNZKPXJ5"
  };
  
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  
  const db = firebase.database();
  const originalSetItem = localStorage.setItem;
  const originalRemoveItem = localStorage.removeItem;
  const originalClear = localStorage.clear;
  
  // Các key này không nên đồng bộ vì là trạng thái phiên đăng nhập của từng máy
  const blacklistPrefixes = ['lms_user', 'last_activity', 'typing_', 'reg_'];
  
  function shouldSync(key) {
    if (!key) return false;
    for (let prefix of blacklistPrefixes) {
      if (key.startsWith(prefix)) return false;
    }
    return true;
  }

  let isSyncingFromFirebase = false;

  localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    if (isSyncingFromFirebase) return;
    
    if (shouldSync(key)) {
      try {
        const parsed = JSON.parse(value);
        db.ref('localStorage/' + key).set(parsed);
      } catch (e) {
        db.ref('localStorage/' + key).set(value);
      }
    }
  };

  localStorage.removeItem = function(key) {
    originalRemoveItem.apply(this, arguments);
    if (isSyncingFromFirebase) return;
    
    if (shouldSync(key)) {
      db.ref('localStorage/' + key).remove();
    }
  };

  localStorage.clear = function() {
    originalClear.apply(this, arguments);
    if (isSyncingFromFirebase) return;
    db.ref('localStorage').remove();
  };
  
  // Lắng nghe dữ liệu thay đổi từ Firebase và cập nhật lại localStorage cục bộ
  db.ref('localStorage').on('value', (snapshot) => {
    const data = snapshot.val() || {};
    isSyncingFromFirebase = true;
    
    // Xử lý thêm mới hoặc cập nhật
    for (let key in data) {
      if (!shouldSync(key)) continue;
      
      const valStr = typeof data[key] === 'object' ? JSON.stringify(data[key]) : String(data[key]);
      const oldVal = localStorage.getItem(key);
      
      if (oldVal !== valStr) {
        originalSetItem.call(localStorage, key, valStr);
        
        // Bắn event storage để các trang đang mở tự động cập nhật UI
        const event = new StorageEvent('storage', {
          key: key,
          newValue: valStr,
          oldValue: oldVal,
          storageArea: localStorage
        });
        window.dispatchEvent(event);
      }
    }

    // Xử lý xóa data (nếu trên Firebase bị xóa thì local cũng phải xóa)
    // Lưu các key cần xóa ra mảng trước để tránh lỗi khi duyệt localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (shouldSync(key) && data[key] === undefined) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      const oldVal = localStorage.getItem(key);
      originalRemoveItem.call(localStorage, key);
      const event = new StorageEvent('storage', {
        key: key,
        newValue: null,
        oldValue: oldVal,
        storageArea: localStorage
      });
      window.dispatchEvent(event);
    });

    isSyncingFromFirebase = false;
  });

  // Đẩy dữ liệu local có sẵn lên Firebase trong lần chạy đầu tiên (nếu Firebase rỗng)
  db.ref('localStorage').once('value').then(snap => {
    if (!snap.exists() || Object.keys(snap.val() || {}).length === 0) {
      isSyncingFromFirebase = true;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (shouldSync(key)) {
           const value = localStorage.getItem(key);
           try {
             db.ref('localStorage/' + key).set(JSON.parse(value));
           } catch(e) {
             db.ref('localStorage/' + key).set(value);
           }
        }
      }
      isSyncingFromFirebase = false;
    }
  });

})();
