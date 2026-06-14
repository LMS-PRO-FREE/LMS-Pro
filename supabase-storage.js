
// ==========================================
// SUPABASE STORAGE CONFIGURATION
// ==========================================
// Hướng dẫn:
// 1. Tạo project trên Supabase (miễn phí)
// 2. Vào mục Storage -> Tạo một Bucket mới tên là 'avatars'
// 3. Quan trọng: Đánh dấu Bucket là 'Public'
// 4. Lấy Project URL và Anon Key dán vào bên dưới:

const SUPABASE_URL = 'https://cboavfmjvidxaehikuls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNib2F2Zm1qdmlkeGFlaGlrdWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDQ3NjksImV4cCI6MjA5NjkyMDc2OX0.cWx6CTZ8YM_kdX7PWgOSMvnNustOwtGBQC26V2IGzNc';
const BUCKET_NAME = 'avatars';

async function uploadAvatarToSupabase(base64DataUrl, username) {
  try {
    // 1. Chuyển đổi Base64 thành file ảnh (Blob)
    const res = await fetch(base64DataUrl);
    const blob = await res.blob();
    
    // 2. Tạo tên file duy nhất tránh trùng lặp
    const fileName = username + '_' + Date.now() + '.jpg';

    // 3. Gửi file lên Supabase Storage qua API REST
    const uploadUrl = SUPABASE_URL + '/storage/v1/object/' + BUCKET_NAME + '/' + fileName;
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': blob.type
      },
      body: blob
    });

    if (!uploadRes.ok) {
      const error = await uploadRes.json();
      console.error('Supabase upload error:', error);
      throw new Error(error.message || 'Lỗi khi tải ảnh lên Supabase');
    }

    // 4. Trả về đường link ảnh công khai
    const publicUrl = SUPABASE_URL + '/storage/v1/object/public/' + BUCKET_NAME + '/' + fileName;
    return publicUrl;
    
  } catch (err) {
    console.error(err);
    alert('Có lỗi xảy ra khi lưu ảnh lên đám mây: ' + err.message);
    return null;
  }
}
