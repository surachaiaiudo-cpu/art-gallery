async function testUpload() {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const buffer = Buffer.from(base64Png, 'base64');

  const payload = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="fileName"\r\n\r\ntest-connectivity\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  try {
    const res = await fetch('https://art-gallery-4ty.pages.dev/api/admin/upload', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: payload,
    });

    const data = await res.json();
    console.log('UPLOAD_RESULT:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('UPLOAD_ERROR:', err);
  }
}

testUpload();
