document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('imageInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const resultContainer = document.getElementById('resultContainer');
    const loading = document.getElementById('loading');
    const dropZone = document.getElementById('dropZone');
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const dropZonePrompt = document.querySelector('.drop-zone__prompt');

    // Trigger input file ketika drop-zone diklik
    dropZone.addEventListener('click', () => fileInput.click());

    // Update pratinjau saat file dipilih
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            showPreview(fileInput.files[0]);
        }
    });

    // Fitur Drag and Drop
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('drop-zone--over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('drop-zone--over');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            fileInput.files = files;
            showPreview(files[0]);
        }
    });

    function showPreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            previewContainer.style.display = 'block';
            if (dropZonePrompt) dropZonePrompt.textContent = `File terpilih: ${file.name}`;
        };
        reader.readAsDataURL(file);
    }

    // Aksi tombol analisis gizi
    uploadBtn.addEventListener('click', async () => {
        if (fileInput.files.length === 0) {
            alert("Silakan pilih atau ambil foto makanan terlebih dahulu!");
            return;
        }

        const file = fileInput.files[0];
        const reader = new FileReader();

        // Tampilkan loading dan sembunyikan hasil sebelumnya
        loading.style.display = 'block';
        resultContainer.style.display = 'none';
        resultContainer.innerHTML = '';

        reader.onloadend = async () => {
            const base64Image = reader.result;

            try {
                // Memanggil Netlify Functions backend aman Anda
                const response = await fetch('/.netlify/functions/analyze-food', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: base64Image })
                });

                if (!response.ok) {
                    throw new Error(`HTTP Error! Status: ${response.status}`);
                }

                const data = await response.json();
                loading.style.display = 'none';

                // Tampilkan container hasil
                resultContainer.style.display = 'block';

                // Render komponen HTML hasil analisis secara terstruktur
                resultContainer.innerHTML = `
                    <div class="result-header">
                        <h2>${data.nama_makanan}</h2>
                        <span class="accuracy-badge">Akurasi AI: ${data.akurasi_deteksi}</span>
                    </div>
                    
                    <div class="calories-box">
                        <span class="calories-val">${data.kalori_total}</span>
                        <span class="calories-lbl">Total Kcal</span>
                    </div>

                    <h3 class="section-title">Makronutrisi Utama</h3>
                    <div class="macro-grid">
                        <div class="macro-item macro-carbs">
                            <span class="macro-name">Karbohidrat</span>
                            <span class="macro-value">${data.kandungan_utama.karbohidrat_gram} g</span>
                        </div>
                        <div class="macro-item macro-protein">
                            <span class="macro-name">Protein</span>
                            <span class="macro-value">${data.kandungan_utama.protein_gram} g</span>
                        </div>
                        <div class="macro-item macro-fat">
                            <span class="macro-name">Lemak</span>
                            <span class="macro-value">${data.kandungan_utama.lemak_gram} g</span>
                        </div>
                    </div>

                    <h3 class="section-title">Karakteristik & Detail Gizi</h3>
                    <ul class="detail-list">
                        ${data.detail_lainnya.map(detail => `<li>${detail}</li>`).join('')}
                    </ul>

                    <div class="health-note">
                        <strong>Catatan Kesehatan AI:</strong>
                        <p>${data.catatan_kesehatan}</p>
                    </div>
                `;
            } catch (err) {
                loading.style.display = 'none';
                resultContainer.style.display = 'block';
                resultContainer.innerHTML = `
                    <div class="error-msg">
                        <p><strong>Gagal Menganalisis:</strong> Terjadi kesalahan jaringan atau respons sistem tidak valid. Pastikan Environment Variable GEMINI_API_KEY sudah disetel di Netlify.</p>
                        <small>${err.message}</small>
                    </div>
                `;
            }
        };

        reader.readAsDataURL(file);
    });
});
