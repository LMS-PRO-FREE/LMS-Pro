
const IMGBB_API_KEY = 'e0ad9e94c2291b3757d114729dd18d10';

async function uploadAvatarToImgBB(base64DataUrl) {
  try {
    // ImgBB requires base64 string WITHOUT the 'data:image/jpeg;base64,' prefix
    const base64Data = base64DataUrl.split(',')[1];
    
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Data);

    const uploadRes = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });

    if (!uploadRes.ok) {
      const error = await uploadRes.json();
      console.error('ImgBB upload error:', error);
      throw new Error(error.error ? error.error.message : 'Lỗi khi tải ảnh lên ImgBB');
    }

    const jsonRes = await uploadRes.json();
    if (jsonRes.success) {
      return jsonRes.data.url; // Đường link ảnh trực tiếp
    } else {
      throw new Error('Tải ảnh thất bại.');
    }
  } catch (err) {
    console.error(err);
    alert('Có lỗi xảy ra khi lưu ảnh lên ImgBB: ' + err.message);
    return null;
  }
}
