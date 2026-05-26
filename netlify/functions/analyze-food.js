const { GoogleGenAI } = require("@google/generative-ai");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { imageBase64 } = JSON.parse(event.body);
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const model = ai.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { 
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });

    const imagePart = {
      inlineData: {
        data: imageBase64.split(",")[1],
        mimeType: "image/jpeg"
      },
    };

    const prompt = `
      Anda adalah ahli gizi digital yang presisi dan ilmiah. 
      Tugas Anda adalah menganalisis gambar makanan/minuman ini dan memberikan estimasi nutrisi secara ketat. 
      Jangan berasumsi terlalu jauh jika gambar tidak jelas atau bukan makanan.

      Wajib merespon HANYA dalam format JSON dengan struktur persis seperti berikut tanpa teks pembuka/penutup lain:
      {
        "nama_makanan": "Nama makanan yang terdeteksi (Bahasa Indonesia)",
        "akurasi_deteksi": "Persentase keyakinan Anda (misal: 95%)",
        "kalori_total": 350,
        "kandungan_utama": {
          "karbohidrat_gram": 45,
          "protein_gram": 12,
          "lemak_gram": 10
        },
        "detail_lainnya": [
          "Rincian bahan yang terlihat",
          "Karakteristik porsi atau kadar zat tertentu"
        ],
        "catatan_kesehatan": "Peringatan atau anjuran gizi medis ringkas terkait makanan ini."
      }
    `;

    const result = await model.generateContent([prompt, imagePart]);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: result.response.text()
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Gagal memproses AI: " + error.message })
    };
  }
};
